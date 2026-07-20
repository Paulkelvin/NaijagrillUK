import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/seo/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;

const { computeCtrBuckets, rebuildCtrModel, INDUSTRY_DEFAULT_POSITIONS } = await import("./ctr-model");

function row(position: number | null, impressions: number, clicks: number) {
  return { position, impressions, clicks };
}

describe("computeCtrBuckets", () => {
  it("computes Σclicks/Σimpressions per rounded position bucket against hand-calculated values", () => {
    const rows = [
      row(1.2, 100, 30), // rounds to 1
      row(0.8, 50, 15), // rounds to 1
      row(2.4, 80, 8), // rounds to 2
    ];
    const { positions, totalClicks } = computeCtrBuckets(rows);
    // bucket 1: (30+15)/(100+50) = 45/150 = 0.3
    expect(positions["1"]).toBeCloseTo(45 / 150, 6);
    // bucket 2 has only 80 impressions >= 50, so real: 8/80 = 0.1
    expect(positions["2"]).toBeCloseTo(0.1, 6);
    expect(totalClicks).toBe(53);
  });

  it("falls back to the industry default for a bucket with fewer than 50 impressions", () => {
    const rows = [row(5, 10, 2)]; // bucket 5, only 10 impressions
    const { positions } = computeCtrBuckets(rows);
    expect(positions["5"]).toBe(INDUSTRY_DEFAULT_POSITIONS["5"]);
  });

  it("excludes null-position and out-of-1-20-range rows from bucketing but still counts their clicks toward totalClicks", () => {
    const rows = [row(null, 100, 10), row(45, 100, 20), row(3, 100, 60)];
    const { positions, totalClicks } = computeCtrBuckets(rows);
    expect(totalClicks).toBe(90); // 10 + 20 + 60
    // bucket 3 has exactly 100 impressions, real CTR used
    expect(positions["3"]).toBeCloseTo(0.6, 6);
    // nothing else was bucketed; every other position falls back to default
    expect(positions["1"]).toBe(INDUSTRY_DEFAULT_POSITIONS["1"]);
  });

  it("rounds position 4.5 up to bucket 5 (standard rounding)", () => {
    const rows = [row(4.5, 100, 50)];
    const { positions } = computeCtrBuckets(rows);
    expect(positions["5"]).toBeCloseTo(0.5, 6);
    expect(positions["4"]).toBe(INDUSTRY_DEFAULT_POSITIONS["4"]);
  });

  it("returns all 20 position keys even with zero input rows, entirely defaulted", () => {
    const { positions, totalClicks } = computeCtrBuckets([]);
    expect(totalClicks).toBe(0);
    expect(Object.keys(positions)).toHaveLength(20);
    expect(positions).toEqual(INDUSTRY_DEFAULT_POSITIONS);
  });
});

interface MockConfig {
  rows?: unknown[];
  fetchError?: unknown;
  updateError?: unknown;
}

function makeSupabaseMock(config: MockConfig = {}) {
  const calls: { updatePayload?: unknown } = {};
  const from = vi.fn((table: string) => {
    if (table === "keyword_page_metrics") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              range: vi.fn().mockResolvedValue({ data: config.rows ?? [], error: config.fetchError ?? null }),
            })),
          })),
        })),
      };
    }
    if (table === "site_configs") {
      return {
        update: vi.fn((payload: unknown) => {
          calls.updatePayload = payload;
          return { eq: vi.fn().mockResolvedValue({ error: config.updateError ?? null }) };
        }),
      };
    }
    throw new Error(`Unexpected table in test: ${table}`);
  });
  return { from, calls };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("rebuildCtrModel", () => {
  it("skips the rebuild and leaves site_configs untouched when total clicks are below the 1,000 minimum", async () => {
    const { from, calls } = makeSupabaseMock({ rows: [row(1, 100, 500)] }); // 500 clicks, below 1000
    mockSupabase = { from };

    const result = await rebuildCtrModel("site-1");

    expect(result.rebuilt).toBe(false);
    expect(result.source).toBe("industry_default");
    expect(result.sampleSize).toBe(500);
    expect(calls.updatePayload).toBeUndefined();
    expect(from).not.toHaveBeenCalledWith("site_configs");
  });

  it("rebuilds and writes a real site_data model when total clicks meet the minimum", async () => {
    // 1100 total clicks, all at position 1 with plenty of impressions
    const { from, calls } = makeSupabaseMock({ rows: [row(1, 2000, 1100)] });
    mockSupabase = { from };

    const result = await rebuildCtrModel("site-1");

    expect(result.rebuilt).toBe(true);
    expect(result.source).toBe("site_data");
    expect(result.sampleSize).toBe(1100);
    expect(result.positions["1"]).toBeCloseTo(1100 / 2000, 6);
    expect(calls.updatePayload).toEqual({
      ctr_model: { source: "site_data", positions: result.positions, sample_size: 1100 },
    });
  });

  it("marks the run failed and rethrows when the fetch errors", async () => {
    const { from } = makeSupabaseMock({ fetchError: { message: "connection reset" } });
    mockSupabase = { from };

    await expect(rebuildCtrModel("site-1")).rejects.toThrow(/Failed to fetch keyword_page_metrics/);
  });

  it("rethrows when the site_configs update errors", async () => {
    const { from } = makeSupabaseMock({ rows: [row(1, 2000, 1100)], updateError: { message: "constraint violation" } });
    mockSupabase = { from };

    await expect(rebuildCtrModel("site-1")).rejects.toThrow(/Failed to update site_configs.ctr_model/);
  });
});
