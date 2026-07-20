import { beforeEach, describe, expect, it, vi } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

const { aggregateDailyTotals, aggregateByKeyword, computeTotals, loadAnalyticsSummary, TOP_KEYWORDS_LIMIT } = await import("./analytics-summary");

describe("aggregateDailyTotals", () => {
  it("sums clicks/impressions per day and impression-weights position across keywords/pages", () => {
    const rows = [
      { keyword_id: "kw-1", date: "2026-07-01", position: 3, impressions: 100, clicks: 10 },
      { keyword_id: "kw-2", date: "2026-07-01", position: 8, impressions: 50, clicks: 2 },
      { keyword_id: "kw-1", date: "2026-07-02", position: 4, impressions: 60, clicks: 5 },
    ];
    const result = aggregateDailyTotals(rows);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      date: "2026-07-01",
      clicks: 12,
      impressions: 150,
      ctr: 12 / 150,
      avgPosition: (3 * 100 + 8 * 50) / 150,
    });
    expect(result[1]).toEqual({ date: "2026-07-02", clicks: 5, impressions: 60, ctr: 5 / 60, avgPosition: 4 });
  });

  it("sorts ascending by date regardless of input order", () => {
    const rows = [
      { keyword_id: "kw-1", date: "2026-07-05", position: 1, impressions: 10, clicks: 1 },
      { keyword_id: "kw-1", date: "2026-07-01", position: 1, impressions: 10, clicks: 1 },
    ];
    expect(aggregateDailyTotals(rows).map((r) => r.date)).toEqual(["2026-07-01", "2026-07-05"]);
  });

  it("returns null ctr/avgPosition for a day with zero impressions or no positioned rows", () => {
    const rows = [{ keyword_id: "kw-1", date: "2026-07-01", position: null, impressions: 0, clicks: 0 }];
    const result = aggregateDailyTotals(rows);
    expect(result[0].ctr).toBeNull();
    expect(result[0].avgPosition).toBeNull();
  });

  it("does not zero-fill days with no rows at all — they're simply absent", () => {
    const rows = [
      { keyword_id: "kw-1", date: "2026-07-01", position: 1, impressions: 10, clicks: 1 },
      { keyword_id: "kw-1", date: "2026-07-03", position: 1, impressions: 10, clicks: 1 },
    ];
    expect(aggregateDailyTotals(rows).map((r) => r.date)).toEqual(["2026-07-01", "2026-07-03"]);
  });
});

describe("aggregateByKeyword", () => {
  it("sums per keyword across dates/pages and sorts by clicks desc", () => {
    const rows = [
      { keyword_id: "kw-1", date: "2026-07-01", position: 3, impressions: 100, clicks: 5 },
      { keyword_id: "kw-1", date: "2026-07-02", position: 5, impressions: 50, clicks: 5 },
      { keyword_id: "kw-2", date: "2026-07-01", position: 8, impressions: 200, clicks: 20 },
    ];
    const result = aggregateByKeyword(rows);
    expect(result[0]).toEqual({ keywordId: "kw-2", clicks: 20, impressions: 200, ctr: 20 / 200, avgPosition: 8 });
    expect(result[1]).toEqual({
      keywordId: "kw-1",
      clicks: 10,
      impressions: 150,
      ctr: 10 / 150,
      avgPosition: (3 * 100 + 5 * 50) / 150,
    });
  });

  it("breaks a clicks tie by impressions", () => {
    const rows = [
      { keyword_id: "kw-low-impressions", date: "2026-07-01", position: 1, impressions: 10, clicks: 5 },
      { keyword_id: "kw-high-impressions", date: "2026-07-01", position: 1, impressions: 500, clicks: 5 },
    ];
    expect(aggregateByKeyword(rows).map((r) => r.keywordId)).toEqual(["kw-high-impressions", "kw-low-impressions"]);
  });
});

describe("computeTotals", () => {
  it("sums clicks/impressions and impression-weights position across all rows", () => {
    const rows = [
      { keyword_id: "kw-1", date: "2026-07-01", position: 2, impressions: 100, clicks: 10 },
      { keyword_id: "kw-2", date: "2026-07-01", position: 10, impressions: 20, clicks: 1 },
    ];
    expect(computeTotals(rows)).toEqual({
      clicks: 11,
      impressions: 120,
      ctr: 11 / 120,
      avgPosition: (2 * 100 + 10 * 20) / 120,
    });
  });

  it("returns nulls when there are no rows at all", () => {
    expect(computeTotals([])).toEqual({ clicks: 0, impressions: 0, ctr: null, avgPosition: null });
  });
});

interface MockConfig {
  pages?: Array<{ data: unknown[] | null; error: { message: string } | null }>;
}

function makeSupabaseMock(config: MockConfig = {}) {
  let call = 0;
  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        gte: vi.fn(() => ({
          range: vi.fn(() => {
            const page = config.pages?.[call] ?? { data: [], error: null };
            call += 1;
            return Promise.resolve(page);
          }),
        })),
      })),
    })),
  }));
  return from;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadAnalyticsSummary", () => {
  it("paginates through every page of results (not silently truncated at 1000 rows)", async () => {
    const fullPage = Array.from({ length: 1000 }, (_, i) => ({
      keyword_id: `kw-${i}`,
      date: "2026-07-01",
      position: 5,
      impressions: 1,
      clicks: 1,
    }));
    const partialPage = [{ keyword_id: "kw-last", date: "2026-07-01", position: 5, impressions: 1, clicks: 1 }];
    mockSupabase = { from: makeSupabaseMock({ pages: [{ data: fullPage, error: null }, { data: partialPage, error: null }] }) };

    const result = await loadAnalyticsSummary("site-1");
    expect(result.totals.clicks).toBe(1001);
    expect(result.topKeywords.length).toBeLessThanOrEqual(TOP_KEYWORDS_LIMIT);
  });

  it("throws a clear error when the fetch fails", async () => {
    mockSupabase = { from: makeSupabaseMock({ pages: [{ data: null, error: { message: "connection reset" } }] }) };
    await expect(loadAnalyticsSummary("site-1")).rejects.toThrow(/connection reset/);
  });
});
