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

const { syncSerpSnapshots } = await import("./serp");

interface MockConfig {
  domain?: string;
  topKeywords?: Array<{ id: string; keyword: string }>;
  recentSnapshotKeywordIds?: string[];
  upsertError?: { message: string } | null;
}

function makeSupabaseMock(config: MockConfig = {}) {
  const upsertCalls: Array<Record<string, unknown>[]> = [];
  const from = vi.fn((table: string) => {
    if (table === "sites") {
      return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { domain: config.domain ?? "naijagrillandspice.co.uk" }, error: null }) })) })) };
    }
    if (table === "keywords") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: config.topKeywords ?? [], error: null }),
            })),
          })),
        })),
      };
    }
    if (table === "serp_snapshots") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({ data: (config.recentSnapshotKeywordIds ?? []).map((keyword_id) => ({ keyword_id })), error: null }),
            })),
          })),
        })),
        upsert: vi.fn((rows: Record<string, unknown>[]) => {
          upsertCalls.push(rows);
          return Promise.resolve({ error: config.upsertError ?? null });
        }),
      };
    }
    throw new Error(`Unexpected table in test: ${table}`);
  });
  return { from, upsertCalls };
}

function serpResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    status_code: 20000,
    status_message: "Ok.",
    cost: 0.003,
    tasks_count: 1,
    tasks_error: 0,
    tasks: [
      {
        id: "t1",
        status_code: 20000,
        status_message: "Ok.",
        cost: 0.003,
        result: [
          {
            keyword: "jollof rice birmingham",
            items: [
              { type: "organic", rank_absolute: 1, domain: "competitor.com", url: "https://competitor.com/jollof", title: "Best Jollof" },
              { type: "organic", rank_absolute: 3, domain: "www.naijagrillandspice.co.uk", url: "https://www.naijagrillandspice.co.uk/menu", title: "Menu" },
              { type: "local_pack", rank_absolute: 2, domain: "www.naijagrillandspice.co.uk", url: "https://www.naijagrillandspice.co.uk", title: null },
              { type: "knowledge_graph", rank_absolute: 4, domain: "wikipedia.org", url: "https://wikipedia.org/x", title: "X" },
              { type: "paid", rank_absolute: 0, domain: "ad.com", url: "https://ad.com", title: "Ad" },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckBudget.mockResolvedValue({ allowed: true, warning: false, currentSpend: 0, monthlyLimit: 10 });
});

describe("syncSerpSnapshots", () => {
  it("returns zeroed result immediately when there are no keywords at all", async () => {
    const { from } = makeSupabaseMock({ topKeywords: [] });
    mockSupabase = { from };

    const result = await syncSerpSnapshots("site-1", 280_000);
    expect(result).toEqual({ keywordsEligible: 0, keywordsSynced: 0, keywordsRemaining: 0, snapshotsWritten: 0, budgetExceeded: false, cost: 0 });
    expect(mockCallDataForSeoApi).not.toHaveBeenCalled();
  });

  it("excludes keywords with a snapshot inside the 7-day cache window", async () => {
    const { from } = makeSupabaseMock({
      topKeywords: [{ id: "kw-1", keyword: "already fresh" }, { id: "kw-2", keyword: "stale one" }],
      recentSnapshotKeywordIds: ["kw-1"],
    });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue(serpResponse());

    const result = await syncSerpSnapshots("site-1", 280_000);
    expect(result.keywordsEligible).toBe(1);
    expect(mockCallDataForSeoApi).toHaveBeenCalledTimes(1);
  });

  it("writes only the item types this schema tracks, correctly detects is_own_site, and uses rank_absolute as position", async () => {
    const { from, upsertCalls } = makeSupabaseMock({ topKeywords: [{ id: "kw-1", keyword: "jollof rice birmingham" }] });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue(serpResponse());

    const result = await syncSerpSnapshots("site-1", 280_000);
    expect(result.snapshotsWritten).toBe(3); // organic x2 + local_pack; knowledge_graph and paid are skipped
    const rows = upsertCalls[0];
    expect(rows).toHaveLength(3);

    const competitor = rows.find((r) => r.domain === "competitor.com")!;
    expect(competitor.is_own_site).toBe(false);
    expect(competitor.position).toBe(1);
    expect(competitor.serp_feature).toBe("organic");

    const ownOrganic = rows.find((r) => r.serp_feature === "organic" && r.domain === "www.naijagrillandspice.co.uk")!;
    expect(ownOrganic.is_own_site).toBe(true);
    expect(ownOrganic.position).toBe(3);

    const localPack = rows.find((r) => r.serp_feature === "local_pack")!;
    expect(localPack.is_own_site).toBe(true);
    expect(localPack.position).toBe(2);
  });

  it("stops before starting a new keyword once the time budget has elapsed", async () => {
    const { from } = makeSupabaseMock({
      topKeywords: [{ id: "kw-1", keyword: "a" }, { id: "kw-2", keyword: "b" }, { id: "kw-3", keyword: "c" }],
    });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue(serpResponse());

    const result = await syncSerpSnapshots("site-1", 0); // zero budget -> stop before the very first keyword
    expect(result.keywordsSynced).toBe(0);
    expect(result.keywordsRemaining).toBe(3);
    expect(mockCallDataForSeoApi).not.toHaveBeenCalled();
  });

  it("stops and reports budgetExceeded when the budget gate denies mid-run, without erroring", async () => {
    const { from } = makeSupabaseMock({
      topKeywords: [{ id: "kw-1", keyword: "a" }, { id: "kw-2", keyword: "b" }],
    });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue(serpResponse());
    mockCheckBudget
      .mockResolvedValueOnce({ allowed: true, warning: false, currentSpend: 9, monthlyLimit: 10 })
      .mockResolvedValueOnce({ allowed: false, reason: "budget_exceeded", currentSpend: 10, monthlyLimit: 10 });

    const result = await syncSerpSnapshots("site-1", 280_000);
    expect(result.keywordsSynced).toBe(1);
    expect(result.keywordsRemaining).toBe(1);
    expect(result.budgetExceeded).toBe(true);
    expect(mockCallDataForSeoApi).toHaveBeenCalledTimes(1);
  });

  it("counts a keyword as synced even when its own task fails, so it doesn't get retried forever within the same run", async () => {
    const { from } = makeSupabaseMock({ topKeywords: [{ id: "kw-1", keyword: "a" }] });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue(
      serpResponse({ tasks: [{ id: "t1", status_code: 40501, status_message: "Invalid Field.", cost: 0, result: null }] }),
    );

    const result = await syncSerpSnapshots("site-1", 280_000);
    expect(result.keywordsSynced).toBe(1);
    expect(result.snapshotsWritten).toBe(0);
  });

  it("records the real accumulated cost across all calls made this run", async () => {
    const { from } = makeSupabaseMock({ topKeywords: [{ id: "kw-1", keyword: "a" }, { id: "kw-2", keyword: "b" }] });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue(serpResponse({ cost: 0.003, tasks: [{ id: "t1", status_code: 20000, status_message: "Ok.", cost: 0.003, result: [{ keyword: "x", items: [] }] }] }));

    await syncSerpSnapshots("site-1", 280_000);
    expect(mockRecordSpend).toHaveBeenCalledWith(mockSupabase, "site-1", "dataforseo", 0.006);
  });

  it("logs and skips a keyword whose serp_snapshots write fails, without losing that call's cost or aborting the rest of the run", async () => {
    const { from } = makeSupabaseMock({
      topKeywords: [{ id: "kw-1", keyword: "a" }, { id: "kw-2", keyword: "b" }],
      upsertError: { message: "connection reset" },
    });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue(serpResponse({ cost: 0.003 }));

    const result = await syncSerpSnapshots("site-1", 280_000);
    expect(result.keywordsSynced).toBe(2);
    expect(result.snapshotsWritten).toBe(0);
    expect(mockRecordSpend).toHaveBeenCalledWith(mockSupabase, "site-1", "dataforseo", 0.006);
  });

  it("still records accumulated spend when a DB write throws an unexpected error partway through the run", async () => {
    const { from } = makeSupabaseMock({ topKeywords: [{ id: "kw-1", keyword: "a" }, { id: "kw-2", keyword: "b" }] });
    // Force the second call's upsert to reject outright (not just return { error }),
    // simulating a genuinely unexpected failure rather than a clean PostgREST error.
    let call = 0;
    const originalFrom = from.getMockImplementation()!;
    from.mockImplementation((table: string) => {
      const impl = originalFrom(table);
      if (table === "serp_snapshots") {
        return {
          ...impl,
          upsert: vi.fn(() => {
            call += 1;
            if (call === 2) return Promise.reject(new Error("network blip"));
            return Promise.resolve({ error: null });
          }),
        };
      }
      return impl;
    });
    mockSupabase = { from };
    mockCallDataForSeoApi.mockResolvedValue(serpResponse({ cost: 0.003 }));

    await expect(syncSerpSnapshots("site-1", 280_000)).rejects.toThrow(/network blip/);
    expect(mockRecordSpend).toHaveBeenCalledWith(mockSupabase, "site-1", "dataforseo", 0.006);
  });
});
