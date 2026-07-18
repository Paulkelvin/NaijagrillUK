# SEO Intelligence Platform — Changelog

All notable changes to the platform architecture and implementation.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

---

## [Unreleased]

### Added
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
