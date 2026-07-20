import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { INDUSTRY_DEFAULT_POSITIONS } from "./ctr-model";
import { avgConversionValue, pageConversionRate } from "./page-roi-score";

// ARCHITECTURE.md §5.5 Conversion-Weighted Keyword Value — "impossible for
// any third-party tool to calculate" since it joins GSC keyword data with
// GA4 conversion data with business-configured conversion values, all
// three of which only this platform has together. No DataForSEO
// dependency beyond the CPC fallback, which degrades gracefully exactly
// like Milestones 7-8's pattern (PHASE_2_IMPLEMENTATION.md's Sequencing
// Decision).
//
// Per ARCHITECTURE.md §5.5's own Output note, this is "computed on-the-fly
// by the analysis engine... not persisted as a separate column" — this
// module returns values, it doesn't write anywhere. Milestone 10's
// orchestrator is responsible for storing results into
// actions.supporting_data (JSONB) when it builds an action from one.
//
// Reuses page-roi-score.ts's pageConversionRate (identical 50-session
// fallback threshold — ARCHITECTURE.md §5.2 states that number explicitly;
// §5.5 only says "fallback: site-wide average" without repeating it, so
// this reuses the same documented threshold rather than inventing a second
// one) and avgConversionValue (same conversion_events-then-CPC fallback
// chain, called here with a single-element CPC array so it degrades to
// "this keyword's own CPC as proxy" per §5.5's wording, rather than the
// CPC-weighted average across a page's keywords that §5.2 calls for).

const VALUE_WINDOW_DAYS = 30;
const MAX_POSITION_BUCKET = 20;
const FETCH_PAGE_SIZE = 1000;

/**
 * ARCHITECTURE.md §5.5: expected_ctr = ctr_model[current_position] (or
 * target_position for projections — the caller decides which position to
 * pass in). null position (no ranking data) -> 0, not a neutral default:
 * there's no click-through to project without a ranking.
 */
export function expectedCtrAtPosition(position: number | null, ctrPositions: Record<string, number>): number {
  if (position === null) return 0;
  const bucket = Math.min(MAX_POSITION_BUCKET, Math.max(1, Math.round(position)));
  return ctrPositions[String(bucket)] ?? 0;
}

/**
 * ARCHITECTURE.md §5.5's exact formula. searchVolume === null (pre-Milestone-5
 * DataForSEO) -> 0, the same "no data source yet" rule this file's imports
 * already apply.
 */
export function computeKeywordMonthlyValue(
  searchVolume: number | null,
  expectedCtr: number,
  conversionRate: number,
  convValue: number,
): number {
  if (searchVolume === null) return 0;
  return searchVolume * expectedCtr * conversionRate * convValue;
}

interface KeywordRow {
  id: string;
  search_volume: number | null;
  cpc: number | null;
}

interface KpmRow {
  keyword_id: string;
  page_id: string;
  position: number | null;
}

interface PmRow {
  page_id: string;
  sessions: number;
  conversions: number;
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
      .select("keyword_id, page_id, position")
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

export interface KeywordValueResult {
  keywordId: string;
  pageId: string;
  position: number | null;
  expectedCtr: number;
  conversionRate: number;
  avgConversionValue: number;
  monthlyValue: number;
}

/**
 * Computes keyword_monthly_value for every (keyword, page) pair with
 * ranking data in the last 30 days. Read-only — computed on-the-fly per
 * ARCHITECTURE.md §5.5, never persisted as its own column. Milestone 10's
 * orchestrator decides which results are worth attaching to an action.
 */
export async function computeKeywordValues(siteId: string): Promise<KeywordValueResult[]> {
  const supabase = createSupabaseServiceRoleClient();
  const since = toIsoDate(VALUE_WINDOW_DAYS);

  const [keywords, kpmRows, pmRows, siteConfigResult] = await Promise.all([
    fetchKeywords(supabase, siteId),
    fetchRecentKeywordPageMetrics(supabase, siteId, since),
    fetchRecentPageMetrics(supabase, siteId, since),
    supabase.from("site_configs").select("ctr_model, conversion_events").eq("site_id", siteId).single(),
  ]);
  if (kpmRows.length === 0) return [];

  const { data: siteConfigRow, error: siteConfigError } = siteConfigResult;
  if (siteConfigError || !siteConfigRow) {
    throw new Error(`Failed to load site_configs: ${siteConfigError?.message ?? "not found"}`);
  }
  const ctrPositions: Record<string, number> = siteConfigRow.ctr_model?.positions ?? INDUSTRY_DEFAULT_POSITIONS;
  const conversionEvents: Array<{ name: string; value: number }> = siteConfigRow.conversion_events ?? [];

  const keywordById = new Map(keywords.map((k) => [k.id, k]));

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

  const positionsByPair = new Map<string, number[]>();
  for (const row of kpmRows) {
    const key = `${row.keyword_id}::${row.page_id}`;
    if (row.position === null) {
      if (!positionsByPair.has(key)) positionsByPair.set(key, []);
      continue;
    }
    const list = positionsByPair.get(key) ?? [];
    list.push(row.position);
    positionsByPair.set(key, list);
  }

  return Array.from(positionsByPair.entries()).map(([key, positions]): KeywordValueResult => {
    const [keywordId, pageId] = key.split("::");
    const keyword = keywordById.get(keywordId);
    const avgPosition = positions.length > 0 ? positions.reduce((s, v) => s + v, 0) / positions.length : null;

    const pm = pmByPage.get(pageId) ?? { sessions: 0, conversions: 0 };
    const conversionRate = pageConversionRate(pm.conversions, pm.sessions, siteConversions, siteSessions);
    const convValue = avgConversionValue(conversionEvents, [keyword?.cpc ?? null]);
    const expectedCtr = expectedCtrAtPosition(avgPosition, ctrPositions);

    return {
      keywordId,
      pageId,
      position: avgPosition,
      expectedCtr,
      conversionRate,
      avgConversionValue: convValue,
      monthlyValue: computeKeywordMonthlyValue(keyword?.search_volume ?? null, expectedCtr, conversionRate, convValue),
    };
  });
}
