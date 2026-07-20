import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/seo/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const mockCallDataForSeoApi = vi.fn();
vi.mock("./client", () => ({ callDataForSeoApi: (...args: unknown[]) => mockCallDataForSeoApi(...args) }));

const mockCheckBudget = vi.fn();
const mockRecordSpend = vi.fn();
vi.mock("./budget", () => ({
  checkBudget: (...args: unknown[]) => mockCheckBudget(...args),
  recordSpend: (...args: unknown[]) => mockRecordSpend(...args),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

const { discoverKeywords, extractCandidates, isLongTail, DEFAULT_SEED_KEYWORDS } = await import("./keyword-discovery");

function relatedItem(overrides: {
  keyword?: string;
  search_volume?: number | null;
  cpc?: number | null;
  keyword_difficulty?: number | null;
  main_intent?: string | null;
}) {
  return {
    keyword_data: {
      keyword: overrides.keyword ?? "some long tail keyword",
      keyword_info: {
        search_volume: "search_volume" in overrides ? overrides.search_volume! : 50,
        cpc: overrides.cpc ?? 1.2,
      },
      keyword_properties: { keyword_difficulty: overrides.keyword_difficulty ?? 30 },
      search_intent_info: { main_intent: overrides.main_intent ?? "commercial" },
    },
  };
}

describe("isLongTail", () => {
  it("requires 3 or more words", () => {
    expect(isLongTail("suya")).toBe(false);
    expect(isLongTail("jollof rice")).toBe(false);
    expect(isLongTail("best jollof rice birmingham")).toBe(true);
  });
});

describe("extractCandidates", () => {
  it("keeps a real long-tail, decent-volume candidate with all fields mapped", () => {
    const result = extractCandidates([relatedItem({ keyword: "best suya spot in handsworth", search_volume: 40, cpc: 0.8, keyword_difficulty: 22, main_intent: "transactional" })]);
    expect(result).toEqual([
      { keyword: "best suya spot in handsworth", keywordNormalized: "best suya spot in handsworth", searchVolume: 40, cpc: 0.8, keywordDifficulty: 22, searchIntent: "transactional" },
    ]);
  });

  it("drops a short (non-long-tail) keyword", () => {
    expect(extractCandidates([relatedItem({ keyword: "suya" })])).toEqual([]);
  });

  it("drops a candidate with no search volume or below the floor", () => {
    expect(extractCandidates([relatedItem({ keyword: "obscure nigerian dish name birmingham", search_volume: null })])).toEqual([]);
    expect(extractCandidates([relatedItem({ keyword: "obscure nigerian dish name birmingham", search_volume: 5 })])).toEqual([]);
  });

  it("dedupes candidates that normalize to the same keyword within one batch", () => {
    const result = extractCandidates([
      relatedItem({ keyword: "Best Jollof Rice Birmingham" }),
      relatedItem({ keyword: "best jollof rice birmingham" }),
    ]);
    expect(result).toHaveLength(1);
  });

  it("treats an unrecognized intent value as null rather than passing it through", () => {
    const result = extractCandidates([relatedItem({ keyword: "some long tail keyword", main_intent: "not_a_real_intent" })]);
    expect(result[0].searchIntent).toBeNull();
  });

  it("handles a missing keyword_data gracefully", () => {
    expect(extractCandidates([{ keyword_data: null }])).toEqual([]);
  });
});

function makeSupabaseMock(config: {
  siteConfig?: Record<string, unknown>;
  existingKeywords?: Array<{ id: string; keyword_normalized: string; keyword_difficulty: number | null; search_intent: string | null }>;
  insertError?: { message: string } | null;
  updateError?: { message: string } | null;
} = {}) {
  const insertCalls: Array<Record<string, unknown>[]> = [];
  const updateCalls: Array<{ id: string; values: Record<string, unknown> }> = [];

  const from = vi.fn((table: string) => {
    if (table === "sites") {
      return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { config: config.siteConfig ?? {} }, error: null }) })) })) };
    }
    if (table === "keywords") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            range: vi.fn().mockResolvedValue({ data: config.existingKeywords ?? [], error: null }),
          })),
        })),
        insert: vi.fn((rows: Record<string, unknown>[]) => {
          insertCalls.push(rows);
          return Promise.resolve({ error: config.insertError ?? null });
        }),
        update: vi.fn((values: Record<string, unknown>) => ({
          eq: vi.fn((_col: string, id: string) => {
            updateCalls.push({ id, values });
            return Promise.resolve({ error: config.updateError ?? null });
          }),
        })),
      };
    }
    throw new Error(`Unexpected table in test: ${table}`);
  });

  return { from, insertCalls, updateCalls };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckBudget.mockResolvedValue({ allowed: true, warning: false, currentSpend: 0, monthlyLimit: 10 });
  mockCallDataForSeoApi.mockResolvedValue({
    status_code: 20000,
    status_message: "Ok.",
    cost: 0.01,
    tasks_count: 1,
    tasks_error: 0,
    tasks: [{ id: "t1", status_code: 20000, status_message: "Ok.", cost: 0.01, result: [{ items: [] }] }],
  });
});

describe("discoverKeywords", () => {
  it("skips entirely when the budget is already exceeded, without calling DataForSEO", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: false, reason: "budget_exceeded", currentSpend: 10, monthlyLimit: 10 });
    mockSupabase = makeSupabaseMock();

    const result = await discoverKeywords("site-1");
    expect(result).toEqual({ skipped: true, reason: "budget_exceeded", seedsQueried: 0, candidatesFound: 0, keywordsInserted: 0, keywordsEnriched: 0, cost: 0 });
    expect(mockCallDataForSeoApi).not.toHaveBeenCalled();
  });

  it("uses the default seed list when sites.config.seed_keywords isn't set", async () => {
    mockSupabase = makeSupabaseMock();
    await discoverKeywords("site-1");
    expect(mockCallDataForSeoApi).toHaveBeenCalledTimes(DEFAULT_SEED_KEYWORDS.length);
  });

  it("uses configured seed_keywords instead of the default list", async () => {
    mockSupabase = makeSupabaseMock({ siteConfig: { seed_keywords: ["custom seed one", "custom seed two"] } });
    await discoverKeywords("site-1");
    expect(mockCallDataForSeoApi).toHaveBeenCalledTimes(2);
    expect(mockCallDataForSeoApi).toHaveBeenCalledWith(expect.any(String), [expect.objectContaining({ keyword: "custom seed one" })]);
  });

  it("inserts a real long-tail candidate not already tracked", async () => {
    const { from, insertCalls } = makeSupabaseMock({ siteConfig: { seed_keywords: ["one seed only"] } });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue({
      status_code: 20000,
      status_message: "Ok.",
      cost: 0.01,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [{ id: "t1", status_code: 20000, status_message: "Ok.", cost: 0.01, result: [{ items: [relatedItem({ keyword: "best jollof rice in handsworth" })] }] }],
    });

    const result = await discoverKeywords("site-1");
    expect(result.keywordsInserted).toBe(1);
    expect(insertCalls[0]).toEqual([
      expect.objectContaining({
        site_id: "site-1",
        keyword: "best jollof rice in handsworth",
        keyword_normalized: "best jollof rice in handsworth",
        search_volume: 50,
        is_target: false,
        data_source: "dataforseo",
      }),
    ]);
  });

  it("enriches an existing keyword missing difficulty/intent instead of inserting a duplicate", async () => {
    const { from, insertCalls, updateCalls } = makeSupabaseMock({
      siteConfig: { seed_keywords: ["one seed only"] },
      existingKeywords: [{ id: "kw-existing", keyword_normalized: "best jollof rice in handsworth", keyword_difficulty: null, search_intent: null }],
    });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue({
      status_code: 20000,
      status_message: "Ok.",
      cost: 0.01,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [{ id: "t1", status_code: 20000, status_message: "Ok.", cost: 0.01, result: [{ items: [relatedItem({ keyword: "best jollof rice in handsworth", keyword_difficulty: 25, main_intent: "commercial" })] }] }],
    });

    const result = await discoverKeywords("site-1");
    expect(result.keywordsInserted).toBe(0);
    expect(result.keywordsEnriched).toBe(1);
    expect(insertCalls).toHaveLength(0);
    expect(updateCalls[0]).toEqual({ id: "kw-existing", values: { keyword_difficulty: 25, search_intent: "commercial" } });
  });

  it("does not touch an existing keyword that already has both fields populated", async () => {
    const { from, updateCalls } = makeSupabaseMock({
      siteConfig: { seed_keywords: ["one seed only"] },
      existingKeywords: [{ id: "kw-existing", keyword_normalized: "best jollof rice in handsworth", keyword_difficulty: 40, search_intent: "informational" }],
    });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue({
      status_code: 20000,
      status_message: "Ok.",
      cost: 0.01,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [{ id: "t1", status_code: 20000, status_message: "Ok.", cost: 0.01, result: [{ items: [relatedItem({ keyword: "best jollof rice in handsworth" })] }] }],
    });

    const result = await discoverKeywords("site-1");
    expect(result.keywordsEnriched).toBe(0);
    expect(updateCalls).toHaveLength(0);
  });

  it("dedupes a candidate returned by more than one seed", async () => {
    mockSupabase = makeSupabaseMock({ siteConfig: { seed_keywords: ["seed one", "seed two"] } });
    mockCallDataForSeoApi.mockResolvedValue({
      status_code: 20000,
      status_message: "Ok.",
      cost: 0.01,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [{ id: "t1", status_code: 20000, status_message: "Ok.", cost: 0.01, result: [{ items: [relatedItem({ keyword: "best jollof rice in handsworth" })] }] }],
    });

    const result = await discoverKeywords("site-1");
    expect(result.keywordsInserted).toBe(1); // not 2, despite both seeds returning it
  });

  it("re-checks the budget before each seed after the first, stopping once denied", async () => {
    mockSupabase = makeSupabaseMock({ siteConfig: { seed_keywords: ["seed one", "seed two", "seed three"] } });
    mockCheckBudget
      .mockResolvedValueOnce({ allowed: true, warning: false, currentSpend: 0, monthlyLimit: 10 })
      .mockResolvedValueOnce({ allowed: false, reason: "budget_exceeded", currentSpend: 10, monthlyLimit: 10 });

    await discoverKeywords("site-1");
    expect(mockCallDataForSeoApi).toHaveBeenCalledTimes(1);
  });

  it("still records accumulated spend when a later seed's task fails", async () => {
    mockSupabase = makeSupabaseMock({ siteConfig: { seed_keywords: ["seed one", "seed two"] } });
    mockCallDataForSeoApi
      .mockResolvedValueOnce({ status_code: 20000, status_message: "Ok.", cost: 0.01, tasks_count: 1, tasks_error: 0, tasks: [{ id: "t1", status_code: 20000, status_message: "Ok.", cost: 0.01, result: [{ items: [] }] }] })
      .mockResolvedValueOnce({ status_code: 20000, status_message: "Ok.", cost: 0.01, tasks_count: 1, tasks_error: 1, tasks: [{ id: "t2", status_code: 40501, status_message: "Invalid Field.", cost: 0.01, result: null }] });

    const result = await discoverKeywords("site-1");
    expect(result.seedsQueried).toBe(2);
    expect(mockRecordSpend).toHaveBeenCalledWith(mockSupabase, "site-1", "dataforseo", 0.02);
  });

  it("does not call recordSpend when cost is 0", async () => {
    mockSupabase = makeSupabaseMock({ siteConfig: { seed_keywords: ["seed one"] } });
    mockCallDataForSeoApi.mockResolvedValue({
      status_code: 20000,
      status_message: "Ok.",
      cost: 0,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [{ id: "t1", status_code: 20000, status_message: "Ok.", cost: 0, result: [{ items: [] }] }],
    });

    await discoverKeywords("site-1");
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });
});
