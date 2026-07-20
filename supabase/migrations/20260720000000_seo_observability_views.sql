-- Milestone 7: Observability Layer (PHASE_1_IMPLEMENTATION.md, ENGINEERING_STANDARDS.md §9).
-- Three read-only views over sync_log/site_configs answering the 8
-- observability questions from ENGINEERING_STANDARDS.md §9, surfaced
-- through the authenticated /api/seo/status endpoint. No new tables.
--
-- Security note (WITH (security_invoker = true)): by default, a Postgres
-- view runs with the privileges of its OWNER (the migration-applying role,
-- effectively a superuser in Supabase), not the querying role — meaning an
-- anon/authenticated client could read through a plain view even though
-- sync_log/pages/site_configs have RLS enabled with zero anon/authenticated
-- policies (Milestone 1's default-deny design). security_invoker (Postgres
-- 15+; both this project's local PG16 and production PG17 support it)
-- makes the view evaluate using the QUERYING role's own privileges, so the
-- underlying tables' RLS applies exactly as if queried directly — anon
-- still gets 0 rows, matching every other SEO table. This is the correct
-- mechanism for views; no separate "RLS on the view" concept exists.

CREATE OR REPLACE VIEW public.sync_status_summary
WITH (security_invoker = true) AS
SELECT DISTINCT ON (site_id, source)
  site_id,
  source,
  status,
  started_at,
  completed_at,
  CASE WHEN completed_at IS NOT NULL THEN completed_at - started_at ELSE NULL END AS duration,
  records_processed,
  api_credits_used,
  metadata
FROM public.sync_log
ORDER BY site_id, source, started_at DESC;

COMMENT ON VIEW public.sync_status_summary IS
  'Most recent sync_log row per (site_id, source), any status. Answers "when did each source last sync / how long did it take / how many rows" (ENGINEERING_STANDARDS.md §9).';

-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.stale_datasets
WITH (security_invoker = true) AS
WITH last_success AS (
  SELECT DISTINCT ON (site_id, source)
    site_id,
    source,
    completed_at AS last_success_at
  FROM public.sync_log
  WHERE status = 'completed'
  ORDER BY site_id, source, completed_at DESC
),
-- A run stuck in 'started' past Vercel's confirmed Hobby ceiling (300s,
-- Milestone 4) plus margin is definitely abnormal — every Phase 1 job is
-- designed to fit that ceiling, so this threshold needs no per-source
-- "expected duration" config (which doesn't exist anywhere as data; only
-- as prose in ARCHITECTURE.md's roadmap table). Directly implements the
-- crashed-job mitigation from ENGINEERING_STANDARDS.md §12: "a 'started'
-- row older than [threshold] is a failure signal".
stuck_runs AS (
  SELECT site_id, source, MIN(started_at) AS stuck_since
  FROM public.sync_log
  WHERE status = 'started' AND started_at < now() - INTERVAL '10 minutes'
  GROUP BY site_id, source
),
-- site_configs.refresh_schedules is a flat {source: "daily"|"weekly"|"monthly"}
-- map; jsonb_each unpacks it to one row per configured source.
schedule AS (
  SELECT
    sc.site_id,
    kv.key AS source,
    kv.value #>> '{}' AS refresh_interval
  FROM public.site_configs sc,
       LATERAL jsonb_each(sc.refresh_schedules) AS kv(key, value)
)
SELECT
  schedule.site_id,
  schedule.source,
  schedule.refresh_interval,
  last_success.last_success_at,
  stuck_runs.stuck_since,
  (
    last_success.last_success_at IS NULL
    OR now() - last_success.last_success_at > CASE schedule.refresh_interval
         WHEN 'daily' THEN INTERVAL '2 days'
         WHEN 'weekly' THEN INTERVAL '14 days'
         WHEN 'monthly' THEN INTERVAL '62 days'
         ELSE INTERVAL '9999 days' -- unrecognized interval string: never auto-flag on a value we can't interpret
       END
    OR stuck_runs.stuck_since IS NOT NULL
  ) AS is_stale
FROM schedule
LEFT JOIN last_success ON last_success.site_id = schedule.site_id AND last_success.source = schedule.source
LEFT JOIN stuck_runs ON stuck_runs.site_id = schedule.site_id AND stuck_runs.source = schedule.source;

COMMENT ON VIEW public.stale_datasets IS
  'Per-source staleness: last successful sync vs. site_configs.refresh_schedules interval (2x grace period against normal cron timing jitter), plus any run stuck in ''started'' past 10 minutes (crashed-job signal, ENGINEERING_STANDARDS.md §12). is_stale=true means "needs attention".

  Known gap, not a Phase 1 blocker: site_configs.refresh_schedules has two DataForSEO keys (dataforseo_volume, dataforseo_serp) that do not correspond 1:1 to any sync_log.source value (sync_log only has a single ''dataforseo'' source). Those two rows will always show is_stale=true with last_success_at NULL until Phase 2''s DataForSEO sync jobs exist and this mismatch is reconciled — truthful (nothing has synced), not incorrect, and DataForSEO is an explicit Phase 1 non-goal.';

-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.sync_failures_recent
WITH (security_invoker = true) AS
SELECT
  id,
  site_id,
  source,
  endpoint,
  status,
  error_message,
  started_at,
  completed_at,
  metadata
FROM public.sync_log
WHERE status = 'failed' AND started_at >= now() - INTERVAL '7 days'
ORDER BY started_at DESC;

COMMENT ON VIEW public.sync_failures_recent IS
  'Failed sync_log rows from the last 7 days. Answers "which jobs failed" (ENGINEERING_STANDARDS.md §9).';
