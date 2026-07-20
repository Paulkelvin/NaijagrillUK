import { logger } from "@/lib/seo/logger";

// ARCHITECTURE.md §6 Budget Controls, implemented exactly:
//   1. api_budgets tracks spend per provider per month
//   2. Before every call, check current_spend < monthly_limit
//   3. At current_spend >= monthly_limit * alert_threshold, log a warning
//   4. At current_spend >= monthly_limit, skip the call, log "budget_exceeded"
//   5. Default monthly limit: $10 per site
//
// Milestone 4's plan doc flagged an open question: does the $10 default
// live in a new site_configs field, or in api_budgets itself? Resolved
// here — api_budgets.monthly_limit has no DB-level DEFAULT (it's NOT NULL
// with no default in the Milestone 0 migration), so the $10 is an
// application-level default applied only when *creating* a new period's
// row (recordSpend's insert path below) — no new site_configs field
// needed. A month rolls over naturally: the first call of a new month
// finds no api_budgets row for that period_start, checkBudget() falls
// back to the default budget for its allow/deny decision, and
// recordSpend() creates the real row on the first successful paid call.
//
// This module only decides allow/deny and tracks spend — it doesn't touch
// sync_log itself. Writing a "budget_exceeded" sync_log entry when
// checkBudget() denies a call is each sync job's own responsibility
// (Milestones 5/6), matching how every other cross-cutting concern in
// this codebase (retry counts, warnings) is folded into sync_log by the
// job that experienced it, not by the shared helper.

export const DEFAULT_MONTHLY_LIMIT_USD = 10;
export const DEFAULT_ALERT_THRESHOLD = 0.8;

export type DataForSeoProvider = "dataforseo";

interface ApiBudgetRow {
  current_spend: number;
  monthly_limit: number;
  alert_threshold: number;
}

export type BudgetCheckResult =
  | { allowed: true; warning: boolean; currentSpend: number; monthlyLimit: number }
  | { allowed: false; reason: "budget_exceeded"; currentSpend: number; monthlyLimit: number };

/** api_budgets.period_start is always the 1st of the month (DB CHECK constraint). */
export function currentPeriodStart(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchBudgetRow(supabase: any, siteId: string, provider: DataForSeoProvider, periodStart: string): Promise<ApiBudgetRow | null> {
  const { data, error } = await supabase
    .from("api_budgets")
    .select("current_spend, monthly_limit, alert_threshold")
    .eq("site_id", siteId)
    .eq("provider", provider)
    .eq("period_start", periodStart)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch api_budgets: ${error.message}`);
  return data;
}

/**
 * Call before every DataForSEO API call. Read-only — never mutates
 * api_budgets (that's recordSpend's job, called after a successful paid
 * call). No row for the current period yet means no spend has happened
 * this month, so it's always allowed (falling back to the $10 default for
 * the limit/threshold, since there's nothing in the DB to read those
 * from).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkBudget(supabase: any, siteId: string, provider: DataForSeoProvider): Promise<BudgetCheckResult> {
  const periodStart = currentPeriodStart();
  const row = await fetchBudgetRow(supabase, siteId, provider, periodStart);

  const currentSpend = row?.current_spend ?? 0;
  const monthlyLimit = row?.monthly_limit ?? DEFAULT_MONTHLY_LIMIT_USD;
  const alertThreshold = row?.alert_threshold ?? DEFAULT_ALERT_THRESHOLD;

  if (currentSpend >= monthlyLimit) {
    return { allowed: false, reason: "budget_exceeded", currentSpend, monthlyLimit };
  }

  const warning = currentSpend >= monthlyLimit * alertThreshold;
  if (warning) {
    logger.warn("dataforseo_budget_alert_threshold", { siteId, provider, currentSpend, monthlyLimit, alertThreshold });
  }

  return { allowed: true, warning, currentSpend, monthlyLimit };
}

/**
 * Call after a successful paid DataForSEO API call, with the real cost
 * from the response envelope's `cost` field. Creates the current period's
 * row (at the $10 default limit) if this is the first spend of the month,
 * otherwise increments the existing row's current_spend.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recordSpend(supabase: any, siteId: string, provider: DataForSeoProvider, amountUsd: number): Promise<void> {
  const periodStart = currentPeriodStart();
  const row = await fetchBudgetRow(supabase, siteId, provider, periodStart);

  if (row) {
    const { error } = await supabase
      .from("api_budgets")
      .update({ current_spend: row.current_spend + amountUsd })
      .eq("site_id", siteId)
      .eq("provider", provider)
      .eq("period_start", periodStart);
    if (error) throw new Error(`Failed to update api_budgets: ${error.message}`);
    return;
  }

  const { error } = await supabase.from("api_budgets").insert({
    site_id: siteId,
    provider,
    period_start: periodStart,
    monthly_limit: DEFAULT_MONTHLY_LIMIT_USD,
    current_spend: amountUsd,
  });
  if (error) throw new Error(`Failed to insert api_budgets: ${error.message}`);
}
