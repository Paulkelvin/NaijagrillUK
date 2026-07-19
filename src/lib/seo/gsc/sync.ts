import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { logger } from "@/lib/seo/logger";
import { normalizeKeyword, normalizeUrl } from "@/lib/seo/normalize";
import { completeSyncRun, startSyncRun } from "@/lib/seo/sync-log";
import { fetchSearchAnalytics, type GscRow } from "./client";

/** GSC data is 2-3 days delayed (ARCHITECTURE.md §4.1) — pull for today-3. */
const GSC_DATA_DELAY_DAYS = 3;

function defaultTargetDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - GSC_DATA_DELAY_DAYS);
  return d.toISOString().slice(0, 10);
}

interface ValidationResult {
  valid: GscRow[];
  rejectedCount: number;
}

/**
 * ARCHITECTURE.md §4.1: reject position < 1 or > 1000, reject clicks >
 * impressions. Rejected rows are skipped, not fatal — one bad row never
 * aborts the whole sync.
 */
function validateRows(rows: GscRow[]): ValidationResult {
  const valid: GscRow[] = [];
  let rejectedCount = 0;
  for (const row of rows) {
    if (row.position < 1 || row.position > 1000) {
      rejectedCount += 1;
      continue;
    }
    if (row.clicks > row.impressions) {
      rejectedCount += 1;
      continue;
    }
    valid.push(row);
  }
  return { valid, rejectedCount };
}

export interface SyncGscResult {
  runId: number;
  recordsProcessed: number;
  rejectedCount: number;
}

/**
 * Orchestrates one day's GSC sync: fetch -> normalize -> validate -> bulk
 * upsert keywords/pages/keyword_page_metrics -> startSyncRun/completeSyncRun.
 *
 * Keywords and pages are upserted in two bulk calls (not one row at a time)
 * — confirmed empirically against production that PostgREST's upsert only
 * touches columns present in the payload, so this never resets is_target,
 * search_volume, or other DataForSEO/manual-tagging fields on a re-sync.
 *
 * isBackfill flags the sync_log row's metadata so Milestone 7's
 * observability layer can distinguish a Milestone 5b backfill run from a
 * normal daily sync (same source="gsc", different metadata.backfill).
 */
export async function syncGsc(
  siteId: string,
  date?: string,
  options?: { isBackfill?: boolean },
): Promise<SyncGscResult> {
  const targetDate = date ?? defaultTargetDate();
  const runId = await startSyncRun(siteId, "gsc", "searchanalytics.query");

  try {
    const { rows } = await fetchSearchAnalytics(targetDate);
    const { valid, rejectedCount } = validateRows(rows);

    const supabase = createSupabaseServiceRoleClient();

    const uniqueKeywords = new Map<string, string>(); // normalized -> original
    const uniquePages = new Map<string, string>(); // path -> normalized url
    for (const row of valid) {
      const normalizedKeyword = normalizeKeyword(row.query);
      if (!uniqueKeywords.has(normalizedKeyword)) uniqueKeywords.set(normalizedKeyword, row.query);
      const { url, path } = normalizeUrl(row.page);
      if (!uniquePages.has(path)) uniquePages.set(path, url);
    }

    const keywordIdByNormalized = new Map<string, string>();
    if (uniqueKeywords.size > 0) {
      const payload = Array.from(uniqueKeywords.entries()).map(([keyword_normalized, keyword]) => ({
        site_id: siteId,
        keyword,
        keyword_normalized,
        data_source: "gsc",
      }));
      const { data, error } = await supabase
        .from("keywords")
        .upsert(payload, { onConflict: "site_id,keyword_normalized" })
        .select("id, keyword_normalized");
      if (error) throw new Error(`Failed to upsert keywords: ${error.message}`);
      for (const row of data ?? []) keywordIdByNormalized.set(row.keyword_normalized, row.id);
    }

    const pageIdByPath = new Map<string, string>();
    if (uniquePages.size > 0) {
      const payload = Array.from(uniquePages.entries()).map(([path, url]) => ({ site_id: siteId, url, path }));
      const { data, error } = await supabase
        .from("pages")
        .upsert(payload, { onConflict: "site_id,path" })
        .select("id, path");
      if (error) throw new Error(`Failed to upsert pages: ${error.message}`);
      for (const row of data ?? []) pageIdByPath.set(row.path, row.id);
    }

    const metricRows = valid.map((row) => {
      const normalizedKeyword = normalizeKeyword(row.query);
      const { path } = normalizeUrl(row.page);
      return {
        site_id: siteId,
        keyword_id: keywordIdByNormalized.get(normalizedKeyword),
        page_id: pageIdByPath.get(path),
        date: targetDate,
        position: row.position,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr,
      };
    });

    if (metricRows.length > 0) {
      const { error } = await supabase
        .from("keyword_page_metrics")
        .upsert(metricRows, { onConflict: "keyword_id,page_id,date" });
      if (error) throw new Error(`Failed to upsert keyword_page_metrics: ${error.message}`);
    }

    await completeSyncRun(runId, {
      status: "completed",
      recordsProcessed: metricRows.length,
      metadata: {
        rejected_rows: rejectedCount,
        warnings: rejectedCount > 0 ? [`${rejectedCount} row(s) rejected by validation`] : [],
        backfill: options?.isBackfill ?? false,
      },
    });

    logger.info("gsc_sync_completed", {
      siteId,
      date: targetDate,
      recordsProcessed: metricRows.length,
      rejectedCount,
    });

    return { runId, recordsProcessed: metricRows.length, rejectedCount };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    try {
      await completeSyncRun(runId, { status: "failed", errorMessage });
    } catch {
      // sync_log itself unreachable -- Milestone 7's stale-run detection
      // is the designed catch-all for this, same pattern as every other
      // job (e.g. src/app/api/seo/sync/ping/route.ts).
    }
    logger.error("gsc_sync_failed", { siteId, date: targetDate, error: errorMessage });
    throw err;
  }
}
