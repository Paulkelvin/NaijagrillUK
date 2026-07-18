// Shared type contracts for the SEO Intelligence Platform. No runtime logic —
// see ENGINEERING_STANDARDS.md and PHASE_1_IMPLEMENTATION.md for the modules
// that implement behaviour against these types.

/** Matches sync_log.source. Free-text column in the DB; this union is the
 *  application-level contract for the values we actually write. */
export type SyncSource =
  | "gsc"
  | "ga4"
  | "dataforseo"
  | "cms"
  | "crawler"
  | "ping"
  | "retention";

/** Matches sync_log.status. */
export type SyncStatus = "started" | "completed" | "failed" | "partial";

/** Shape of sync_log.metadata (JSONB) — see ENGINEERING_STANDARDS.md §9. */
export interface SyncMetadata {
  retry_count: number;
  rejected_rows: number;
  warnings: string[];
  backfill: boolean;
}

export interface CompleteSyncRunInput {
  status: Exclude<SyncStatus, "started">;
  recordsProcessed?: number;
  apiCreditsUsed?: number;
  errorMessage?: string;
  metadata?: Partial<SyncMetadata>;
}
