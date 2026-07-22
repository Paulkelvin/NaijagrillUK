import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { INDUSTRY_DEFAULT_POSITIONS } from "./ctr-model";

// ARCHITECTURE.md §5.2 Page ROI Score. Depends on Milestone 1's CTR model
// (live) and, for real traffic_potential, on keywords.search_volume —
// still null for every GSC-discovered keyword until Milestone 5
// (DataForSEO search volume sync) runs. Until then this module is
// code-complete and null-safe (PHASE_2_IMPLEMENTATION.md's Sequencing
// Decision) but produces roi_score = 0 for every page, since
// traffic_potential (and therefore revenue_potential) has no numerator
// without search_volume. This is a stronger degradation than Opportunity
// Score's, which still varies by position_potential/intent alone — worth
// knowing before reading Page ROI's output as "no page needs work."
//
// effort_score's six ARCHITECTURE.md-documented components split into two
// groups:
//  - word_count_gap has an ARCHITECTURE.md-documented interim formula (a
//    fixed target word count per content_type, substituting for
//    unavailable competitor-word-count data) and is implemented for real —
//    though pages.word_count itself has no producer in Phase 1/2 either
//    (no content/CMS sync milestone exists yet), so it too currently
//    evaluates to its null-safe default.
//  - content_age, missing_paa, link_deficit, schema_gap, and meta_quality
//    all need data ARCHITECTURE.md gives a real formula for but no
//    interim-default guidance for (pages.cms_updated_at, SERP PAA data,
//    internal_links, pages.schema_types, pages.title/meta_description) —
//    and Phase 2 has zero producers for any of them (no site crawler; an
//    explicit Phase 3 Non-Goal per PHASE_2_IMPLEMENTATION.md). Rather than
//    inventing undocumented thresholds/tables (the same trap
//    content-decay.ts's seasonality check deliberately avoided), all five
//    are forced to 0 — ARCHITECTURE.md's own explicit precedent for
//    missing_paa, extended consistently to the other four.

const TRAFFIC_WINDOW_DAYS = 30;
const CONVERSION_WINDOW_DAYS = 30;
const MIN_SESSIONS_FOR_PAGE_CONVERSION_RATE = 50;
const MAX_POSITION_BUCKET = 20;
const POSITION_IMPROVEMENT_TARGET = 3;
const EFFORT_FLOOR = 0.05;
const FETCH_PAGE_SIZE = 1000;

// Same real gap as run-analysis.ts's Opportunity Score ceiling, found while
// diagnosing why the homepage's "Improve /" action had a suspiciously huge
// trafficPotential (744,442 projected clicks) despite roiScore landing at
// 0. Real cause: GSC reports the homepage picking up rare, essentially
// noise impressions for wildly irrelevant/broad queries it will never
// convert on — "restaurant near me" (9.14M/mo), "restaurant" (7.48M/mo),
// "indian restaurant near me" (550K/mo, wrong cuisine entirely), "indian
// restaurant" (201K/mo at position 111) — every one with 0 real clicks in
// 30 days. computePageRoiScores summed projectedClickGain across every
// keyword tied to a page with no sanity check, so a handful of these noise
// keywords completely dominated the real signal from genuine ones (jollof
// rice near me, mix grill, suya birmingham, etc.). Exported so
// run-analysis.ts's create_content gate uses the same single ceiling
// rather than two independently-maintained magic numbers.
export const MAX_ACTIONABLE_VOLUME = 50_000;

const EFFORT_WEIGHTS = {
  wordCountGap: 0.25,
  contentAge: 0.15,
  missingPaa: 0.25,
  linkDeficit: 0.15,
  schemaGap: 0.1,
  metaQuality: 0.1,
} as const;

const TARGET_WORD_COUNT_BY_CONTENT_TYPE: Record<string, number> = {
  blog_post: 1500,
  category_page: 1500,
  landing_page: 800,
  service_page: 800,
  product_page: 500,
};
// content_type has no producer in Phase 1/2 either (see top-of-file
// comment) — this only matters once a future crawler starts populating
// both word_count and content_type together. landing_page's 800 is the
// most representative default for this project's actual site shape
// (single-location restaurant marketing pages).
const DEFAULT_TARGET_WORD_COUNT = 800;

/**
 * ARCHITECTURE.md §5.2: (target_word_count - word_count) / target_word_count,
 * clamped to [0, 1]. wordCount === null (no crawler yet) -> 0, the same
 * "data source doesn't exist yet" rule this file applies to its other
 * effort components once the underlying value is genuinely unmeasured
 * rather than a real zero.
 */
export function wordCountGap(wordCount: number | null, contentType: string | null): number {
  if (wordCount === null) return 0;
  const target = (contentType && TARGET_WORD_COUNT_BY_CONTENT_TYPE[contentType]) || DEFAULT_TARGET_WORD_COUNT;
  return Math.max(0, Math.min(1, (target - wordCount) / target));
}

/** Forced to 0 — see top-of-file comment. */
export const CONTENT_AGE_SCORE = 0;
/** Forced to 0 per ARCHITECTURE.md §5.2's own explicit Limitation. */
export const MISSING_PAA_SCORE = 0;
/** Forced to 0 — see top-of-file comment. */
export const LINK_DEFICIT_SCORE = 0;
/** Forced to 0 — see top-of-file comment. */
export const SCHEMA_GAP_SCORE = 0;
/** Forced to 0 — see top-of-file comment. */
export const META_QUALITY_SCORE = 0;

export interface EffortComponents {
  wordCountGap: number;
  contentAge: number;
  missingPaa: number;
  linkDeficit: number;
  schemaGap: number;
  metaQuality: number;
}

export function computeEffortScore(c: EffortComponents): number {
  return (
    c.wordCountGap * EFFORT_WEIGHTS.wordCountGap +
    c.contentAge * EFFORT_WEIGHTS.contentAge +
    c.missingPaa * EFFORT_WEIGHTS.missingPaa +
    c.linkDeficit * EFFORT_WEIGHTS.linkDeficit +
    c.schemaGap * EFFORT_WEIGHTS.schemaGap +
    c.metaQuality * EFFORT_WEIGHTS.metaQuality
  );
}

export interface KeywordTrafficInput {
  currentClicks30d: number;
  avgPosition: number | null;
  searchVolume: number | null;
}

/**
 * ARCHITECTURE.md §5.2 per-keyword click-gain projection. current_clicks_K
 * is the literal 30-day sum (avg_daily_clicks x 30 collapses to the same
 * value; summing directly avoids re-deriving a daily average just to
 * multiply it back out).
 */
export function projectedClickGain(input: KeywordTrafficInput, ctrPositions: Record<string, number>): number {
  if (input.avgPosition === null || input.searchVolume === null) return 0;
  const targetPosition = Math.max(1, input.avgPosition - POSITION_IMPROVEMENT_TARGET);
  const bucket = Math.min(MAX_POSITION_BUCKET, Math.max(1, Math.round(targetPosition)));
  const projectedCtr = ctrPositions[String(bucket)] ?? 0;
  const projectedClicks = input.searchVolume * projectedCtr;
  return Math.max(0, projectedClicks - input.currentClicks30d);
}

/** page_conversion_rate with ARCHITECTURE.md's site-wide fallback below 50 sessions/month. */
export function pageConversionRate(
  pageConversions: number,
  pageSessions: number,
  siteConversions: number,
  siteSessions: number,
): number {
  if (pageSessions >= MIN_SESSIONS_FOR_PAGE_CONVERSION_RATE) {
    return pageSessions > 0 ? pageConversions / pageSessions : 0;
  }
  return siteSessions > 0 ? siteConversions / siteSessions : 0;
}

/**
 * avg_conversion_value: mean of site_configs.conversion_events' configured
 * values, falling back to the mean CPC across the page's ranking keywords
 * (ARCHITECTURE.md's documented fallback) when no conversion events are
 * configured. 0 (not a neutral default) when neither is available — an
 * unpriced conversion has no defensible monetary value to assume.
 */
export function avgConversionValue(
  conversionEvents: Array<{ name: string; value: number }>,
  keywordCpcs: Array<number | null>,
): number {
  if (conversionEvents.length > 0) {
    const sum = conversionEvents.reduce((s, e) => s + (e.value ?? 0), 0);
    return sum / conversionEvents.length;
  }
  const validCpcs = keywordCpcs.filter((c): c is number => c !== null);
  if (validCpcs.length === 0) return 0;
  return validCpcs.reduce((s, c) => s + c, 0) / validCpcs.length;
}

export function computeRevenuePotential(trafficPotential: number, pageConvRate: number, avgConvValue: number): number {
  return trafficPotential * pageConvRate * avgConvValue;
}

export function computeRoiScore(revenuePotential: number, effortScore: number): number {
  return revenuePotential / Math.max(effortScore, EFFORT_FLOOR);
}

interface PageRow {
  id: string;
  word_count: number | null;
  content_type: string | null;
}

interface KeywordRow {
  id: string;
  search_volume: number | null;
  cpc: number | null;
}

interface KpmRow {
  page_id: string;
  keyword_id: string;
  position: number | null;
  clicks: number;
}

interface PmRow {
  page_id: string;
  sessions: number;
  conversions: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPages(supabase: any, siteId: string): Promise<PageRow[]> {
  const rows: PageRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("pages")
      .select("id, word_count, content_type")
      .eq("site_id", siteId)
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch pages: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }
  return rows;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchKeywords(supabase: any, siteId: string): Promise<KeywordRow[]> {
  const rows: KeywordRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("keywords")
      .select("id, search_volume, cpc")
      .eq("site_id", siteId)
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch keywords: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }
  return rows;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchRecentKeywordPageMetrics(supabase: any, siteId: string, sinceDate: string): Promise<KpmRow[]> {
  const rows: KpmRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("keyword_page_metrics")
      .select("page_id, keyword_id, position, clicks")
      .eq("site_id", siteId)
      .gte("date", sinceDate)
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch keyword_page_metrics: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }
  return rows;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchRecentPageMetrics(supabase: any, siteId: string, sinceDate: string): Promise<PmRow[]> {
  const rows: PmRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("page_metrics")
      .select("page_id, sessions, conversions")
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

function toIsoDate(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export interface PageRoiResult {
  pageId: string;
  trafficPotential: number;
  pageConversionRate: number;
  avgConversionValue: number;
  revenuePotential: number;
  effortScore: number;
  effortComponents: EffortComponents;
  roiScore: number;
}

/**
 * Ranks every page in the pages table by ROI. Read-only — does not write
 * to the actions table (Milestone 10's orchestrator does that).
 */
export async function computePageRoiScores(siteId: string): Promise<PageRoiResult[]> {
  const supabase = createSupabaseServiceRoleClient();
  const sinceTraffic = toIsoDate(TRAFFIC_WINDOW_DAYS);
  const sinceConversion = toIsoDate(CONVERSION_WINDOW_DAYS);

  const [pages, keywords, kpmRows, pmRows, siteConfigResult] = await Promise.all([
    fetchPages(supabase, siteId),
    fetchKeywords(supabase, siteId),
    fetchRecentKeywordPageMetrics(supabase, siteId, sinceTraffic),
    fetchRecentPageMetrics(supabase, siteId, sinceConversion),
    supabase.from("site_configs").select("ctr_model, conversion_events").eq("site_id", siteId).single(),
  ]);
  if (pages.length === 0) return [];

  const { data: siteConfigRow, error: siteConfigError } = siteConfigResult;
  if (siteConfigError || !siteConfigRow) {
    throw new Error(`Failed to load site_configs: ${siteConfigError?.message ?? "not found"}`);
  }
  const ctrPositions: Record<string, number> = siteConfigRow.ctr_model?.positions ?? INDUSTRY_DEFAULT_POSITIONS;
  const conversionEvents: Array<{ name: string; value: number }> = siteConfigRow.conversion_events ?? [];

  const keywordById = new Map(keywords.map((k) => [k.id, k]));

  const kpmByPage = new Map<string, Map<string, { clicks: number; positions: number[] }>>();
  for (const row of kpmRows) {
    const byKeyword = kpmByPage.get(row.page_id) ?? new Map<string, { clicks: number; positions: number[] }>();
    const entry = byKeyword.get(row.keyword_id) ?? { clicks: 0, positions: [] };
    entry.clicks += row.clicks;
    if (row.position !== null) entry.positions.push(row.position);
    byKeyword.set(row.keyword_id, entry);
    kpmByPage.set(row.page_id, byKeyword);
  }

  const pmByPage = new Map<string, { sessions: number; conversions: number }>();
  let siteSessions = 0;
  let siteConversions = 0;
  for (const row of pmRows) {
    const entry = pmByPage.get(row.page_id) ?? { sessions: 0, conversions: 0 };
    entry.sessions += row.sessions;
    entry.conversions += row.conversions;
    pmByPage.set(row.page_id, entry);
    siteSessions += row.sessions;
    siteConversions += row.conversions;
  }

  return pages.map((page): PageRoiResult => {
    const byKeyword: Map<string, { clicks: number; positions: number[] }> = kpmByPage.get(page.id) ?? new Map();
    let trafficPotential = 0;
    const pageKeywordCpcs: Array<number | null> = [];
    for (const [keywordId, entry] of byKeyword) {
      const keyword = keywordById.get(keywordId);
      if (keyword?.search_volume !== null && keyword?.search_volume !== undefined && keyword.search_volume > MAX_ACTIONABLE_VOLUME) continue;
      pageKeywordCpcs.push(keyword?.cpc ?? null);
      const avgPosition =
        entry.positions.length > 0 ? entry.positions.reduce((s, v) => s + v, 0) / entry.positions.length : null;
      trafficPotential += projectedClickGain(
        { currentClicks30d: entry.clicks, avgPosition, searchVolume: keyword?.search_volume ?? null },
        ctrPositions,
      );
    }

    const pm = pmByPage.get(page.id) ?? { sessions: 0, conversions: 0 };
    const pageConvRate = pageConversionRate(pm.conversions, pm.sessions, siteConversions, siteSessions);
    const convValue = avgConversionValue(conversionEvents, pageKeywordCpcs);
    const revenuePotential = computeRevenuePotential(trafficPotential, pageConvRate, convValue);

    const effortComponents: EffortComponents = {
      wordCountGap: wordCountGap(page.word_count, page.content_type),
      contentAge: CONTENT_AGE_SCORE,
      missingPaa: MISSING_PAA_SCORE,
      linkDeficit: LINK_DEFICIT_SCORE,
      schemaGap: SCHEMA_GAP_SCORE,
      metaQuality: META_QUALITY_SCORE,
    };
    const effortScore = computeEffortScore(effortComponents);

    return {
      pageId: page.id,
      trafficPotential,
      pageConversionRate: pageConvRate,
      avgConversionValue: convValue,
      revenuePotential,
      effortScore,
      effortComponents,
      roiScore: computeRoiScore(revenuePotential, effortScore),
    };
  });
}
