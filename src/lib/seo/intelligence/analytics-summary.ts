import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

// Real clicks/impressions/position trends for /admin/seo/analytics — the
// "why don't I see anything like Search Console" gap a user raised
// directly. Pure GSC data (keyword_page_metrics), already collected daily
// since Phase 1 — no new sync, no new cost, just a read/aggregation layer
// that never existed until now.

const FETCH_PAGE_SIZE = 1000;
export const DEFAULT_TREND_WINDOW_DAYS = 90;
export const TOP_KEYWORDS_LIMIT = 25;

function toIsoDate(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

interface MetricRow {
  keyword_id: string;
  date: string;
  position: number | null;
  impressions: number;
  clicks: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchMetrics(supabase: any, siteId: string, sinceDate: string): Promise<MetricRow[]> {
  const rows: MetricRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("keyword_page_metrics")
      .select("keyword_id, date, position, impressions, clicks")
      .eq("site_id", siteId)
      .gte("date", sinceDate)
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch keyword_page_metrics: ${error.message}`);
    rows.push(...((data ?? []) as MetricRow[]));
    if (!data || data.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }
  return rows;
}

export interface DailyTotal {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  avgPosition: number | null;
}

/**
 * One row per calendar day across every keyword/page — the same
 * impression-weighted-position, summed-clicks-and-impressions convention
 * `retention/run.ts`'s weekly rollup already established, applied here to
 * a daily trend instead. Days with zero rows for the site (before GSC
 * started syncing, or a genuine gap) are simply absent, not zero-filled —
 * a real gap in Search Console's own data shouldn't be drawn as a flat
 * zero implying "no traffic that day" when it really means "no data".
 */
export function aggregateDailyTotals(rows: MetricRow[]): DailyTotal[] {
  const buckets = new Map<string, { clicks: number; impressions: number; positionWeighted: number; impressionsWithPosition: number }>();
  for (const row of rows) {
    let bucket = buckets.get(row.date);
    if (!bucket) {
      bucket = { clicks: 0, impressions: 0, positionWeighted: 0, impressionsWithPosition: 0 };
      buckets.set(row.date, bucket);
    }
    bucket.clicks += row.clicks;
    bucket.impressions += row.impressions;
    if (row.position !== null) {
      bucket.positionWeighted += row.position * row.impressions;
      bucket.impressionsWithPosition += row.impressions;
    }
  }

  return Array.from(buckets.entries())
    .map(([date, b]) => ({
      date,
      clicks: b.clicks,
      impressions: b.impressions,
      ctr: b.impressions > 0 ? b.clicks / b.impressions : null,
      avgPosition: b.impressionsWithPosition > 0 ? b.positionWeighted / b.impressionsWithPosition : null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface KeywordTotal {
  keywordId: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  avgPosition: number | null;
}

/** Same window, grouped by keyword instead of by date — the "Queries" table. */
export function aggregateByKeyword(rows: MetricRow[]): KeywordTotal[] {
  const buckets = new Map<string, { clicks: number; impressions: number; positionWeighted: number; impressionsWithPosition: number }>();
  for (const row of rows) {
    let bucket = buckets.get(row.keyword_id);
    if (!bucket) {
      bucket = { clicks: 0, impressions: 0, positionWeighted: 0, impressionsWithPosition: 0 };
      buckets.set(row.keyword_id, bucket);
    }
    bucket.clicks += row.clicks;
    bucket.impressions += row.impressions;
    if (row.position !== null) {
      bucket.positionWeighted += row.position * row.impressions;
      bucket.impressionsWithPosition += row.impressions;
    }
  }

  return Array.from(buckets.entries())
    .map(([keywordId, b]) => ({
      keywordId,
      clicks: b.clicks,
      impressions: b.impressions,
      ctr: b.impressions > 0 ? b.clicks / b.impressions : null,
      avgPosition: b.impressionsWithPosition > 0 ? b.positionWeighted / b.impressionsWithPosition : null,
    }))
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
}

export interface AnalyticsTotals {
  clicks: number;
  impressions: number;
  ctr: number | null;
  avgPosition: number | null;
}

export function computeTotals(rows: MetricRow[]): AnalyticsTotals {
  let clicks = 0;
  let impressions = 0;
  let positionWeighted = 0;
  let impressionsWithPosition = 0;
  for (const row of rows) {
    clicks += row.clicks;
    impressions += row.impressions;
    if (row.position !== null) {
      positionWeighted += row.position * row.impressions;
      impressionsWithPosition += row.impressions;
    }
  }
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : null,
    avgPosition: impressionsWithPosition > 0 ? positionWeighted / impressionsWithPosition : null,
  };
}

export interface AnalyticsSummary {
  daily: DailyTotal[];
  topKeywords: KeywordTotal[];
  totals: AnalyticsTotals;
  windowDays: number;
}

export async function loadAnalyticsSummary(siteId: string, windowDays: number = DEFAULT_TREND_WINDOW_DAYS): Promise<AnalyticsSummary> {
  const supabase = createSupabaseServiceRoleClient();
  const rows = await fetchMetrics(supabase, siteId, toIsoDate(windowDays));

  return {
    daily: aggregateDailyTotals(rows),
    topKeywords: aggregateByKeyword(rows).slice(0, TOP_KEYWORDS_LIMIT),
    totals: computeTotals(rows),
    windowDays,
  };
}
