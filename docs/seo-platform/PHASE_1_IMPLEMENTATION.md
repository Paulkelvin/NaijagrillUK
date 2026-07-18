# Phase 1 Implementation Plan — Data Foundation

> **Status:** Planning complete, execution not started.
> **Last updated:** 2026-07-18
> **Owner:** Paul Kelvin
> **Depends on:** ARCHITECTURE.md (frozen), ENGINEERING_STANDARDS.md

---

## Objective

Prove that we can **reliably ingest, normalise, archive, monitor, and query** SEO data (GSC + GA4 + CMS) in a production-ready way. This phase is deliberately *not* about building dashboards — see Non-Goals below.

**Definition of "production-ready" for Phase 1:**
- Daily syncs run unattended and are idempotent (safe to re-run, never duplicate data)
- Every sync run is logged with enough detail to answer all 8 observability questions (ENGINEERING_STANDARDS.md §9)
- Data survives crashes and partial failures without corruption or silent loss
- 16 months of GSC history is captured before it ages out of GSC's own retention window
- The retention/archival job is proven correct, not just designed

### Non-Goals for Phase 1

- No dashboard, charts, or analytics UI
- No scoring/intelligence algorithms (Phase 2)
- No DataForSEO integration (Phase 2)
- No action queue (Phase 2)
- No competitor tracking, SERP snapshots, or internal link graph (Phase 3)

A minimal **read-only verification UI** (keyword table, page table, striking-distance report — the UI items listed under ARCHITECTURE.md §9 Phase 1) is sequenced as the **final, explicitly deferred milestone** (Milestone 9). It does not start until Milestones 0–8 are proven with real production data. This resequences — but does not change the scope of — ARCHITECTURE.md's Phase 1 roadmap.

---

## Milestone Sequence

```
0. Standards & Scaffolding
        │
        ▼
1. Database Schema (Phase 1 tables)
        │
        ▼
2. Config & Secrets
        │
        ▼
3. Logger + sync_log Writer
        │
        ▼
4. Cron Infra Proof ("ping" job)
        │
        ├──────────────┐
        ▼              ▼
5. GSC Sync       6. GA4 Sync      (can run in parallel; both depend only on 0–4)
        │              │
        └──────┬───────┘
               ▼
7. Observability Layer
               │
               ▼
8. Retention / Archival Job
               │
               ▼
9. Minimal Read-Only UI  (DEFERRED — gated on real data)
```

Milestones 5 and 6 are independent of each other (both only need 0–4) and can be built in either order, or in parallel if more than one person is working. Everything else is strictly sequential.

---

## Milestone 0 — Engineering Standards & Scaffolding

**Objective:** Establish tooling and folder skeleton before any feature code exists, so every later milestone follows the same conventions from its first commit.

**Tasks:**
- [ ] Write `ENGINEERING_STANDARDS.md` (done alongside this document)
- [ ] Add `vitest` as a devDependency; add `npm test` script
- [ ] Create empty skeleton: `src/lib/seo/{config,logger,sync-log,retry,normalize,types}.ts`
- [ ] Add `CRON_SECRET`, `GSC_*`, `GA4_*` placeholders to `.env.example`
- [ ] Add a commented-out `vercel.json` crons block (uncommented in Milestone 4)

**Dependencies:** None.

**Expected outputs:** Vitest runs (`npm test`) with zero tests and exits 0. Lint passes. Folder skeleton exists but contains no real logic yet.

**Database changes:** None.

**Files to create/modify:**
- `package.json` (add vitest, test script)
- `vitest.config.ts`
- `src/lib/seo/*.ts` (empty exports)
- `.env.example`
- `vercel.json` (new file)

**Tests to perform:**
- `npm test` exits 0
- `npm run lint` exits 0
- `npm run build` still succeeds (empty modules don't break the build)

**Success criteria (DoD):**
- All scaffolding files exist and compile
- CHANGELOG.md updated

**Risks & rollback:**
- Risk: none significant — this is inert scaffolding. Rollback: `git revert` the single commit.

---

## Milestone 1 — Database Schema (Phase 1 Tables)

**Objective:** Create the subset of ARCHITECTURE.md's schema needed for GSC + GA4 ingestion and observability — deliberately excluding tables that belong to later phases (competitors, serp_snapshots, internal_links, actions, action_outcomes, api_budgets — DataForSEO/Phase 2/3 concerns).

**Tables included:** `sites`, `site_configs`, `topic_clusters`, `pages`, `keywords`, `cluster_keywords`, `keyword_page_metrics`, `keyword_page_metrics_weekly`, `page_metrics`, `page_metrics_weekly`, `sync_log`.

**Tasks:**
- [ ] Write migration `supabase/migrations/<timestamp>_seo_platform_core.sql`, copied and adapted from ARCHITECTURE.md §3's schema block (tables above only)
- [ ] Add RLS: enable RLS on every new table, **no anon policies** (these are server-only tables, unlike the public form tables) — access is via service-role key exclusively, per ARCHITECTURE.md's "Row-Level Security" note
- [ ] Seed one `sites` row for `naijagrillandspice.co.uk`, `business_type = 'restaurant'`
- [ ] Seed matching `site_configs` row using the Restaurant preset from ARCHITECTURE.md Appendix B
- [ ] Apply migration via Supabase SQL editor (matching current repo practice — see DEPLOYMENT.md)

**Dependencies:** Milestone 0 (folder conventions).

**Expected outputs:** All 11 tables exist in Supabase with correct constraints, indexes, and RLS. One seeded site + config row.

**Database changes:** New migration file; new tables; seed data (2 rows).

**Files to create/modify:**
- `supabase/migrations/<timestamp>_seo_platform_core.sql`

**Tests to perform:**
- Apply migration to Supabase; verify all 11 tables + indexes exist via SQL editor `\d` / information_schema query
- Attempt a read with the **anon** key against `sites` — must be denied (RLS working)
- Attempt a read with the **service role** key — must succeed
- Insert a duplicate `(site_id, path)` into `pages` — must fail on the unique constraint (confirms dedup constraints are live before any sync code depends on them)

**Success criteria (DoD):**
- Migration applied to production Supabase project without error
- Anon-key access to all new tables confirmed blocked
- Seed row for the site exists and is queryable via service role
- `ARCHITECTURE.md`'s schema diagram is a byte-for-byte match for the tables included (no silent drift)

**Risks & rollback:**
- Risk: schema drift from ARCHITECTURE.md during hand-adaptation. Mitigation: diff the migration's `CREATE TABLE` blocks against the architecture doc before applying.
- Risk: applying to production Supabase directly (no staging environment exists yet). Mitigation: migration is additive-only (new tables, nothing touches the four existing form tables) — low blast radius. Rollback: `DROP TABLE` in reverse dependency order (documented at the bottom of the migration file as a commented-out rollback block).

---

## Milestone 2 — Config & Secrets

**Objective:** Wire GSC/GA4 credentials safely with fail-fast validation, before any job tries to use them.

**Tasks:**
- [ ] Implement `src/lib/seo/config.ts`: Zod schemas for GSC, GA4, and cron secret config
- [ ] Implement `getGscConfig()` / `isGscConfigured()`, `getGa4Config()` / `isGa4Configured()` (mirrors `isSupabaseConfigured()`)
- [ ] Implement `normalizePrivateKey()` — handles both literal `\n` and real-newline PEM key formats
- [ ] Document exact env var setup (service account creation, property verification) in this document's runbook appendix
- [ ] Update `.env.example` with real variable names and comments (already stubbed in Milestone 0)

**Dependencies:** Milestone 0.

**Expected outputs:** `src/lib/seo/config.ts` fully implemented and unit-tested. No job code yet depends on it (that's Milestones 4–6).

**Database changes:** None.

**Files to create/modify:**
- `src/lib/seo/config.ts`
- `src/lib/seo/config.test.ts`
- `.env.example`
- `DEPLOYMENT.md` (add GSC/GA4 service account setup section)

**Tests to perform (unit, via Vitest):**
- Valid full config → parses correctly
- Missing required var → `isXConfigured()` returns false, no throw
- Malformed private key (missing PEM header) → clear validation error
- Escaped `\n` in private key → `normalizePrivateKey()` produces valid real-newline PEM

**Success criteria (DoD):**
- `npm test` covers all four cases above and passes
- No code outside `config.ts` reads `process.env.GSC_*` / `GA4_*` directly (grep check)

**Risks & rollback:**
- Risk: GSC/GA4 service account setup is fiddly and can take 2-3 days per ARCHITECTURE.md's own risk note (domain property verification, correct API scopes). Mitigation: this milestone only wires config parsing — actual auth is proven in Milestone 5, isolating the two risks.
- Rollback: this module has no side effects; safe to revert independently.

---

## Milestone 3 — Logger + sync_log Writer

**Objective:** Build the observability foundation *before* any real job exists, so every subsequent job is instrumented from its first line of code rather than retrofitted.

**Tasks:**
- [ ] Implement `src/lib/seo/logger.ts` — structured JSON logger with `debug/info/warn/error` levels
- [ ] Implement `src/lib/seo/sync-log.ts`:
  - `startSyncRun(siteId, source, endpoint)` → inserts a `sync_log` row with `status = 'started'`, returns the row id
  - `completeSyncRun(id, { status, recordsProcessed, apiCreditsUsed, errorMessage, metadata })` → updates the row with `completed_at` and final status
  - Guarantees: called from a `try/catch` pattern (documented in ENGINEERING_STANDARDS.md §3) so a run is never left hanging on a *handled* exception
- [ ] Define the `metadata` JSON shape: `{ retry_count, rejected_rows, warnings: string[], backfill: boolean }`

**Dependencies:** Milestone 1 (needs `sync_log` table), Milestone 0.

**Expected outputs:** `sync-log.ts` fully implemented and unit-tested against a real (test) Supabase connection.

**Database changes:** None (uses Milestone 1's `sync_log` table).

**Files to create/modify:**
- `src/lib/seo/logger.ts`, `logger.test.ts`
- `src/lib/seo/sync-log.ts`, `sync-log.test.ts`
- `src/lib/seo/types.ts` (SyncStatus, SyncMetadata types)

**Tests to perform:**
- Unit: `logger` emits valid JSON with required fields for each level
- Integration (`RUN_INTEGRATION_TESTS=1`): `startSyncRun` → `completeSyncRun("completed")` produces a correct row; `startSyncRun` → simulated throw → `completeSyncRun("failed", ...)` produces a row with `error_message` populated
- Integration: two concurrent `startSyncRun` calls for the same source produce two distinct rows (no accidental overwrite)

**Success criteria (DoD):**
- A synthetic test job (throwaway script, not committed) can log a full start→complete→fail cycle and it's correctly queryable in `sync_log`
- This module is the *only* place in the codebase that writes to `sync_log`

**Risks & rollback:**
- Risk: a job crash that bypasses even the `catch` block (e.g., process killed) leaves a row stuck in `"started"` — this is accepted and explicitly handled by the `stale_datasets` view in Milestone 7, not solved here.
- Rollback: additive module, safe to revert independently of schema.

---

## Milestone 4 — Cron Infrastructure Proof ("ping" job)

**Objective:** Prove the full path — Vercel Cron → API route → auth → job → `sync_log` — end-to-end with a trivial job, isolating infrastructure risk from GSC/GA4 API complexity before either is built.

**Tasks:**
- [ ] Implement `src/app/api/seo/sync/ping/route.ts`: checks `CRON_SECRET` header, calls `startSyncRun`/`completeSyncRun` with a fixed 1-second delay, returns JSON
- [ ] Uncomment and populate `vercel.json` crons block with the ping job (daily, low-traffic hour)
- [ ] Document manual curl trigger for local/staging testing
- [ ] Confirm actual Vercel plan's function timeout limits (Hobby vs Pro) and record the finding here

**Dependencies:** Milestones 1–3.

**Expected outputs:** A working, deployed, cron-triggerable endpoint with a proven auth boundary.

**Database changes:** None.

**Files to create/modify:**
- `src/app/api/seo/sync/ping/route.ts`
- `vercel.json`

**Tests to perform:**
- `curl` with no `CRON_SECRET` header → 401
- `curl` with wrong secret → 401
- `curl` with correct secret → 200 + new `sync_log` row with `source = 'ping'`, `status = 'completed'`
- Post-deploy: confirm in the Vercel dashboard that the cron actually fires on schedule (cron only runs on production deployments, not preview — verify this explicitly)

**Success criteria (DoD):**
- A full round trip (cron → route → auth → job → `sync_log`) is proven working *in production* before a single line of GSC/GA4 integration code is written
- Vercel plan's timeout limit is documented (feeds into Milestone 5b's backfill design)

**Risks & rollback:**
- Risk: Vercel Cron has plan-dependent limits (Hobby: fewer/less-frequent crons). Confirm against the actual account before relying on it.
- Risk: Vercel Cron does not retry on failure — confirmed here as a real platform behaviour, reinforcing why retries live inside the job (ENGINEERING_STANDARDS.md §6).
- Rollback: delete the route and the `vercel.json` entry; no data dependencies.

---

## Milestone 5 — GSC Sync Job

**Objective:** Pull real Search Console data, normalise it, and upsert it idempotently — the first real data flowing through the pipeline.

**Tasks:**
- [ ] Implement `src/lib/seo/normalize.ts`: keyword normalization (ADR-008 rules) and URL normalization (ARCHITECTURE.md §3 rules) as pure, heavily-tested functions
- [ ] Implement `src/lib/seo/gsc/client.ts`: JWT service-account auth, `searchanalytics.query` with pagination (25,000-row pages)
- [ ] Implement `src/lib/seo/gsc/sync.ts`: orchestrates fetch → normalize → validate → upsert `keywords`/`pages`/`keyword_page_metrics` → wraps in `startSyncRun`/`completeSyncRun`
- [ ] Implement row validation: reject `position < 1 or > 1000`, reject `clicks > impressions`, count rejects into `metadata.rejected_rows`
- [ ] Implement `src/app/api/seo/sync/gsc/route.ts` (thin adapter over `sync.ts`)
- [ ] **Milestone 5b:** first-sync backfill variant — pulls up to 16 months of history, chunked to fit the Vercel timeout found in Milestone 4, run manually once

**Dependencies:** Milestones 1–4.

**Expected outputs:** Real keyword/page/metric rows in the database, sourced from the live GSC property.

**Database changes:** None (uses Milestone 1 tables).

**Files to create/modify:**
- `src/lib/seo/normalize.ts`, `normalize.test.ts`
- `src/lib/seo/gsc/client.ts`
- `src/lib/seo/gsc/sync.ts`
- `src/app/api/seo/sync/gsc/route.ts`
- `src/lib/seo/retry.ts`, `retry.test.ts` (used here for the first time)

**Tests to perform:**
- Unit: `normalize.ts` — casing, whitespace collapse, leading article stripping, preposition preservation (must NOT strip "in"), trailing slash removal, query param stripping, `www.` stripping, root path edge case
- Unit: validation rejects out-of-range position and `clicks > impressions` without aborting the batch
- Integration: run the job twice against the same date → row count unchanged, values match latest fetch (idempotency proof)
- Integration: real curl trigger against the live GSC property → real rows appear, `sync_log.records_processed` matches
- Manual: verify pagination triggers correctly if a day ever exceeds 25,000 rows (unlikely at current traffic — documented as untested-at-scale)

**Success criteria (DoD):**
- Two consecutive runs for the same day produce zero duplicate rows
- `sync_log` accurately reflects `records_processed`, duration, and any rejected rows
- 16-month backfill completed at least once, confirmed against GSC's own UI totals for a sanity check
- `ARCHITECTURE.md`'s "16-month retention" risk is retired — history is captured

**Risks & rollback:**
- Risk (flagged in ARCHITECTURE.md itself): service-account auth setup, budget 2-3 days. Isolated from other work since normalize.ts and retry.ts can be built/tested without live credentials.
- Risk: backfill duration vs. Vercel timeout. Mitigated by chunking per date range, resumable (idempotent upserts mean a partial backfill can simply be re-run).
- Rollback: `DELETE FROM keyword_page_metrics WHERE site_id = ...` is safe and non-cascading to other tables; re-run the sync to repopulate.

---

## Milestone 6 — GA4 Sync Job

**Objective:** Mirror Milestone 5 for GA4 page-level metrics, reusing the normalization and retry infrastructure already proven.

**Tasks:**
- [ ] Implement `src/lib/seo/ga4/client.ts`: JWT service-account auth, `runReport` for sessions/engagement/conversions
- [ ] Implement `src/lib/seo/ga4/sync.ts`: orchestrates fetch → normalize pagePath (reuses `normalize.ts`) → upsert `page_metrics`
- [ ] Implement conversion breakdown as a second report call, mapped against `site_configs.conversion_events`
- [ ] Implement `src/app/api/seo/sync/ga4/route.ts`
- [ ] Log pages seen in GA4 but missing from `pages` (potential crawler miss) as a `metadata.warnings` entry, not a hard failure

**Dependencies:** Milestones 1–4 (not 5 — can run in parallel with Milestone 5).

**Expected outputs:** Real `page_metrics` rows sourced from the live GA4 property.

**Database changes:** None.

**Files to create/modify:**
- `src/lib/seo/ga4/client.ts`
- `src/lib/seo/ga4/sync.ts`
- `src/app/api/seo/sync/ga4/route.ts`

**Tests to perform:**
- Unit: conversion breakdown mapping against `site_configs.conversion_events`
- Integration: idempotency proof (same pattern as Milestone 5)
- Integration: real curl trigger against the live GA4 property
- Manual: confirm a page with zero GA4 traffic doesn't produce a spurious warning (only genuinely-missing `pages` rows should warn)

**Success criteria (DoD):**
- Two consecutive runs for the same day produce zero duplicate `page_metrics` rows
- Conversion breakdown values match GA4's own UI for a spot-checked date
- `sync_log` reflects accurate row counts and duration

**Risks & rollback:**
- Risk: GA4's `conversions`/`purchaseRevenue` metrics are effectively 0 for a restaurant site with no e-commerce — expected, not a bug (see ARCHITECTURE.md's GA4 metric mapping note). Custom event conversions (WhatsApp click, etc.) are the meaningful signal here and depend on GA4 events already being configured in Analytics — confirm they exist before trusting this data.
- Rollback: same pattern as Milestone 5 — safe, non-cascading delete + re-sync.

---

## Milestone 7 — Observability Layer

**Objective:** Make the data pipeline's own health queryable — answer all 8 observability questions from ENGINEERING_STANDARDS.md §9 through one authenticated endpoint, without building a dashboard.

**Tasks:**
- [ ] Write migration `supabase/migrations/<timestamp>_seo_observability_views.sql`:
  - `sync_status_summary` view — last run per source: status, `started_at`, duration, `records_processed`, `api_credits_used`
  - `stale_datasets` view — join `sync_status_summary` against `site_configs.refresh_schedules` to flag sources overdue
  - `sync_failures_recent` view — failed runs, last 7 days
- [ ] Implement `src/app/api/seo/status/route.ts` — HTTP Basic Auth (same pattern as `/admin`), returns all three views plus retry/warning counts as one JSON payload

**Dependencies:** Milestones 3, 5, 6 (needs real sync_log data to validate against).

**Expected outputs:** One authenticated JSON endpoint that fully answers "is the pipeline healthy?"

**Database changes:** New migration (views only, no new tables).

**Files to create/modify:**
- `supabase/migrations/<timestamp>_seo_observability_views.sql`
- `src/app/api/seo/status/route.ts`

**Tests to perform:**
- Seed a synthetic failed run and a synthetic stale run (started > 2× expected interval ago, never completed) → confirm both surface correctly in the endpoint's output
- Unauthenticated request → 401 (same as `/admin`)
- Authenticated request against real data → spot-check every one of the 8 questions in ENGINEERING_STANDARDS.md §9 has a correct, correct-shaped answer

**Success criteria (DoD):**
- All 8 observability questions are answerable from this one endpoint, verified against real pipeline data from Milestones 5–6
- A deliberately-broken sync (revoke a credential temporarily, trigger a run) shows up correctly as a failure within one request/response cycle

**Risks & rollback:**
- Risk: views computed over a growing `sync_log` table could slow down as history accumulates — acceptable at Phase 1 volume (few rows/day); revisit if `sync_log`'s own 3-month retention (Milestone 8) isn't enough.
- Rollback: `DROP VIEW` — no data loss, views are derived.

---

## Milestone 8 — Retention / Archival Job

**Objective:** Prove the "archive" half of the Phase 1 objective — not just design it. Built and tested against synthetic old data now, even though real 6-month-old rows won't exist yet.

**Tasks:**
- [ ] Implement `src/lib/seo/retention/run.ts`:
  1. Aggregate `keyword_page_metrics` rows older than 6 months into `keyword_page_metrics_weekly`
  2. Aggregate `page_metrics` rows older than 6 months into `page_metrics_weekly`
  3. Delete the aggregated daily rows from both tables
  4. Delete `sync_log` entries older than 3 months
- [ ] Implement `src/app/api/seo/retention/run/route.ts`
- [ ] Add weekly cron entry to `vercel.json`

**Dependencies:** Milestones 1, 3, 4.

**Expected outputs:** A proven, idempotent retention job — not yet exercised on real 6-month-old data, but correct against seeded synthetic data.

**Database changes:** None (uses existing tables).

**Files to create/modify:**
- `src/lib/seo/retention/run.ts`, `run.test.ts`
- `src/app/api/seo/retention/run/route.ts`
- `vercel.json`

**Tests to perform:**
- Integration: seed 200-day-old daily rows with known values → run retention → verify `keyword_page_metrics_weekly` aggregates match hand-calculated expected values, and the source daily rows are gone
- Integration: run retention twice in a row → second run is a no-op (idempotent — no double-aggregation, no error)
- Integration: rows newer than 6 months are untouched
- Integration: `sync_log` rows older than 3 months are deleted; newer ones survive

**Success criteria (DoD):**
- Synthetic-data test suite passes deterministically
- Job is confirmed idempotent (safe if cron fires twice, safe if manually re-run)
- This milestone is re-validated against *real* 6-month-old data once Phase 1 has been live that long (tracked as a follow-up note, not a blocker to closing this milestone)

**Risks & rollback:**
- Risk: aggregation bugs would silently corrupt historical trend data since the source daily rows are deleted after aggregation. Mitigation: dry-run mode (`?dryRun=true` query param) that computes and logs the would-be aggregates without deleting, used for one real pass before trusting the destructive path.
- Rollback: because daily rows are deleted, a bad aggregation is not trivially reversible — this is exactly why the dry-run mode above is mandatory before the first real (non-synthetic) run, and why GSC's own 16-month data remains the ultimate source of truth for keyword metrics if a re-backfill is ever needed.

---

## Milestone 9 — Minimal Read-Only UI (DEFERRED)

**Objective:** Close out ARCHITECTURE.md §9 Phase 1's UI deliverables (keyword explorer, page performance table, striking-distance report, basic `/admin/seo` layout) — explicitly last, and explicitly gated.

**Gate condition:** Do not start until Milestones 0–8 are complete AND at least 2 weeks of real production data has flowed through the pipeline without unresolved observability warnings.

This milestone is intentionally left undetailed until its gate condition is met — writing detailed tasks for UI now would be planning against data we don't have yet, contrary to the "prove the data model first" priority that opened this phase.

---

## Key Technical Risks (Summary)

Consolidated from each milestone's risk section — see ENGINEERING_STANDARDS.md §12 for the mitigation pattern applied to each:

1. GSC/GA4 service-account auth setup (2-3 day budget, per ARCHITECTURE.md)
2. Vercel function timeout vs. 16-month GSC backfill duration — confirm plan limits in Milestone 4 before Milestone 5b
3. Vercel Cron does not retry — retries must live inside job code
4. Crashed jobs can leave `sync_log` rows stuck in `"started"` — handled by the `stale_datasets` view, not prevented outright
5. Retention job is destructive (deletes daily rows after aggregation) — mandatory dry-run before first real execution
6. No staging Supabase environment — migrations are applied directly to production; kept additive-only and low blast radius in Phase 1
7. Manual SQL-editor migration application (no CLI pipeline) — acceptable at current scale, documented per-migration

---

## Runbook Appendix (filled in as milestones complete)

- GSC/GA4 service account creation steps: _TBD in Milestone 2_
- Manual curl commands for each sync route: _TBD in Milestone 4_
- Confirmed Vercel plan timeout limits: _TBD in Milestone 4_
