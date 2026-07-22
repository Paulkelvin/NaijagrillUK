import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;

const {
  wordCountGap,
  computeEffortScore,
  projectedClickGain,
  pageConversionRate,
  avgConversionValue,
  computeRevenuePotential,
  computeRoiScore,
  computePageRoiScores,
  CONTENT_AGE_SCORE,
  MISSING_PAA_SCORE,
  LINK_DEFICIT_SCORE,
  SCHEMA_GAP_SCORE,
  META_QUALITY_SCORE,
  MAX_ACTIONABLE_VOLUME,
} = await import("./page-roi-score");

describe("wordCountGap", () => {
  it("computes (target - word_count) / target for a recognized content_type", () => {
    expect(wordCountGap(750, "landing_page")).toBeCloseTo((800 - 750) / 800, 6);
    expect(wordCountGap(1200, "blog_post")).toBeCloseTo((1500 - 1200) / 1500, 6);
  });

  it("clamps to 0 when word_count already exceeds the target", () => {
    expect(wordCountGap(2000, "product_page")).toBe(0);
  });

  it("falls back to the 800-word default target for an unrecognized/null content_type", () => {
    expect(wordCountGap(400, null)).toBeCloseTo((800 - 400) / 800, 6);
    expect(wordCountGap(400, "unknown_type")).toBeCloseTo((800 - 400) / 800, 6);
  });

  it("returns 0 (not a neutral default) when word_count is null — no crawler populates it yet", () => {
    expect(wordCountGap(null, "blog_post")).toBe(0);
  });
});

describe("forced-0 effort components", () => {
  it("are all exactly 0, per the top-of-file documented reasoning", () => {
    expect(CONTENT_AGE_SCORE).toBe(0);
    expect(MISSING_PAA_SCORE).toBe(0);
    expect(LINK_DEFICIT_SCORE).toBe(0);
    expect(SCHEMA_GAP_SCORE).toBe(0);
    expect(META_QUALITY_SCORE).toBe(0);
  });
});

describe("computeEffortScore", () => {
  it("computes the exact weighted sum against hand-calculated values", () => {
    const components = {
      wordCountGap: 0.4,
      contentAge: 0,
      missingPaa: 0,
      linkDeficit: 0,
      schemaGap: 0,
      metaQuality: 0,
    };
    // only wordCountGap's 0.25 weight contributes today
    expect(computeEffortScore(components)).toBeCloseTo(0.4 * 0.25, 6);
  });
});

describe("projectedClickGain", () => {
  const ctrPositions = { "1": 0.28, "5": 0.06, "8": 0.035, "20": 0.004 };

  it("computes click_gain_K against hand-calculated values", () => {
    // avgPosition=8 -> target=5 -> ctr[5]=0.06; searchVolume=1000 -> projected=60; current=20 -> gain=40
    const gain = projectedClickGain({ currentClicks30d: 20, avgPosition: 8, searchVolume: 1000 }, ctrPositions);
    expect(gain).toBeCloseTo(40, 6);
  });

  it("clamps to 0 when projected clicks are lower than current (no regression counted as negative gain)", () => {
    const gain = projectedClickGain({ currentClicks30d: 1000, avgPosition: 8, searchVolume: 1000 }, ctrPositions);
    expect(gain).toBe(0);
  });

  it("clamps target_position to a floor of 1", () => {
    // avgPosition=2 -> target=max(1, 2-3)=1 -> ctr[1]=0.28
    const gain = projectedClickGain({ currentClicks30d: 0, avgPosition: 2, searchVolume: 100 }, ctrPositions);
    expect(gain).toBeCloseTo(28, 6);
  });

  it("clamps the CTR-model lookup bucket to a ceiling of 20", () => {
    // avgPosition=25 -> target=22 -> bucket clamped to 20 -> ctr[20]=0.004
    const gain = projectedClickGain({ currentClicks30d: 0, avgPosition: 25, searchVolume: 1000 }, ctrPositions);
    expect(gain).toBeCloseTo(4, 6);
  });

  it("returns 0 when avgPosition or searchVolume is null (pre-DataForSEO/no ranking data)", () => {
    expect(projectedClickGain({ currentClicks30d: 0, avgPosition: null, searchVolume: 1000 }, ctrPositions)).toBe(0);
    expect(projectedClickGain({ currentClicks30d: 0, avgPosition: 5, searchVolume: null }, ctrPositions)).toBe(0);
  });
});

describe("pageConversionRate", () => {
  it("uses the page's own rate at/above the 50-session floor", () => {
    expect(pageConversionRate(10, 100, 999, 999)).toBeCloseTo(0.1, 6);
    expect(pageConversionRate(5, 50, 999, 999)).toBeCloseTo(0.1, 6); // exactly at the boundary
  });

  it("falls back to the site-wide rate below the 50-session floor", () => {
    expect(pageConversionRate(2, 20, 50, 1000)).toBeCloseTo(0.05, 6);
  });

  it("returns 0 when the relevant denominator is 0", () => {
    expect(pageConversionRate(0, 0, 0, 0)).toBe(0);
    expect(pageConversionRate(0, 100, 0, 0)).toBe(0);
  });
});

describe("avgConversionValue", () => {
  it("averages configured conversion_events when present", () => {
    const events = [
      { name: "whatsapp_click", value: 15 },
      { name: "uber_eats_click", value: 12 },
    ];
    expect(avgConversionValue(events, [1, 2, 3])).toBeCloseTo(13.5, 6);
  });

  it("falls back to the mean CPC across the page's keywords when no conversion_events exist", () => {
    expect(avgConversionValue([], [2, 4, null])).toBeCloseTo(3, 6);
  });

  it("returns 0 when neither conversion_events nor any real CPC exists", () => {
    expect(avgConversionValue([], [null, null])).toBe(0);
    expect(avgConversionValue([], [])).toBe(0);
  });
});

describe("computeRevenuePotential", () => {
  it("multiplies the three inputs", () => {
    expect(computeRevenuePotential(40, 0.1, 15)).toBeCloseTo(60, 6);
  });
});

describe("computeRoiScore", () => {
  it("divides revenue_potential by effort_score when above the floor", () => {
    expect(computeRoiScore(100, 0.5)).toBeCloseTo(200, 6);
  });

  it("applies the 0.05 floor when effort_score is lower (or exactly 0, today's common case)", () => {
    expect(computeRoiScore(100, 0)).toBeCloseTo(2000, 6);
    expect(computeRoiScore(100, 0.02)).toBeCloseTo(2000, 6);
  });
});

interface MockConfig {
  pageRows?: Array<{ id: string; word_count: number | null; content_type: string | null }>;
  keywordRows?: Array<{ id: string; search_volume: number | null; cpc: number | null }>;
  kpmRows?: Array<{ page_id: string; keyword_id: string; position: number | null; clicks: number }>;
  pmRows?: Array<{ page_id: string; sessions: number; conversions: number }>;
  ctrModel?: { positions: Record<string, number> };
  conversionEvents?: Array<{ name: string; value: number }>;
}

function makeSupabaseMock(config: MockConfig = {}) {
  const from = vi.fn((table: string) => {
    if (table === "pages") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            range: vi.fn().mockResolvedValue({ data: config.pageRows ?? [], error: null }),
          })),
        })),
      };
    }
    if (table === "keywords") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            range: vi.fn().mockResolvedValue({ data: config.keywordRows ?? [], error: null }),
          })),
        })),
      };
    }
    if (table === "keyword_page_metrics") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              range: vi.fn().mockResolvedValue({ data: config.kpmRows ?? [], error: null }),
            })),
          })),
        })),
      };
    }
    if (table === "page_metrics") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              range: vi.fn().mockResolvedValue({ data: config.pmRows ?? [], error: null }),
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
              data: {
                ctr_model: config.ctrModel ?? null,
                conversion_events: config.conversionEvents ?? [],
              },
              error: null,
            }),
          })),
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

describe("computePageRoiScores", () => {
  it("returns an empty array immediately when the site has no pages", async () => {
    const { from } = makeSupabaseMock({ pageRows: [] });
    mockSupabase = { from };

    const result = await computePageRoiScores("site-1");
    expect(result).toEqual([]);
  });

  it("computes a full page ROI chain against hand-calculated values", async () => {
    const { from } = makeSupabaseMock({
      pageRows: [{ id: "pg-1", word_count: 400, content_type: "landing_page" }],
      keywordRows: [{ id: "kw-1", search_volume: 1000, cpc: 2.0 }],
      kpmRows: [
        { page_id: "pg-1", keyword_id: "kw-1", position: 8, clicks: 10 },
        { page_id: "pg-1", keyword_id: "kw-1", position: 8, clicks: 10 },
      ],
      pmRows: [{ page_id: "pg-1", sessions: 100, conversions: 10 }],
      ctrModel: { positions: { "1": 0.28, "5": 0.06, "8": 0.035 } },
      conversionEvents: [{ name: "whatsapp_click", value: 15 }],
    });
    mockSupabase = { from };

    const [result] = await computePageRoiScores("site-1");
    // avgPosition=8, target=5, ctr[5]=0.06, projected=1000*0.06=60, current=20 -> gain=40
    expect(result.trafficPotential).toBeCloseTo(40, 6);
    // page has 100 sessions (>=50 floor) -> own rate 10/100=0.1
    expect(result.pageConversionRate).toBeCloseTo(0.1, 6);
    // conversion_events present -> avg = 15
    expect(result.avgConversionValue).toBeCloseTo(15, 6);
    // revenue = 40 * 0.1 * 15 = 60
    expect(result.revenuePotential).toBeCloseTo(60, 6);
    // word_count=400, landing_page target=800 -> gap=(800-400)/800=0.5 -> effort=0.5*0.25=0.125
    expect(result.effortScore).toBeCloseTo(0.125, 6);
    // roi = 60 / max(0.125, 0.05) = 480
    expect(result.roiScore).toBeCloseTo(480, 6);
  });

  it("excludes a keyword above the volume ceiling from trafficPotential, keeps one under it", async () => {
    const { from } = makeSupabaseMock({
      pageRows: [{ id: "pg-1", word_count: null, content_type: null }],
      keywordRows: [
        { id: "kw-noise", search_volume: MAX_ACTIONABLE_VOLUME + 1, cpc: null },
        { id: "kw-real", search_volume: 1000, cpc: null },
      ],
      kpmRows: [
        { page_id: "pg-1", keyword_id: "kw-noise", position: 9, clicks: 0 },
        { page_id: "pg-1", keyword_id: "kw-real", position: 8, clicks: 0 },
      ],
      pmRows: [],
      ctrModel: { positions: { "1": 0.28, "5": 0.06, "8": 0.035 } },
    });
    mockSupabase = { from };

    const [result] = await computePageRoiScores("site-1");
    // Only kw-real should contribute: avgPosition=8, target=5, ctr[5]=0.06,
    // projected=1000*0.06=60, current=0 -> gain=60. If kw-noise's ~
    // millions-scale volume leaked in, this would be orders of magnitude
    // larger.
    expect(result.trafficPotential).toBeCloseTo(60, 6);
  });

  it("falls back to the site-wide conversion rate when a page is below the 50-session floor", async () => {
    const { from } = makeSupabaseMock({
      pageRows: [
        { id: "pg-sparse", word_count: null, content_type: null },
        { id: "pg-other", word_count: null, content_type: null },
      ],
      keywordRows: [],
      kpmRows: [],
      pmRows: [
        { page_id: "pg-sparse", sessions: 10, conversions: 5 },
        { page_id: "pg-other", sessions: 990, conversions: 90 },
      ],
    });
    mockSupabase = { from };

    const results = await computePageRoiScores("site-1");
    const sparse = results.find((r) => r.pageId === "pg-sparse")!;
    // site-wide: (5+90)/(10+990) = 95/1000 = 0.095
    expect(sparse.pageConversionRate).toBeCloseTo(0.095, 6);
  });

  it("falls back to industry-default CTR positions when site_configs.ctr_model is unset", async () => {
    const { from } = makeSupabaseMock({
      pageRows: [{ id: "pg-1", word_count: null, content_type: null }],
      keywordRows: [{ id: "kw-1", search_volume: 500, cpc: null }],
      kpmRows: [{ page_id: "pg-1", keyword_id: "kw-1", position: 8, clicks: 0 }],
      pmRows: [],
      ctrModel: undefined,
    });
    mockSupabase = { from };

    const [result] = await computePageRoiScores("site-1");
    // target=5, industry default ctr[5]=0.06, projected=500*0.06=30, current=0 -> gain=30
    expect(result.trafficPotential).toBeCloseTo(30, 6);
  });

  it("uses word_count_gap = 0 (not a neutral default) for pages with no crawled word_count", async () => {
    const { from } = makeSupabaseMock({
      pageRows: [{ id: "pg-1", word_count: null, content_type: null }],
      keywordRows: [],
      kpmRows: [],
      pmRows: [],
    });
    mockSupabase = { from };

    const [result] = await computePageRoiScores("site-1");
    expect(result.effortComponents.wordCountGap).toBe(0);
    expect(result.effortScore).toBe(0);
    // revenue is also 0 (no keywords) -> roi = 0 / 0.05 = 0
    expect(result.roiScore).toBe(0);
  });
});
