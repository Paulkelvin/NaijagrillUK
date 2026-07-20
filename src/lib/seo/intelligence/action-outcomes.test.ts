import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/seo/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

const { captureActionMetrics, classifyOutcome, measureActionOutcomes, OUTCOME_WINDOW_DAYS } = await import("./action-outcomes");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function queryBuilder(result: { data: any; error: any }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    eq: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    // A real supabase-js query builder is itself thenable — awaiting it
    // directly (without a terminal .then()-less call) resolves to
    // { data, error }. Mocked the same way so captureActionMetrics's
    // optional trailing .eq("page_id", ...) can be tacked on or skipped.
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

describe("classifyOutcome", () => {
  const baseKeyword = { window: "keyword" as const, capturedAt: "t0", avgPosition: 15, clicks: 10, impressions: 500 };
  const basePage = { window: "page" as const, capturedAt: "t0", sessions: 20, conversionValue: 100 };

  it("improved: position moved up by at least 1", () => {
    const current = { ...baseKeyword, avgPosition: 13 };
    expect(classifyOutcome(baseKeyword, current)).toBe("improved");
  });

  it("improved: clicks rose by at least the relative floor even with a stable position", () => {
    const current = { ...baseKeyword, clicks: 13 }; // +30%, above the 20% floor
    expect(classifyOutcome(baseKeyword, current)).toBe("improved");
  });

  it("declined: position moved down by at least 1", () => {
    const current = { ...baseKeyword, avgPosition: 17 };
    expect(classifyOutcome(baseKeyword, current)).toBe("declined");
  });

  it("unchanged: movement inside both floors", () => {
    const current = { ...baseKeyword, avgPosition: 15.5, clicks: 11 }; // +10%, below the 20% floor
    expect(classifyOutcome(baseKeyword, current)).toBe("unchanged");
  });

  it("uses the absolute floor of 1 when baseline clicks is 0, not a 0-based percentage", () => {
    const zeroBaseline = { ...baseKeyword, clicks: 0 };
    const currentBelowFloor = { ...baseKeyword, clicks: 0 }; // 0 -> 0, no change
    expect(classifyOutcome(zeroBaseline, currentBelowFloor)).toBe("unchanged");
    const currentAtFloor = { ...baseKeyword, clicks: 1 }; // 0 -> 1 clears the absolute floor
    expect(classifyOutcome(zeroBaseline, currentAtFloor)).toBe("improved");
  });

  it("page window: improved via a relative sessions increase", () => {
    const current = { ...basePage, sessions: 30 }; // +50%
    expect(classifyOutcome(basePage, current)).toBe("improved");
  });

  it("page window: declined via a relative sessions drop", () => {
    const current = { ...basePage, sessions: 10 }; // -50%
    expect(classifyOutcome(basePage, current)).toBe("declined");
  });

  it("treats a null avgPosition on either side as no position signal, falling back to the clicks delta", () => {
    const baseline = { ...baseKeyword, avgPosition: null };
    const current = { ...baseKeyword, avgPosition: null, clicks: 13 };
    expect(classifyOutcome(baseline, current)).toBe("improved");
  });
});

describe("captureActionMetrics", () => {
  it("captures keyword-wide metrics (impression-weighted position, summed clicks) when only keywordId is set", async () => {
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() =>
          queryBuilder({
            data: [
              { position: 3, impressions: 100, clicks: 10 },
              { position: 8, impressions: 50, clicks: 2 },
            ],
            error: null,
          }),
        ),
      })),
    };

    const result = await captureActionMetrics(mockSupabase, { keywordId: "kw-1", pageId: null });
    expect(result?.window).toBe("keyword");
    if (result?.window === "keyword") {
      expect(result.clicks).toBe(12);
      expect(result.impressions).toBe(150);
      // (3*100 + 8*50) / 150 = 4.666...
      expect(result.avgPosition).toBeCloseTo((3 * 100 + 8 * 50) / 150, 6);
    }
  });

  it("scopes to a single page when both keywordId and pageId are set (fix_cannibalization's canonical page)", async () => {
    const eqCalls: Array<[string, unknown]> = [];
    mockSupabase = {
      from: vi.fn(() => {
        const builder = queryBuilder({ data: [], error: null });
        const originalEq = builder.eq;
        builder.eq = vi.fn((col: string, val: unknown) => {
          eqCalls.push([col, val]);
          return originalEq(col, val);
        });
        return { select: vi.fn(() => builder) };
      }),
    };

    await captureActionMetrics(mockSupabase, { keywordId: "kw-1", pageId: "pg-1" });
    expect(eqCalls).toContainEqual(["keyword_id", "kw-1"]);
    expect(eqCalls).toContainEqual(["page_id", "pg-1"]);
  });

  it("captures page metrics (summed sessions/conversion_value) when only pageId is set", async () => {
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() =>
          queryBuilder({
            data: [
              { sessions: 20, conversion_value: 50 },
              { sessions: 15, conversion_value: 30 },
            ],
            error: null,
          }),
        ),
      })),
    };

    const result = await captureActionMetrics(mockSupabase, { keywordId: null, pageId: "pg-1" });
    expect(result).toEqual(expect.objectContaining({ window: "page", sessions: 35, conversionValue: 80 }));
  });

  it("returns null when neither id is set", async () => {
    mockSupabase = { from: vi.fn() };
    const result = await captureActionMetrics(mockSupabase, { keywordId: null, pageId: null });
    expect(result).toBeNull();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});

interface ActionRow {
  id: string;
  keyword_id: string | null;
  page_id: string | null;
  baseline_metrics: unknown;
}

interface MeasureMockCapture {
  notCalls: Array<[string, string]>;
  isCalls: Array<[string, string]>;
}

function makeMeasureMock(actions: ActionRow[]) {
  const updateCalls: Array<{ id: string; values: Record<string, unknown> }> = [];
  const capture: MeasureMockCapture = { notCalls: [], isCalls: [] };
  const from = vi.fn((table: string) => {
    if (table === "actions") {
      return {
        // The "has a baseline, no outcome yet" filter is now expressed in
        // the query itself (idx_actions_pending_outcome) rather than
        // filtered in application code — these mocks just record that the
        // right filter calls were made, since a mock can't actually filter.
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              not: vi.fn((col: string, op: string) => {
                capture.notCalls.push([col, op]);
                return {
                  is: vi.fn((col2: string, val: string) => {
                    capture.isCalls.push([col2, val]);
                    return { lte: vi.fn().mockResolvedValue({ data: actions, error: null }) };
                  }),
                };
              }),
            })),
          })),
        })),
        update: vi.fn((values: Record<string, unknown>) => ({
          eq: vi.fn((_col: string, id: string) => {
            updateCalls.push({ id, values });
            return Promise.resolve({ error: null });
          }),
        })),
      };
    }
    // keyword_page_metrics / page_metrics — no history needed for these tests
    return { select: vi.fn(() => queryBuilder({ data: [], error: null })) };
  });
  return { from, updateCalls, capture };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("measureActionOutcomes", () => {
  it("queries with the real pending-outcome filter (has a baseline, no outcome yet)", async () => {
    const { from, capture } = makeMeasureMock([]);
    mockSupabase = { from };

    await measureActionOutcomes("site-1");
    expect(capture.notCalls).toContainEqual(["baseline_metrics", "is"]);
    expect(capture.isCalls).toContainEqual(["outcome", null]);
  });

  it("measures a real pending action, writing outcome_metrics/outcome/outcome_measured_at as real columns", async () => {
    const { from, updateCalls } = makeMeasureMock([
      { id: "a1", keyword_id: "kw-1", page_id: null, baseline_metrics: { window: "keyword", capturedAt: "t0", avgPosition: 10, clicks: 5, impressions: 100 } },
    ]);
    mockSupabase = { from };

    const result = await measureActionOutcomes("site-1");
    expect(result.measured).toBe(1);
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].id).toBe("a1");
    expect(updateCalls[0].values.outcome).toBeDefined();
    expect(updateCalls[0].values.outcome_measured_at).toBeDefined();
    expect(updateCalls[0].values.outcome_metrics).toBeDefined();
  });

  it(`queries with a completed_at cutoff of ${OUTCOME_WINDOW_DAYS} days`, async () => {
    let capturedCutoff: string | undefined;
    const from = vi.fn((table: string) => {
      if (table === "actions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                not: vi.fn(() => ({
                  is: vi.fn(() => ({
                    lte: vi.fn((_col: string, cutoff: string) => {
                      capturedCutoff = cutoff;
                      return Promise.resolve({ data: [], error: null });
                    }),
                  })),
                })),
              })),
            })),
          })),
        };
      }
      return queryBuilder({ data: [], error: null });
    });
    mockSupabase = { from };

    await measureActionOutcomes("site-1");
    const daysAgo = (Date.now() - new Date(capturedCutoff!).getTime()) / (24 * 60 * 60 * 1000);
    expect(daysAgo).toBeCloseTo(OUTCOME_WINDOW_DAYS, 1);
  });
});
