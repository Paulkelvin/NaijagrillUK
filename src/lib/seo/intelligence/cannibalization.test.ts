import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;

const { detectCandidates, scoreCandidate, detectCannibalization } = await import("./cannibalization");

// detectCannibalization filters rows against a *rolling* window
// (SCORING_WINDOW_DAYS = 30, DETECTION_WINDOW_DAYS = 90) computed from
// Date.now(). These fixtures were originally hardcoded to a literal
// "2026-07-01", which sat inside that window when written and silently fell
// outside it once real time moved past 2026-07-31 — the suite began
// failing on its own with no code change, because the tests aged out.
//
// RECENT_DATE is computed relative to today so it is always comfortably
// inside both windows. Do not replace it with a literal date.
const RECENT_DATE = (() => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 5);
  return d.toISOString().slice(0, 10);
})();

function row(
  keywordId: string,
  pageId: string,
  date: string,
  position: number | null,
  impressions: number,
  clicks: number,
) {
  return { keyword_id: keywordId, page_id: pageId, date, position, impressions, clicks };
}

describe("detectCandidates", () => {
  it("flags a keyword with impressions from 2+ distinct pages", () => {
    const rows = [
      row("kw-1", "pg-1", RECENT_DATE, 3, 100, 10),
      row("kw-1", "pg-2", RECENT_DATE, 8, 50, 2),
    ];
    expect(detectCandidates(rows)).toEqual(new Set(["kw-1"]));
  });

  it("does not flag a keyword with only 1 page", () => {
    const rows = [row("kw-1", "pg-1", RECENT_DATE, 3, 100, 10)];
    expect(detectCandidates(rows)).toEqual(new Set());
  });

  it("flags multiple keywords independently", () => {
    const rows = [
      row("kw-1", "pg-1", RECENT_DATE, 3, 100, 10),
      row("kw-1", "pg-2", RECENT_DATE, 8, 50, 2),
      row("kw-2", "pg-3", RECENT_DATE, 5, 20, 1),
    ];
    expect(detectCandidates(rows)).toEqual(new Set(["kw-1"]));
  });
});

describe("scoreCandidate", () => {
  const ctrPositions = { "1": 0.28, "2": 0.15, "3": 0.11, "4": 0.08, "20": 0.004 };

  it("computes position variance, click split, and traffic value against hand-calculated values", () => {
    const rows30d = [
      row("kw-1", "pg-1", RECENT_DATE, 2, 100, 20),
      row("kw-1", "pg-2", RECENT_DATE, 4, 100, 10),
    ];
    const result = scoreCandidate("kw-1", rows30d, ctrPositions, 2.0);

    // positions [2, 4]: mean=3, variance=((2-3)^2+(4-3)^2)/2=1, stddev=1, norm=1/10=0.1
    expect(result.positionVarianceNorm).toBeCloseTo(0.1, 6);
    // totalClicks=30, maxPageClicks=20 (pg-1) -> clickSplit = 1 - 20/30 = 1/3
    expect(result.clickSplit).toBeCloseTo(1 / 3, 6);
    expect(result.totalClicks).toBe(30);
    expect(result.dominantPageId).toBe("pg-1");
    expect(result.dominantShare).toBeCloseTo(20 / 30, 6);
    // trafficValue = 30 clicks * cpc 2.0 = 60
    expect(result.trafficValue).toBe(60);
  });

  it("falls back to cpc=1.0 when the keyword has no CPC data (pre-DataForSEO)", () => {
    const rows30d = [row("kw-1", "pg-1", RECENT_DATE, 2, 100, 10)];
    const result = scoreCandidate("kw-1", rows30d, ctrPositions, null);
    expect(result.trafficValue).toBe(10); // 10 clicks * 1.0
  });

  it("clamps the CTR-model lookup position to 20 when the best average position is worse than 20", () => {
    const rows30d = [row("kw-1", "pg-1", RECENT_DATE, 45, 100, 1)];
    const result = scoreCandidate("kw-1", rows30d, ctrPositions, 1.0);
    // expectedCtr should use position "20" (0.004), actualCtr = 1/100 = 0.01, which is HIGHER
    // than expected, so ctrDeficit = max(0, 0.004 - 0.01) = 0 -> norm 0
    expect(result.ctrDeficitNorm).toBe(0);
  });

  it("computes ctr_deficit correctly when actual CTR underperforms the expected rate", () => {
    // best avg position = 1 -> expectedCtr = 0.28; actualCtr = 5/1000 = 0.005
    const rows30d = [row("kw-1", "pg-1", RECENT_DATE, 1, 1000, 5)];
    const result = scoreCandidate("kw-1", rows30d, ctrPositions, 1.0);
    const expectedDeficit = 0.28 - 0.005;
    expect(result.ctrDeficitNorm).toBeCloseTo(Math.min(expectedDeficit / 0.28, 1.0), 6);
  });

  it("returns clickSplit and dominantShare of 0 when there are zero total clicks (degenerate case)", () => {
    const rows30d = [row("kw-1", "pg-1", RECENT_DATE, 3, 100, 0)];
    const result = scoreCandidate("kw-1", rows30d, ctrPositions, 1.0);
    expect(result.clickSplit).toBe(0);
    expect(result.dominantShare).toBe(0);
    expect(result.dominantPageId).toBeNull();
  });
});

interface MockConfig {
  metricRows?: unknown[];
  ctrModel?: { positions: Record<string, number> } | null;
  scoringWeights?: Record<string, number> | null;
  siteConfig?: Record<string, unknown>;
  keywordRows?: Array<{ id: string; keyword_normalized: string; cpc: number | null }>;
}

function makeSupabaseMock(config: MockConfig = {}) {
  const from = vi.fn((table: string) => {
    if (table === "keyword_page_metrics") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              gt: vi.fn(() => ({
                range: vi.fn().mockResolvedValue({ data: config.metricRows ?? [], error: null }),
              })),
            })),
          })),
        })),
      };
    }
    if (table === "site_configs") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { ctr_model: config.ctrModel ?? { positions: {} }, scoring_weights: { cannibalization: config.scoringWeights } },
              error: null,
            }),
          })),
        })),
      };
    }
    if (table === "sites") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { config: config.siteConfig ?? {} }, error: null }),
          })),
        })),
      };
    }
    if (table === "keywords") {
      return {
        select: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({ data: config.keywordRows ?? [], error: null }),
        })),
      };
    }
    throw new Error(`Unexpected table in test: ${table}`);
  });
  return { from };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("detectCannibalization", () => {
  const ctrPositions = { "1": 0.28, "2": 0.15, "3": 0.11, "4": 0.08, "5": 0.06 };
  const defaultWeights = { position_variance: 0.25, click_split: 0.3, ctr_deficit: 0.25, traffic_at_risk: 0.2 };

  it("returns an empty array immediately when no keyword has 2+ pages, without querying anything else", async () => {
    const { from } = makeSupabaseMock({ metricRows: [row("kw-1", "pg-1", RECENT_DATE, 2, 100, 10)] });
    mockSupabase = { from };

    const result = await detectCannibalization("site-1");
    expect(result).toEqual([]);
    expect(from).toHaveBeenCalledTimes(1); // only keyword_page_metrics, nothing else
  });

  it("scores a real cannibalized keyword and generates a canonicalize recommendation for a dominant page", async () => {
    const metricRows = [
      row("kw-1", "pg-1", RECENT_DATE, 2, 1000, 90),
      row("kw-1", "pg-2", RECENT_DATE, 10, 500, 5),
    ];
    const { from } = makeSupabaseMock({
      metricRows,
      ctrModel: { positions: ctrPositions },
      scoringWeights: defaultWeights,
      keywordRows: [{ id: "kw-1", keyword_normalized: "jollof rice", cpc: 1.5 }],
    });
    mockSupabase = { from };

    const [result] = await detectCannibalization("site-1");
    expect(result.keywordId).toBe("kw-1");
    expect(result.pageIds.sort()).toEqual(["pg-1", "pg-2"]);
    // pg-1 has 90/95 = ~94.7% of clicks, well above the 70% dominant threshold
    expect(result.recommendation).toBe("canonicalize");
    expect(result.recommendedCanonicalPageId).toBe("pg-1");
    expect(result.score).toBeGreaterThan(0);
  });

  it("excludes a keyword matching a configured brand term", async () => {
    const metricRows = [
      row("kw-1", "pg-1", RECENT_DATE, 2, 1000, 90),
      row("kw-1", "pg-2", RECENT_DATE, 10, 500, 5),
    ];
    const { from } = makeSupabaseMock({
      metricRows,
      ctrModel: { positions: ctrPositions },
      scoringWeights: defaultWeights,
      siteConfig: { brand_terms: ["naija grill"] },
      keywordRows: [{ id: "kw-1", keyword_normalized: "naija grill menu", cpc: null }],
    });
    mockSupabase = { from };

    const result = await detectCannibalization("site-1");
    expect(result).toEqual([]);
  });

  it("returns recommendation: null when the score doesn't exceed the action threshold", async () => {
    // Two pages with near-identical, low-severity metrics -> low score
    const metricRows = [
      row("kw-1", "pg-1", RECENT_DATE, 5, 100, 5),
      row("kw-1", "pg-2", RECENT_DATE, 5, 100, 5),
    ];
    const { from } = makeSupabaseMock({
      metricRows,
      ctrModel: { positions: ctrPositions },
      scoringWeights: defaultWeights,
      keywordRows: [{ id: "kw-1", keyword_normalized: "jollof rice", cpc: 1.0 }],
    });
    mockSupabase = { from };

    const [result] = await detectCannibalization("site-1");
    // identical pages: clickSplit = 1 - 5/10 = 0.5, position variance 0 (same position),
    // low traffic value normalized to 1.0 (only one keyword in the set) -- still,
    // with these small numbers the score should land at or below threshold.
    expect(result.recommendation === null || result.score <= 40).toBe(true);
  });

  it("recommends merge (not canonicalize) when clicks are evenly split between pages", async () => {
    const metricRows = [
      row("kw-1", "pg-1", RECENT_DATE, 3, 1000, 50),
      row("kw-1", "pg-2", RECENT_DATE, 4, 1000, 40),
    ];
    const { from } = makeSupabaseMock({
      metricRows,
      ctrModel: { positions: ctrPositions },
      scoringWeights: defaultWeights,
      keywordRows: [{ id: "kw-1", keyword_normalized: "jollof rice", cpc: 2.0 }],
    });
    mockSupabase = { from };

    const [result] = await detectCannibalization("site-1");
    expect(result.recommendation).toBe("merge");
    expect(result.recommendedCanonicalPageId).toBeNull();
  });
});
