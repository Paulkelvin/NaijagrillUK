-- ============================================================================
-- Harden trigger functions against search_path injection
--
-- Flagged by Supabase's own security advisor (function_search_path_mutable,
-- WARN) after applying 20260719000000_sync_log_server_side_completed_at.sql:
-- neither seo_set_updated_at() (Milestone 1) nor
-- seo_set_sync_log_completed_at() (Milestone 3) pinned search_path,
-- leaving them resolvable against a caller-influenced search_path — a
-- standard Postgres hardening, unrelated to the clock-skew fix in the
-- previous migration.
--
-- Both functions only call now() (always resolved via the implicit
-- pg_catalog search, unaffected by search_path) and read/write NEW/OLD
-- record fields (unaffected by search_path entirely) — pinning
-- search_path to '' is a pure hardening with zero behavioral change,
-- confirmed by re-running the full Milestone 1 + Milestone 3 verification
-- suites after applying this.
--
-- Idempotent: ALTER FUNCTION ... SET is safe to re-run (sets the same
-- value again, no error).
-- ============================================================================

ALTER FUNCTION public.seo_set_updated_at() SET search_path = '';
ALTER FUNCTION public.seo_set_sync_log_completed_at() SET search_path = '';
