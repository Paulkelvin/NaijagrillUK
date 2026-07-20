import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { logger } from "@/lib/seo/logger";
import { completeSyncRun, startSyncRun } from "@/lib/seo/sync-log";

// ARCHITECTURE.md "Retention Policy": daily keyword_page_metrics/page_metrics
// rows older than 6 months are aggregated into their _weekly tables and
// deleted; sync_log rows older than 3 months are deleted outright.
const DAILY_RETENTION_MONTHS = 6;
const SYNC_LOG_RETENTION_MONTHS = 3;
const FETCH_PAGE_SIZE = 1000;

function monthsAgoDate(monthsAgo: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - monthsAgo);
  return d.toISOString().slice(0, 10);
}

/** Monday (ISO week start) of the week containing dateStr, computed in UTC. */
export function mondayOfWeek(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const isoDow = d.getUTCDay() === 0 ? 7 : d.getUTCDay(); // JS: Sun=0..Sat=6 -> ISO: Mon=1..Sun=7
  d.setUTCDate(d.getUTCDate() - (isoDow - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Only fully-elapsed weeks are ever aggregated: a daily row is eligible
 * only if it falls strictly before the Monday of the week containing the
 * raw cutoff date. This guarantees a week is never touched twice — once
 * its days are aggregated and deleted, the cutoff can only move forward,
 * so it's never revisited — which is what makes the upsert-then-delete
 * below safe to re-run (no additive-merge logic needed, no risk of a
 * later run overwriting an earlier partial aggregate with incomplete data).
 * Trade-off: up to ~6 extra days of daily data can be retained beyond the
 * nominal 6-month/3-month cutoff (whichever week is currently straddling
 * it) — not specified either way in ARCHITECTURE.md, resolved here in
 * favor of correctness/idempotency over exact cutoff precision.
 */
function eligibleBoundary(monthsAgo: number): string {
  return mondayOfWeek(monthsAgoDate(monthsAgo));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAllBefore(supabase: any, table: string, siteId: string, boundary: string, columns: string) {
  const rows: Record<string, unknown>[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .eq("site_id", siteId)
      .lt("date", boundary)
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }
  return rows;
}

interface KpmDailyRow {
  keyword_id: string;
  page_id: string;
  date: string;
  position: number | null;
  impressions: number;
  clicks: number;
}

/**
 * avg_position is impression-weighted (a keyword ranked #3 on a 1,000-
 * impression day should weight toward #3, not average flatly with a #50
 * position from a 1-impression day). avg_ctr is computed from the week's
 * summed clicks/impressions, not an average of daily CTRs — averaging
 * ratios directly is a well-known statistical trap (a 1-impression/1-click
 * day would contribute a misleading 100% CTR at equal weight to a 500-
 * impression day). Neither formula is specified in ARCHITECTURE.md; both
 * are the standard, defensible choice for this kind of rollup.
 */
export function aggregateKeywordPageMetricsWeekly(rows: KpmDailyRow[], siteId: string) {
  const buckets = new Map<
    string,
    {
      keyword_id: string;
      page_id: string;
      week_start: string;
      impressions: number;
      clicks: number;
      positionWeighted: number;
      impressionsWithPosition: number;
    }
  >();

  for (const row of rows) {
    const week_start = mondayOfWeek(row.date);
    const key = `${row.keyword_id}|${row.page_id}|${week_start}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        keyword_id: row.keyword_id,
        page_id: row.page_id,
        week_start,
        impressions: 0,
        clicks: 0,
        positionWeighted: 0,
        impressionsWithPosition: 0,
      };
      buckets.set(key, bucket);
    }
    bucket.impressions += row.impressions;
    bucket.clicks += row.clicks;
    if (row.position !== null) {
      bucket.positionWeighted += row.position * row.impressions;
      bucket.impressionsWithPosition += row.impressions;
    }
  }

  return Array.from(buckets.values()).map((b) => ({
    site_id: siteId,
    keyword_id: b.keyword_id,
    page_id: b.page_id,
    week_start: b.week_start,
    avg_position: b.impressionsWithPosition > 0 ? b.positionWeighted / b.impressionsWithPosition : null,
    total_impressions: b.impressions,
    total_clicks: b.clicks,
    avg_ctr: b.impressions > 0 ? b.clicks / b.impressions : null,
  }));
}

interface PmDailyRow {
  page_id: string;
  date: string;
  sessions: number;
  engaged_sessions: number;
  bounce_rate: number | null;
  avg_engagement_time: number | null;
  conversions: number;
  conversion_value: number;
}

/**
 * avg_sessions/avg_engaged_sessions are per-day averages across however
 * many daily rows actually exist for that (page, week) — divided by the
 * real row count, not a hardcoded 7, so gaps (a day a sync job failed)
 * don't skew the average downward. avg_bounce_rate/avg_engagement_time are
 * session-weighted for the same "don't average ratios flatly" reason as
 * avg_ctr above. total_conversions/total_conversion_value are plain sums.
 */
export function aggregatePageMetricsWeekly(rows: PmDailyRow[], siteId: string) {
  const buckets = new Map<
    string,
    {
      page_id: string;
      week_start: string;
      dayCount: number;
      sessions: number;
      engagedSessions: number;
      bounceWeighted: number;
      sessionsForBounce: number;
      engagementWeighted: number;
      sessionsForEngagement: number;
      conversions: number;
      conversionValue: number;
    }
  >();

  for (const row of rows) {
    const week_start = mondayOfWeek(row.date);
    const key = `${row.page_id}|${week_start}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        page_id: row.page_id,
        week_start,
        dayCount: 0,
        sessions: 0,
        engagedSessions: 0,
        bounceWeighted: 0,
        sessionsForBounce: 0,
        engagementWeighted: 0,
        sessionsForEngagement: 0,
        conversions: 0,
        conversionValue: 0,
      };
      buckets.set(key, bucket);
    }
    bucket.dayCount += 1;
    bucket.sessions += row.sessions;
    bucket.engagedSessions += row.engaged_sessions;
    if (row.bounce_rate !== null) {
      bucket.bounceWeighted += row.bounce_rate * row.sessions;
      bucket.sessionsForBounce += row.sessions;
    }
    if (row.avg_engagement_time !== null) {
      bucket.engagementWeighted += row.avg_engagement_time * row.sessions;
      bucket.sessionsForEngagement += row.sessions;
    }
    bucket.conversions += row.conversions;
    bucket.conversionValue += row.conversion_value;
  }

  return Array.from(buckets.values()).map((b) => ({
    site_id: siteId,
    page_id: b.page_id,
    week_start: b.week_start,
    avg_sessions: b.sessions / b.dayCount,
    avg_engaged_sessions: b.engagedSessions / b.dayCount,
    avg_bounce_rate: b.sessionsForBounce > 0 ? b.bounceWeighted / b.sessionsForBounce : null,
    avg_engagement_time: b.sessionsForEngagement > 0 ? b.engagementWeighted / b.sessionsForEngagement : null,
    total_conversions: b.conversions,
    total_conversion_value: b.conversionValue,
  }));
}

interface TableRetentionResult {
  rowsAggregated: number;
  weeksWritten: number;
  rowsDeleted: number;
}

export interface RetentionRunResult {
  dryRun: boolean;
  keywordPageMetrics: TableRetentionResult;
  pageMetrics: TableRetentionResult;
  syncLog: { rowsDeleted: number };
}

/**
 * Runs the weekly retention/archival job: aggregate + delete daily rows
 * older than 6 months from keyword_page_metrics/page_metrics, delete
 * sync_log rows older than 3 months.
 *
 * Dry-run mode (dryRun: true) computes and returns the exact same result
 * shape without writing or deleting anything — mandatory for the first
 * real (non-synthetic) pass per this milestone's risk note, since the
 * daily-row deletes are not trivially reversible. Deliberately does NOT
 * write a sync_log row for a dry run: a dry run isn't a real operational
 * event, and logging one as "completed" would make Milestone 7's
 * stale_datasets view (last successful sync vs. schedule) falsely believe
 * retention had actually run.
 */
export async function runRetention(siteId: string, options?: { dryRun?: boolean }): Promise<RetentionRunResult> {
  const dryRun = options?.dryRun ?? false;
  const supabase = createSupabaseServiceRoleClient();

  const runId = dryRun ? null : await startSyncRun(siteId, "retention");

  try {
    const kpmBoundary = eligibleBoundary(DAILY_RETENTION_MONTHS);
    const kpmRows = (await fetchAllBefore(
      supabase,
      "keyword_page_metrics",
      siteId,
      kpmBoundary,
      "keyword_id, page_id, date, position, impressions, clicks",
    )) as unknown as KpmDailyRow[];
    const kpmWeekly = aggregateKeywordPageMetricsWeekly(kpmRows, siteId);

    const pmBoundary = eligibleBoundary(DAILY_RETENTION_MONTHS);
    const pmRows = (await fetchAllBefore(
      supabase,
      "page_metrics",
      siteId,
      pmBoundary,
      "page_id, date, sessions, engaged_sessions, bounce_rate, avg_engagement_time, conversions, conversion_value",
    )) as unknown as PmDailyRow[];
    const pmWeekly = aggregatePageMetricsWeekly(pmRows, siteId);

    const syncLogBoundary = monthsAgoDate(SYNC_LOG_RETENTION_MONTHS);
    let syncLogRowsDeleted = 0;
    if (dryRun) {
      const { count, error } = await supabase
        .from("sync_log")
        .select("id", { count: "exact", head: true })
        .eq("site_id", siteId)
        .lt("started_at", syncLogBoundary);
      if (error) throw new Error(`Failed to count sync_log rows: ${error.message}`);
      syncLogRowsDeleted = count ?? 0;
    }

    if (!dryRun) {
      if (kpmWeekly.length > 0) {
        const { error } = await supabase
          .from("keyword_page_metrics_weekly")
          .upsert(kpmWeekly, { onConflict: "keyword_id,page_id,week_start" });
        if (error) throw new Error(`Failed to upsert keyword_page_metrics_weekly: ${error.message}`);

        const { error: deleteError } = await supabase
          .from("keyword_page_metrics")
          .delete()
          .eq("site_id", siteId)
          .lt("date", kpmBoundary);
        if (deleteError) throw new Error(`Failed to delete aggregated keyword_page_metrics: ${deleteError.message}`);
      }

      if (pmWeekly.length > 0) {
        const { error } = await supabase
          .from("page_metrics_weekly")
          .upsert(pmWeekly, { onConflict: "page_id,week_start" });
        if (error) throw new Error(`Failed to upsert page_metrics_weekly: ${error.message}`);

        const { error: deleteError } = await supabase
          .from("page_metrics")
          .delete()
          .eq("site_id", siteId)
          .lt("date", pmBoundary);
        if (deleteError) throw new Error(`Failed to delete aggregated page_metrics: ${deleteError.message}`);
      }

      const { error: syncLogDeleteError, count } = await supabase
        .from("sync_log")
        .delete({ count: "exact" })
        .eq("site_id", siteId)
        .lt("started_at", syncLogBoundary);
      if (syncLogDeleteError) throw new Error(`Failed to delete old sync_log rows: ${syncLogDeleteError.message}`);
      syncLogRowsDeleted = count ?? 0;
    }

    const result: RetentionRunResult = {
      dryRun,
      keywordPageMetrics: { rowsAggregated: kpmRows.length, weeksWritten: kpmWeekly.length, rowsDeleted: dryRun ? 0 : kpmRows.length },
      pageMetrics: { rowsAggregated: pmRows.length, weeksWritten: pmWeekly.length, rowsDeleted: dryRun ? 0 : pmRows.length },
      syncLog: { rowsDeleted: syncLogRowsDeleted },
    };

    if (runId !== null) {
      await completeSyncRun(runId, {
        status: "completed",
        recordsProcessed: kpmRows.length + pmRows.length,
      });
    }

    logger.info("retention_run_completed", { siteId, ...result });
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (runId !== null) {
      try {
        await completeSyncRun(runId, { status: "failed", errorMessage });
      } catch {
        // sync_log itself unreachable -- same designed catch-all as every
        // other job (Milestone 7's stale-run detection covers this).
      }
    }
    logger.error("retention_run_failed", { siteId, dryRun, error: errorMessage });
    throw err;
  }
}
