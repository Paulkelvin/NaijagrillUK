import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchPageMetrics = vi.fn();
const mockFetchConversionBreakdown = vi.fn();
vi.mock("./client", () => ({
  fetchPageMetrics: (...args: unknown[]) => mockFetchPageMetrics(...args),
  fetchConversionBreakdown: (...args: unknown[]) => mockFetchConversionBreakdown(...args),
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

interface MockConfig {
  site?: { domain: string } | null;
  siteError?: unknown;
  conversionEvents?: unknown;
  siteConfigsError?: unknown;
  existingPages?: Array<{ path: string }>;
  existingPagesError?: unknown;
  pagesUpsertResult?: Array<{ id: string; path: string }>;
  pagesUpsertError?: unknown;
  pageMetricsUpsertError?: unknown;
}

// Chainable Supabase mock covering exactly the query shapes ga4/sync.ts
// issues: sites.select().eq().single(), site_configs.select().eq().single(),
// pages.select().eq().in() (existing-page check), pages.upsert().select(),
// page_metrics.upsert() (no .select(), thenable like keyword_page_metrics
// in gsc/sync.test.ts).
function makeSupabaseMock(config: MockConfig = {}) {
  const calls: { pagesUpsertPayload?: unknown[]; pageMetricsUpsertPayload?: unknown[] } = {};

  const from = vi.fn((table: string) => {
    if (table === "sites") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: config.site ?? { domain: "naijagrillandspice.co.uk" },
              error: config.siteError ?? null,
            }),
          })),
        })),
      };
    }
    if (table === "site_configs") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { conversion_events: config.conversionEvents ?? [] },
              error: config.siteConfigsError ?? null,
            }),
          })),
        })),
      };
    }
    if (table === "pages") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({
              data: config.existingPages ?? [],
              error: config.existingPagesError ?? null,
            }),
          })),
        })),
        upsert: vi.fn((payload: unknown[]) => {
          calls.pagesUpsertPayload = payload;
          return {
            select: vi.fn().mockResolvedValue({
              data: config.pagesUpsertResult ?? [],
              error: config.pagesUpsertError ?? null,
            }),
          };
        }),
      };
    }
    if (table === "page_metrics") {
      return {
        upsert: vi.fn((payload: unknown[]) => {
          calls.pageMetricsUpsertPayload = payload;
          const response = { data: null, error: config.pageMetricsUpsertError ?? null };
          return { then: (resolve: (v: unknown) => void) => resolve(response) };
        }),
      };
    }
    throw new Error(`Unexpected table in test: ${table}`);
  });

  return { from, calls };
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;

const { syncGa4 } = await import("./sync");

function pageRow(pagePath: string, overrides: Partial<Record<string, number | null>> = {}) {
  return {
    pagePath,
    sessions: overrides.sessions ?? 10,
    engagedSessions: overrides.engagedSessions ?? 6,
    bounceRate: overrides.bounceRate === undefined ? 0.25 : overrides.bounceRate,
    avgSessionDuration: overrides.avgSessionDuration === undefined ? 42.5 : overrides.avgSessionDuration,
    conversions: overrides.conversions ?? 0,
    purchaseRevenue: overrides.purchaseRevenue ?? 0,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockStartSyncRun.mockResolvedValue(42);
  mockCompleteSyncRun.mockResolvedValue(undefined);
  mockFetchConversionBreakdown.mockResolvedValue({ rows: [] });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("syncGa4", () => {
  it("upserts pages and page_metrics, then completes the run", async () => {
    mockFetchPageMetrics.mockResolvedValue({ rows: [pageRow("/menu")] });
    const { from } = makeSupabaseMock({
      existingPages: [{ path: "/menu" }],
      pagesUpsertResult: [{ id: "pg-1", path: "/menu" }],
    });
    mockSupabase = { from };

    const result = await syncGa4("site-1", "2026-07-01");

    expect(result).toEqual({ runId: 42, recordsProcessed: 1, rejectedCount: 0, newPageCount: 0 });
    expect(mockStartSyncRun).toHaveBeenCalledWith("site-1", "ga4", "runReport");
    expect(from).toHaveBeenCalledWith("sites");
    expect(from).toHaveBeenCalledWith("site_configs");
    expect(from).toHaveBeenCalledWith("pages");
    expect(from).toHaveBeenCalledWith("page_metrics");
    expect(mockFetchConversionBreakdown).toHaveBeenCalledWith("2026-07-01", []);
    expect(mockCompleteSyncRun).toHaveBeenCalledWith(42, {
      status: "completed",
      recordsProcessed: 1,
      metadata: { rejected_rows: 0, warnings: [], backfill: false },
    });
  });

  it("builds pages.url from the site's www-stripped domain plus the normalized path", async () => {
    mockFetchPageMetrics.mockResolvedValue({ rows: [pageRow("/Menu/")] });
    const { from, calls } = makeSupabaseMock({
      site: { domain: "www.naijagrillandspice.co.uk" },
      existingPages: [],
      pagesUpsertResult: [{ id: "pg-1", path: "/menu" }],
    });
    mockSupabase = { from };

    await syncGa4("site-1", "2026-07-01");

    expect(calls.pagesUpsertPayload).toEqual([
      { site_id: "site-1", url: "https://naijagrillandspice.co.uk/menu", path: "/menu" },
    ]);
  });

  it("flags newly-created pages as a metadata warning (potential crawler miss)", async () => {
    mockFetchPageMetrics.mockResolvedValue({ rows: [pageRow("/menu"), pageRow("/new-page")] });
    const { from } = makeSupabaseMock({
      existingPages: [{ path: "/menu" }], // /new-page is not in the existing set
      pagesUpsertResult: [
        { id: "pg-1", path: "/menu" },
        { id: "pg-2", path: "/new-page" },
      ],
    });
    mockSupabase = { from };

    const result = await syncGa4("site-1", "2026-07-01");

    expect(result.newPageCount).toBe(1);
    expect(mockCompleteSyncRun).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        metadata: expect.objectContaining({
          warnings: ["1 page(s) newly created from GA4 data not previously known to the pages table (potential crawler miss)"],
        }),
      }),
    );
  });

  it("computes conversion_value from purchaseRevenue plus configured event values", async () => {
    mockFetchPageMetrics.mockResolvedValue({ rows: [pageRow("/contact", { purchaseRevenue: 0 })] });
    mockFetchConversionBreakdown.mockResolvedValue({
      rows: [{ pagePath: "/contact", eventName: "whatsapp_click", eventCount: 3 }],
    });
    const { from, calls } = makeSupabaseMock({
      conversionEvents: [{ name: "whatsapp_click", value: 15 }],
      existingPages: [{ path: "/contact" }],
      pagesUpsertResult: [{ id: "pg-1", path: "/contact" }],
    });
    mockSupabase = { from };

    await syncGa4("site-1", "2026-07-01");

    expect(mockFetchConversionBreakdown).toHaveBeenCalledWith("2026-07-01", ["whatsapp_click"]);
    const payload = calls.pageMetricsUpsertPayload as Array<Record<string, unknown>>;
    expect(payload[0].conversion_value).toBe(45); // 3 * 15
    expect(payload[0].conversion_breakdown).toEqual({ whatsapp_click: 3 });
  });

  it("rejects rows with an empty pagePath or an excluded pattern without aborting the batch", async () => {
    mockFetchPageMetrics.mockResolvedValue({
      rows: [pageRow("/menu"), pageRow(""), pageRow("/studio/settings"), pageRow("/api/webhook")],
    });
    const { from } = makeSupabaseMock({
      existingPages: [{ path: "/menu" }],
      pagesUpsertResult: [{ id: "pg-1", path: "/menu" }],
    });
    mockSupabase = { from };

    const result = await syncGa4("site-1", "2026-07-01");

    expect(result.recordsProcessed).toBe(1);
    expect(result.rejectedCount).toBe(3);
    expect(mockCompleteSyncRun).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        metadata: expect.objectContaining({ rejected_rows: 3, warnings: ["3 row(s) rejected by validation"] }),
      }),
    );
  });

  it("skips all Supabase calls when there are zero valid rows", async () => {
    mockFetchPageMetrics.mockResolvedValue({ rows: [] });
    const from = vi.fn();
    mockSupabase = { from };

    const result = await syncGa4("site-1", "2026-07-01");
    expect(result).toEqual({ runId: 42, recordsProcessed: 0, rejectedCount: 0, newPageCount: 0 });
    expect(from).not.toHaveBeenCalled();
    expect(mockFetchConversionBreakdown).not.toHaveBeenCalled();
  });

  it("sets metadata.backfill: true when called with isBackfill", async () => {
    mockFetchPageMetrics.mockResolvedValue({ rows: [] });
    mockSupabase = { from: vi.fn() };

    await syncGa4("site-1", "2026-07-01", { isBackfill: true });

    expect(mockCompleteSyncRun).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ metadata: expect.objectContaining({ backfill: true }) }),
    );
  });

  it("defaults the target date to 3 days ago when not provided", async () => {
    mockFetchPageMetrics.mockResolvedValue({ rows: [] });
    mockSupabase = { from: vi.fn() };

    await syncGa4("site-1");

    const expected = new Date();
    expected.setUTCDate(expected.getUTCDate() - 3);
    const expectedDateStr = expected.toISOString().slice(0, 10);
    expect(mockFetchPageMetrics).toHaveBeenCalledWith(expectedDateStr);
  });

  it("marks the run failed and rethrows when fetchPageMetrics throws", async () => {
    mockFetchPageMetrics.mockRejectedValue(new Error("GA4 runReport failed (500)"));

    await expect(syncGa4("site-1", "2026-07-01")).rejects.toThrow("GA4 runReport failed (500)");
    expect(mockCompleteSyncRun).toHaveBeenCalledWith(42, {
      status: "failed",
      errorMessage: "GA4 runReport failed (500)",
    });
  });

  it("marks the run failed when the page_metrics upsert errors", async () => {
    mockFetchPageMetrics.mockResolvedValue({ rows: [pageRow("/menu")] });
    const { from } = makeSupabaseMock({
      existingPages: [{ path: "/menu" }],
      pagesUpsertResult: [{ id: "pg-1", path: "/menu" }],
      pageMetricsUpsertError: { message: "constraint violation" },
    });
    mockSupabase = { from };

    await expect(syncGa4("site-1", "2026-07-01")).rejects.toThrow(/Failed to upsert page_metrics/);
    expect(mockCompleteSyncRun).toHaveBeenCalledWith(42, expect.objectContaining({ status: "failed" }));
  });

  it("does not throw the whole job if completeSyncRun itself fails after a job error", async () => {
    mockFetchPageMetrics.mockRejectedValue(new Error("network down"));
    mockCompleteSyncRun.mockRejectedValueOnce(new Error("sync_log unreachable"));

    await expect(syncGa4("site-1", "2026-07-01")).rejects.toThrow("network down");
  });
});
