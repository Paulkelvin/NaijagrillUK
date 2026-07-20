import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { INDUSTRY_DEFAULT_POSITIONS } from "./ctr-model";

// ARCHITECTURE.md §5.3 Cannibalization Score. Pure GSC data — no
// DataForSEO dependency (PHASE_2_IMPLEMENTATION.md's Sequencing Decision).
// This module only computes and returns scores; it does not write to the
// actions table — that's Milestone 10's analysis-engine orchestrator.

const DETECTION_WINDOW_DAYS = 90;
const SCORING_WINDOW_DAYS = 30;
const ACTION_THRESHOLD = 40;
// "Significantly more traffic" (ARCHITECTURE.md §5.3's action-generation
// rule) isn't given a numeric definition — resolved here as the dominant
// page holding ≥70% of clicks, reusing click_split's own 0-1 scale rather
// than inventing an unrelated second signal.
const DOMINANT_SHARE_THRESHOLD = 0.7;
const FETCH_PAGE_SIZE = 1000;

interface MetricRow {
  keyword_id: string;
  page_id: string;
  date: string;
  position: number | null;
  impressions: number;
  clicks: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchRecentMetrics(supabase: any, siteId: string, sinceDate: string): Promise<MetricRow[]> {
  const rows: MetricRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("keyword_page_metrics")
      .select("keyword_id, page_id, date, position, impressions, clicks")
      .eq("site_id", siteId)
      .gte("date", sinceDate)
      .gt("impressions", 0)
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch keyword_page_metrics: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }
  return rows;
}

/**
 * ARCHITECTURE.md §5.3's detection query, reproduced over already-fetched
 * rows rather than as a second DB round trip: keywords with impressions
 * from 2+ distinct pages in the 90-day window are cannibalization
 * candidates.
 */
export function detectCandidates(rows: MetricRow[]): Set<string> {
  const pagesByKeyword = new Map<string, Set<string>>();
  for (const row of rows) {
    const pages = pagesByKeyword.get(row.keyword_id) ?? new Set<string>();
    pages.add(row.page_id);
    pagesByKeyword.set(row.keyword_id, pages);
  }
  const candidates = new Set<string>();
  for (const [keywordId, pages] of pagesByKeyword) {
    if (pages.size >= 2) candidates.add(keywordId);
  }
  return candidates;
}

/** Population standard deviation — the daily position readings being
 *  scored are the complete set of observations available for this
 *  keyword/window, not a sample drawn from a larger population. */
function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export interface RawScore {
  keywordId: string;
  pageIds: string[];
  positionVarianceNorm: number;
  clickSplit: number;
  ctrDeficitNorm: number;
  trafficValue: number;
  totalClicks: number;
  dominantPageId: string | null;
  dominantShare: number;
}

/** Scores one candidate keyword against its last-30-day rows. Everything
 *  except trafficValueNorm (which needs the full candidate set to
 *  normalise against) is computed here. */
export function scoreCandidate(
  keywordId: string,
  rows30d: MetricRow[],
  ctrPositions: Record<string, number>,
  cpc: number | null,
): RawScore {
  const positions = rows30d.filter((r) => r.position !== null).map((r) => r.position as number);
  const positionVarianceNorm = Math.min(stdDev(positions) / 10, 1.0);

  const perPage = new Map<string, { clicks: number; impressions: number; positions: number[] }>();
  for (const row of rows30d) {
    const existing = perPage.get(row.page_id) ?? { clicks: 0, impressions: 0, positions: [] };
    existing.clicks += row.clicks;
    existing.impressions += row.impressions;
    if (row.position !== null) existing.positions.push(row.position);
    perPage.set(row.page_id, existing);
  }

  const totalClicks = Array.from(perPage.values()).reduce((sum, p) => sum + p.clicks, 0);
  const totalImpressions = Array.from(perPage.values()).reduce((sum, p) => sum + p.impressions, 0);

  let dominantPageId: string | null = null;
  let maxPageClicks = 0;
  for (const [pageId, p] of perPage) {
    if (p.clicks > maxPageClicks) {
      maxPageClicks = p.clicks;
      dominantPageId = pageId;
    }
  }
  const clickSplit = totalClicks > 0 ? 1 - maxPageClicks / totalClicks : 0;
  const dominantShare = totalClicks > 0 ? maxPageClicks / totalClicks : 0;

  const pageAvgPositions = Array.from(perPage.values())
    .filter((p) => p.positions.length > 0)
    .map((p) => p.positions.reduce((sum, v) => sum + v, 0) / p.positions.length);
  const bestAvgPosition = pageAvgPositions.length > 0 ? Math.min(...pageAvgPositions) : null;
  // Clamped to the model's 1-20 range — the CTR model has no entry beyond
  // position 20, so a worse average position falls back to position 20's
  // (lowest) rate as a floor rather than looking up a non-existent key.
  const bucket = bestAvgPosition !== null ? Math.min(20, Math.max(1, Math.round(bestAvgPosition))) : null;
  const expectedCtr = bucket !== null ? ctrPositions[String(bucket)] : 0;
  const actualCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const ctrDeficit = Math.max(0, expectedCtr - actualCtr);
  const ctrDeficitNorm = expectedCtr > 0 ? Math.min(ctrDeficit / expectedCtr, 1.0) : 0;

  const trafficValue = totalClicks * (cpc ?? 1.0);

  return {
    keywordId,
    pageIds: Array.from(perPage.keys()),
    positionVarianceNorm,
    clickSplit,
    ctrDeficitNorm,
    trafficValue,
    totalClicks,
    dominantPageId,
    dominantShare,
  };
}

export interface CannibalizationResult {
  keywordId: string;
  pageIds: string[];
  score: number;
  positionVarianceNorm: number;
  clickSplit: number;
  ctrDeficitNorm: number;
  trafficValueNorm: number;
  /**
   * "canonicalize": one page dominates (≥70% of clicks) — recommend
   * making it canonical, redirect/de-optimise the rest.
   * "merge": clicks are split without a clear winner — recommend merging.
   * null: score is at/below the 40-point action threshold, or below.
   * Deliberately never "differentiate" — ARCHITECTURE.md §5.3's third
   * case ("pages serve different intents") needs the Intent Alignment
   * Check (§5.9), explicitly deferred to Phase 3
   * (PHASE_2_IMPLEMENTATION.md Non-Goals) — there's no reliable intent
   * signal to make that call from yet.
   */
  recommendation: "canonicalize" | "merge" | null;
  recommendedCanonicalPageId: string | null;
}

function toIsoDate(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/**
 * Detects and scores cannibalized keywords for a site. Read-only — does
 * not write to the actions table (Milestone 10's orchestrator does that).
 */
export async function detectCannibalization(siteId: string): Promise<CannibalizationResult[]> {
  const supabase = createSupabaseServiceRoleClient();

  const since90 = toIsoDate(DETECTION_WINDOW_DAYS);
  const since30 = toIsoDate(SCORING_WINDOW_DAYS);

  const rows90d = await fetchRecentMetrics(supabase, siteId, since90);
  const candidateIds = detectCandidates(rows90d);
  if (candidateIds.size === 0) return [];

  const { data: siteConfigRow, error: siteConfigError } = await supabase
    .from("site_configs")
    .select("ctr_model, scoring_weights")
    .eq("site_id", siteId)
    .single();
  if (siteConfigError || !siteConfigRow) {
    throw new Error(`Failed to load site_configs: ${siteConfigError?.message ?? "not found"}`);
  }
  const ctrPositions: Record<string, number> = siteConfigRow.ctr_model?.positions ?? INDUSTRY_DEFAULT_POSITIONS;
  const weights = siteConfigRow.scoring_weights?.cannibalization ?? {
    position_variance: 0.25,
    click_split: 0.3,
    ctr_deficit: 0.25,
    traffic_at_risk: 0.2,
  };

  const { data: siteRow, error: siteError } = await supabase.from("sites").select("config").eq("id", siteId).single();
  if (siteError || !siteRow) throw new Error(`Failed to load site: ${siteError?.message ?? "not found"}`);
  // Brand-name exclusion (ARCHITECTURE.md §5.3 Limitations) is stored in
  // sites.config — the "lightweight overrides" column (Milestone 1's own
  // description), not a new site_configs column — this is exactly the
  // single-value, single-site override it exists for (ADR-003).
  const brandTerms: string[] = (siteRow.config?.brand_terms ?? []).map((t: string) => t.toLowerCase());

  const candidateIdList = Array.from(candidateIds);
  const { data: keywordRows, error: keywordError } = await supabase
    .from("keywords")
    .select("id, keyword_normalized, cpc")
    .in("id", candidateIdList);
  if (keywordError) throw new Error(`Failed to load keywords: ${keywordError.message}`);
  const keywordById = new Map((keywordRows ?? []).map((k: { id: string; keyword_normalized: string; cpc: number | null }) => [k.id, k]));

  const nonBrandCandidates = candidateIdList.filter((id) => {
    const kw = keywordById.get(id);
    if (!kw) return true;
    return !brandTerms.some((term) => term.length > 0 && kw.keyword_normalized.includes(term));
  });
  if (nonBrandCandidates.length === 0) return [];

  const rows30dByKeyword = new Map<string, MetricRow[]>();
  for (const row of rows90d) {
    if (row.date < since30) continue;
    if (!nonBrandCandidates.includes(row.keyword_id)) continue;
    const list = rows30dByKeyword.get(row.keyword_id) ?? [];
    list.push(row);
    rows30dByKeyword.set(row.keyword_id, list);
  }

  const rawScores: RawScore[] = nonBrandCandidates.map((keywordId) =>
    scoreCandidate(keywordId, rows30dByKeyword.get(keywordId) ?? [], ctrPositions, keywordById.get(keywordId)?.cpc ?? null),
  );

  // traffic_value_norm normalises against the max within *this detected
  // set* (ARCHITECTURE.md §5.3: "max_traffic_value_in_set"), not some
  // historical/global maximum.
  const maxTrafficValue = Math.max(0, ...rawScores.map((s) => s.trafficValue));

  return rawScores.map((s): CannibalizationResult => {
    const trafficValueNorm = maxTrafficValue > 0 ? Math.min(s.trafficValue / maxTrafficValue, 1.0) : 0;
    const score =
      (s.positionVarianceNorm * (weights.position_variance ?? 0) +
        s.clickSplit * (weights.click_split ?? 0) +
        s.ctrDeficitNorm * (weights.ctr_deficit ?? 0) +
        trafficValueNorm * (weights.traffic_at_risk ?? 0)) *
      100;

    let recommendation: CannibalizationResult["recommendation"] = null;
    let recommendedCanonicalPageId: string | null = null;
    if (score > ACTION_THRESHOLD) {
      if (s.dominantShare >= DOMINANT_SHARE_THRESHOLD) {
        recommendation = "canonicalize";
        recommendedCanonicalPageId = s.dominantPageId;
      } else {
        recommendation = "merge";
      }
    }

    return {
      keywordId: s.keywordId,
      pageIds: s.pageIds,
      score,
      positionVarianceNorm: s.positionVarianceNorm,
      clickSplit: s.clickSplit,
      ctrDeficitNorm: s.ctrDeficitNorm,
      trafficValueNorm,
      recommendation,
      recommendedCanonicalPageId,
    };
  });
}
