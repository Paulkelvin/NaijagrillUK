import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { logger } from "@/lib/seo/logger";

// Closes a real gap flagged during a post-ship review of this whole
// platform: every other feedback loop in this system (the CTR model
// recalibrating weekly, the daily analysis re-scoring against fresh data,
// the budget module self-correcting spend) improves the *inputs*, but
// nothing ever checked whether completing a specific action actually
// worked. This module does — it snapshots a keyword's or page's real
// performance at the moment an action is marked "completed", then again
// OUTCOME_WINDOW_DAYS later, and classifies the change.
//
// No schema migration: this environment has no path to apply DDL against
// production right now (direct Postgres is network-blocked here — the
// same finding from Milestone 7 — and no Supabase Management API token is
// available this session to reach it over HTTPS instead, the workaround
// used earlier in Phase 2). Rather than block a real, requested
// improvement on an unrelated infrastructure gap, this stores its data in
// `actions.supporting_data` (JSONB, NOT NULL, already the designed
// extensibility point every action type uses for its own module-specific
// context — see run-analysis.ts) under an `outcomeTracking` key, instead
// of new dedicated columns. Trade-off, stated plainly: no DB-level CHECK
// constraint on `outcome`'s enum values (validated in this module only)
// and no partial index for "completed actions pending measurement" (the
// measurement job instead reads every completed action for the site,
// fine at this project's real scale — dozens of rows, not thousands).
// If/when a migration path is available again, promoting this to real
// columns + a partial index is a small, low-risk follow-up — the JSON
// shape below is designed to map onto that directly.

export const OUTCOME_WINDOW_DAYS = 30;
const METRICS_WINDOW_DAYS = 30;

// A meaningful move needs to clear both an absolute floor (so a baseline
// of 0 clicks doesn't count "1 click" as an infinite percentage swing)
// and a relative one (so a high-traffic keyword isn't called "improved"
// by statistical noise). Neither ARCHITECTURE.md nor any other module in
// this codebase specifies an outcome-classification threshold — this is a
// new, reasoned convention for this module alone, documented here rather
// than guessed silently.
const MIN_POSITION_DELTA = 1;
const MIN_RELATIVE_DELTA = 0.2;

export type ActionOutcome = "improved" | "unchanged" | "declined";

export interface KeywordMetricsSnapshot {
  window: "keyword";
  capturedAt: string;
  avgPosition: number | null;
  clicks: number;
  impressions: number;
}

export interface PageMetricsSnapshot {
  window: "page";
  capturedAt: string;
  sessions: number;
  conversionValue: number;
}

export type MetricsSnapshot = KeywordMetricsSnapshot | PageMetricsSnapshot;

export interface OutcomeTracking {
  baselineMetrics: MetricsSnapshot;
  outcomeMetrics?: MetricsSnapshot;
  outcome?: ActionOutcome;
  outcomeMeasuredAt?: string;
}

function toIsoDate(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

interface KpmRow {
  position: number | null;
  impressions: number;
  clicks: number;
}

/**
 * A keyword's real performance over the trailing window — impression-
 * weighted average position and summed clicks/impressions, the same
 * weighting convention retention/run.ts's weekly rollup already
 * established (a #3 position on a 1,000-impression day should weight
 * toward #3, not average flatly with a #50 position from a 1-impression
 * day). Scoped to one page when pageId is given (fix_cannibalization
 * actions, which target a specific recommended canonical page) or
 * aggregated across every page still reporting data for that keyword
 * when it isn't (create_content actions, which by definition have no
 * page yet).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function captureKeywordMetrics(supabase: any, keywordId: string, pageId: string | null): Promise<KeywordMetricsSnapshot> {
  let query = supabase
    .from("keyword_page_metrics")
    .select("position, impressions, clicks")
    .eq("keyword_id", keywordId)
    .gte("date", toIsoDate(METRICS_WINDOW_DAYS));
  if (pageId) query = query.eq("page_id", pageId);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to capture keyword metrics: ${error.message}`);

  let positionWeighted = 0;
  let impressionsWithPosition = 0;
  let impressions = 0;
  let clicks = 0;
  for (const row of (data ?? []) as KpmRow[]) {
    impressions += row.impressions;
    clicks += row.clicks;
    if (row.position !== null) {
      positionWeighted += row.position * row.impressions;
      impressionsWithPosition += row.impressions;
    }
  }

  return {
    window: "keyword",
    capturedAt: new Date().toISOString(),
    avgPosition: impressionsWithPosition > 0 ? positionWeighted / impressionsWithPosition : null,
    clicks,
    impressions,
  };
}

interface PmRow {
  sessions: number;
  conversion_value: number;
}

/** A page's real performance over the trailing window — summed sessions and conversion_value. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function capturePageMetrics(supabase: any, pageId: string): Promise<PageMetricsSnapshot> {
  const { data, error } = await supabase
    .from("page_metrics")
    .select("sessions, conversion_value")
    .eq("page_id", pageId)
    .gte("date", toIsoDate(METRICS_WINDOW_DAYS));
  if (error) throw new Error(`Failed to capture page metrics: ${error.message}`);

  let sessions = 0;
  let conversionValue = 0;
  for (const row of (data ?? []) as PmRow[]) {
    sessions += row.sessions;
    conversionValue += row.conversion_value;
  }

  return { window: "page", capturedAt: new Date().toISOString(), sessions, conversionValue };
}

/**
 * Which metric an action is measured against depends on what it actually
 * targets: a keyword (with an optional specific page, for
 * fix_cannibalization's canonical-page recommendation) takes priority
 * over a bare page, matching how create_content/fix_cannibalization
 * actions are the ones ARCHITECTURE.md frames as keyword-driven. Returns
 * null only for the case run-analysis.ts never actually produces (neither
 * id set) — defensive, not reachable from real action generation today.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function captureActionMetrics(supabase: any, action: { keywordId: string | null; pageId: string | null }): Promise<MetricsSnapshot | null> {
  if (action.keywordId) return captureKeywordMetrics(supabase, action.keywordId, action.pageId);
  if (action.pageId) return capturePageMetrics(supabase, action.pageId);
  return null;
}

/**
 * Classifies the change between a baseline and a later snapshot of the
 * same shape. "Improved" requires clearing either the absolute position
 * floor or the relative floor on whichever count metric applies
 * (clicks for a keyword, sessions for a page) — see the module-level
 * comment for why both floors exist. Symmetric for "declined".
 */
export function classifyOutcome(baseline: MetricsSnapshot, current: MetricsSnapshot): ActionOutcome {
  if (baseline.window === "keyword" && current.window === "keyword") {
    const positionDelta =
      baseline.avgPosition !== null && current.avgPosition !== null ? baseline.avgPosition - current.avgPosition : 0; // positive = better (lower position number)
    const clicksDelta = current.clicks - baseline.clicks;
    const clicksThreshold = Math.max(1, baseline.clicks * MIN_RELATIVE_DELTA);

    if (positionDelta >= MIN_POSITION_DELTA || clicksDelta >= clicksThreshold) return "improved";
    if (positionDelta <= -MIN_POSITION_DELTA || clicksDelta <= -clicksThreshold) return "declined";
    return "unchanged";
  }

  if (baseline.window === "page" && current.window === "page") {
    const sessionsDelta = current.sessions - baseline.sessions;
    const sessionsThreshold = Math.max(1, baseline.sessions * MIN_RELATIVE_DELTA);

    if (sessionsDelta >= sessionsThreshold) return "improved";
    if (sessionsDelta <= -sessionsThreshold) return "declined";
    return "unchanged";
  }

  // Mismatched snapshot shapes shouldn't happen (an action's keywordId/
  // pageId don't change after creation) — "unchanged" is the safe,
  // conservative default rather than guessing a direction from
  // incomparable metrics.
  return "unchanged";
}

export interface MeasureActionOutcomesResult {
  measured: number;
  pending: number;
}

/**
 * Finds every completed action whose baseline was captured but whose
 * outcome hasn't been measured yet and is now at least OUTCOME_WINDOW_DAYS
 * past completion, captures a fresh snapshot, and classifies the change.
 * Actions completed before this feature existed have no baselineMetrics
 * (nothing to compare against) and are silently skipped, not retroactively
 * guessed at — they'll simply never get an outcome, which is honest given
 * there's no real "before" data for them.
 */
export async function measureActionOutcomes(siteId: string): Promise<MeasureActionOutcomesResult> {
  const supabase = createSupabaseServiceRoleClient();

  const cutoff = new Date(Date.now() - OUTCOME_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("actions")
    .select("id, keyword_id, page_id, supporting_data, completed_at")
    .eq("site_id", siteId)
    .eq("status", "completed")
    .lte("completed_at", cutoff);
  if (error) throw new Error(`Failed to fetch completed actions: ${error.message}`);

  let measured = 0;
  let pending = 0;

  for (const action of data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supportingData = (action.supporting_data ?? {}) as Record<string, any>;
    const tracking: OutcomeTracking | undefined = supportingData.outcomeTracking;
    if (!tracking?.baselineMetrics || tracking.outcome) continue; // no baseline to compare, or already measured

    const current = await captureActionMetrics(supabase, { keywordId: action.keyword_id, pageId: action.page_id });
    if (!current) {
      pending++;
      continue;
    }

    const outcome = classifyOutcome(tracking.baselineMetrics, current);
    const updatedSupportingData = {
      ...supportingData,
      outcomeTracking: { ...tracking, outcomeMetrics: current, outcome, outcomeMeasuredAt: new Date().toISOString() },
    };

    const { error: updateError } = await supabase.from("actions").update({ supporting_data: updatedSupportingData }).eq("id", action.id);
    if (updateError) {
      logger.warn("action_outcome_write_failed", { siteId, actionId: action.id, error: updateError.message });
      pending++;
      continue;
    }
    measured++;
  }

  logger.info("action_outcomes_measured", { siteId, measured, pending });
  return { measured, pending };
}
