import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { logger } from "@/lib/seo/logger";
import { normalizePath } from "@/lib/seo/normalize";
import { completeSyncRun, startSyncRun } from "@/lib/seo/sync-log";
import { fetchConversionBreakdown, fetchPageMetrics, type Ga4PageMetricRow } from "./client";

/**
 * ARCHITECTURE.md line ~1604: "GSC and GA4 data becomes available on a
 * predictable schedule (daily, with a 2-3 day delay)" — GA4 is explicitly
 * grouped with GSC's own 2-3 day delay note (§4.1), so this pulls for the
 * same today-3 target date as gsc/sync.ts.
 */
const GA4_DATA_DELAY_DAYS = 3;

function defaultTargetDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - GA4_DATA_DELAY_DAYS);
  return d.toISOString().slice(0, 10);
}

// ARCHITECTURE.md §4.2 validation: "Reject rows where pagePath is empty or
// matches excluded patterns (/studio, /api/)".
const EXCLUDED_PATH_PATTERNS = [/^\/studio(\/|$)/, /^\/api\//];

interface ValidationResult {
  valid: Ga4PageMetricRow[];
  rejectedCount: number;
}

function validateRows(rows: Ga4PageMetricRow[]): ValidationResult {
  const valid: Ga4PageMetricRow[] = [];
  let rejectedCount = 0;
  for (const row of rows) {
    if (!row.pagePath || row.pagePath.trim() === "") {
      rejectedCount += 1;
      continue;
    }
    if (EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(row.pagePath))) {
      rejectedCount += 1;
      continue;
    }
    valid.push(row);
  }
  return { valid, rejectedCount };
}

interface ConversionEventConfig {
  name: string;
  value: number;
}

/**
 * site_configs.conversion_events is a JSONB array with only a CHECK that it
 * IS an array (schema-level, not shape-level) — this defensively filters out
 * any malformed entry rather than letting one bad row abort the whole sync.
 */
function parseConversionEvents(raw: unknown): ConversionEventConfig[] {
  if (!Array.isArray(raw)) return [];
  const parsed: ConversionEventConfig[] = [];
  for (const entry of raw) {
    if (
      entry !== null &&
      typeof entry === "object" &&
      "name" in entry &&
      "value" in entry &&
      typeof (entry as { name: unknown }).name === "string" &&
      (entry as { name: string }).name.length > 0 &&
      typeof (entry as { value: unknown }).value === "number" &&
      Number.isFinite((entry as { value: number }).value)
    ) {
      parsed.push({ name: (entry as { name: string }).name, value: (entry as { value: number }).value });
    }
  }
  return parsed;
}

export interface SyncGa4Result {
  runId: number;
  recordsProcessed: number;
  rejectedCount: number;
  newPageCount: number;
}

/**
 * Orchestrates one day's GA4 sync: fetch page metrics -> validate -> fetch
 * conversion breakdown (if any events configured) -> upsert pages/page_metrics
 * -> startSyncRun/completeSyncRun.
 *
 * conversion_value = GA4's own purchaseRevenue (0 for non-ecommerce sites,
 * per ARCHITECTURE.md §4.2) + sum(eventCount * configured value) across the
 * breakdown report — this is the platform's stated competitive advantage
 * (ARCHITECTURE.md line ~1022): business-configured conversion values joined
 * against GA4's raw event counts, something no third-party tool can compute.
 *
 * "create if new" (ARCHITECTURE.md §4.2 step 1) is satisfied via upsert —
 * page_metrics.page_id is NOT NULL, so a pages row must exist regardless.
 * Newly-created pages are additionally counted and surfaced as a
 * metadata.warnings entry (Milestone 6 task: "potential crawler miss") —
 * both directives are satisfied by the same upsert, not in tension.
 */
export async function syncGa4(
  siteId: string,
  date?: string,
  options?: { isBackfill?: boolean },
): Promise<SyncGa4Result> {
  const targetDate = date ?? defaultTargetDate();
  const runId = await startSyncRun(siteId, "ga4", "runReport");

  try {
    const { rows } = await fetchPageMetrics(targetDate);
    const { valid, rejectedCount } = validateRows(rows);

    if (valid.length === 0) {
      await completeSyncRun(runId, {
        status: "completed",
        recordsProcessed: 0,
        metadata: {
          rejected_rows: rejectedCount,
          warnings: rejectedCount > 0 ? [`${rejectedCount} row(s) rejected by validation`] : [],
          backfill: options?.isBackfill ?? false,
        },
      });
      logger.info("ga4_sync_completed", { siteId, date: targetDate, recordsProcessed: 0, rejectedCount });
      return { runId, recordsProcessed: 0, rejectedCount, newPageCount: 0 };
    }

    const supabase = createSupabaseServiceRoleClient();

    const { data: siteRow, error: siteError } = await supabase
      .from("sites")
      .select("domain")
      .eq("id", siteId)
      .single();
    if (siteError || !siteRow) {
      throw new Error(`Failed to resolve site domain: ${siteError?.message ?? "site not found"}`);
    }
    const domain = (siteRow.domain as string).toLowerCase().replace(/^www\./, "");

    const { data: configRow, error: configError } = await supabase
      .from("site_configs")
      .select("conversion_events")
      .eq("site_id", siteId)
      .single();
    if (configError) throw new Error(`Failed to load site_configs: ${configError.message}`);
    const conversionEvents = parseConversionEvents(configRow?.conversion_events);
    const eventNames = conversionEvents.map((e) => e.name);
    const valueByEvent = new Map(conversionEvents.map((e) => [e.name, e.value]));

    const { rows: breakdownRows } = await fetchConversionBreakdown(targetDate, eventNames);
    const breakdownByPath = new Map<string, Record<string, number>>();
    for (const row of breakdownRows) {
      const path = normalizePath(row.pagePath);
      const existing = breakdownByPath.get(path) ?? {};
      existing[row.eventName] = (existing[row.eventName] ?? 0) + row.eventCount;
      breakdownByPath.set(path, existing);
    }

    const uniquePaths = new Set<string>();
    for (const row of valid) uniquePaths.add(normalizePath(row.pagePath));
    for (const path of breakdownByPath.keys()) uniquePaths.add(path);

    const pageIdByPath = new Map<string, string>();
    let newPageCount = 0;

    if (uniquePaths.size > 0) {
      const paths = Array.from(uniquePaths);
      const { data: existingPages, error: existingError } = await supabase
        .from("pages")
        .select("path")
        .eq("site_id", siteId)
        .in("path", paths);
      if (existingError) throw new Error(`Failed to check existing pages: ${existingError.message}`);
      const existingPathSet = new Set((existingPages ?? []).map((row: { path: string }) => row.path));
      newPageCount = paths.filter((p) => !existingPathSet.has(p)).length;

      const payload = paths.map((path) => ({ site_id: siteId, url: `https://${domain}${path}`, path }));
      const { data, error } = await supabase
        .from("pages")
        .upsert(payload, { onConflict: "site_id,path" })
        .select("id, path");
      if (error) throw new Error(`Failed to upsert pages: ${error.message}`);
      for (const row of data ?? []) pageIdByPath.set(row.path, row.id);
    }

    const metricRows = valid.map((row) => {
      const path = normalizePath(row.pagePath);
      const breakdown = breakdownByPath.get(path) ?? {};
      const customValue = Object.entries(breakdown).reduce(
        (sum, [eventName, count]) => sum + count * (valueByEvent.get(eventName) ?? 0),
        0,
      );
      return {
        site_id: siteId,
        page_id: pageIdByPath.get(path),
        date: targetDate,
        sessions: row.sessions,
        engaged_sessions: row.engagedSessions,
        bounce_rate: row.bounceRate,
        avg_engagement_time: row.avgSessionDuration,
        conversions: row.conversions,
        conversion_value: row.purchaseRevenue + customValue,
        conversion_breakdown: breakdown,
      };
    });

    if (metricRows.length > 0) {
      const { error } = await supabase
        .from("page_metrics")
        .upsert(metricRows, { onConflict: "page_id,date" });
      if (error) throw new Error(`Failed to upsert page_metrics: ${error.message}`);
    }

    await completeSyncRun(runId, {
      status: "completed",
      recordsProcessed: metricRows.length,
      metadata: {
        rejected_rows: rejectedCount,
        warnings: [
          ...(rejectedCount > 0 ? [`${rejectedCount} row(s) rejected by validation`] : []),
          ...(newPageCount > 0
            ? [`${newPageCount} page(s) newly created from GA4 data not previously known to the pages table (potential crawler miss)`]
            : []),
        ],
        backfill: options?.isBackfill ?? false,
      },
    });

    logger.info("ga4_sync_completed", {
      siteId,
      date: targetDate,
      recordsProcessed: metricRows.length,
      rejectedCount,
      newPageCount,
    });

    return { runId, recordsProcessed: metricRows.length, rejectedCount, newPageCount };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    try {
      await completeSyncRun(runId, { status: "failed", errorMessage });
    } catch {
      // sync_log itself unreachable -- same designed catch-all as every
      // other job (Milestone 7's stale-run detection covers this).
    }
    logger.error("ga4_sync_failed", { siteId, date: targetDate, error: errorMessage });
    throw err;
  }
}
