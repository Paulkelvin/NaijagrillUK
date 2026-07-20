# SEO Intelligence Platform — Changelog

All notable changes to the platform architecture and implementation.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

---

## [Unreleased]

### Added
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
