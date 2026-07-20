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

const { syncSearchVolume, monthlySearchesToVolumesByMonth } = await import("./search-volume");

describe("monthlySearchesToVolumesByMonth", () => {
  it("keys entries by month number", () => {
    const result = monthlySearchesToVolumesByMonth([
      { year: 2026, month: 1, search_volume: 100 },
      { year: 2026, month: 2, search_volume: 140 },
    ]);
    expect(result).toEqual({ "1": 100, "2": 140 });
  });

  it("keeps the most recent occurrence when a month number repeats across years", () => {
    const result = monthlySearchesToVolumesByMonth([
      { year: 2025, month: 6, search_volume: 50 },
      { year: 2026, month: 6, search_volume: 90 },
    ]);
    expect(result).toEqual({ "6": 90 });
  });

  it("returns null for null or empty input", () => {
    expect(monthlySearchesToVolumesByMonth(null)).toBeNull();
    expect(monthlySearchesToVolumesByMonth([])).toBeNull();
  });
});

interface MockConfig {
  keywordRows?: Array<{ id: string; keyword: string; last_volume_refresh: string | null }>;
  updateError?: { message: string } | null;
}

function makeSupabaseMock(config: MockConfig = {}) {
  const updateCalls: Array<{ id: string; values: Record<string, unknown> }> = [];
  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ data: config.keywordRows ?? [], error: null }),
    })),
    update: vi.fn((values: Record<string, unknown>) => ({
      eq: vi.fn((_col: string, id: string) => {
        updateCalls.push({ id, values });
        return Promise.resolve({ error: config.updateError ?? null });
      }),
    })),
  }));
  return { from, updateCalls };
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckBudget.mockResolvedValue({ allowed: true, warning: false, currentSpend: 0, monthlyLimit: 10 });
});

describe("syncSearchVolume", () => {
  it("skips entirely when the budget is exceeded, without calling DataForSEO", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: false, reason: "budget_exceeded", currentSpend: 10, monthlyLimit: 10 });
    mockSupabase = makeSupabaseMock();

    const result = await syncSearchVolume("site-1");
    expect(result).toEqual({ skipped: true, reason: "budget_exceeded", keywordsChecked: 0, keywordsUpdated: 0, cost: 0 });
    expect(mockCallDataForSeoApi).not.toHaveBeenCalled();
  });

  it("returns immediately with zero counts when no keywords are stale", async () => {
    const { from } = makeSupabaseMock({
      keywordRows: [{ id: "kw-1", keyword: "jollof rice", last_volume_refresh: new Date().toISOString() }],
    });
    mockSupabase = { from };

    const result = await syncSearchVolume("site-1");
    expect(result).toEqual({ skipped: false, keywordsChecked: 0, keywordsUpdated: 0, cost: 0 });
    expect(mockCallDataForSeoApi).not.toHaveBeenCalled();
  });

  it("treats a keyword with no last_volume_refresh as stale, and one refreshed 31 days ago", async () => {
    const { from, updateCalls } = makeSupabaseMock({
      keywordRows: [
        { id: "kw-1", keyword: "jollof rice", last_volume_refresh: null },
        { id: "kw-2", keyword: "suya", last_volume_refresh: daysAgo(31) },
        { id: "kw-3", keyword: "recently checked", last_volume_refresh: daysAgo(5) },
      ],
    });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue({
      status_code: 20000,
      status_message: "Ok.",
      cost: 0.0001,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [
        {
          id: "t1",
          status_code: 20000,
          status_message: "Ok.",
          cost: 0.0001,
          result: [
            { keyword: "jollof rice", search_volume: 500, cpc: 1.2, monthly_searches: [{ year: 2026, month: 1, search_volume: 500 }] },
            { keyword: "suya", search_volume: 300, cpc: 0.8, monthly_searches: null },
          ],
        },
      ],
    });

    const result = await syncSearchVolume("site-1");
    expect(result.keywordsChecked).toBe(2);
    expect(result.keywordsUpdated).toBe(2);
    expect(mockCallDataForSeoApi).toHaveBeenCalledWith(
      "/v3/keywords_data/google_ads/search_volume/live",
      [expect.objectContaining({ location_code: 2826, language_code: "en", keywords: ["jollof rice", "suya"] })],
    );
    expect(updateCalls).toHaveLength(2);
    expect(updateCalls[0]).toEqual({
      id: "kw-1",
      values: { search_volume: 500, cpc: 1.2, monthly_volumes: { "1": 500 }, last_volume_refresh: expect.any(String) },
    });
    expect(updateCalls[1]).toEqual({
      id: "kw-2",
      values: { search_volume: 300, cpc: 0.8, monthly_volumes: null, last_volume_refresh: expect.any(String) },
    });
  });

  it("skips a keyword DataForSEO returned no result for, leaving it unupdated", async () => {
    const { from, updateCalls } = makeSupabaseMock({
      keywordRows: [{ id: "kw-1", keyword: "an obscure phrase", last_volume_refresh: null }],
    });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue({
      status_code: 20000,
      status_message: "Ok.",
      cost: 0.0001,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [{ id: "t1", status_code: 20000, status_message: "Ok.", cost: 0.0001, result: [] }],
    });

    const result = await syncSearchVolume("site-1");
    expect(result.keywordsUpdated).toBe(0);
    expect(updateCalls).toHaveLength(0);
  });

  it("records the real cost from the response envelope after a successful sync", async () => {
    const { from } = makeSupabaseMock({ keywordRows: [{ id: "kw-1", keyword: "jollof rice", last_volume_refresh: null }] });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue({
      status_code: 20000,
      status_message: "Ok.",
      cost: 0.05,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [{ id: "t1", status_code: 20000, status_message: "Ok.", cost: 0.05, result: [{ keyword: "jollof rice", search_volume: 100, cpc: 1, monthly_searches: null }] }],
    });

    await syncSearchVolume("site-1");
    expect(mockRecordSpend).toHaveBeenCalledWith(mockSupabase, "site-1", "dataforseo", 0.05);
  });

  it("does not call recordSpend when cost is 0", async () => {
    const { from } = makeSupabaseMock({ keywordRows: [{ id: "kw-1", keyword: "jollof rice", last_volume_refresh: null }] });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue({
      status_code: 20000,
      status_message: "Ok.",
      cost: 0,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [{ id: "t1", status_code: 20000, status_message: "Ok.", cost: 0, result: [{ keyword: "jollof rice", search_volume: 100, cpc: 1, monthly_searches: null }] }],
    });

    await syncSearchVolume("site-1");
    expect(mockRecordSpend).not.toHaveBeenCalled();
  });

  it("throws a clear error when the DataForSEO task itself failed", async () => {
    const { from } = makeSupabaseMock({ keywordRows: [{ id: "kw-1", keyword: "jollof rice", last_volume_refresh: null }] });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue({
      status_code: 20000,
      status_message: "Ok.",
      cost: 0,
      tasks_count: 1,
      tasks_error: 1,
      tasks: [{ id: "t1", status_code: 40501, status_message: "Invalid Field.", cost: 0, result: null }],
    });

    await expect(syncSearchVolume("site-1")).rejects.toThrow(/Invalid Field/);
  });

  it("still records the already-incurred cost when the task fails after DataForSEO already charged for the call", async () => {
    const { from } = makeSupabaseMock({ keywordRows: [{ id: "kw-1", keyword: "jollof rice", last_volume_refresh: null }] });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue({
      status_code: 20000,
      status_message: "Ok.",
      cost: 0.05,
      tasks_count: 1,
      tasks_error: 1,
      tasks: [{ id: "t1", status_code: 40501, status_message: "Invalid Field.", cost: 0.05, result: null }],
    });

    await expect(syncSearchVolume("site-1")).rejects.toThrow(/Invalid Field/);
    expect(mockRecordSpend).toHaveBeenCalledWith(mockSupabase, "site-1", "dataforseo", 0.05);
  });

  it("logs and skips a single keyword whose DB update fails, without losing the rest of the batch or the recorded spend", async () => {
    const { from, updateCalls } = makeSupabaseMock({
      keywordRows: [
        { id: "kw-1", keyword: "jollof rice", last_volume_refresh: null },
        { id: "kw-2", keyword: "suya", last_volume_refresh: null },
      ],
      updateError: { message: "connection reset" },
    });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue({
      status_code: 20000,
      status_message: "Ok.",
      cost: 0.05,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [
        {
          id: "t1",
          status_code: 20000,
          status_message: "Ok.",
          cost: 0.05,
          result: [
            { keyword: "jollof rice", search_volume: 500, cpc: 1.2, monthly_searches: null },
            { keyword: "suya", search_volume: 300, cpc: 0.8, monthly_searches: null },
          ],
        },
      ],
    });

    const result = await syncSearchVolume("site-1");
    expect(result.keywordsUpdated).toBe(0);
    expect(updateCalls).toHaveLength(2);
    expect(mockRecordSpend).toHaveBeenCalledWith(mockSupabase, "site-1", "dataforseo", 0.05);
  });

  it("re-checks the budget before every batch after the first, stopping once a later batch is denied", async () => {
    const keywordRows = Array.from({ length: 1500 }, (_, i) => ({
      id: `kw-${i}`,
      keyword: `keyword ${i}`,
      last_volume_refresh: null,
    }));
    const { from, updateCalls } = makeSupabaseMock({ keywordRows });
    mockSupabase = { from };
    mockCheckBudget
      .mockResolvedValueOnce({ allowed: true, warning: false, currentSpend: 0, monthlyLimit: 10 }) // pre-loop check
      .mockResolvedValueOnce({ allowed: false, reason: "budget_exceeded", currentSpend: 10, monthlyLimit: 10 }); // 2nd batch
    mockCallDataForSeoApi.mockImplementation((_endpoint: string, [{ keywords }]: [{ keywords: string[] }]) => ({
      status_code: 20000,
      status_message: "Ok.",
      cost: 0.05,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [{
        id: "t1",
        status_code: 20000,
        status_message: "Ok.",
        cost: 0.05,
        result: keywords.map((keyword) => ({ keyword, search_volume: 100, cpc: 1, monthly_searches: null })),
      }],
    }));

    const result = await syncSearchVolume("site-1");
    // Only the first 1000-keyword batch was ever sent — the second batch
    // was blocked by the mid-loop budget re-check before calling the API.
    expect(mockCallDataForSeoApi).toHaveBeenCalledTimes(1);
    expect(updateCalls).toHaveLength(1000);
    expect(result.keywordsUpdated).toBe(1000);
    expect(mockRecordSpend).toHaveBeenCalledWith(mockSupabase, "site-1", "dataforseo", 0.05);
  });
});
