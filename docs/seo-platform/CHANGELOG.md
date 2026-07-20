# SEO Intelligence Platform — Changelog

All notable changes to the platform architecture and implementation.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

---

## [Unreleased]

### Added
- **Phase 2 Milestone 3 (Content Decay Score) code-complete.**
  `src/lib/seo/intelligence/content-decay.ts` — linear regression slope
  and a 30-day rolling average (slid exhaustively across the 90-day
  window, all 61 positions) to find peak vs. current traffic, decay-stage
  bucketing, `recency_factor`, `decay_urgency`. Only flags pages with
  ≥30 avg sessions/month and ≥60 real data rows. Seasonality
  cross-reference against the page's primary keyword's `monthly_volumes`
  resolved as `seasonalityChecked: boolean` with `seasonal` always
  `false` for now — deliberately not guessing at a pattern-matching
  algorithm with no real DataForSEO data yet to validate it against. 16
  new unit tests (220 total), including every decay-stage and
  recency-factor boundary individually verified. Genuinely cannot
  produce real output for months — GA4 only went live today, this
  algorithm needs 60–90 days of history. See
  PHASE_2_IMPLEMENTATION.md Milestone 3
- **Phase 2 Milestone 2 (Cannibalization Detection & Scoring)
  code-complete.** `src/lib/seo/intelligence/cannibalization.ts` —
  detects keywords with impressions from 2+ distinct pages over a
  90-day window, scores each over the last 30 days
  (`position_variance`, `click_split`, `ctr_deficit` using Milestone
  1's CTR model, `traffic_value`), generates a `"canonicalize"` or
  `"merge"` recommendation above a 40-point threshold. Brand-name
  exclusion resolved as `sites.config.brand_terms` — reuses the
  existing "lightweight overrides" column rather than a new migration.
  Deliberately skips ARCHITECTURE.md §5.3's third action case
  ("differentiate" for mismatched intent) since that needs the Intent
  Alignment Check, out of scope for Phase 2. 13 new unit tests (204
  total). Read-only — doesn't write to `actions` yet (Milestone 10's
  job); no route/deploy this milestone since it's not its own
  background job. See PHASE_2_IMPLEMENTATION.md Milestone 2

### Deployed
- **Phase 2 Milestones 0–1 merged to `main` and deployed to production,
  2026-07-20.** Verified via `curl`: `/api/seo/analysis/ctr-model`
  correctly identifies only 5 real clicks exist and skips the rebuild
  rather than overwriting the model with noise. Confirmed all five
  `vercel.json` cron entries registered on Vercel's side (`GSC` daily
  06:00 UTC, `GA4` daily 06:30 UTC, `CTR model` Monday 06:15 UTC,
  `retention` Sunday 03:00 UTC, `ping`) — the pipeline now runs itself
  end to end, no more manual `curl` triggering needed

### Fixed
- **`/api/seo/sync/gsc` and `/api/seo/sync/ga4` were never added to
  `vercel.json`'s cron schedule** — found while adding Phase 2
  Milestone 1's own cron entry. Every real sync that ran today happened
  via manual `curl`, not the automated daily schedule ARCHITECTURE.md
  §7 specifies. Added both (GSC daily 06:00 UTC, GA4 daily 06:30 UTC,
  matching that table exactly) — not deployed yet, same as the rest of
  this session's Phase 2 work

### Added
- **Phase 2 Milestone 1 (Site-Specific CTR Model) code-complete.**
  `src/lib/seo/intelligence/ctr-model.ts` — buckets `keyword_page_metrics`
  by rounded position over a 90-day window, `Σclicks/Σimpressions` per
  bucket with a ≥50-impression floor before trusting real data over the
  industry default, a ≥1,000-total-click gate before touching
  `site_configs.ctr_model` at all. `/api/seo/analysis/ctr-model` route,
  cron entry added (Monday 06:15 UTC, 15 min after GSC's daily sync —
  ARCHITECTURE.md specifies "weekly after GSC sync" without an exact
  time). 15 new unit tests (191 total), all passing. Not yet deployed.
  See PHASE_2_IMPLEMENTATION.md Milestone 1
- **Phase 2 Milestone 0 (Database Schema) — locally validated, not yet
  in production.** New migration
  `20260720120000_seo_phase2_intelligence.sql` — `actions` (the action
  queue), `api_budgets` (DataForSEO spend tracking), `serp_snapshots`
  (weekly SERP data), matching ARCHITECTURE.md §3 with the same
  constraint-hardening discipline Milestone 1 applied (enum CHECKs,
  an `actions` status/`completed_at` consistency check mirroring
  `sync_log`'s own rule, an `api_budgets` period-start-is-1st-of-month
  check mirroring `keyword_page_metrics_weekly`'s week-start check).
  Every constraint, the `serp_snapshots` unique key, and both
  `updated_at` triggers verified against a real local PostgreSQL 16
  instance by deliberately triggering each one; RLS default-deny
  confirmed via `SET ROLE anon`. See PHASE_2_IMPLEMENTATION.md
  Milestone 0
- **`PHASE_2_IMPLEMENTATION.md` — Phase 2 (Intelligence Layer) planning
  document, 13 milestones (0–12) covering the schema additions
  (`actions`, `api_budgets`, `serp_snapshots`), all six Phase 2 scoring
  algorithms (CTR model, cannibalization, content decay, opportunity
  score, page ROI score, conversion-weighted keyword value), DataForSEO
  integration (client, search volume sync, SERP snapshots, budget
  controls), the action-queue analysis engine, and the two admin UI
  surfaces (action queue, site settings) — mirrors
  `PHASE_1_IMPLEMENTATION.md`'s structure and discipline exactly.
  Deliberately resequences ARCHITECTURE.md §5/§6's algorithm order
  (documented as an explicit, reasoned build-order decision, not a
  scope change): the three GSC/GA4-only algorithms (CTR model,
  cannibalization, content decay) ship before DataForSEO integration,
  so real scoring output exists before a second external-credential
  saga is needed; the three DataForSEO-enriched algorithms are built
  null-safe from the start and improve automatically once that data
  lands. Flags one real open question for a stop-and-discuss at
  Milestone 6 (SERP snapshots): its documented 10-minute timeout
  budget exceeds Hobby's confirmed 300s ceiling — needs either
  backfill-style chunking or a Pro-plan decision when that milestone
  starts. Execution not yet begun

### Deployed
- **16-month GSC backfill run, production, 2026-07-20.** `curl` against
  `/api/seo/sync/gsc/backfill` completed the entire 2025-03-20 through
  2026-07-17 range in one invocation (2m54s, no chunking needed against
  real data volume). 484 of 485 days processed successfully; one date
  (`2026-06-17`) failed and was skipped rather than aborting the run
  (by design), retried on its own and failed again — root cause not
  yet diagnosed (needs `sync_log` or Vercel log access this session
  didn't have). Found a real gap while diagnosing: the backfill
  response reports *which* dates failed but not *why* — worth adding
  per-failure error detail in a future pass. See
  PHASE_1_IMPLEMENTATION.md Milestone 5 for full detail
- **Real GSC/GA4 credentials configured and verified in production, 2026-07-20.**
  The Google Cloud service-account setup finally completed after a long
  multi-session troubleshooting thread (Organization Policy Administrator
  role, project-vs-org IAM scoping, two independently-enforced
  service-account-key-creation constraints, a project-level policy
  override re-enforcing one of them, a `serviceusage.services.enable`
  gap for enabling the GA4 Data API). `GSC_CLIENT_EMAIL`,
  `GSC_PRIVATE_KEY`, `GSC_PROPERTY_URL` (`sc-domain:naijagrillandspice.co.uk`),
  `GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY`, `GA4_PROPERTY_ID`, and
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` all added to Vercel; redeployed.
  First real GSC sync: `{"ok":true,"recordsProcessed":25,"rejectedCount":0}`
  — 25 real keyword/page/metric rows. Second consecutive run reproduced
  identically, proving idempotency for real (not just unit-tested) — the
  `UNIQUE(keyword_id, page_id, date)` constraint guarantees an identical
  `recordsProcessed` with no error means the same rows were updated, not
  duplicated. GA4 sync also confirmed working end-to-end
  (`recordsProcessed: 0`, correct — the GA4 property and site tracking
  tag are brand new, so there's no traffic data yet for the 3-day-old
  target date the sync defaults to). See PHASE_1_IMPLEMENTATION.md
  Milestones 5 and 6 for full detail
- **`claude/exciting-johnson-nddaq1` merged into `main` and deployed to
  production** (naijagrillandspice.co.uk) — Milestones 5–8's code (GSC
  sync, GA4 sync, observability endpoint, retention job) is now live
  alongside Milestones 0–4. No Vercel MCP connector was reachable this
  session (toggled on per Paul, never surfaced in this session's tool
  list), so the deploy was verified via direct `curl` against production
  instead: `/api/seo/status`, `/api/seo/sync/gsc`, `/api/seo/sync/ga4`,
  `/api/seo/sync/gsc/backfill`, and `/api/seo/retention/run` all
  correctly return `401` (Basic Auth / `Bearer` auth enforced, exactly as
  designed — none of these are meant to be callable without a credential
  yet); `/admin` still `401`; the homepage still `200`. Diff touched zero
  existing site pages/components — additive only, zero regressions
  observed. **This does not mean the sync jobs are doing anything for
  real** — `GSC_CLIENT_EMAIL`/`GA4_CLIENT_EMAIL` etc. still aren't
  configured, so `isGscConfigured()`/`isGa4Configured()` are `false` and
  those two routes stay inert (`503`) even once authorized; the retention
  cron is live on its weekly schedule but has nothing to aggregate yet
  (no 6-month-old data exists)

### Added
- **Milestone 8 (Retention/Archival Job) code-complete, fully tested, no
  external blocker.** `retention/run.ts` — aggregates
  `keyword_page_metrics`/`page_metrics` rows older than 6 months into
  their `_weekly` tables and deletes the source rows, deletes `sync_log`
  rows older than 3 months; `?dryRun=true` computes the same result
  without writing anything (mandatory before the first real pass, per this
  milestone's own risk note). Only fully-elapsed ISO weeks are ever
  aggregated (`mondayOfWeek(cutoffDate)` boundary) so a week is never
  revisited once deleted — this is what makes the plain-overwrite upsert
  safe to re-run with no additive-merge logic. `avg_position` is
  impression-weighted, `avg_ctr`/`avg_bounce_rate`/`avg_engagement_time`
  are computed from summed/session-weighted totals rather than averaging
  daily ratios directly (a well-known statistical trap) — none of these
  formulas are specified in ARCHITECTURE.md, resolved here and documented
  in code. Dry runs deliberately don't write to `sync_log` (would falsely
  satisfy Milestone 7's staleness check). `/api/seo/retention/run` route;
  weekly Sunday 03:00 UTC cron entry added to `vercel.json`. 24 new unit
  tests (178 total). Additionally verified locally against a real
  PostgreSQL instance: hand-calculated weekly aggregates for two known
  daily rows in a real full week satisfy every CHECK constraint
  (including `week_start_is_monday`), and the boundary-based delete
  removes exactly the aggregated rows. Unlike Milestones 5–7, this
  milestone has no credential dependency and no new migration — not yet
  merged/deployed, same posture as Milestones 5–7 (destructive job,
  warrants an explicit go-ahead)
- **Milestone 7 (Observability Layer) code-complete, migration live in
  production.** New migration
  `20260720000000_seo_observability_views.sql` — `sync_status_summary`
  (most recent run per source), `stale_datasets` (last-success vs.
  `site_configs.refresh_schedules` interval, OR'd with a stuck-`'started'`-
  row crashed-job signal per ENGINEERING_STANDARDS.md §12), and
  `sync_failures_recent` (failed runs, last 7 days) — all three
  `WITH (security_invoker = true)` so RLS applies through the view exactly
  as it does on the underlying tables (empirically confirmed: `anon` sees 0
  rows via `SET ROLE anon` against a real local Postgres instance).
  `src/lib/auth/basic-auth.ts` — Basic Auth check extracted out of
  `src/middleware.ts` so `/admin` and the new `/api/seo/status` endpoint
  share one implementation (ARCHITECTURE.md §7). `src/middleware.ts`'s
  matcher extended to cover `/api/seo/status`; `src/middleware.test.ts`
  added (no test previously existed for `/admin`'s auth either).
  `/api/seo/status` route — assembles all three views plus summed
  retry/warning counts over a 7-day window. 24 new unit tests (154 total).
  Migration applied and verified end-to-end against a real, throwaway
  PostgreSQL 16 instance with synthetic completed/failed/stuck sync_log
  rows (same rigor as Milestone 1). **Applied to production Supabase via
  the SQL editor** (no Supabase MCP connector was reachable this
  session, and this environment's network policy blocks direct
  Postgres connections outright — confirmed by testing the direct host
  and 12 pooler regions, all timing out despite working DNS/HTTPS);
  confirmed live via `pg_views`, all three views present. The
  `/api/seo/status` route itself is still only on the feature branch —
  see PHASE_1_IMPLEMENTATION.md Milestone 7
- **Milestone 6 (GA4 Sync Job) code-complete, integration verification
  pending real credentials.** `ga4/client.ts` — hand-rolled JWT
  service-account auth (mirrors `gsc/client.ts`), `runReport` with
  rowCount-based pagination (exact, unlike GSC's short-page heuristic),
  same retry/auth-failure classification (`Ga4AuthError`) — 14 tests
  including real cryptographic JWT signature verification. Requests the
  `keyEvents` metric, not `conversions` — see "Fixed" below. `ga4/sync.ts`
  — fetch page metrics → validate (empty/excluded pagePath) → fetch
  conversion breakdown (skipped entirely when no
  `site_configs.conversion_events` are configured) → upsert
  pages/page_metrics → sync_log; computes
  `conversion_value = purchaseRevenue + Σ(eventCount × configured value)`,
  the platform's stated first-party competitive advantage
  (ARCHITECTURE.md) — 11 tests. `/api/seo/sync/ga4` route — 5 tests. 30
  new unit tests (130 total), all passing; zero real GA4 API calls made
  or claimed — see PHASE_1_IMPLEMENTATION.md Milestone 6 for exactly what
  is and isn't verified
- **Milestone 5 (GSC Sync Job) code-complete, integration verification
  pending real credentials.** `normalize.ts` (`normalizeKeyword`,
  `normalizeUrl`/`normalizePath` — 26 tests). `retry.ts`
  (`withRetry`/`RetryableError`, first real consumer — 6 tests).
  `gsc/client.ts` — hand-rolled JWT service-account auth (RS256, no SDK,
  per ARCHITECTURE.md's Technology Stack choice), `searchanalytics.query`
  with pagination, retry classification (429/5xx/network → retryable,
  401/403 → one re-auth attempt then fail fast, `GscAuthError`) — 11
  tests including real cryptographic JWT signature verification.
  `gsc/sync.ts` — fetch → normalize → validate → bulk upsert
  keywords/pages/keyword_page_metrics → sync_log — 9 tests. `gsc/backfill.ts`
  (Milestone 5b) — chunked, resumable 16-month backfill respecting
  Hobby's 300s ceiling — 6 tests including a precisely clocked
  time-budget-cutoff test. `/api/seo/sync/gsc` and
  `/api/seo/sync/gsc/backfill` routes — 11 tests. 100 total unit tests,
  all passing; zero real GSC API calls made or claimed — see
  PHASE_1_IMPLEMENTATION.md Milestone 5 for exactly what is and isn't
  verified
- Empirically confirmed (against production) that PostgREST's upsert only
  touches columns present in the payload — `is_target`/DataForSEO fields
  survive a GSC re-sync's partial upsert untouched

### Deployed
- **`claude/exciting-johnson-nddaq1` merged into `main` and deployed to production** (naijagrillandspice.co.uk) — Milestones 0–4 of the SEO Intelligence Platform are now live. Confirmed via Vercel MCP: build succeeded with zero errors, `curl https://www.naijagrillandspice.co.uk/api/seo/sync/ping` returns `401 {"error":"Unauthorized"}` (correct — proves the route is live; `CRON_SECRET` isn't set in Vercel yet), runtime logs show no errors. Diff touched zero existing site pages/components — additive only. One remaining manual step: Paul needs to set `CRON_SECRET` in the Vercel dashboard (no environment-variable tool exists in the connected Vercel MCP toolset to automate this)

### Added
- **Milestone 4 (Cron Infrastructure Proof) CLOSED.**
  `src/app/api/seo/sync/ping/route.ts` — GET route, `Authorization: Bearer
  <CRON_SECRET>` auth (Vercel's actual mechanism, timing-safe comparison),
  writes/completes a real `sync_log` row. `src/lib/seo/site.ts` —
  `getPrimarySiteId()`, the Phase 1 single-site resolution (ADR-003).
  `vercel.json` created (deferred since Milestone 0's JSON-can't-hold-
  comments finding) with the ping job's daily schedule. 11 unit tests +
  a full unmocked local-server-to-real-production curl verification (5
  cases, including the `timingSafeEqual` length-guard branch), production
  row fetched and confirmed exactly correct, then cleaned up
- Vercel's current Cron Jobs / function duration documentation fetched and
  verified rather than assumed from training data (per `AGENTS.md`'s own
  warning): GET method, best-effort delivery (can double-invoke — validates
  the existing upsert-based idempotency design), no retry on failure,
  300s/5min Hobby ceiling and up to 800s/1800s on Pro under Fluid Compute
  (materially more generous than outdated 10s/60s assumptions)

### Fixed
- **ARCHITECTURE.md §4.2 corrected:** the originally-sketched GA4 `runReport`
  request listed a `conversions` metric. Google renamed GA4 "conversions"
  to "key events" platform-wide (migration completed June 2026, after
  ARCHITECTURE.md was written) — the Data API's `conversions` metric name
  is now deprecated in favor of `keyEvents`. Verified against Google's
  live docs/changelog during Milestone 6, not assumed from training data.
  `ga4/client.ts` requests `keyEvents`; same underlying metric, current
  API name, no design change

- **ARCHITECTURE.md §7 corrected:** the originally-sketched cron auth
  (`x-cron-secret` custom header, checked alongside Basic Auth on every
  `/api/seo/*` route) doesn't match Vercel's actual mechanism and would
  have made cron routes permanently uncallable by Vercel's own cron
  system. Corrected to: `CRON_SECRET`-only via `Authorization: Bearer` for
  cron-triggered routes, Basic Auth unchanged for human-facing mutation
  routes, CMS webhook signature unchanged for the webhook route

- **Milestone 3 (Logger + sync_log Writer) CLOSED.** `src/lib/seo/logger.ts`
  — structured JSON logger (debug/info/warn/error) with best-effort
  redaction of credential-shaped field names. `src/lib/seo/sync-log.ts` —
  `startSyncRun()`/`completeSyncRun()`, the only module permitted to write
  to `sync_log`. `createSupabaseServiceRoleClient()` added to
  `src/lib/supabase/server.ts` (service-role-only, throws clearly instead
  of silently falling back to an anon key that RLS would block on every
  SEO table). 7 unit tests + 3 integration tests (real production Supabase,
  gated behind `RUN_INTEGRATION_TESTS=1` / `npm run test:integration`) —
  20/20 unit, 23/23 total
- `ADR-009-server-side-timestamps.md` — server-generated timestamps for any
  column compared against a DB-generated timestamp in a CHECK constraint;
  general principle for future tables, not just `sync_log`
- Supabase MCP connector documented as a third database-access path in
  `DATABASE_OPERATIONS.md`, alongside the SQL editor and `DATABASE_URL`

### Fixed
- **Real production bug found via integration testing, not a test
  artifact:** `sync_log_completed_after_started_check` failed under actual
  app/database clock skew (~150ms of real elapsed time between two
  separate requests was still enough to trip it). Root cause: `completed_at`
  was computed client-side and compared against a database-computed
  `started_at`. Fixed with a `BEFORE UPDATE` trigger
  (`20260719000000_sync_log_server_side_completed_at.sql`) that forces
  `completed_at = now()` server-side — both timestamps now always come
  from the same clock. Verified with a deliberate 10-second backdate
  (locally, then directly against production via the Supabase MCP
  connector, then end-to-end through the real integration test suite).
  Stopped and presented options before implementing, per standing
  instruction; user selected the recommended fix
- `function_search_path_mutable` security advisory (Supabase linter, WARN)
  on both trigger functions (`seo_set_updated_at` from Milestone 1,
  `seo_set_sync_log_completed_at` from this fix) — pinned
  `search_path = ''` on both (`20260719193100_harden_trigger_function_search_path.sql`),
  zero behavioral change, re-verified both triggers still work correctly
- Milestone 1's index/constraint catalog verification gap (previously only
  offered as a paste-back SQL query) closed for real — all 28 indexes
  confirmed present via direct SQL access once the Supabase MCP connector
  became available

- **Milestone 2 (Configuration & Secrets) complete.** `src/lib/seo/config.ts`
  — Zod-validated `getGscConfig()`/`isGscConfigured()`,
  `getGa4Config()`/`isGa4Configured()`, `getCronSecret()`/`isCronSecretConfigured()`,
  and `normalizePrivateKey()` (handles both literal `\n` and real-newline PEM
  keys). The only module permitted to read `process.env` for GSC/GA4/cron
  secret vars — grep-verified. 13 unit tests, all passing. `DEPLOYMENT.md` §8
  — full GSC/GA4 service-account setup walkthrough, including a verification
  command that was actually run before being documented
- `DATABASE_OPERATIONS.md` — operational runbook: fresh-database setup,
  running/applying migrations, seeding, dev-database reset, backup/restore
  (tested end-to-end locally: seed → `pg_dump` → restore → verified intact),
  rollback strategy, append-only migration discipline, production deployment
  checklist, environment variable requirements, and troubleshooting
- `DATABASE_URL` documented as a server-side-only, operational-use-only
  credential (direct Postgres access for migrations/backups/diagnostics —
  never an application runtime dependency, never client-exposed)

### Fixed
- **Milestone 1's documented rollback procedure was wrong**, found while
  writing `DATABASE_OPERATIONS.md`: `pages` and `topic_clusters` have a
  circular FK, so the originally-documented drop order fails outright
  (confirmed by running it). Corrected, tested sequence now lives in
  `DATABASE_OPERATIONS.md` §7; `PHASE_1_IMPLEMENTATION.md` updated to point
  there instead of claiming the rollback SQL lives in the migration file

- **Milestone 1 (Database Foundation) CLOSED — applied to production and verified.**
  `supabase/migrations/20260718000000_seo_platform_core.sql` — 11 tables
  (`sites`, `site_configs`, `topic_clusters`, `pages`, `keywords`,
  `cluster_keywords`, `keyword_page_metrics(_weekly)`, `page_metrics(_weekly)`,
  `sync_log`), 19 foreign keys, 9 unique constraints, 33 CHECK constraints,
  9 indexes tied to documented query patterns, a shared `updated_at` trigger,
  RLS enabled with zero anon/authenticated policies (default-deny), and
  seed data for the restaurant site. Fully idempotent — verified re-runnable
  against a local PostgreSQL 16 instance configured to replicate Supabase's
  `anon`/`authenticated`/`service_role` model, then applied to the production
  Supabase project and independently verified there via `@supabase/supabase-js`
  (28/28 checks: table reachability, seed data, RLS deny/allow, 8 constraint
  types, cascade design). See PHASE_1_IMPLEMENTATION.md Milestone 1 for the
  full verification record
- **Milestone 0 (Standards & Scaffolding) complete.** `vitest` added as the
  test runner (`npm test` / `npm run test:watch`); `vitest.config.ts` with
  the `@/` path alias matching `tsconfig.json` and `passWithNoTests: true`
  for the pre-implementation state
- `src/lib/seo/{config,logger,sync-log,retry,normalize}.ts` — placeholder
  modules, each documenting which milestone implements it; no logic yet
- `src/lib/seo/types.ts` — shared `SyncSource`, `SyncStatus`, `SyncMetadata`,
  `CompleteSyncRunInput` type contracts used by Milestones 3–8
- `CRON_SECRET`, `GSC_CLIENT_EMAIL`, `GSC_PRIVATE_KEY`, `GSC_PROPERTY_URL`,
  `GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY`, `GA4_PROPERTY_ID` placeholders in
  `.env.example`, documented as inert until Milestone 2
- `ENGINEERING_STANDARDS.md` — folder structure, naming conventions, error handling, logging, background job architecture, retry strategy, configuration management, testing strategy, documentation requirements, git workflow, and an observability requirements section built in from the start (not bolted on later)
- `PHASE_1_IMPLEMENTATION.md` — 10 sequential milestones (0–9) covering scaffolding, database schema, config, logging/sync_log, cron infrastructure proof, GSC sync, GA4 sync, observability layer, retention/archival, and a deferred minimal read-only UI. Each milestone specifies objective, tasks, dependencies, database changes, files, tests, Definition of Done, and risks/rollback
- Architecture document (ARCHITECTURE.md) — complete system design covering vision, database schema, data pipeline, intelligence engine, API design, frontend architecture, and roadmap
- 8 Architecture Decision Records (ADR-001 through ADR-008) as individual files in `decisions/`
- `page_metrics_weekly` table for GA4 data retention parity with keyword metrics
- `serp_snapshots` unique constraint (keyword_id, date, position) for idempotent upserts
- Defined `recency_factor` formula for Content Decay Score (was previously undefined)
- Clarified analysis trigger mechanism (inline function call after sync, not event bus)
- Documented first-sync backfill strategy (one-time 16-month GSC history pull)
- Documented CTR position bucketing (round fractional positions to nearest integer)
- Documented URL redirect / slug change handling strategy
- Documented database migration approach (Supabase Migrations)
- Documented RLS bypass strategy (service role key for SEO tables)
- Documented GA4 `purchaseRevenue` → `conversion_value` mapping and custom event fallback

### Changed
- Fixed `keywords.keyword_normalized` column comment: "articles stripped" (was incorrectly "prepositions stripped")
- Clarified `sites.config` vs `site_configs` table purpose with inline comment
- Cannibalization detection now uses 90-day lookback (was 30-day); scoring remains 30-day
- `keyword_monthly_value` output: computed on-the-fly, stored in `actions.supporting_data` (was ambiguously "keyword summary view")
- Retention policy: `page_metrics` now aggregates to `page_metrics_weekly` (was "aggregate on read")

### Fixed
- Contradiction between keyword normalization rules (strip articles only) and schema comment (said "prepositions stripped")
- Missing unique constraint on `serp_snapshots` that would have caused duplicate rows on re-sync

---

## [0.1.0] — 2026-07-18

### Added
- Initial architecture document
- Database schema (16 tables)
- Data pipeline design (GSC, GA4, DataForSEO, CMS)
- Intelligence engine (9 scoring algorithms)
- API design and frontend architecture
- 4-phase roadmap
- Business type configuration presets (restaurant, ecommerce, service, blog)
