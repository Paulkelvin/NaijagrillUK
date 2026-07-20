import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/seo/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
const { logger } = await import("@/lib/seo/logger");

const { checkBudget, recordSpend, currentPeriodStart, DEFAULT_MONTHLY_LIMIT_USD, DEFAULT_ALERT_THRESHOLD } = await import("./budget");

interface MockConfig {
  existingRow?: { current_spend: number; monthly_limit: number; alert_threshold: number } | null;
  fetchError?: { message: string } | null;
  updateError?: { message: string } | null;
  insertError?: { message: string } | null;
}

function makeSupabaseMock(config: MockConfig = {}) {
  const updateCalls: Array<Record<string, unknown>> = [];
  const insertCalls: Array<Record<string, unknown>> = [];

  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: config.existingRow ?? null, error: config.fetchError ?? null }),
          })),
        })),
      })),
    })),
    update: vi.fn((values: Record<string, unknown>) => {
      updateCalls.push(values);
      return {
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: config.updateError ?? null }),
          })),
        })),
      };
    }),
    insert: vi.fn((values: Record<string, unknown>) => {
      insertCalls.push(values);
      return Promise.resolve({ error: config.insertError ?? null });
    }),
  }));

  return { from, updateCalls, insertCalls };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("currentPeriodStart", () => {
  it("returns the 1st of the current month in YYYY-MM-01 format", () => {
    const result = currentPeriodStart();
    expect(result).toMatch(/^\d{4}-\d{2}-01$/);
  });
});

describe("checkBudget", () => {
  it("allows the call and falls back to the $10 default when no row exists yet this period", async () => {
    const { from } = makeSupabaseMock({ existingRow: null });
    const result = await checkBudget({ from }, "site-1", "dataforseo");

    expect(result).toEqual({ allowed: true, warning: false, currentSpend: 0, monthlyLimit: DEFAULT_MONTHLY_LIMIT_USD });
  });

  it("allows the call, no warning, when comfortably under the alert threshold", async () => {
    const { from } = makeSupabaseMock({ existingRow: { current_spend: 1, monthly_limit: 10, alert_threshold: 0.8 } });
    const result = await checkBudget({ from }, "site-1", "dataforseo");

    expect(result).toEqual({ allowed: true, warning: false, currentSpend: 1, monthlyLimit: 10 });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("allows the call but warns once spend crosses the alert threshold", async () => {
    const { from } = makeSupabaseMock({ existingRow: { current_spend: 8, monthly_limit: 10, alert_threshold: 0.8 } });
    const result = await checkBudget({ from }, "site-1", "dataforseo");

    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.warning).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(
      "dataforseo_budget_alert_threshold",
      expect.objectContaining({ siteId: "site-1", currentSpend: 8, monthlyLimit: 10 }),
    );
  });

  it("denies the call once spend meets or exceeds the monthly limit", async () => {
    const { from } = makeSupabaseMock({ existingRow: { current_spend: 10, monthly_limit: 10, alert_threshold: 0.8 } });
    const result = await checkBudget({ from }, "site-1", "dataforseo");

    expect(result).toEqual({ allowed: false, reason: "budget_exceeded", currentSpend: 10, monthlyLimit: 10 });
  });

  it("denies the call when spend exceeds the monthly limit", async () => {
    const { from } = makeSupabaseMock({ existingRow: { current_spend: 12, monthly_limit: 10, alert_threshold: 0.8 } });
    const result = await checkBudget({ from }, "site-1", "dataforseo");

    expect(result.allowed).toBe(false);
  });

  it("uses the row's own custom limit/threshold when a row exists", async () => {
    const { from } = makeSupabaseMock({ existingRow: { current_spend: 45, monthly_limit: 50, alert_threshold: 0.9 } });
    const result = await checkBudget({ from }, "site-1", "dataforseo");

    // 45/50 = 0.9, exactly at the custom 0.9 threshold -> warning
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.warning).toBe(true);
  });
});

describe("recordSpend", () => {
  it("creates a new api_budgets row at the $10 default limit when none exists for this period", async () => {
    const { from, insertCalls } = makeSupabaseMock({ existingRow: null });
    await recordSpend({ from }, "site-1", "dataforseo", 0.05);

    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]).toMatchObject({
      site_id: "site-1",
      provider: "dataforseo",
      monthly_limit: DEFAULT_MONTHLY_LIMIT_USD,
      current_spend: 0.05,
    });
  });

  it("increments the existing row's current_spend when one already exists", async () => {
    const { from, updateCalls } = makeSupabaseMock({ existingRow: { current_spend: 1.2, monthly_limit: 10, alert_threshold: 0.8 } });
    await recordSpend({ from }, "site-1", "dataforseo", 0.05);

    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].current_spend).toBeCloseTo(1.25, 6);
  });

  it("propagates a clear error when the update fails", async () => {
    const { from } = makeSupabaseMock({
      existingRow: { current_spend: 1, monthly_limit: 10, alert_threshold: 0.8 },
      updateError: { message: "constraint violation" },
    });
    await expect(recordSpend({ from }, "site-1", "dataforseo", 0.05)).rejects.toThrow(/constraint violation/);
  });

  it("propagates a clear error when the insert fails", async () => {
    const { from } = makeSupabaseMock({ existingRow: null, insertError: { message: "constraint violation" } });
    await expect(recordSpend({ from }, "site-1", "dataforseo", 0.05)).rejects.toThrow(/constraint violation/);
  });
});

describe("DEFAULT_ALERT_THRESHOLD", () => {
  it("matches the api_budgets.alert_threshold column default (0.8)", () => {
    expect(DEFAULT_ALERT_THRESHOLD).toBe(0.8);
  });
});
