import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));
vi.mock("@/lib/seo/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

vi.mock("./cannibalization", () => ({ detectCannibalization: vi.fn() }));
vi.mock("./content-decay", () => ({ detectContentDecay: vi.fn() }));
vi.mock("./page-roi-score", () => ({ computePageRoiScores: vi.fn() }));
vi.mock("./keyword-value", () => ({ computeKeywordValues: vi.fn() }));
vi.mock("./opportunity-score", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = (await importOriginal()) as any;
  return { ...actual, computeOpportunityScores: vi.fn() };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;

const { detectCannibalization } = await import("./cannibalization");
const { detectContentDecay } = await import("./content-decay");
const { computeOpportunityScores } = await import("./opportunity-score");
const { computePageRoiScores } = await import("./page-roi-score");
const { computeKeywordValues } = await import("./keyword-value");
const { runAnalysis, computePagePriority, actionDedupKey } = await import("./run-analysis");

describe("computePagePriority", () => {
  const weights = { traffic_potential: 0.35, conversion_rate: 0.3, effort_inverse: 0.2, decay_urgency: 0.15 };

  it("computes the exact weighted blend against hand-calculated values", () => {
    const components = { trafficPotentialNorm: 0.5, conversionRate: 0.2, effortInverse: 0.8, decayUrgencyNorm: 0.3 };
    const expected = (0.5 * 0.35 + 0.2 * 0.3 + 0.8 * 0.2 + 0.3 * 0.15) * 100;
    expect(computePagePriority(components, weights)).toBeCloseTo(expected, 6);
  });

  it("clamps conversionRate to [0, 1] before blending", () => {
    const components = { trafficPotentialNorm: 0, conversionRate: 1.5, effortInverse: 0, decayUrgencyNorm: 0 };
    expect(computePagePriority(components, weights)).toBeCloseTo(1.0 * 0.3 * 100, 6);
  });
});

describe("actionDedupKey", () => {
  it("keys fix_cannibalization on keyword_id alone, ignoring a changing page_id", () => {
    const a = actionDedupKey({ type: "fix_cannibalization", sourceModule: "cannibalization", pageId: "pg-1", keywordId: "kw-1" });
    const b = actionDedupKey({ type: "fix_cannibalization", sourceModule: "cannibalization", pageId: "pg-2", keywordId: "kw-1" });
    expect(a).toBe(b);
  });

  it("keys other types on both page_id and keyword_id", () => {
    const a = actionDedupKey({ type: "update_content", sourceModule: "page_performance", pageId: "pg-1", keywordId: null });
    const b = actionDedupKey({ type: "update_content", sourceModule: "page_performance", pageId: "pg-2", keywordId: null });
    expect(a).not.toBe(b);
  });
});

interface MockConfig {
  keywordRows?: Array<{ id: string; keyword: string; is_target: boolean | null; search_volume?: number | null }>;
  pageRows?: Array<{ id: string; path: string }>;
  scoringWeights?: Record<string, unknown>;
  existingActions?: Array<{ id: string; type: string; source_module: string; page_id: string | null; keyword_id: string | null }>;
}

function makeSupabaseMock(config: MockConfig = {}) {
  const insertedRows: Array<Record<string, unknown>> = [];
  const upsertedRows: Array<Record<string, unknown>> = [];

  const from = vi.fn((table: string) => {
    if (table === "keywords") {
      return { select: vi.fn(() => ({ in: vi.fn().mockResolvedValue({ data: config.keywordRows ?? [], error: null }) })) };
    }
    if (table === "pages") {
      return { select: vi.fn(() => ({ in: vi.fn().mockResolvedValue({ data: config.pageRows ?? [], error: null }) })) };
    }
    if (table === "site_configs") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { scoring_weights: config.scoringWeights ?? {} }, error: null }),
          })),
        })),
      };
    }
    if (table === "actions") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({ data: config.existingActions ?? [], error: null }),
          })),
        })),
        insert: vi.fn((rows: Array<Record<string, unknown>>) => {
          insertedRows.push(...rows);
          return Promise.resolve({ error: null });
        }),
        upsert: vi.fn((rows: Array<Record<string, unknown>>) => {
          upsertedRows.push(...rows);
          return Promise.resolve({ error: null });
        }),
      };
    }
    throw new Error(`Unexpected table in test: ${table}`);
  });

  return { from, insertedRows, upsertedRows };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(detectCannibalization).mockResolvedValue([]);
  vi.mocked(detectContentDecay).mockResolvedValue([]);
  vi.mocked(computeOpportunityScores).mockResolvedValue([]);
  vi.mocked(computePageRoiScores).mockResolvedValue([]);
  vi.mocked(computeKeywordValues).mockResolvedValue([]);
});

describe("runAnalysis", () => {
  it("generates and creates nothing when every module returns empty", async () => {
    const { from, insertedRows } = makeSupabaseMock();
    mockSupabase = { from };

    const result = await runAnalysis("site-1");
    expect(result).toEqual({ candidatesGenerated: 0, actionsCreated: 0, actionsUpdated: 0 });
    expect(insertedRows).toHaveLength(0);
  });

  it("creates a create_content action for an untargeted keyword above the threshold, skips targeted/below-threshold ones", async () => {
    vi.mocked(computeOpportunityScores).mockResolvedValue([
      { keywordId: "kw-untargeted", score: 50, bestPosition: 8, components: {} as never },
      { keywordId: "kw-targeted", score: 90, bestPosition: 3, components: {} as never },
      { keywordId: "kw-low", score: 10, bestPosition: null, components: {} as never },
    ]);
    const { from, insertedRows } = makeSupabaseMock({
      keywordRows: [
        { id: "kw-untargeted", keyword: "jollof rice birmingham", is_target: false },
        { id: "kw-targeted", keyword: "already targeted", is_target: true },
        { id: "kw-low", keyword: "low score", is_target: false },
      ],
    });
    mockSupabase = { from };

    const result = await runAnalysis("site-1");
    expect(result.actionsCreated).toBe(1);
    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0]).toMatchObject({ type: "create_content", source_module: "keyword_intelligence", keyword_id: "kw-untargeted", status: "queued" });
    expect(insertedRows[0].title).toContain("jollof rice birmingham");
  });

  it("skips an above-threshold opportunity whose keyword volume is too broad/generic to be actionable, keeps one under the ceiling", async () => {
    vi.mocked(computeOpportunityScores).mockResolvedValue([
      { keywordId: "kw-generic", score: 68, bestPosition: 5, components: {} as never },
      { keywordId: "kw-menu-item", score: 51, bestPosition: 17, components: {} as never },
    ]);
    const { from, insertedRows } = makeSupabaseMock({
      keywordRows: [
        { id: "kw-generic", keyword: "restaurants near me", is_target: false, search_volume: 9_140_000 },
        { id: "kw-menu-item", keyword: "mix grill", is_target: false, search_volume: 9_900 },
      ],
    });
    mockSupabase = { from };

    const result = await runAnalysis("site-1");
    expect(result.actionsCreated).toBe(1);
    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0]).toMatchObject({ keyword_id: "kw-menu-item" });
  });

  it("creates a fix_cannibalization action carrying the recommended canonical page", async () => {
    vi.mocked(detectCannibalization).mockResolvedValue([
      {
        keywordId: "kw-1",
        pageIds: ["pg-1", "pg-2"],
        score: 55,
        positionVarianceNorm: 0.5,
        clickSplit: 0.1,
        ctrDeficitNorm: 0.2,
        trafficValueNorm: 0.3,
        recommendation: "canonicalize",
        recommendedCanonicalPageId: "pg-1",
      },
    ]);
    const { from, insertedRows } = makeSupabaseMock({
      keywordRows: [{ id: "kw-1", keyword: "nigerian food birmingham", is_target: true }],
      pageRows: [{ id: "pg-1", path: "/menu" }],
    });
    mockSupabase = { from };

    const result = await runAnalysis("site-1");
    expect(result.actionsCreated).toBe(1);
    expect(insertedRows[0]).toMatchObject({ type: "fix_cannibalization", source_module: "cannibalization", page_id: "pg-1", keyword_id: "kw-1", priority_score: 55 });
  });

  it("computes the blended page priority and creates both a page_performance and a decay action when a page is both ROI-worthy and decaying", async () => {
    vi.mocked(computePageRoiScores).mockResolvedValue([
      { pageId: "pg-1", trafficPotential: 100, pageConversionRate: 0.2, avgConversionValue: 1, revenuePotential: 20, effortScore: 0.2, effortComponents: {} as never, roiScore: 100 },
    ]);
    vi.mocked(detectContentDecay).mockResolvedValue([
      { pageId: "pg-1", trendSlope: -1, peakTraffic: 25, currentTraffic: 10, daysSincePeak: 50, decayPct: 60, decayStage: "critical_decay", recencyFactor: 0.7, decayUrgency: 420, seasonalityChecked: false, seasonal: false },
    ]);
    const { from, insertedRows } = makeSupabaseMock({ pageRows: [{ id: "pg-1", path: "/menu" }] });
    mockSupabase = { from };

    const result = await runAnalysis("site-1");
    // trafficPotentialNorm=1.0 (only page), effortInverse=0.8, conversionRate=0.2, decayUrgencyNorm=1.0 (only page)
    // priority = (1.0*.35 + 0.2*.30 + 0.8*.20 + 1.0*.15) * 100 = 72
    expect(result.actionsCreated).toBe(2);
    const pagePerf = insertedRows.find((r) => r.source_module === "page_performance")!;
    const decay = insertedRows.find((r) => r.source_module === "decay")!;
    expect(pagePerf.priority_score).toBeCloseTo(72, 6);
    expect(decay.priority_score).toBeCloseTo(72, 6);
    expect(decay.title).toContain("critical decay");
  });

  it("updates (upserts) an existing non-terminal action instead of creating a duplicate", async () => {
    vi.mocked(computeOpportunityScores).mockResolvedValue([{ keywordId: "kw-1", score: 60, bestPosition: 5, components: {} as never }]);
    const { from, insertedRows, upsertedRows } = makeSupabaseMock({
      keywordRows: [{ id: "kw-1", keyword: "suya birmingham", is_target: false }],
      existingActions: [{ id: "existing-action-1", type: "create_content", source_module: "keyword_intelligence", page_id: null, keyword_id: "kw-1" }],
    });
    mockSupabase = { from };

    const result = await runAnalysis("site-1");
    expect(result.actionsCreated).toBe(0);
    expect(result.actionsUpdated).toBe(1);
    expect(insertedRows).toHaveLength(0);
    expect(upsertedRows).toHaveLength(1);
    expect(upsertedRows[0]).toMatchObject({ id: "existing-action-1", priority_score: 60 });
    expect(upsertedRows[0].status).toBeUndefined(); // never touches status on update
  });

  it("attaches keyword_monthly_value to an opportunity action's supporting_data when one exists", async () => {
    vi.mocked(computeOpportunityScores).mockResolvedValue([{ keywordId: "kw-1", score: 60, bestPosition: 5, components: {} as never }]);
    vi.mocked(computeKeywordValues).mockResolvedValue([
      { keywordId: "kw-1", pageId: "pg-1", position: 5, expectedCtr: 0.06, conversionRate: 0.1, avgConversionValue: 15, monthlyValue: 45 },
    ]);
    const { from, insertedRows } = makeSupabaseMock({ keywordRows: [{ id: "kw-1", keyword: "small chops", is_target: false }] });
    mockSupabase = { from };

    await runAnalysis("site-1");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supportingData = insertedRows[0].supporting_data as any;
    expect(supportingData.keywordMonthlyValue).toBe(45);
  });
});
