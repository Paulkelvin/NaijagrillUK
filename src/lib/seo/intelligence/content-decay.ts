import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

// ARCHITECTURE.md §5.7 Content Decay Score. Pure GA4 data — no DataForSEO
// dependency (PHASE_2_IMPLEMENTATION.md's Sequencing Decision). Genuinely
// cannot produce meaningful output until ~60-90 days of real GA4 history
// exist (an ARCHITECTURE.md constraint, not a shortcut) — same "code
// complete, needs real-world time" posture as Phase 1's retention job had
// on day one.

const WINDOW_DAYS = 90;
const ROLLING_WINDOW = 30;
const MIN_REAL_DATA_DAYS = 60;
const MIN_AVG_SESSIONS_PER_MONTH = 30;
const FETCH_PAGE_SIZE = 1000;

export type DecayStage = "stable" | "early_decay" | "mid_decay" | "critical_decay";

export interface DecayComputation {
  trendSlope: number;
  peakTraffic: number;
  currentTraffic: number;
  daysSincePeak: number;
  decayPct: number;
  decayStage: DecayStage;
  recencyFactor: number;
  decayUrgency: number;
}

/** Least-squares slope over day-index (0..n-1) vs. sessions. Negative = declining. */
export function computeLinearRegressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let x = 0; x < n; x++) {
    const y = values[x];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
}

/**
 * Slides a 30-day window across the 90-day array (61 possible positions)
 * to find peak_traffic (ARCHITECTURE.md §5.7: "max 30-day rolling average
 * in available history") and current_traffic (the final, most-recent
 * window). Ties for the peak resolve to the most recent qualifying
 * window (>= comparison in a left-to-right scan) — a defensible default
 * ARCHITECTURE.md doesn't specify, chosen to give the benefit of the
 * doubt toward "still recoverable" rather than "long gone".
 */
export function computeRollingPeakAndCurrent(dailySessions: number[]): {
  peakTraffic: number;
  peakWindowStart: number;
  currentTraffic: number;
} {
  const numWindows = dailySessions.length - ROLLING_WINDOW + 1;
  let peakTraffic = -Infinity;
  let peakWindowStart = 0;
  for (let start = 0; start < numWindows; start++) {
    let sum = 0;
    for (let i = start; i < start + ROLLING_WINDOW; i++) sum += dailySessions[i];
    const avg = sum / ROLLING_WINDOW;
    if (avg >= peakTraffic) {
      peakTraffic = avg;
      peakWindowStart = start;
    }
  }
  const currentWindowStart = dailySessions.length - ROLLING_WINDOW;
  let currentSum = 0;
  for (let i = currentWindowStart; i < currentWindowStart + ROLLING_WINDOW; i++) currentSum += dailySessions[i];
  return { peakTraffic, peakWindowStart, currentTraffic: currentSum / ROLLING_WINDOW };
}

function decayStageFor(decayPct: number): DecayStage {
  if (decayPct < 5) return "stable";
  if (decayPct < 15) return "early_decay";
  if (decayPct <= 40) return "mid_decay"; // ARCHITECTURE.md: critical is "> 40", so exactly 40 is still mid
  return "critical_decay";
}

function recencyFactorFor(daysSincePeak: number): number {
  if (daysSincePeak <= 30) return 1.0;
  if (daysSincePeak <= 90) return 0.7;
  return 0.4;
}

/** dailySessions must be exactly WINDOW_DAYS entries, oldest to newest, zero-filled for missing days. */
export function computeDecay(dailySessions: number[]): DecayComputation {
  const trendSlope = computeLinearRegressionSlope(dailySessions);
  const { peakTraffic, peakWindowStart, currentTraffic } = computeRollingPeakAndCurrent(dailySessions);
  const decayPct = peakTraffic > 0 ? Math.max(0, ((peakTraffic - currentTraffic) / peakTraffic) * 100) : 0;
  const currentWindowStart = dailySessions.length - ROLLING_WINDOW;
  // Both windows are the same width, so the gap between their start indices
  // equals the gap between their end indices — days since the peak window
  // ended, measured against "now" (the end of the current window).
  const daysSincePeak = currentWindowStart - peakWindowStart;
  const decayStage = decayStageFor(decayPct);
  const recencyFactor = recencyFactorFor(daysSincePeak);
  const decayUrgency = decayPct * currentTraffic * recencyFactor;
  return { trendSlope, peakTraffic, currentTraffic, daysSincePeak, decayPct, decayStage, recencyFactor, decayUrgency };
}

export interface PageDecayResult extends DecayComputation {
  pageId: string;
  seasonalityChecked: boolean;
  /**
   * Always false today — ARCHITECTURE.md §5.7's seasonality cross-check
   * ("if a page's primary keyword has seasonal patterns matching the
   * traffic drop, flag it as seasonal, not decaying") doesn't specify an
   * exact matching algorithm, and keywords.monthly_volumes (DataForSEO,
   * Milestone 5) has no real data yet to validate any algorithm against.
   * Implementing a guessed pattern-match now would be exactly the kind of
   * unvalidated logic this project avoids (same principle as Page ROI
   * Score's missing_paa being forced to 0 pre-DataForSEO). seasonalChecked
   * distinguishes "no keyword volume data available" from "checked, not
   * seasonal" for whoever consumes this later.
   */
  seasonal: boolean;
}

function toIsoDate(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function buildDateSequence(days: number): string[] {
  const dates: string[] = [];
  for (let i = days; i >= 1; i--) dates.push(toIsoDate(i));
  return dates;
}

interface PageMetricRow {
  page_id: string;
  date: string;
  sessions: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPageMetrics(supabase: any, siteId: string, sinceDate: string): Promise<PageMetricRow[]> {
  const rows: PageMetricRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("page_metrics")
      .select("page_id, date, sessions")
      .eq("site_id", siteId)
      .gte("date", sinceDate)
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch page_metrics: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }
  return rows;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPrimaryKeywordMonthlyVolumes(supabase: any, pageId: string, sinceDate: string): Promise<unknown | null> {
  const { data: kpmRows, error } = await supabase
    .from("keyword_page_metrics")
    .select("keyword_id, clicks")
    .eq("page_id", pageId)
    .gte("date", sinceDate);
  if (error) throw new Error(`Failed to fetch keyword_page_metrics for page ${pageId}: ${error.message}`);
  if (!kpmRows || kpmRows.length === 0) return null;

  const clicksByKeyword = new Map<string, number>();
  for (const row of kpmRows as Array<{ keyword_id: string; clicks: number }>) {
    clicksByKeyword.set(row.keyword_id, (clicksByKeyword.get(row.keyword_id) ?? 0) + row.clicks);
  }
  let primaryKeywordId: string | null = null;
  let maxClicks = -1;
  for (const [keywordId, clicks] of clicksByKeyword) {
    if (clicks > maxClicks) {
      maxClicks = clicks;
      primaryKeywordId = keywordId;
    }
  }
  if (!primaryKeywordId) return null;

  const { data: keywordRow, error: keywordError } = await supabase
    .from("keywords")
    .select("monthly_volumes")
    .eq("id", primaryKeywordId)
    .single();
  if (keywordError || !keywordRow) return null;
  return keywordRow.monthly_volumes ?? null;
}

/**
 * Detects and scores content decay for every page with enough real
 * history and traffic to make it meaningful. Read-only — does not write
 * to the actions table (Milestone 10's orchestrator does that).
 */
export async function detectContentDecay(siteId: string): Promise<PageDecayResult[]> {
  const supabase = createSupabaseServiceRoleClient();
  const since = toIsoDate(WINDOW_DAYS);

  const rows = await fetchPageMetrics(supabase, siteId, since);

  const byPage = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const dateMap = byPage.get(row.page_id) ?? new Map<string, number>();
    dateMap.set(row.date, row.sessions);
    byPage.set(row.page_id, dateMap);
  }

  const dateSequence = buildDateSequence(WINDOW_DAYS);
  const results: PageDecayResult[] = [];

  for (const [pageId, dateMap] of byPage) {
    // ARCHITECTURE.md §5.7: "Requires at least 60 days of data" — real
    // rows present, not just calendar days elapsed since the site began.
    if (dateMap.size < MIN_REAL_DATA_DAYS) continue;

    const totalSessions = Array.from(dateMap.values()).reduce((sum, s) => sum + s, 0);
    // "≥ 30 avg sessions/month" over the ~3-month (90-day) window.
    if (totalSessions / 3 < MIN_AVG_SESSIONS_PER_MONTH) continue;

    const dailySessions = dateSequence.map((d) => dateMap.get(d) ?? 0);
    const decay = computeDecay(dailySessions);

    const monthlyVolumes = await fetchPrimaryKeywordMonthlyVolumes(supabase, pageId, since);

    results.push({
      pageId,
      ...decay,
      seasonalityChecked: monthlyVolumes !== null,
      seasonal: false,
    });
  }

  return results;
}
