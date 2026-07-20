import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPrimarySiteId = vi.fn();
vi.mock("@/lib/seo/site", () => ({
  getPrimarySiteId: () => mockGetPrimarySiteId(),
}));

interface MockConfig {
  syncStatusSummary?: unknown[];
  syncStatusSummaryError?: unknown;
  staleDatasets?: unknown[];
  staleDatasetsError?: unknown;
  syncFailuresRecent?: unknown[];
  syncFailuresRecentError?: unknown;
  recentLogs?: unknown[];
  recentLogsError?: unknown;
}

// Auth is enforced by middleware, not this route (see route.ts) — no 401
// case here; that's covered by src/middleware.test.ts instead.
function makeSupabaseMock(config: MockConfig = {}) {
  const from = vi.fn((table: string) => {
    if (table === "sync_log") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn().mockResolvedValue({ data: config.recentLogs ?? [], error: config.recentLogsError ?? null }),
          })),
        })),
      };
    }
    const viewData: Record<string, { data: unknown[]; error: unknown }> = {
      sync_status_summary: { data: config.syncStatusSummary ?? [], error: config.syncStatusSummaryError ?? null },
      stale_datasets: { data: config.staleDatasets ?? [], error: config.staleDatasetsError ?? null },
      sync_failures_recent: { data: config.syncFailuresRecent ?? [], error: config.syncFailuresRecentError ?? null },
    };
    if (!(table in viewData)) throw new Error(`Unexpected table in test: ${table}`);
    return {
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue(viewData[table]),
      })),
    };
  });
  return { from };
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;

const { GET } = await import("./route");

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPrimarySiteId.mockResolvedValue("site-1");
});

describe("GET /api/seo/status", () => {
  it("returns all three views plus summed retry/warning counts across the recent window", async () => {
    const { from } = makeSupabaseMock({
      syncStatusSummary: [{ source: "gsc", status: "completed" }],
      staleDatasets: [{ source: "ga4", is_stale: true }],
      syncFailuresRecent: [{ id: 1, source: "gsc", status: "failed" }],
      recentLogs: [
        { metadata: { retry_count: 2, warnings: ["a", "b"] } },
        { metadata: { retry_count: 1, warnings: [] } },
        { metadata: null },
      ],
    });
    mockSupabase = { from };

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      syncStatusSummary: [{ source: "gsc", status: "completed" }],
      staleDatasets: [{ source: "ga4", is_stale: true }],
      syncFailuresRecent: [{ id: 1, source: "gsc", status: "failed" }],
      recentWindow: { days: 7, totalRetries: 3, totalWarnings: 2 },
    });
  });

  it("returns zeros and empty arrays when there is no recent activity", async () => {
    const { from } = makeSupabaseMock({});
    mockSupabase = { from };

    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      syncStatusSummary: [],
      staleDatasets: [],
      syncFailuresRecent: [],
      recentWindow: { days: 7, totalRetries: 0, totalWarnings: 0 },
    });
  });

  it("treats malformed metadata (missing retry_count, non-array warnings) as zero rather than throwing", async () => {
    const { from } = makeSupabaseMock({
      recentLogs: [{ metadata: { warnings: "not-an-array" } }, { metadata: {} }],
    });
    mockSupabase = { from };

    const res = await GET();
    const body = await res.json();
    expect(body.recentWindow).toEqual({ days: 7, totalRetries: 0, totalWarnings: 0 });
  });

  it("returns 500 when a view query errors", async () => {
    const { from } = makeSupabaseMock({ staleDatasetsError: { message: "relation does not exist" } });
    mockSupabase = { from };

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/Failed to query stale_datasets/);
  });

  it("returns 500 when getPrimarySiteId throws", async () => {
    mockGetPrimarySiteId.mockRejectedValue(new Error("No site exists"));

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "No site exists" });
  });
});
