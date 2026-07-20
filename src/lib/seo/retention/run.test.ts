import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockStartSyncRun = vi.fn();
const mockCompleteSyncRun = vi.fn();
vi.mock("@/lib/seo/sync-log", () => ({
  startSyncRun: (...args: unknown[]) => mockStartSyncRun(...args),
  completeSyncRun: (...args: unknown[]) => mockCompleteSyncRun(...args),
}));

vi.mock("@/lib/seo/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;

const { mondayOfWeek, aggregateKeywordPageMetricsWeekly, aggregatePageMetricsWeekly, runRetention } = await import(
  "./run"
);

describe("mondayOfWeek", () => {
  it("returns the date itself when it's already a Monday", () => {
    expect(mondayOfWeek("2024-01-01")).toBe("2024-01-01"); // 2024-01-01 is a real-world Monday
  });

  it("rounds a mid-week date back to that week's Monday", () => {
    expect(mondayOfWeek("2024-01-03")).toBe("2024-01-01"); // Wednesday
  });

  it("rounds a Sunday back to the Monday that started its own week (not the next one)", () => {
    expect(mondayOfWeek("2024-01-07")).toBe("2024-01-01"); // Sunday
  });

  it("does not fold the following Monday into the prior week", () => {
    expect(mondayOfWeek("2024-01-08")).toBe("2024-01-08"); // Monday
  });
});

describe("aggregateKeywordPageMetricsWeekly", () => {
  it("computes impression-weighted avg_position and sum-derived avg_ctr against hand-calculated values", () => {
    const rows = [
      { keyword_id: "kw-1", page_id: "pg-1", date: "2024-01-01", position: 3, impressions: 100, clicks: 10 },
      { keyword_id: "kw-1", page_id: "pg-1", date: "2024-01-02", position: 5, impressions: 20, clicks: 1 },
    ];
    const result = aggregateKeywordPageMetricsWeekly(rows, "site-1");

    expect(result).toHaveLength(1);
    // avg_position = (3*100 + 5*20) / (100+20) = 400/120 = 3.3333...
    expect(result[0].avg_position).toBeCloseTo(400 / 120, 6);
    expect(result[0].total_impressions).toBe(120);
    expect(result[0].total_clicks).toBe(11);
    // avg_ctr = 11/120, NOT the average of the two daily CTRs (0.1 and 0.05 -> 0.075)
    expect(result[0].avg_ctr).toBeCloseTo(11 / 120, 6);
    expect(result[0].week_start).toBe("2024-01-01");
    expect(result[0].site_id).toBe("site-1");
  });

  it("splits rows into separate weekly buckets by (keyword_id, page_id, week_start)", () => {
    const rows = [
      { keyword_id: "kw-1", page_id: "pg-1", date: "2024-01-01", position: 3, impressions: 10, clicks: 1 },
      { keyword_id: "kw-1", page_id: "pg-1", date: "2024-01-08", position: 3, impressions: 10, clicks: 1 }, // next week
      { keyword_id: "kw-2", page_id: "pg-1", date: "2024-01-01", position: 3, impressions: 10, clicks: 1 }, // different keyword
    ];
    const result = aggregateKeywordPageMetricsWeekly(rows, "site-1");
    expect(result).toHaveLength(3);
  });

  it("treats a null position as excluded from the weighted average but still counts impressions/clicks", () => {
    const rows = [
      { keyword_id: "kw-1", page_id: "pg-1", date: "2024-01-01", position: null, impressions: 0, clicks: 0 },
      { keyword_id: "kw-1", page_id: "pg-1", date: "2024-01-02", position: 4, impressions: 50, clicks: 5 },
    ];
    const result = aggregateKeywordPageMetricsWeekly(rows, "site-1");
    expect(result[0].avg_position).toBe(4); // only the non-null-position day contributes
    expect(result[0].total_impressions).toBe(50);
  });

  it("returns avg_position/avg_ctr as null (not NaN) when a bucket has zero impressions throughout", () => {
    const rows = [{ keyword_id: "kw-1", page_id: "pg-1", date: "2024-01-01", position: null, impressions: 0, clicks: 0 }];
    const result = aggregateKeywordPageMetricsWeekly(rows, "site-1");
    expect(result[0].avg_position).toBeNull();
    expect(result[0].avg_ctr).toBeNull();
  });
});

describe("aggregatePageMetricsWeekly", () => {
  it("computes per-day averages and session-weighted rates against hand-calculated values", () => {
    const rows = [
      {
        page_id: "pg-1",
        date: "2024-01-01",
        sessions: 100,
        engaged_sessions: 60,
        bounce_rate: 0.4,
        avg_engagement_time: 30,
        conversions: 2,
        conversion_value: 30,
      },
      {
        page_id: "pg-1",
        date: "2024-01-02",
        sessions: 50,
        engaged_sessions: 20,
        bounce_rate: 0.6,
        avg_engagement_time: 10,
        conversions: 1,
        conversion_value: 15,
      },
    ];
    const result = aggregatePageMetricsWeekly(rows, "site-1");

    expect(result).toHaveLength(1);
    expect(result[0].avg_sessions).toBe((100 + 50) / 2);
    expect(result[0].avg_engaged_sessions).toBe((60 + 20) / 2);
    // session-weighted, not a flat (0.4+0.6)/2 = 0.5
    expect(result[0].avg_bounce_rate).toBeCloseTo((0.4 * 100 + 0.6 * 50) / 150, 6);
    expect(result[0].avg_engagement_time).toBeCloseTo((30 * 100 + 10 * 50) / 150, 6);
    expect(result[0].total_conversions).toBe(3);
    expect(result[0].total_conversion_value).toBe(45);
  });

  it("divides by the actual number of daily rows present, not a hardcoded 7 (handles gaps)", () => {
    const rows = [
      { page_id: "pg-1", date: "2024-01-01", sessions: 100, engaged_sessions: 50, bounce_rate: null, avg_engagement_time: null, conversions: 0, conversion_value: 0 },
    ];
    const result = aggregatePageMetricsWeekly(rows, "site-1");
    expect(result[0].avg_sessions).toBe(100); // not 100/7
  });

  it("returns null rates (not NaN) when no day in the bucket has a non-null bounce_rate/avg_engagement_time", () => {
    const rows = [
      { page_id: "pg-1", date: "2024-01-01", sessions: 0, engaged_sessions: 0, bounce_rate: null, avg_engagement_time: null, conversions: 0, conversion_value: 0 },
    ];
    const result = aggregatePageMetricsWeekly(rows, "site-1");
    expect(result[0].avg_bounce_rate).toBeNull();
    expect(result[0].avg_engagement_time).toBeNull();
  });
});

// ----------------------------------------------------------------------------
// runRetention orchestration — mocked Supabase client covering exactly the
// query shapes run.ts issues.

interface MockConfig {
  kpmRows?: unknown[];
  kpmFetchError?: unknown;
  kpmUpsertError?: unknown;
  kpmDeleteError?: unknown;
  pmRows?: unknown[];
  pmFetchError?: unknown;
  pmUpsertError?: unknown;
  pmDeleteError?: unknown;
  syncLogCount?: number;
  syncLogCountError?: unknown;
  syncLogDeleteCount?: number;
  syncLogDeleteError?: unknown;
}

function makeSupabaseMock(config: MockConfig = {}) {
  const calls: Record<string, unknown> = {};
  const boundaries: Record<string, string> = {};

  const from = vi.fn((table: string) => {
    if (table === "keyword_page_metrics") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn((_col: string, boundary: string) => {
              boundaries.kpmFetchBoundary = boundary;
              return { range: vi.fn().mockResolvedValue({ data: config.kpmRows ?? [], error: config.kpmFetchError ?? null }) };
            }),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn((_col: string, boundary: string) => {
              boundaries.kpmDeleteBoundary = boundary;
              return Promise.resolve({ error: config.kpmDeleteError ?? null });
            }),
          })),
        })),
      };
    }
    if (table === "page_metrics") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn((_col: string, boundary: string) => {
              boundaries.pmFetchBoundary = boundary;
              return { range: vi.fn().mockResolvedValue({ data: config.pmRows ?? [], error: config.pmFetchError ?? null }) };
            }),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn((_col: string, boundary: string) => {
              boundaries.pmDeleteBoundary = boundary;
              return Promise.resolve({ error: config.pmDeleteError ?? null });
            }),
          })),
        })),
      };
    }
    if (table === "keyword_page_metrics_weekly") {
      return {
        upsert: vi.fn((payload: unknown[]) => {
          calls.kpmWeeklyUpsertPayload = payload;
          return Promise.resolve({ error: config.kpmUpsertError ?? null });
        }),
      };
    }
    if (table === "page_metrics_weekly") {
      return {
        upsert: vi.fn((payload: unknown[]) => {
          calls.pmWeeklyUpsertPayload = payload;
          return Promise.resolve({ error: config.pmUpsertError ?? null });
        }),
      };
    }
    if (table === "sync_log") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn().mockResolvedValue({ count: config.syncLogCount ?? 0, error: config.syncLogCountError ?? null }),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn().mockResolvedValue({ count: config.syncLogDeleteCount ?? 0, error: config.syncLogDeleteError ?? null }),
          })),
        })),
      };
    }
    throw new Error(`Unexpected table in test: ${table}`);
  });

  return { from, calls, boundaries };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockStartSyncRun.mockResolvedValue(99);
  mockCompleteSyncRun.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("runRetention", () => {
  it("dry run computes the correct counts and writes nothing, including no sync_log row", async () => {
    const { from, calls } = makeSupabaseMock({
      kpmRows: [{ keyword_id: "kw-1", page_id: "pg-1", date: "2024-01-01", position: 3, impressions: 10, clicks: 1 }],
      pmRows: [{ page_id: "pg-1", date: "2024-01-01", sessions: 10, engaged_sessions: 5, bounce_rate: 0.5, avg_engagement_time: 20, conversions: 0, conversion_value: 0 }],
      syncLogCount: 4,
    });
    mockSupabase = { from };

    const result = await runRetention("site-1", { dryRun: true });

    expect(result).toEqual({
      dryRun: true,
      keywordPageMetrics: { rowsAggregated: 1, weeksWritten: 1, rowsDeleted: 0 },
      pageMetrics: { rowsAggregated: 1, weeksWritten: 1, rowsDeleted: 0 },
      syncLog: { rowsDeleted: 4 },
    });
    expect(calls.kpmWeeklyUpsertPayload).toBeUndefined();
    expect(calls.pmWeeklyUpsertPayload).toBeUndefined();
    expect(mockStartSyncRun).not.toHaveBeenCalled();
    expect(mockCompleteSyncRun).not.toHaveBeenCalled();
  });

  it("a real run aggregates, upserts weekly tables, deletes source rows, and logs a completed sync run", async () => {
    const { from, calls } = makeSupabaseMock({
      kpmRows: [{ keyword_id: "kw-1", page_id: "pg-1", date: "2024-01-01", position: 3, impressions: 10, clicks: 1 }],
      pmRows: [{ page_id: "pg-1", date: "2024-01-01", sessions: 10, engaged_sessions: 5, bounce_rate: 0.5, avg_engagement_time: 20, conversions: 1, conversion_value: 10 }],
      syncLogDeleteCount: 2,
    });
    mockSupabase = { from };

    const result = await runRetention("site-1");

    expect(result).toEqual({
      dryRun: false,
      keywordPageMetrics: { rowsAggregated: 1, weeksWritten: 1, rowsDeleted: 1 },
      pageMetrics: { rowsAggregated: 1, weeksWritten: 1, rowsDeleted: 1 },
      syncLog: { rowsDeleted: 2 },
    });
    expect(calls.kpmWeeklyUpsertPayload).toHaveLength(1);
    expect(calls.pmWeeklyUpsertPayload).toHaveLength(1);
    expect(mockStartSyncRun).toHaveBeenCalledWith("site-1", "retention");
    expect(mockCompleteSyncRun).toHaveBeenCalledWith(99, { status: "completed", recordsProcessed: 2 });
  });

  it("is idempotent: a second run with nothing left to aggregate is a clean no-op", async () => {
    const { from, calls } = makeSupabaseMock({ kpmRows: [], pmRows: [], syncLogDeleteCount: 0 });
    mockSupabase = { from };

    const result = await runRetention("site-1");

    expect(result).toEqual({
      dryRun: false,
      keywordPageMetrics: { rowsAggregated: 0, weeksWritten: 0, rowsDeleted: 0 },
      pageMetrics: { rowsAggregated: 0, weeksWritten: 0, rowsDeleted: 0 },
      syncLog: { rowsDeleted: 0 },
    });
    // zero weekly rows -> upsert/delete for the daily tables are skipped entirely
    expect(calls.kpmWeeklyUpsertPayload).toBeUndefined();
    expect(calls.pmWeeklyUpsertPayload).toBeUndefined();
    expect(mockCompleteSyncRun).toHaveBeenCalledWith(99, { status: "completed", recordsProcessed: 0 });
  });

  it("only fetches/deletes rows strictly before the Monday of the cutoff week (full-week alignment)", async () => {
    const { from, boundaries } = makeSupabaseMock({});
    mockSupabase = { from };

    await runRetention("site-1", { dryRun: true });

    expect(boundaries.kpmFetchBoundary).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // the boundary itself must be a Monday
    const boundaryDate = new Date(`${boundaries.kpmFetchBoundary}T00:00:00Z`);
    expect(boundaryDate.getUTCDay()).toBe(1); // 1 = Monday
  });

  it("marks the run failed and rethrows when fetching keyword_page_metrics errors", async () => {
    const { from } = makeSupabaseMock({ kpmFetchError: { message: "connection reset" } });
    mockSupabase = { from };

    await expect(runRetention("site-1")).rejects.toThrow(/Failed to fetch keyword_page_metrics/);
    expect(mockCompleteSyncRun).toHaveBeenCalledWith(99, expect.objectContaining({ status: "failed" }));
  });

  it("marks the run failed and rethrows when the weekly upsert errors", async () => {
    const { from } = makeSupabaseMock({
      kpmRows: [{ keyword_id: "kw-1", page_id: "pg-1", date: "2024-01-01", position: 3, impressions: 10, clicks: 1 }],
      kpmUpsertError: { message: "constraint violation" },
    });
    mockSupabase = { from };

    await expect(runRetention("site-1")).rejects.toThrow(/Failed to upsert keyword_page_metrics_weekly/);
    expect(mockCompleteSyncRun).toHaveBeenCalledWith(99, expect.objectContaining({ status: "failed" }));
  });

  it("does not throw the whole job if completeSyncRun itself fails after a job error", async () => {
    const { from } = makeSupabaseMock({ kpmFetchError: { message: "connection reset" } });
    mockSupabase = { from };
    mockCompleteSyncRun.mockRejectedValueOnce(new Error("sync_log unreachable"));

    await expect(runRetention("site-1")).rejects.toThrow(/Failed to fetch keyword_page_metrics/);
  });
});
