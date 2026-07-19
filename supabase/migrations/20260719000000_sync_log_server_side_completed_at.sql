-- ============================================================================
-- sync_log: compute completed_at server-side, not application-side
--
-- Found during Milestone 3 (docs/seo-platform/PHASE_1_IMPLEMENTATION.md):
-- completeSyncRun() previously sent a client-computed `completed_at`
-- (new Date().toISOString()), compared by sync_log_completed_after_started_check
-- against `started_at`, which the DATABASE computes independently via
-- DEFAULT now() at insert time. Reproduced against production with ~150ms
-- of real elapsed time between the two network round-trips — the
-- constraint still failed, meaning the app process's clock and the
-- Postgres host's clock disagreed by more than that gap. In a real
-- deployment (Vercel app, Supabase DB — always different machines) this
-- could intermittently misreport a successful sync as a crash.
--
-- Fix: a BEFORE UPDATE trigger sets completed_at = now() server-side
-- whenever status transitions away from 'started', overriding whatever the
-- application sends. Both started_at (set at INSERT) and completed_at (set
-- here, at UPDATE) are now always computed by the same clock — the clock-
-- skew race is eliminated, not just narrowed. Mirrors the existing
-- seo_set_updated_at() trigger pattern already used elsewhere in this
-- schema (20260718000000_seo_platform_core.sql).
--
-- Idempotent: CREATE OR REPLACE FUNCTION and DROP TRIGGER IF EXISTS +
-- CREATE TRIGGER are both safe to re-run.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seo_set_sync_log_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> 'started' THEN
    -- Always the database's own clock — never trust a client-supplied value.
    NEW.completed_at := now();
  ELSE
    -- Defensive: if a row is ever updated while still 'started' (not part
    -- of the normal startSyncRun -> completeSyncRun lifecycle), keep the
    -- sync_log_status_completed_at_consistency_check invariant intact
    -- rather than leaving a stale completed_at from before this trigger existed.
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_log_set_completed_at ON public.sync_log;
CREATE TRIGGER sync_log_set_completed_at
  BEFORE UPDATE ON public.sync_log
  FOR EACH ROW EXECUTE FUNCTION public.seo_set_sync_log_completed_at();

COMMENT ON FUNCTION public.seo_set_sync_log_completed_at() IS
  'Forces sync_log.completed_at to the database''s own now() on any UPDATE that sets status away from ''started'', eliminating app/DB clock-skew races. See migration header.';
