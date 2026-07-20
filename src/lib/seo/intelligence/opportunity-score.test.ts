import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;

const {
  positionPotential,
  difficultyScore,
  intentValue,
  normalizedRatio,
  computeOpportunityScore,
  computeOpportunityScores,
} = await import("./opportunity-score");

describe("positionPotential", () => {
  it("matches ARCHITECTURE.md §5.1's exact bucketing, including every boundary", () => {
    expect(positionPotential(null)).toBe(0.3);
    expect(positionPotential(1)).toBe(0.2);
    expect(positionPotential(3)).toBe(0.2);
    expect(positionPotential(4)).toBe(0.6);
    expect(positionPotential(10)).toBe(0.6);
    expect(positionPotential(11)).toBe(1.0);
    expect(positionPotential(20)).toBe(1.0);
    expect(positionPotential(21)).toBe(0.4);
    expect(positionPotential(50)).toBe(0.4);
    expect(positionPotential(51)).toBe(0.1);
  });
});

describe("difficultyScore", () => {
  it("computes 1 - difficulty/100 for real data", () => {
    expect(difficultyScore(0)).toBe(1.0);
    expect(difficultyScore(100)).toBe(0.0);
    expect(difficultyScore(30)).toBeCloseTo(0.7, 6);
  });

  it("defaults to neutral 0.5 when difficulty is null (pre-DataForSEO)", () => {
    expect(difficultyScore(null)).toBe(0.5);
  });
});

describe("intentValue", () => {
  it("matches ARCHITECTURE.md §5.1's exact mapping", () => {
    expect(intentValue("transactional")).toBe(1.0);
    expect(intentValue("commercial")).toBe(0.8);
    expect(intentValue("informational")).toBe(0.4);
    expect(intentValue("navigational")).toBe(0.2);
  });

  it("defaults to 0.5 for null/unknown, per ARCHITECTURE.md's own explicit rule", () => {
    expect(intentValue(null)).toBe(0.5);
    expect(intentValue("something_unrecognized")).toBe(0.5);
  });
});

describe("normalizedRatio", () => {
  it("computes min(value/max, 1.0) for real data", () => {
    expect(normalizedRatio(50, 100)).toBeCloseTo(0.5, 6);
    expect(normalizedRatio(150, 100)).toBe(1.0); // clamped
  });

  it("returns 0 (not a neutral default) when the value is null", () => {
    expect(normalizedRatio(null, 100)).toBe(0);
  });

  it("returns 0 when the site-wide max is 0 or negative (no relative standing to report)", () => {
    expect(normalizedRatio(10, 0)).toBe(0);
  });
});

describe("computeOpportunityScore", () => {
  it("computes the exact weighted sum against hand-calculated values", () => {
    const components = {
      positionPotential: 1.0,
      difficultyScore: 0.7,
      intentValue: 0.8,
      volumeNorm: 0.5,
      businessValue: 0.3,
    };
    const weights = { volume: 0.2, position: 0.35, difficulty: 0.15, intent: 0.15, business_value: 0.15 };
    const expected = (0.5 * 0.2 + 1.0 * 0.35 + 0.7 * 0.15 + 0.8 * 0.15 + 0.3 * 0.15) * 100;
    expect(computeOpportunityScore(components, weights)).toBeCloseTo(expected, 6);
  });
});

interface MockConfig {
  keywordRows?: Array<{ id: string; search_volume: number | null; keyword_difficulty: number | null; cpc: number | null; search_intent: string | null }>;
  metricRows?: Array<{ keyword_id: string; position: number }>;
  scoringWeights?: Record<string, number>;
}

function makeSupabaseMock(config: MockConfig = {}) {
  const from = vi.fn((table: string) => {
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
              not: vi.fn(() => ({
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
              data: { scoring_weights: config.scoringWeights ? { opportunity: config.scoringWeights } : {} },
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

describe("computeOpportunityScores", () => {
  it("returns an empty array immediately when the site has no keywords", async () => {
    const { from } = makeSupabaseMock({ keywordRows: [] });
    mockSupabase = { from };

    const result = await computeOpportunityScores("site-1");
    expect(result).toEqual([]);
  });

  it("scores a keyword with all DataForSEO fields null (Phase 1-only state) using neutral/zero defaults", async () => {
    const { from } = makeSupabaseMock({
      keywordRows: [{ id: "kw-1", search_volume: null, keyword_difficulty: null, cpc: null, search_intent: null }],
      metricRows: [{ keyword_id: "kw-1", position: 15 }],
      scoringWeights: { volume: 0.2, position: 0.35, difficulty: 0.15, intent: 0.15, business_value: 0.15 },
    });
    mockSupabase = { from };

    const [result] = await computeOpportunityScores("site-1");
    expect(result.bestPosition).toBe(15);
    expect(result.components.positionPotential).toBe(1.0); // striking distance (11-20)
    expect(result.components.difficultyScore).toBe(0.5); // neutral default
    expect(result.components.intentValue).toBe(0.5); // neutral default
    expect(result.components.volumeNorm).toBe(0); // no data = 0, not neutral
    expect(result.components.businessValue).toBe(0);
  });

  it("computes volume_norm/business_value against the site-wide max across all keywords, not just the one being scored", async () => {
    const { from } = makeSupabaseMock({
      keywordRows: [
        { id: "kw-1", search_volume: 500, keyword_difficulty: 40, cpc: 2.0, search_intent: "commercial" },
        { id: "kw-2", search_volume: 1000, keyword_difficulty: 20, cpc: 4.0, search_intent: "transactional" },
      ],
      metricRows: [],
      scoringWeights: { volume: 0.2, position: 0.35, difficulty: 0.15, intent: 0.15, business_value: 0.15 },
    });
    mockSupabase = { from };

    const results = await computeOpportunityScores("site-1");
    const kw1 = results.find((r) => r.keywordId === "kw-1")!;
    const kw2 = results.find((r) => r.keywordId === "kw-2")!;
    // max volume across the set is 1000 (kw-2's own), max cpc is 4.0 (kw-2's own)
    expect(kw1.components.volumeNorm).toBeCloseTo(500 / 1000, 6);
    expect(kw1.components.businessValue).toBeCloseTo(2.0 / 4.0, 6);
    expect(kw2.components.volumeNorm).toBe(1.0); // is the max itself
    expect(kw2.components.businessValue).toBe(1.0);
  });

  it("takes the best (lowest) position across multiple rows in the recent window", async () => {
    const { from } = makeSupabaseMock({
      keywordRows: [{ id: "kw-1", search_volume: null, keyword_difficulty: null, cpc: null, search_intent: null }],
      metricRows: [
        { keyword_id: "kw-1", position: 8 },
        { keyword_id: "kw-1", position: 3 },
        { keyword_id: "kw-1", position: 12 },
      ],
      scoringWeights: { volume: 0.2, position: 0.35, difficulty: 0.15, intent: 0.15, business_value: 0.15 },
    });
    mockSupabase = { from };

    const [result] = await computeOpportunityScores("site-1");
    expect(result.bestPosition).toBe(3);
  });

  it("falls back to the documented default weights when site_configs.scoring_weights.opportunity is missing", async () => {
    const { from } = makeSupabaseMock({
      keywordRows: [{ id: "kw-1", search_volume: null, keyword_difficulty: null, cpc: null, search_intent: null }],
      metricRows: [],
      scoringWeights: undefined,
    });
    mockSupabase = { from };

    const [result] = await computeOpportunityScores("site-1");
    // no ranking -> positionPotential 0.3, difficulty/intent neutral 0.5, volume/business 0
    // default weights: volume .2, position .35, difficulty .15, intent .15, business .15
    const expected = (0 * 0.2 + 0.3 * 0.35 + 0.5 * 0.15 + 0.5 * 0.15 + 0 * 0.15) * 100;
    expect(result.score).toBeCloseTo(expected, 6);
  });
});
