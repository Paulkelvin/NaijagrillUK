import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;

const { expectedCtrAtPosition, computeKeywordMonthlyValue, computeKeywordValues } = await import("./keyword-value");

describe("expectedCtrAtPosition", () => {
  const ctrPositions = { "1": 0.28, "5": 0.06, "20": 0.004 };

  it("rounds to the nearest bucket and looks up the CTR model", () => {
    expect(expectedCtrAtPosition(5, ctrPositions)).toBeCloseTo(0.06, 6);
    expect(expectedCtrAtPosition(4.6, ctrPositions)).toBeCloseTo(0.06, 6); // rounds to 5
  });

  it("clamps to the model's 1-20 range", () => {
    expect(expectedCtrAtPosition(0, ctrPositions)).toBeCloseTo(0.28, 6); // clamped up to 1
    expect(expectedCtrAtPosition(35, ctrPositions)).toBeCloseTo(0.004, 6); // clamped down to 20
  });

  it("returns 0 (not a neutral default) when position is null — no ranking, no projectable CTR", () => {
    expect(expectedCtrAtPosition(null, ctrPositions)).toBe(0);
  });
});

describe("computeKeywordMonthlyValue", () => {
  it("multiplies the four inputs per ARCHITECTURE.md §5.5's formula", () => {
    expect(computeKeywordMonthlyValue(1000, 0.06, 0.1, 15)).toBeCloseTo(1000 * 0.06 * 0.1 * 15, 6);
  });

  it("returns 0 (not a neutral default) when search_volume is null — pre-Milestone-5 DataForSEO state", () => {
    expect(computeKeywordMonthlyValue(null, 0.06, 0.1, 15)).toBe(0);
  });
});

interface MockConfig {
  keywordRows?: Array<{ id: string; search_volume: number | null; cpc: number | null }>;
  kpmRows?: Array<{ keyword_id: string; page_id: string; position: number | null }>;
  pmRows?: Array<{ page_id: string; sessions: number; conversions: number }>;
  ctrModel?: { positions: Record<string, number> };
  conversionEvents?: Array<{ name: string; value: number }>;
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

describe("computeKeywordValues", () => {
  it("returns an empty array immediately when there's no recent keyword_page_metrics data", async () => {
    const { from } = makeSupabaseMock({ kpmRows: [] });
    mockSupabase = { from };

    const result = await computeKeywordValues("site-1");
    expect(result).toEqual([]);
  });

  it("computes the full chain against hand-calculated values, using conversion_events over the CPC fallback", async () => {
    const { from } = makeSupabaseMock({
      keywordRows: [{ id: "kw-1", search_volume: 1000, cpc: 3.0 }],
      kpmRows: [
        { keyword_id: "kw-1", page_id: "pg-1", position: 5 },
        { keyword_id: "kw-1", page_id: "pg-1", position: 5 },
      ],
      pmRows: [{ page_id: "pg-1", sessions: 100, conversions: 10 }],
      ctrModel: { positions: { "5": 0.06 } },
      conversionEvents: [{ name: "whatsapp_click", value: 15 }],
    });
    mockSupabase = { from };

    const [result] = await computeKeywordValues("site-1");
    expect(result.position).toBeCloseTo(5, 6);
    expect(result.expectedCtr).toBeCloseTo(0.06, 6);
    expect(result.conversionRate).toBeCloseTo(0.1, 6); // 10/100, >=50 sessions -> page's own rate
    expect(result.avgConversionValue).toBeCloseTo(15, 6); // conversion_events wins over cpc=3.0
    expect(result.monthlyValue).toBeCloseTo(1000 * 0.06 * 0.1 * 15, 6);
  });

  it("falls back to the keyword's own CPC as the conversion value proxy when no conversion_events exist", async () => {
    const { from } = makeSupabaseMock({
      keywordRows: [{ id: "kw-1", search_volume: 500, cpc: 4.0 }],
      kpmRows: [{ keyword_id: "kw-1", page_id: "pg-1", position: 10 }],
      pmRows: [{ page_id: "pg-1", sessions: 100, conversions: 5 }],
      ctrModel: { positions: { "10": 0.025 } },
      conversionEvents: [],
    });
    mockSupabase = { from };

    const [result] = await computeKeywordValues("site-1");
    expect(result.avgConversionValue).toBeCloseTo(4.0, 6);
  });

  it("falls back to the site-wide conversion rate below the 50-session floor", async () => {
    const { from } = makeSupabaseMock({
      keywordRows: [{ id: "kw-1", search_volume: 100, cpc: null }],
      kpmRows: [
        { keyword_id: "kw-1", page_id: "pg-sparse", position: 8 },
        { keyword_id: "kw-2", page_id: "pg-other", position: 3 },
      ],
      pmRows: [
        { page_id: "pg-sparse", sessions: 10, conversions: 2 },
        { page_id: "pg-other", sessions: 990, conversions: 88 },
      ],
      ctrModel: { positions: { "8": 0.035, "3": 0.11 } },
    });
    mockSupabase = { from };

    const results = await computeKeywordValues("site-1");
    const sparse = results.find((r) => r.pageId === "pg-sparse")!;
    // site-wide: (2+88)/(10+990) = 90/1000 = 0.09
    expect(sparse.conversionRate).toBeCloseTo(0.09, 6);
  });

  it("returns monthlyValue 0 when the keyword has no search_volume (pre-Milestone-5 state)", async () => {
    const { from } = makeSupabaseMock({
      keywordRows: [{ id: "kw-1", search_volume: null, cpc: null }],
      kpmRows: [{ keyword_id: "kw-1", page_id: "pg-1", position: 5 }],
      pmRows: [],
    });
    mockSupabase = { from };

    const [result] = await computeKeywordValues("site-1");
    expect(result.monthlyValue).toBe(0);
  });

  it("treats a keyword/page pair with only null-position rows as position: null", async () => {
    const { from } = makeSupabaseMock({
      keywordRows: [{ id: "kw-1", search_volume: 1000, cpc: 2 }],
      kpmRows: [{ keyword_id: "kw-1", page_id: "pg-1", position: null }],
      pmRows: [],
    });
    mockSupabase = { from };

    const [result] = await computeKeywordValues("site-1");
    expect(result.position).toBeNull();
    expect(result.expectedCtr).toBe(0);
    expect(result.monthlyValue).toBe(0);
  });
});
