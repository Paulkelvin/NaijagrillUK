import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchSearchAnalytics = vi.fn();
vi.mock("./client", () => ({
  fetchSearchAnalytics: (...args: unknown[]) => mockFetchSearchAnalytics(...args),
}));

const mockStartSyncRun = vi.fn();
const mockCompleteSyncRun = vi.fn();
vi.mock("@/lib/seo/sync-log", () => ({
  startSyncRun: (...args: unknown[]) => mockStartSyncRun(...args),
  completeSyncRun: (...args: unknown[]) => mockCompleteSyncRun(...args),
}));

vi.mock("@/lib/seo/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Chainable Supabase query builder mock: .from(table).upsert(payload).select(cols)
// resolves to a per-table configured response.
function makeSupabaseMock(responses: Record<string, { data: unknown; error: unknown }>) {
  const upsertCalls: Record<string, unknown[]> = {};
  const from = vi.fn((table: string) => ({
    upsert: vi.fn((payload: unknown) => {
      upsertCalls[table] = payload as unknown[];
      const response = responses[table] ?? { data: [], error: null };
      return {
        select: vi.fn().mockResolvedValue(response),
        // keyword_page_metrics upsert in sync.ts doesn't call .select()
        then: (resolve: (v: unknown) => void) => resolve(response),
      };
    }),
  }));
  return { from, upsertCalls };
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;

const { syncGsc } = await import("./sync");

function gscRow(query: string, page: string, overrides: Partial<Record<string, number>> = {}) {
  return {
    query,
    page,
    clicks: overrides.clicks ?? 1,
    impressions: overrides.impressions ?? 10,
    ctr: overrides.ctr ?? 0.1,
    position: overrides.position ?? 5,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockStartSyncRun.mockResolvedValue(42);
  mockCompleteSyncRun.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("syncGsc", () => {
  it("upserts keywords, pages, and metrics, then completes the run", async () => {
    mockFetchSearchAnalytics.mockResolvedValue({
      rows: [gscRow("jollof rice", "https://www.naijagrillandspice.co.uk/menu")],
    });

    const { from } = makeSupabaseMock({
      keywords: { data: [{ id: "kw-1", keyword_normalized: "jollof rice" }], error: null },
      pages: { data: [{ id: "pg-1", path: "/menu" }], error: null },
    });
    mockSupabase = { from };

    const result = await syncGsc("site-1", "2026-07-01");

    expect(result).toEqual({ runId: 42, recordsProcessed: 1, rejectedCount: 0 });
    expect(mockStartSyncRun).toHaveBeenCalledWith("site-1", "gsc", "searchanalytics.query");
    expect(from).toHaveBeenCalledWith("keywords");
    expect(from).toHaveBeenCalledWith("pages");
    expect(from).toHaveBeenCalledWith("keyword_page_metrics");
    expect(mockCompleteSyncRun).toHaveBeenCalledWith(42, {
      status: "completed",
      recordsProcessed: 1,
      metadata: { rejected_rows: 0, warnings: [], backfill: false },
    });
  });

  it("rejects out-of-range position without aborting the batch", async () => {
    mockFetchSearchAnalytics.mockResolvedValue({
      rows: [
        gscRow("good keyword", "https://www.naijagrillandspice.co.uk/menu", { position: 5 }),
        gscRow("bad keyword", "https://www.naijagrillandspice.co.uk/menu", { position: 1500 }),
      ],
    });

    const { from } = makeSupabaseMock({
      keywords: { data: [{ id: "kw-1", keyword_normalized: "good keyword" }], error: null },
      pages: { data: [{ id: "pg-1", path: "/menu" }], error: null },
    });
    mockSupabase = { from };

    const result = await syncGsc("site-1", "2026-07-01");

    expect(result.recordsProcessed).toBe(1);
    expect(result.rejectedCount).toBe(1);
    expect(mockCompleteSyncRun).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        metadata: { rejected_rows: 1, warnings: ["1 row(s) rejected by validation"], backfill: false },
      }),
    );
  });

  it("sets metadata.backfill: true when called with isBackfill", async () => {
    mockFetchSearchAnalytics.mockResolvedValue({ rows: [] });
    mockSupabase = { from: vi.fn() };

    await syncGsc("site-1", "2026-07-01", { isBackfill: true });

    expect(mockCompleteSyncRun).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ metadata: expect.objectContaining({ backfill: true }) }),
    );
  });

  it("rejects rows where clicks > impressions without aborting the batch", async () => {
    mockFetchSearchAnalytics.mockResolvedValue({
      rows: [gscRow("bad keyword", "https://www.naijagrillandspice.co.uk/menu", { clicks: 50, impressions: 10 })],
    });

    const { from } = makeSupabaseMock({
      keywords: { data: [], error: null },
      pages: { data: [], error: null },
    });
    mockSupabase = { from };

    const result = await syncGsc("site-1", "2026-07-01");
    expect(result.recordsProcessed).toBe(0);
    expect(result.rejectedCount).toBe(1);
  });

  it("defaults the target date to 3 days ago when not provided", async () => {
    mockFetchSearchAnalytics.mockResolvedValue({ rows: [] });
    mockSupabase = { from: vi.fn(() => ({ upsert: vi.fn(() => ({ select: vi.fn().mockResolvedValue({ data: [], error: null }) })) })) };

    await syncGsc("site-1");

    const expected = new Date();
    expected.setUTCDate(expected.getUTCDate() - 3);
    const expectedDateStr = expected.toISOString().slice(0, 10);
    expect(mockFetchSearchAnalytics).toHaveBeenCalledWith(expectedDateStr);
  });

  it("marks the run failed and rethrows when fetchSearchAnalytics throws", async () => {
    mockFetchSearchAnalytics.mockRejectedValue(new Error("GSC query failed (500)"));

    await expect(syncGsc("site-1", "2026-07-01")).rejects.toThrow("GSC query failed (500)");
    expect(mockCompleteSyncRun).toHaveBeenCalledWith(42, {
      status: "failed",
      errorMessage: "GSC query failed (500)",
    });
  });

  it("marks the run failed when the keywords upsert errors", async () => {
    mockFetchSearchAnalytics.mockResolvedValue({
      rows: [gscRow("jollof rice", "https://www.naijagrillandspice.co.uk/menu")],
    });
    const { from } = makeSupabaseMock({
      keywords: { data: null, error: { message: "constraint violation" } },
    });
    mockSupabase = { from };

    await expect(syncGsc("site-1", "2026-07-01")).rejects.toThrow(/Failed to upsert keywords/);
    expect(mockCompleteSyncRun).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ status: "failed" }),
    );
  });

  it("does not throw the whole job if completeSyncRun itself fails after a job error", async () => {
    mockFetchSearchAnalytics.mockRejectedValue(new Error("network down"));
    mockCompleteSyncRun.mockRejectedValueOnce(new Error("sync_log unreachable"));

    // Original error should still propagate, not the completeSyncRun error.
    await expect(syncGsc("site-1", "2026-07-01")).rejects.toThrow("network down");
  });

  it("skips upserts entirely when there are zero valid rows", async () => {
    mockFetchSearchAnalytics.mockResolvedValue({ rows: [] });
    const from = vi.fn();
    mockSupabase = { from };

    const result = await syncGsc("site-1", "2026-07-01");
    expect(result).toEqual({ runId: 42, recordsProcessed: 0, rejectedCount: 0 });
    expect(from).not.toHaveBeenCalled();
  });
});
