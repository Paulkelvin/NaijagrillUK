import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;

const { computeLinearRegressionSlope, computeRollingPeakAndCurrent, computeDecay, detectContentDecay } = await import(
  "./content-decay"
);

describe("computeLinearRegressionSlope", () => {
  it("returns the exact slope for a perfectly increasing line", () => {
    expect(computeLinearRegressionSlope([1, 2, 3, 4, 5])).toBeCloseTo(1, 6);
  });

  it("returns the exact slope for a perfectly decreasing line", () => {
    expect(computeLinearRegressionSlope([5, 4, 3, 2, 1])).toBeCloseTo(-1, 6);
  });

  it("returns 0 for a flat line", () => {
    expect(computeLinearRegressionSlope([10, 10, 10, 10])).toBeCloseTo(0, 6);
  });

  it("returns 0 for fewer than 2 points", () => {
    expect(computeLinearRegressionSlope([5])).toBe(0);
    expect(computeLinearRegressionSlope([])).toBe(0);
  });
});

function buildStepArray(peakValue: number, postValue: number, peakDays: number, totalDays: number): number[] {
  return Array.from({ length: totalDays }, (_, i) => (i < peakDays ? peakValue : postValue));
}

describe("computeRollingPeakAndCurrent", () => {
  it("finds the peak window at the start and the current window at the end, matching hand-calculated averages", () => {
    // days 0-29 = 100/day (peak), days 30-89 = 50/day (post-decline)
    const daily = buildStepArray(100, 50, 30, 90);
    const result = computeRollingPeakAndCurrent(daily);
    expect(result.peakTraffic).toBeCloseTo(100, 6);
    expect(result.peakWindowStart).toBe(0);
    expect(result.currentTraffic).toBeCloseTo(50, 6);
  });

  it("resolves ties for the peak to the most recent qualifying window", () => {
    // two identical 30-day plateaus at the same average, separated by a dip
    const daily = [...Array(30).fill(80), ...Array(30).fill(0), ...Array(30).fill(80)];
    const result = computeRollingPeakAndCurrent(daily);
    // both window start=0 and start=60 achieve avg 80; the later one should win
    expect(result.peakWindowStart).toBe(60);
  });
});

describe("computeDecay", () => {
  it("computes decay_pct, stage, recency_factor, and decay_urgency against hand-calculated values", () => {
    const daily = buildStepArray(100, 50, 30, 90);
    const result = computeDecay(daily);

    expect(result.peakTraffic).toBeCloseTo(100, 6);
    expect(result.currentTraffic).toBeCloseTo(50, 6);
    // decay_pct = (100-50)/100 * 100 = 50
    expect(result.decayPct).toBeCloseTo(50, 6);
    expect(result.decayStage).toBe("critical_decay"); // > 40
    // daysSincePeak = currentWindowStart(60) - peakWindowStart(0) = 60 -> bucket 31-90 -> 0.7
    expect(result.daysSincePeak).toBe(60);
    expect(result.recencyFactor).toBe(0.7);
    // decay_urgency = 50 * 50 * 0.7 = 1750
    expect(result.decayUrgency).toBeCloseTo(1750, 6);
  });

  it("returns decay_pct 0 when peak_traffic is 0 (no traffic ever, nothing to decay)", () => {
    const daily = new Array(90).fill(0);
    const result = computeDecay(daily);
    expect(result.decayPct).toBe(0);
    expect(result.decayStage).toBe("stable");
  });

  it("classifies decay stage boundaries exactly as documented", () => {
    // decayPct is driven by peak vs current; construct arrays engineered
    // to land exactly on each boundary via a simple peak/current pair.
    const stageFor = (peak: number, current: number) => {
      const daily = [...Array(30).fill(peak), ...Array(60).fill(current)];
      return computeDecay(daily).decayStage;
    };
    expect(stageFor(100, 96)).toBe("stable"); // decay_pct = 4
    expect(stageFor(100, 95)).toBe("early_decay"); // decay_pct = 5 (boundary, inclusive)
    expect(stageFor(100, 86)).toBe("early_decay"); // decay_pct = 14, still early
    expect(stageFor(100, 60)).toBe("mid_decay"); // decay_pct = 40 (boundary, still mid per "> 40" rule)
    expect(stageFor(100, 59)).toBe("critical_decay"); // decay_pct = 41
  });

  it("classifies exactly decay_pct=15 as mid_decay (early_decay's range is 5-15, mid starts at 15)", () => {
    const daily = [...Array(30).fill(100), ...Array(60).fill(85)]; // decay_pct = 15
    expect(computeDecay(daily).decayStage).toBe("mid_decay");
  });

  it("classifies recency_factor boundaries exactly as documented", () => {
    // daysSincePeak is currentWindowStart(60) - peakWindowStart; construct
    // peak windows at specific start offsets to hit each boundary.
    const daysSincePeakOf = (peakWindowStart: number) => {
      const daily = new Array(90).fill(10);
      // Elevate exactly one 30-day window starting at peakWindowStart so it's
      // unambiguously the peak, then depress the final window so decay is nonzero.
      for (let i = peakWindowStart; i < peakWindowStart + 30; i++) daily[i] = 100;
      for (let i = 60; i < 90; i++) daily[i] = 5;
      return computeDecay(daily);
    };
    expect(daysSincePeakOf(30).recencyFactor).toBe(1.0); // daysSincePeak = 60-30 = 30
    expect(daysSincePeakOf(29).recencyFactor).toBe(0.7); // daysSincePeak = 31
    expect(daysSincePeakOf(0).recencyFactor).toBe(0.7); // daysSincePeak = 60
  });
});

interface MockConfig {
  pageMetricRows?: unknown[];
  kpmRowsByPage?: Record<string, Array<{ keyword_id: string; clicks: number }>>;
  keywordMonthlyVolumes?: Record<string, unknown>;
}

function makeSupabaseMock(config: MockConfig = {}) {
  const from = vi.fn((table: string) => {
    if (table === "page_metrics") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              range: vi.fn().mockResolvedValue({ data: config.pageMetricRows ?? [], error: null }),
            })),
          })),
        })),
      };
    }
    if (table === "keyword_page_metrics") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_col: string, pageId: string) => ({
            gte: vi.fn().mockResolvedValue({ data: config.kpmRowsByPage?.[pageId] ?? [], error: null }),
          })),
        })),
      };
    }
    if (table === "keywords") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_col: string, keywordId: string) => ({
            single: vi.fn().mockResolvedValue({
              data: { monthly_volumes: config.keywordMonthlyVolumes?.[keywordId] ?? null },
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

function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("detectContentDecay", () => {
  it("excludes a page with fewer than 60 days of real data", async () => {
    const rows = Array.from({ length: 40 }, (_, i) => ({ page_id: "pg-1", date: isoDaysAgo(i + 1), sessions: 100 }));
    const { from } = makeSupabaseMock({ pageMetricRows: rows });
    mockSupabase = { from };

    const results = await detectContentDecay("site-1");
    expect(results).toEqual([]);
  });

  it("excludes a page below the 30 avg-sessions/month floor even with enough days of history", async () => {
    // 70 days of data, but total sessions only 60 -> avg/month = 20, below 30
    const rows = Array.from({ length: 70 }, (_, i) => ({
      page_id: "pg-1",
      date: isoDaysAgo(i + 1),
      sessions: i < 60 ? 1 : 0,
    }));
    const { from } = makeSupabaseMock({ pageMetricRows: rows });
    mockSupabase = { from };

    const results = await detectContentDecay("site-1");
    expect(results).toEqual([]);
  });

  it("includes a qualifying page with correct decay fields and seasonalityChecked: false when no keyword volume data exists", async () => {
    // 90 days, first 30 days at 100 sessions/day (well above the floor), rest at 50
    const rows = Array.from({ length: 90 }, (_, i) => {
      const daysAgo = 90 - i; // oldest first
      return { page_id: "pg-1", date: isoDaysAgo(daysAgo), sessions: i < 30 ? 100 : 50 };
    });
    const { from } = makeSupabaseMock({ pageMetricRows: rows });
    mockSupabase = { from };

    const [result] = await detectContentDecay("site-1");
    expect(result.pageId).toBe("pg-1");
    expect(result.decayStage).toBe("critical_decay");
    expect(result.seasonalityChecked).toBe(false);
    expect(result.seasonal).toBe(false);
  });

  it("sets seasonalityChecked: true when the page's primary keyword has monthly_volumes data", async () => {
    const rows = Array.from({ length: 90 }, (_, i) => {
      const daysAgo = 90 - i;
      return { page_id: "pg-1", date: isoDaysAgo(daysAgo), sessions: i < 30 ? 100 : 50 };
    });
    const { from } = makeSupabaseMock({
      pageMetricRows: rows,
      kpmRowsByPage: { "pg-1": [{ keyword_id: "kw-1", clicks: 20 }, { keyword_id: "kw-2", clicks: 5 }] },
      keywordMonthlyVolumes: { "kw-1": { "2026-01": 500, "2026-02": 300 } },
    });
    mockSupabase = { from };

    const [result] = await detectContentDecay("site-1");
    // kw-1 has more clicks (20 > 5) so it's the primary keyword, and it has monthly_volumes
    expect(result.seasonalityChecked).toBe(true);
    expect(result.seasonal).toBe(false); // still always false — see content-decay.ts's own doc comment
  });

  it("handles multiple pages independently, only returning the ones that qualify", async () => {
    const qualifyingRows = Array.from({ length: 90 }, (_, i) => {
      const daysAgo = 90 - i;
      return { page_id: "pg-qualifies", date: isoDaysAgo(daysAgo), sessions: 50 };
    });
    const sparseRows = Array.from({ length: 10 }, (_, i) => ({
      page_id: "pg-too-sparse",
      date: isoDaysAgo(i + 1),
      sessions: 100,
    }));
    const { from } = makeSupabaseMock({ pageMetricRows: [...qualifyingRows, ...sparseRows] });
    mockSupabase = { from };

    const results = await detectContentDecay("site-1");
    expect(results).toHaveLength(1);
    expect(results[0].pageId).toBe("pg-qualifies");
  });
});
