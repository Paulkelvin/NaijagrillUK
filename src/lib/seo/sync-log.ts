import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { logger } from "./logger";
import type { CompleteSyncRunInput, SyncMetadata, SyncSource } from "./types";

// The only module permitted to write to sync_log (ENGINEERING_STANDARDS.md
// §9). Callers wrap their job body in try/catch and call startSyncRun /
// completeSyncRun per the pattern in ENGINEERING_STANDARDS.md §3:
//
//   const runId = await startSyncRun(siteId, "gsc", "searchanalytics.query");
//   try {
//     const result = await doSync();
//     await completeSyncRun(runId, { status: "completed", recordsProcessed: result.count });
//   } catch (err) {
//     await completeSyncRun(runId, { status: "failed", errorMessage: toErrorMessage(err) });
//     throw err;
//   }

const DEFAULT_METADATA: SyncMetadata = {
  retry_count: 0,
  rejected_rows: 0,
  warnings: [],
  backfill: false,
};

/**
 * Inserts a sync_log row with status "started" and returns its id.
 *
 * sync_log.id is a BIGINT (GENERATED ALWAYS AS IDENTITY); supabase-js
 * returns it as a JS number. That's safe at this project's realistic scale
 * (a handful of sync runs per day per source) — nowhere near
 * Number.MAX_SAFE_INTEGER — so no string conversion is done here.
 */
export async function startSyncRun(
  siteId: string,
  source: SyncSource,
  endpoint?: string,
): Promise<number> {
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("sync_log")
    .insert({ site_id: siteId, source, endpoint: endpoint ?? null, status: "started" })
    .select("id")
    .single();

  if (error || !data) {
    const message = error?.message ?? "insert returned no row";
    logger.error("sync_run_start_failed", { siteId, source, endpoint, error: message });
    throw new Error(`Failed to start sync run (source=${source}): ${message}`);
  }

  logger.info("sync_run_started", { siteId, source, endpoint, runId: data.id });
  return data.id as number;
}

/**
 * Updates a sync_log row to a terminal status (completed/failed/partial).
 *
 * completed_at is deliberately NOT set here — a database trigger
 * (seo_set_sync_log_completed_at, added in
 * 20260719000000_sync_log_server_side_completed_at.sql) forces it to the
 * database's own now() whenever status moves away from "started". Sending
 * a client-computed timestamp here previously caused
 * sync_log_completed_after_started_check to fail under real app/DB clock
 * skew (found during this milestone's integration testing) — started_at
 * and completed_at must always be compared using the same clock, which is
 * only guaranteed if the same process (Postgres) sets both.
 */
export async function completeSyncRun(runId: number, input: CompleteSyncRunInput): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();

  const metadata: SyncMetadata = { ...DEFAULT_METADATA, ...input.metadata };

  const { error } = await supabase
    .from("sync_log")
    .update({
      status: input.status,
      records_processed: input.recordsProcessed ?? 0,
      api_credits_used: input.apiCreditsUsed ?? 0,
      error_message: input.errorMessage ?? null,
      metadata,
    })
    .eq("id", runId);

  if (error) {
    logger.error("sync_run_complete_failed", { runId, status: input.status, error: error.message });
    throw new Error(`Failed to complete sync run ${runId}: ${error.message}`);
  }

  logger.info("sync_run_completed", {
    runId,
    status: input.status,
    recordsProcessed: input.recordsProcessed,
  });
}
