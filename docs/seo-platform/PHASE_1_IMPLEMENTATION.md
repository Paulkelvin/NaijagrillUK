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
- [x] Write `ENGINEERING_STANDARDS.md` (done alongside this document)
- [x] Add `vitest` as a devDependency; add `npm test` script
- [x] Create empty skeleton: `src/lib/seo/{config,logger,sync-log,retry,normalize,types}.ts`
- [x] Add `CRON_SECRET`, `GSC_*`, `GA4_*` placeholders to `.env.example`
- [~] `vercel.json` crons block — **deviation:** JSON has no comment syntax, so a
      "commented-out" block isn't literally possible. Deferred `vercel.json`
      creation to Milestone 4 in full, rather than committing an empty/misleading
      stub now. See "Deviations from Plan" below.

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
- `npm test` exits 0 — confirmed (`No test files found, exiting with code 0`, `passWithNoTests: true`)
- `npm run lint` exits 0 — **for new files.** Pre-existing lint errors in
  `scripts/gen-brand-assets.cjs` (3 `no-require-imports` errors) and a
  pre-existing warning in `src/components/home/StorySection.tsx` predate this
  milestone (confirmed via `git log` on those files) and are out of scope.
  `npx eslint src/lib/seo/ vitest.config.ts` — clean, zero output.
- `npm run build` still succeeds — confirmed, TypeScript + Turbopack build
  completes with no errors, all 37 routes generate correctly.

**Success criteria (DoD):**
- All scaffolding files exist and compile — met
- CHANGELOG.md updated — met

**Risks & rollback:**
- Risk: none significant — this is inert scaffolding. Rollback: `git revert` the single commit.

**Completed:** 2026-07-18.

### Deviations from Plan

- **`vercel.json` not created in this milestone.** The original task said "add a
  commented-out crons block" — JSON has no comment syntax, so this was not
  literally achievable. Rather than commit a placeholder file (`{ "crons": [] }`)
  that adds no information and could be mistaken for a deliberate empty config,
  `vercel.json` creation is deferred in full to Milestone 4, where it will be
  created once with real, active cron entries. No functional impact — nothing
  in Milestones 1–3 depends on `vercel.json` existing.
- **`sync-log` module's `SyncSource` type includes `"ping"` and `"retention"`**
  (Milestones 4 and 8) in addition to ARCHITECTURE.md's original comment list
  (`gsc | ga4 | dataforseo | cms | crawler`) on `sync_log.source`. This is not
  a schema change — `source` is an unconstrained `TEXT` column, so no
  migration is affected — but the descriptive comment in the Milestone 1
  migration should list the full set. Noted here so it isn't missed when
  Milestone 1 is written.

---

## Milestone 1 — Database Schema (Phase 1 Tables)

**Objective:** Create the subset of ARCHITECTURE.md's schema needed for GSC + GA4 ingestion and observability — deliberately excluding tables that belong to later phases (competitors, serp_snapshots, internal_links, actions, action_outcomes, api_budgets — DataForSEO/Phase 2/3 concerns).

**Tables included:** `sites`, `site_configs`, `topic_clusters`, `pages`, `keywords`, `cluster_keywords`, `keyword_page_metrics`, `keyword_page_metrics_weekly`, `page_metrics`, `page_metrics_weekly`, `sync_log`.

**Tasks:**
- [x] Write migration `supabase/migrations/20260718000000_seo_platform_core.sql`, adapted from ARCHITECTURE.md §3's schema block (tables above only)
- [x] Add RLS: enable RLS on every new table, **no anon policies** (these are server-only tables, unlike the public form tables) — access is via service-role key exclusively, per ARCHITECTURE.md's "Row-Level Security" note
- [x] Seed one `sites` row for `naijagrillandspice.co.uk`, `business_type = 'restaurant'`
- [x] Seed matching `site_configs` row using the Restaurant preset from ARCHITECTURE.md Appendix B
- [x] Apply migration via Supabase SQL editor against the real production project — **done by Paul Kelvin**, applied without error. Production verification performed afterward (see "Production Verification" below).

**Dependencies:** Milestone 0 (folder conventions).

**Expected outputs:** All 11 tables exist in Supabase with correct constraints, indexes, and RLS. One seeded site + config row.

**Database changes:** New migration file; new tables; seed data (2 rows).

**Files to create/modify:**
- `supabase/migrations/<timestamp>_seo_platform_core.sql`

**Tests performed (against a local PostgreSQL 16 instance, configured to replicate Supabase's `anon`/`authenticated`/`service_role` model — see "Validation Methodology" below):**
- [x] Empty database → full migration sequence (existing + new) applies cleanly, exit 0
- [x] Full migration sequence re-run end to end → new migration is fully idempotent (every statement a no-op on re-run, seed `INSERT`s become `0 rows` via `ON CONFLICT DO NOTHING`)
- [x] `anon` role: `SELECT` on `sites`/`keyword_page_metrics` → 0 rows (RLS filter, confirmed not an empty-table artifact by cross-checking as superuser)
- [x] `anon` role: `INSERT` into `sites` → rejected (`new row violates row-level security policy`)
- [x] `authenticated` role: `SELECT` on `sync_log` → 0 rows, same mechanism
- [x] `service_role`: `SELECT`/`INSERT` on `sites`, `keywords` → succeeds (simulated ingestion)
- [x] 6 targeted constraint-violation tests (clicks > impressions, position out of range, non-Monday `week_start`, `failed` status without `error_message`, `started` status with `completed_at` set, duplicate `keyword_normalized`) → all correctly rejected with the expected named constraint
- [x] Idempotent upsert on `keyword_page_metrics` (`ON CONFLICT ... DO UPDATE`, run twice with different values) → exactly 1 row survives with the latest values; `updated_at` trigger verified to fire correctly across a real transaction boundary (initial same-transaction test was a false negative caused by `now()` being transaction-scoped, not a trigger bug — re-verified with two separate `psql` invocations and a 1s gap)
- [x] Cascade: delete a `page` → its `keyword_page_metrics` rows are gone
- [x] Cascade: delete a `site` → its `keywords`, `site_configs`, and everything beneath cascade away
- [x] 32,283-row synthetic `keyword_page_metrics` dataset (realistic Phase 1 scale, sparse like real GSC data) + `ANALYZE` → confirmed via `EXPLAIN` that `idx_kpm_site_date`, `idx_kpm_keyword_date`, `idx_kpm_page_date`, and `idx_sync_site_source` are each chosen by the planner (Bitmap/Index Scan, not Seq Scan) for their documented query pattern
- [x] Full FK inventory (19 foreign keys) and RLS state (`relrowsecurity = t` on all 11 tables, 0 rows in `pg_policies` for all 11) pulled directly from `pg_catalog`

**Success criteria (DoD):**
- [x] Migration is idempotent and schema-correct, exhaustively verified locally (see above)
- [x] Anon/authenticated access to all new tables confirmed blocked; service-role ingestion confirmed working
- [x] Seed row for the site exists and is queryable via service role
- [x] `ARCHITECTURE.md`'s schema is matched for the tables included, with documented, reasoned deltas (see "Differences from Architecture" below) — not a silent drift
- [x] **Migration applied to the actual production Supabase project** and independently verified there (see "Production Verification" below)

**Risks & rollback:**
- Risk: schema drift from ARCHITECTURE.md during hand-adaptation. Mitigated by writing every deviation down explicitly (below) rather than letting it happen silently.
- Risk: applying to production Supabase directly (no staging environment exists yet). Mitigation: migration is additive-only (new tables, nothing touches the four existing form tables) — low blast radius. Rollback procedure: see `DATABASE_OPERATIONS.md` §7.
  **Correction (found while writing `DATABASE_OPERATIONS.md`):** this section originally claimed the rollback order was "`pages`/`topic_clusters` before each other doesn't matter since their mutual FK is `ON DELETE SET NULL`, not blocking" and that the rollback SQL would live as a comment in the migration file. Both were wrong — `pages` and `topic_clusters` have a genuine circular FK (`pages.topic_cluster_id → topic_clusters.id` and `topic_clusters.pillar_page_id → pages.id`), and dropping either first fails with `cannot drop table ... because other objects depend on it`, confirmed by actually running it. The correct, tested sequence (break the circular FK first, then drop in dependency order) now lives in `DATABASE_OPERATIONS.md` §7, which is also the more sensible home for it — a runbook a human opens during an incident, not a comment in an already-applied, append-only migration file.
- **Finding (out of scope for this migration, flagged for a decision):** the pre-existing `20260609000000_initial_schema.sql` is **not** idempotent — its four `CREATE POLICY` statements have no guard and error on re-run (`policy ... already exists`). This didn't block Milestone 1 (my migration runs independently and is itself fully idempotent), but it means "re-run the full migration sequence from scratch" fails at the *first* file if attempted twice against the same database, for reasons unrelated to the SEO platform. I did not touch that file — per `ENGINEERING_STANDARDS.md` §11, applied migrations are append-only. If you'd like this fixed, it would be a small follow-up migration (`DROP POLICY IF EXISTS` + `CREATE POLICY` for the four existing policies) — let me know and I'll do it as its own commit, separate from Milestone 1.

### Validation Methodology

No Supabase credentials are available in this environment, so "verify against a real database" meant standing up an equivalent locally rather than skipping the check. PostgreSQL 16 is installed in this sandbox; I:
1. Created `anon`, `authenticated`, and `service_role` Postgres roles matching Supabase's actual model — `NOLOGIN NOINHERIT` for the first two, `BYPASSRLS` for `service_role` — and replicated Supabase's default grants (`GRANT ALL ON ALL TABLES ... TO anon, authenticated, service_role`, since in Supabase RLS is the enforcement layer, not table-level `GRANT`s; granting too little would have made the anon-denied tests pass for the wrong reason).
2. Applied the existing initial migration, then the new one, against a freshly created database.
3. Ran the full test matrix above using `SET ROLE` to switch between `anon`/`authenticated`/`service_role` within `psql`.
4. Populated 32K+ rows of realistic synthetic data to get meaningful `EXPLAIN` output (an empty/near-empty table correctly makes the planner prefer a sequential scan — that's not a defect, so I didn't stop at the misleading zero-data result).
5. Tore down the test database, roles, and stopped the local Postgres service, leaving the sandbox as it was found.

This proves the migration is *correct*. It does not replace applying it to the real Supabase project, since things like the exact Postgres version/extensions Supabase runs, connection pooling behaviour, and the real `service_role` key's actual grants could theoretically differ — low risk given how closely Supabase's documented model was replicated, but worth stating plainly rather than implying "production-verified" when it's "locally-verified against a faithful replica."

### Production Verification

Performed after Paul applied the migration to the live Supabase project. This environment has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` available, but **no direct Postgres connection string** — only Supabase's REST API (PostgREST) is reachable, so verification is behavioral (via `@supabase/supabase-js`, already a project dependency) rather than a raw `pg_catalog` dump. A one-off script was written to a scratch location, temporarily copied into `scripts/` only so Node's module resolution could find `node_modules` (`npx tsx` requires running from inside the project tree), run, and then deleted — nothing was committed. `git status` confirmed clean before and after.

**Safety approach:** every test that needed a foreign-key target inserted its own temporary, distinctively-named row (`keyword_normalized = '__milestone1_verification__'`) and deleted it in a `finally` block regardless of pass/fail. The pre-existing seed data (`sites`/`site_configs` for `naijagrillandspice.co.uk`) was only ever read, never mutated — the one test that attempted to mutate it (`business_type` → an invalid value) was *expected* to be rejected by the CHECK constraint, and a follow-up read confirmed the real row was untouched. A final row-count pass after cleanup confirmed the database is back to exactly the seed state (`sites=1, site_configs=1`, all 9 other tables `=0`).

**Results — 28/28 checks passed:**

| Check | Result |
|-------|--------|
| All 11 tables exist and are reachable via `service_role` | ✅ (11/11) |
| `sites` seed row: correct domain, name, `business_type = 'restaurant'` | ✅ |
| `site_configs` seed row: `conversion_events` contains the restaurant preset (`whatsapp_click`, etc.) | ✅ |
| `anon` `SELECT` on `sites` → 0 rows (RLS filter, not an error) | ✅ |
| `anon` `INSERT` into `sites` → rejected (`new row violates row-level security policy`) | ✅ |
| `anon` `SELECT` on `keyword_page_metrics` → 0 rows | ✅ |
| `service_role` `INSERT` into `keywords`, `pages` → succeeds (simulated ingestion) | ✅ |
| `service_role` valid `keyword_page_metrics` row → accepted | ✅ |
| CHECK: `clicks > impressions` → rejected (`keyword_page_metrics_clicks_le_impressions_check`) | ✅ |
| CHECK: `position` out of range → rejected (`keyword_page_metrics_position_range_check`) | ✅ |
| CHECK: non-Monday `week_start` → rejected (`kpm_weekly_week_start_is_monday_check`) | ✅ |
| CHECK: `sync_log` invalid `source` enum → rejected (`sync_log_source_check`) | ✅ |
| CHECK: `sync_log` `failed` without `error_message` → rejected — isolated retest below | ✅ |
| CHECK: invalid `business_type` enum → rejected (`sites_business_type_check`), seed row confirmed unchanged after | ✅ |
| UNIQUE: duplicate `keyword_normalized` per site → rejected (`keywords_site_normalized_key`) | ✅ |

**One test artifact worth recording:** the first attempt at the "`failed` without `error_message`" check used a single `INSERT` with both `started_at` (server-defaulted) and `completed_at` (client-computed) set near-simultaneously. It was correctly rejected, but by `sync_log_completed_after_started_check` rather than the intended `sync_log_failed_has_error_message_check` — client/server clock skew across the network round-trip made `completed_at` (computed before the request) occasionally earlier than `started_at` (computed by Postgres at insert time). This is a **test-script artifact, not a production concern**: real usage (Milestone 3's `startSyncRun`/`completeSyncRun`) always does two separate writes with a genuine elapsed-time gap between them, so this race can't occur in practice. Re-ran isolated with the realistic two-step pattern (insert `'started'` → wait 1.2s → attempt update to `'failed'` with no `error_message`) and got the exact expected result: rejected specifically by `sync_log_failed_has_error_message_check`; the same update with `error_message` set succeeded.

**What this does *not* directly confirm:** exact index existence (`idx_kpm_site_date` etc.) and the full `pg_constraint`/`pg_indexes` catalog dump, since PostgREST doesn't expose `pg_catalog` and no raw Postgres connection is available here. Confidence on that front rests on: (1) this being the byte-identical DDL file already exhaustively proven correct against a matching PostgreSQL 16 engine locally, and (2) the migration applying to production without error — `CREATE INDEX` statements are part of the same script, so a clean apply is a deterministic guarantee they exist, not an inference. If you want empirical closure on this specific point, paste the output of this query from the SQL editor and I'll fold it into the record:

```sql
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public' AND tablename IN
  ('sites','site_configs','topic_clusters','pages','keywords','cluster_keywords',
   'keyword_page_metrics','keyword_page_metrics_weekly','page_metrics','page_metrics_weekly','sync_log')
ORDER BY tablename, indexname;
```

### Deliverables

#### ER Diagram

```mermaid
erDiagram
    SITES ||--|| SITE_CONFIGS : "1:1 config"
    SITES ||--o{ TOPIC_CLUSTERS : "has"
    SITES ||--o{ PAGES : "has"
    SITES ||--o{ KEYWORDS : "has"
    SITES ||--o{ KEYWORD_PAGE_METRICS : "has (denormalized)"
    SITES ||--o{ KEYWORD_PAGE_METRICS_WEEKLY : "has (denormalized)"
    SITES ||--o{ PAGE_METRICS : "has (denormalized)"
    SITES ||--o{ PAGE_METRICS_WEEKLY : "has (denormalized)"
    SITES ||--o{ SYNC_LOG : "has"

    TOPIC_CLUSTERS ||--o{ PAGES : "groups (topic_cluster_id, nullable)"
    PAGES |o--o| TOPIC_CLUSTERS : "pillar page (nullable, SET NULL)"
    TOPIC_CLUSTERS ||--o{ CLUSTER_KEYWORDS : "has member"
    KEYWORDS ||--o{ CLUSTER_KEYWORDS : "belongs to"

    KEYWORDS ||--o{ KEYWORD_PAGE_METRICS : "ranks in"
    PAGES ||--o{ KEYWORD_PAGE_METRICS : "ranks in"
    KEYWORDS ||--o{ KEYWORD_PAGE_METRICS_WEEKLY : "ranks in"
    PAGES ||--o{ KEYWORD_PAGE_METRICS_WEEKLY : "ranks in"
    PAGES ||--o{ PAGE_METRICS : "measured (GA4)"
    PAGES ||--o{ PAGE_METRICS_WEEKLY : "measured (GA4)"

    SITES {
        uuid id PK
        text domain UK
        text business_type "CHECK enum"
    }
    SITE_CONFIGS {
        uuid site_id PK_FK
    }
    TOPIC_CLUSTERS {
        uuid id PK
        uuid site_id FK
        text name "UNIQUE per site"
        uuid pillar_page_id FK "nullable"
    }
    PAGES {
        uuid id PK
        uuid site_id FK
        text path "UNIQUE per site"
        uuid topic_cluster_id FK "nullable"
        text content_type "nullable, CHECK enum"
    }
    KEYWORDS {
        uuid id PK
        uuid site_id FK
        text keyword_normalized "UNIQUE per site"
        text data_source "NOT NULL, CHECK enum"
    }
    CLUSTER_KEYWORDS {
        uuid cluster_id PK_FK
        uuid keyword_id PK_FK
        boolean is_primary
    }
    KEYWORD_PAGE_METRICS {
        bigint id PK
        uuid site_id FK
        uuid keyword_id FK
        uuid page_id FK
        date date
        real position "nullable, CHECK 1-1000"
    }
    KEYWORD_PAGE_METRICS_WEEKLY {
        bigint id PK
        uuid keyword_id FK
        uuid page_id FK
        date week_start "CHECK is Monday"
    }
    PAGE_METRICS {
        bigint id PK
        uuid page_id FK
        date date
    }
    PAGE_METRICS_WEEKLY {
        bigint id PK
        uuid page_id FK
        date week_start "CHECK is Monday"
    }
    SYNC_LOG {
        bigint id PK
        uuid site_id FK
        text source "CHECK enum"
        text status "CHECK enum"
        timestamptz completed_at "nullable, CHECK tied to status"
    }
```

#### Final Table List

| Table | Purpose |
|-------|---------|
| `sites` | One row per tracked property |
| `site_configs` | 1:1 scoring weights, conversion events, CTR model per site |
| `topic_clusters` | Manual keyword groupings (ADR-004) |
| `pages` | Every known URL on the site |
| `keywords` | Every known query, GSC-discovered or manually targeted |
| `cluster_keywords` | Many-to-many: keywords ↔ topic_clusters |
| `keyword_page_metrics` | Daily GSC fact table (query × page × day) |
| `keyword_page_metrics_weekly` | Retention-job aggregate, populated Milestone 8 |
| `page_metrics` | Daily GA4 fact table (page × day) |
| `page_metrics_weekly` | Retention-job aggregate, populated Milestone 8 |
| `sync_log` | Every pipeline run — the observability backbone |

11 tables. Matches the Phase 1 scope from the milestone plan exactly; `competitors`, `serp_snapshots`, `internal_links`, `actions`, `action_outcomes`, `api_budgets` remain out of scope (Phase 2/3).

#### Index Summary

| Index | Table | Columns | Query pattern served |
|-------|-------|---------|----------------------|
| `idx_topic_clusters_site` | topic_clusters | (site_id) | Topical Authority Score, per-site cluster iteration |
| `idx_pages_site_cluster` | pages | (site_id, topic_cluster_id) | Topical Authority Score, per-cluster page lookup |
| `idx_keywords_site_target` | keywords | (site_id, is_target) | Opportunity Score, target vs. discovered keywords |
| `idx_cluster_keywords_keyword` | cluster_keywords | (keyword_id) | Reverse lookup: clusters for a given keyword |
| `idx_kpm_site_date` | keyword_page_metrics | (site_id, date) | Cannibalization Score (90d), retention job scan — **confirmed chosen by planner at 32K rows** |
| `idx_kpm_page_date` | keyword_page_metrics | (page_id, date) | Page ROI Score, 30d per-page scan — **confirmed chosen** |
| `idx_kpm_keyword_date` | keyword_page_metrics | (keyword_id, date) | Opportunity Score / CTR Model, 7d per-keyword scan — **confirmed chosen** |
| `idx_pm_site_date` | page_metrics | (site_id, date) | Page ROI Score, per-site scan |
| `idx_sync_site_source` | sync_log | (site_id, source, started_at DESC) | Observability "last run per source" — **confirmed chosen** |

Plus 11 primary-key indexes and 9 unique-constraint indexes (`sites.domain`, `topic_clusters(site_id, name)`, `pages(site_id, path)`, `keywords(site_id, keyword_normalized)`, `keyword_page_metrics(keyword_id, page_id, date)`, `keyword_page_metrics_weekly(keyword_id, page_id, week_start)`, `page_metrics(page_id, date)`, `page_metrics_weekly(page_id, week_start)`), each doing double duty as both a data-integrity constraint and the index that serves the corresponding upsert's `ON CONFLICT` target.

**Deliberately not indexed:** `keyword_page_metrics_weekly` and `page_metrics_weekly` have no index beyond their unique constraint — no Phase 1 query pattern reads them except the retention job's own upsert. A partial index for `sync_log`'s failed/stale-run queries is deferred to Milestone 7, when the actual observability view is built, rather than guessed at now.

#### Constraint Summary

| Category | Count | Examples |
|----------|-------|----------|
| Primary keys | 11 | All tables |
| Foreign keys | 19 | All `ON DELETE CASCADE` except `pages.topic_cluster_id` and `topic_clusters.pillar_page_id`, both `ON DELETE SET NULL` |
| Unique constraints | 9 | `sites.domain`, `topic_clusters(site_id, name)`, `pages(site_id, path)`, `keywords(site_id, keyword_normalized)`, 3× metrics `(keyword_id/page_id, date/week_start)` composites |
| CHECK constraints | 33 | Enum checks (business_type, content_type, search_intent, data_source, source, status), range checks (position 1–1000, ratios 0–1, non-negative counts), JSONB shape checks (`jsonb_typeof`), cross-field checks (`clicks <= impressions`, `week_start` is Monday, `sync_log` status/`completed_at` consistency, `failed` requires `error_message`) |
| Triggers | 9 | `seo_set_updated_at()` on every mutable table (not `sync_log` — see reasoning below) |

**FK cascade behaviour, by intent:**
- `ON DELETE CASCADE` (17 of 19 FKs): child data has no meaning without its parent — deleting a site should delete everything under it; deleting a keyword/page should delete its metrics rows. Includes the "denormalized" `site_id` FKs on the metrics tables, which are redundant with the cascade chain through `keyword_id`/`page_id` but kept for referential-integrity consistency.
- `ON DELETE SET NULL` (2 of 19 FKs): `pages.topic_cluster_id` and `topic_clusters.pillar_page_id` — a page or cluster still means something after losing its cluster/pillar reference, so the relationship is severed rather than the row destroyed.

**CHECK constraints beyond ARCHITECTURE.md's original schema:** all 33 are additions — the architecture document specified column types and a few inline comments describing valid ranges, but did not encode them as SQL constraints. Per this milestone's "prefer explicit constraints over relying on application logic" rule, every range/enum/cross-field rule already documented in ARCHITECTURE.md's prose (§4.1's row validation, §5.x formulas' assumed ranges, the "Monday of the week" comment) is now enforced at the database level as well as the application level (Milestone 5+). This is defense-in-depth, not a design change — nothing here contradicts an documented business rule, it just stops trusting application code alone to uphold it.

#### RLS Summary

- All 11 tables: `ROW LEVEL SECURITY` enabled, **zero policies** for `anon`/`authenticated` (confirmed via `pg_policies` — 0 rows).
- This is default-deny, not default-allow: Postgres RLS with no policy for a role means that role sees/writes nothing, even though (matching Supabase's actual setup) `anon`/`authenticated` hold full `GRANT`-level table privileges. Confirmed empirically — `anon` `SELECT` returns 0 rows on a table proven non-empty via superuser; `anon` `INSERT` is rejected outright.
- `service_role` has Postgres `BYPASSRLS` (set automatically by Supabase) and therefore needs no policy — confirmed it can read and write freely.
- This differs from the four pre-existing public tables (`reservations`, `event_inquiries`, `newsletter_leads`, `contact_messages`), which intentionally have `anon`-insert policies since they're public-facing forms. The SEO tables are server-only by design (ARCHITECTURE.md's RLS note) — no anonymous or client-side access is ever expected.

#### Differences Between Implemented Schema and ARCHITECTURE.md

None of these change any table's purpose, relationship, or the algorithms that read from them — they're schema-hygiene refinements made in direct response to this milestone's explicit "database-first principles" (documented nullability, explicit constraints, timestamps on every table). Listed here per your request, so nothing is silently different from the frozen document:

| Difference | Reasoning |
|------------|-----------|
| Every table gets `created_at`; every table with a column that can change post-insert also gets a trigger-maintained `updated_at` | ARCHITECTURE.md's original schema omitted timestamps on several tables (`keyword_page_metrics`, `page_metrics`, `cluster_keywords`, `topic_clusters`, `pages`). This milestone's rules require timestamps "from the outset" on every table |
| `sync_log` has **no** `updated_at` | Deliberate exception: `completed_at` already captures the row's only mutation (transition to a terminal status). A separate `updated_at` would be redundant and could drift from `completed_at` if unrelated future code touched another field |
| `keywords.data_source` is `NOT NULL` (was nullable) | Every keyword row is created by a specific sync job that always knows its own provenance at write time — no code path exists that would leave this genuinely unknown. Per this milestone's own rule, a nullable column needs a documented reason; none could be found |
| `pages.is_indexed` is `NOT NULL DEFAULT true` (was nullable-with-default) | Three-state booleans (true/false/unknown) are a schema smell when "unknown" isn't a real state the application ever produces |
| `topic_clusters` gets `UNIQUE(site_id, name)` (architecture had no uniqueness rule on cluster names) | Matches the intended business rule — the manual clustering UI (ADR-004) has no use case for two identically-named clusters on one site |
| 33 `CHECK` constraints added (enum, range, cross-field) | See Constraint Summary above — encodes rules ARCHITECTURE.md already stated in prose but left to application code alone |
| `sync_log.source` enum includes `'ping'` and `'retention'` | Flagged in the Milestone 0 write-up; these are Milestone 4/8 job names not anticipated by ARCHITECTURE.md's original comment list. `source` was always an unconstrained `TEXT` column, so this is additive, not a change to an existing constraint |

**Nothing here required stopping to discuss per your rule 6/7** — these are constraint tightening and hygiene, not a "significantly better approach" to the data model itself. If you'd rather any of these be loosened back to match ARCHITECTURE.md exactly (e.g., keep `data_source` nullable for future-proofing against a sync path I haven't thought of), say so and I'll revert that specific one — they're each independent, cheap to change.

### Status: CLOSED

**Completed:** 2026-07-18. Migration applied to production Supabase by Paul Kelvin; 28/28 production verification checks passed (all tables, seed data, RLS deny/allow, 8 distinct constraint types, cascade design). Index/constraint catalog-level closure is inferred from a clean production apply of the byte-identical, locally-proven DDL rather than directly queried (no raw Postgres access available) — optional paste-back query offered above if full empirical closure is wanted before Milestone 2. No architectural changes to ARCHITECTURE.md; all schema deltas from the original document are documented, reasoned, and reversible on request.

---

## Milestone 2 — Config & Secrets

**Objective:** Wire GSC/GA4 credentials safely with fail-fast validation, before any job tries to use them.

**Tasks:**
- [x] Implement `src/lib/seo/config.ts`: Zod schemas for GSC, GA4, and cron secret config
- [x] Implement `getGscConfig()` / `isGscConfigured()`, `getGa4Config()` / `isGa4Configured()` (mirrors `isSupabaseConfigured()`) — plus `getCronSecret()` / `isCronSecretConfigured()`, folded into this milestone since the task list already scoped "cron secret config" in and Milestone 4's cron routes need it read the same way
- [x] Implement `normalizePrivateKey()` — handles both literal `\n` and real-newline PEM key formats
- [x] Document exact env var setup (service account creation, property verification) — added as `DEPLOYMENT.md` §8 rather than an appendix in this document, matching where the equivalent Sanity/Supabase/Analytics setup steps already live (consistency over introducing a second setup-doc location)
- [x] Update `.env.example` with real variable names and comments (already stubbed in Milestone 0, refined here)

**Dependencies:** Milestone 0.

**Expected outputs:** `src/lib/seo/config.ts` fully implemented and unit-tested. No job code yet depends on it (that's Milestones 4–6).

**Database changes:** None.

**Files created/modified:**
- `src/lib/seo/config.ts`
- `src/lib/seo/config.test.ts`
- `.env.example`
- `DEPLOYMENT.md` (§8, GSC/GA4 service account setup)

**Tests performed (13 unit tests via Vitest, all passing):**
- [x] Valid full GSC config → parses correctly, values round-trip including normalized private key
- [x] Valid full GA4 config → same
- [x] Missing required var (GSC `propertyUrl`, GA4 `propertyId`) → `isXConfigured()` returns `false`, confirmed not to throw
- [x] Malformed private key (missing PEM header) → `getGscConfig()`/`getGa4Config()` throw with a message naming the field and the specific problem
- [x] Invalid `clientEmail` → throws naming the field
- [x] Invalid `propertyUrl` → `isGscConfigured()` returns `false`
- [x] `normalizePrivateKey()`: literal `\n` → real newlines, confirmed exact output
- [x] `normalizePrivateKey()`: idempotent on a key that already has real newlines
- [x] Cron secret: unset → `isCronSecretConfigured()` false, `getCronSecret()` throws; set → both work; empty string → treated as unset

**Success criteria (DoD):**
- [x] `npm test` — 13/13 passing, covers all four originally-specified cases plus the additional edge cases above
- [x] Grep-verified: no code outside `config.ts` reads `process.env.GSC_*`/`GA4_*`/`CRON_SECRET` directly (only `config.test.ts`, which is expected — it's exercising the module)
- [x] `npm run lint` — clean on the new files; repo-wide, same 2 pre-existing unrelated issues as Milestones 0/1
- [x] `npm run build` — succeeds

**Deviations from plan:**
- Added `isCronSecretConfigured()`/`getCronSecret()` even though not called out in this milestone's original "Files"/"Tests" bullets — the Tasks list already said "Zod schemas for GSC, GA4, **and cron secret config**", and mirroring the exact same pattern now means Milestone 4's cron routes read it through `config.ts` from day one rather than reaching for `process.env.CRON_SECRET` directly and creating exactly the inconsistency ENGINEERING_STANDARDS.md §7 rules out.
- Env var setup documentation went into `DEPLOYMENT.md` §8 (new section, correctly renumbered — the existing Post-Deploy Checklist shifted from §8 to §9) instead of "this document's runbook appendix" as originally planned. `PHASE_1_IMPLEMENTATION.md` doesn't otherwise contain operational setup instructions (that's what `DEPLOYMENT.md` and, as of this milestone, `DATABASE_OPERATIONS.md` are for) — putting it there would have split "how to deploy this app" across two documents for no benefit. Verified the documented `npx tsx -e "..."` verification snippet actually runs and produces the claimed output before writing it into the doc.

**New risks/trade-offs discovered:** None beyond what was already anticipated. The GSC/GA4 service-account setup itself (the fiddly part) is still ahead of us in Milestone 5 — this milestone only proved the config-parsing side is solid.

**Risks & rollback:**
- Risk: GSC/GA4 service account setup is fiddly and can take 2-3 days per ARCHITECTURE.md's own risk note (domain property verification, correct API scopes). Mitigation: this milestone only wires config parsing — actual auth is proven in Milestone 5, isolating the two risks.
- Rollback: this module has no side effects; safe to revert independently.

**Completed:** 2026-07-18.

---

## Milestone 3 — Logger + sync_log Writer

**Objective:** Build the observability foundation *before* any real job exists, so every subsequent job is instrumented from its first line of code rather than retrofitted.

**Tasks:**
- [x] Implement `src/lib/seo/logger.ts` — structured JSON logger with `debug/info/warn/error` levels, plus best-effort redaction of credential-shaped field names (a hardening beyond the original task list, cheap and directly enforces ENGINEERING_STANDARDS.md §4's "never log secrets" rule at the infrastructure level rather than caller discipline alone)
- [x] Implement `src/lib/seo/sync-log.ts`:
  - `startSyncRun(siteId, source, endpoint?)` → inserts a `sync_log` row with `status = 'started'`, returns the row id
  - `completeSyncRun(runId, { status, recordsProcessed, apiCreditsUsed, errorMessage, metadata })` → updates the row with final status (see "A Real Bug Found and Fixed" below for why `completed_at` isn't in this list)
  - Guarantee honored: both are meant to be called from the `try/catch` pattern documented in ENGINEERING_STANDARDS.md §3, shown as a worked example in `sync-log.ts`'s own header comment
- [x] `metadata` JSON shape already existed as `SyncMetadata` in `types.ts` (Milestone 0) — reused as-is, defaults filled in by `completeSyncRun` for any field the caller omits

**Dependencies:** Milestone 1 (`sync_log` table), Milestone 0.

**Expected outputs:** `sync-log.ts` fully implemented and integration-tested against the real production Supabase project.

**Database changes:** Two new forward-only migrations (unplanned at the start of this milestone — see below):
- `20260719000000_sync_log_server_side_completed_at.sql` — `BEFORE UPDATE` trigger forcing `sync_log.completed_at` to the database's own `now()`
- `20260719193100_harden_trigger_function_search_path.sql` — pins `search_path = ''` on both trigger functions (this one and Milestone 1's `seo_set_updated_at()`), per a Supabase security advisor finding

**Files created/modified:**
- `src/lib/seo/logger.ts`, `logger.test.ts` (7 unit tests)
- `src/lib/seo/sync-log.ts`, `sync-log.integration.test.ts` (3 integration tests, real Supabase)
- `src/lib/supabase/server.ts` — added `createSupabaseServiceRoleClient()` (see "Implementation Decision" below); pre-existing `createSupabaseServerClient()`/`isSupabaseConfigured()` untouched
- `package.json` — added `test:integration` script (`RUN_INTEGRATION_TESTS=1 vitest run`)
- `supabase/migrations/20260719000000_sync_log_server_side_completed_at.sql` (new)
- `supabase/migrations/20260719193100_harden_trigger_function_search_path.sql` (new)
- `docs/seo-platform/decisions/ADR-009-server-side-timestamps.md` (new)
- `docs/seo-platform/DATABASE_OPERATIONS.md` — documented a third database-access path (Supabase MCP connector) that became available mid-milestone

**Implementation decision — a new `createSupabaseServiceRoleClient()`:** the existing `createSupabaseServerClient()` (used by the public form tables) silently falls back to the anon key if the service-role key is absent. SEO tables have zero anon/authenticated RLS policies (Milestone 1), so an anon-key client would be blocked on every one of them — a confusing, far-from-its-cause failure. Added a dedicated function to the existing shared file that throws immediately and clearly if `SUPABASE_SERVICE_ROLE_KEY` is missing, rather than degrading silently. Small, additive, doesn't change the existing function's behavior.

**Tests performed:**
- 7 unit tests (`logger.test.ts`): JSON shape per level, `debug()` suppressed in production/emitted otherwise, credential-shaped field redaction, no-context calls don't throw
- 3 integration tests (`sync-log.integration.test.ts`, real production Supabase, `RUN_INTEGRATION_TESTS=1`):
  - `startSyncRun` → `completeSyncRun('completed')` produces a correct row, defaults filled in for omitted metadata fields
  - `startSyncRun` → simulated throw → `completeSyncRun('failed', ...)` produces a row with `error_message` set
  - Two concurrent `startSyncRun` calls for the same source → two distinct row ids, both queryable
  - All test rows tracked by id and deleted in `afterAll` regardless of pass/fail; production `sync_log` confirmed back to 0 rows after every run
- **Final result: 20/20 unit tests, 23/23 total including integration** (`npm test` + `npm run test:integration`)
- Both new migrations validated locally (full sequence, fresh DB) before being applied to production
- Search-path hardening specifically re-verified post-application: `updated_at` trigger still advances correctly; `completed_at` override still works; `pg_proc.proconfig` confirms `search_path=""` pinned on both functions

**Success criteria (DoD):**
- [x] A full start→complete→fail cycle is correctly queryable in `sync_log` — proven against real production, not a throwaway script (upgraded from the original plan once integration testing was actually possible)
- [x] `sync-log.ts` is the only module that writes to `sync_log` (unchanged from the design — no other code touches this table)

**New risks/trade-offs discovered:** covered in detail below — the clock-skew bug and its fix. Residual risk: the crash-mid-job case (a row stuck in `'started'` forever) is still open by design, deferred to Milestone 7's `stale_datasets` view, exactly as originally planned.

**Risks & rollback:**
- Risk: a job crash that bypasses even the `catch` block (e.g., process killed) leaves a row stuck in `"started"` — accepted, handled by the `stale_datasets` view in Milestone 7, not solved here.
- Rollback: `sync-log.ts`/`logger.ts` are additive, safe to revert independently. The two new migrations are also additive (a function + a trigger) — rollback would be `DROP TRIGGER sync_log_set_completed_at ON sync_log; DROP FUNCTION seo_set_sync_log_completed_at();` plus reverting the two `ALTER FUNCTION ... SET search_path` calls, though there's no reason to want to.

### A Real Bug Found and Fixed: `sync_log` Clock-Skew Race

While integration-testing `completeSyncRun('failed', ...)` against real production, a genuine bug surfaced — not a test artifact. `completeSyncRun` computed `completed_at` client-side (`new Date().toISOString()`), compared by `sync_log_completed_after_started_check` against `started_at`, which the *database* computes independently via `DEFAULT now()`. With ~150ms of real elapsed wall-clock time between the `INSERT` and the `UPDATE` (two separate network round-trips, not a same-transaction artifact like a similar-looking false positive in Milestone 1), the constraint still failed — meaning this session's clock and Supabase's Postgres host clock disagreed by more than that gap. In a real deployment (Vercel app, Supabase DB — always different machines), this could have intermittently misreported a successful sync as a crash, undermining the exact reliability Milestone 3 exists to build.

Per your standing instruction, this was **not** fixed silently — I stopped, explained the finding, presented four options, and you chose the recommended one: a `BEFORE UPDATE` trigger that forces `completed_at = now()` server-side whenever `status` moves away from `'started'`, so both timestamps are always computed by the same clock. Full reasoning in **ADR-009**.

**Fix validated three ways**, escalating in rigor as tooling became available mid-milestone:
1. Locally (fresh Postgres, full migration sequence) — deliberately sent a `completed_at` 10 seconds *before* `started_at`; trigger overrode it, invariant held.
2. Directly against production via the newly-connected Supabase MCP connector — same 10-second-backdate test, run as raw SQL against the real database, same result.
3. End-to-end through the actual application code path — re-ran the full integration suite; the previously-failing test now passes, 23/23.

### A Second Finding, Enabled by New Tooling: `search_path` Hardening

Partway through this milestone, you connected a Supabase MCP connector in this session, which — for the first time — gave direct SQL/DDL access to production from within the session (previously blocked at the network-policy level; see the updated "A Note on Environment Access" in `DATABASE_OPERATIONS.md`). Used `get_advisors` to sanity-check the clock-skew fix and it surfaced a real, separate, actionable finding: both `seo_set_updated_at()` (Milestone 1) and the new `seo_set_sync_log_completed_at()` were flagged `WARN` for a mutable `search_path` — a standard Postgres/Supabase security hardening, unrelated to the clock-skew issue.

Unlike the clock-skew fix, this didn't need a stop-and-discuss: it's a single well-known remediation (`ALTER FUNCTION ... SET search_path = ''`) with no behavioral trade-off, directly recommended by Supabase's own linter. Fixed via a third forward-only migration, validated locally first, then applied and re-verified against production (both triggers re-tested, advisor re-run, warnings gone). Everything else `get_advisors` reported is either the intended RLS design (`rls_enabled_no_policy` on all 11 SEO tables — exactly Milestone 1's default-deny design) or pre-existing, unrelated behavior on the four public form tables (`rls_policy_always_true` — deliberate anonymous-insert policies, predates the SEO platform) or already-documented Milestone 1 deferrals (`unindexed_foreign_keys`/`unused_index` on tables with no Phase 1 query pattern yet).

This also closed a loose end from Milestone 1: the index/constraint catalog dump I could only offer as a paste-back query before (no direct SQL access at the time) was run for real this time — all 28 indexes confirmed present, matching Milestone 1's documentation exactly.

### Status: CLOSED

**Completed:** 2026-07-19. Logger and sync-log primitives implemented, integration-tested against real production (23/23 passing), one genuine architectural bug found and fixed with your explicit sign-off (ADR-009), one additional security hardening applied opportunistically once tooling allowed it, and a Milestone 1 verification gap closed as a side effect. No changes to ARCHITECTURE.md — the sync_log table's documented columns and business semantics are unchanged; only how `completed_at` gets populated changed, which is an implementation detail already covered by the Data Pipeline section, not a design element.

---

## Milestone 4 — Cron Infrastructure Proof ("ping" job)

**Objective:** Prove the full path — Vercel Cron → API route → auth → job → `sync_log` — end-to-end with a trivial job, isolating infrastructure risk from GSC/GA4 API complexity before either is built.

**Tasks:**
- [x] Implement `src/app/api/seo/sync/ping/route.ts`: checks the cron secret, calls `startSyncRun`/`completeSyncRun` with a fixed 1-second delay, returns JSON
- [x] Populate `vercel.json` crons block with the ping job (`17 3 * * *` — 3:17am UTC, an off-the-hour minute; deliberately deferred since Milestone 0 since JSON can't hold a "commented-out" stub)
- [x] Document manual curl trigger — Runbook Appendix, above
- [x] Confirm Vercel's actual function timeout limits — Runbook Appendix, above. **Confirmed: Hobby plan.** No Vercel account access in this session to check it directly (no token, no MCP connector, no `.vercel/` project link — checked all three) — Paul confirmed it directly.

**Dependencies:** Milestones 1–3.

**Expected outputs:** A working, cron-triggerable endpoint with a proven auth boundary, verified locally end-to-end against real production Supabase. **Not yet verified against an actual live Vercel deployment** — that needs you to deploy and confirm the schedule fires (see DoD below).

**Database changes:** None.

**Files created/modified:**
- `src/app/api/seo/sync/ping/route.ts`, `route.test.ts` (7 unit tests)
- `src/lib/seo/site.ts`, `site.test.ts` (4 unit tests) — new, unplanned addition, see "Implementation Decision" below
- `vercel.json` (created — deferred since Milestone 0)
- `docs/seo-platform/ARCHITECTURE.md` §7 — corrected (see "A Real Finding: Cron Auth Mechanism" below)

**Implementation decision — `getPrimarySiteId()`:** neither ARCHITECTURE.md nor this plan specified how a sync job resolves *which* site to operate on. ARCHITECTURE.md's own ADR-003 already settled the relevant question — "Build for one, design for many," Phase 1 targets a single site even though the schema is multi-site-ready — so this is implementing an already-approved decision, not making a new one. Added `src/lib/seo/site.ts`'s `getPrimarySiteId()`: queries `sites`, returns the one row's id, and throws a clear, descriptive error if zero or more than one site exists (a Phase 1 assumption stated in the code, not a hidden TODO — revisit when Phase 4 actually builds multi-site sync).

**Tests performed:**
- 7 unit tests (`route.test.ts`, mocked I/O): no header → 401, wrong secret → 401, secret configured-but-header-missing → 401, malformed header (no `Bearer` prefix) → 401, correct secret → 200 + calls `startSyncRun`/`completeSyncRun` in order, `completeSyncRun` throwing mid-job → marked failed with the error message, `startSyncRun` itself throwing → 500 without attempting `completeSyncRun`
- 4 unit tests (`site.test.ts`, mocked Supabase client): one site → returns its id, zero sites → clear error, multiple sites → clear error, query failure → surfaces the underlying error message
- **Real, unmocked end-to-end verification** (not just unit tests): built the app (`npm run build`), ran it locally (`npm run start`) with a real generated `CRON_SECRET`, and curled it against real production Supabase (via this shell's existing env vars) —
  - No `Authorization` header → `401 {"error":"Unauthorized"}`
  - Wrong secret → `401`
  - Wrong-length secret (exercises the `timingSafeEqual` length guard specifically, not just a value mismatch) → `401`
  - Header present but missing the `Bearer ` prefix → `401`
  - Correct secret → `200 {"ok":true,"runId":19}`, and the resulting `sync_log` row was fetched directly via SQL and confirmed exactly correct: `source='ping'`, `endpoint='smoke-test'`, `status='completed'`, `completed_at` ≈1.18s after `started_at` (matching the 1s delay plus real work), `records_processed=0`, `metadata` defaults all correctly filled
  - Test row deleted afterward; production `sync_log` confirmed back to 0 rows
- **Final result: 31/31 unit tests** (`npm test`) **+ full manual production round-trip verified**
- `npm run lint` / `npm run build` — clean (same 2 pre-existing unrelated issues as every prior milestone)

**Success criteria (DoD):**
- [x] A full round trip (route → auth → job → `sync_log`) proven working against real production data, before any GSC/GA4 integration code exists
- [x] Vercel's timeout limits documented from current official sources — **confirmed: Hobby plan**, meaning 300s (5 min) is both the default and the hard ceiling per function, no headroom beyond that
- [ ] **Post-deploy dashboard confirmation that the cron actually fires on schedule** — cannot be done from this session (no live deployment, no Vercel account access). This is the one item that genuinely requires you to deploy and check, same shape as the Supabase migration applications in Milestones 1 and 3.

**Risks & rollback:**
- Risk: Vercel Cron has plan-dependent limits — confirmed Hobby restricts cron to once-per-day scheduling (irrelevant here, the ping job is already daily) and a 300s/5min function ceiling (Phase 1 jobs all fit).
- Risk: Vercel Cron does not retry on failure — confirmed directly from Vercel's current documentation (not assumed), reinforcing why retries live inside the job itself (ENGINEERING_STANDARDS.md §6, first built in Milestone 5).
- **New, confirmed platform fact relevant to Milestone 5/6:** Vercel's cron delivery is explicitly *best-effort* and can invoke the same scheduled run more than once, or (rarely) not at all — their own docs recommend idempotent, reconciliation-based job design. This validates, after the fact, a design choice already made in ARCHITECTURE.md's Deduplication Strategy (`ON CONFLICT DO UPDATE` upserts) — no change needed, just confirms it was the right call for a platform-specific reason not originally cited as the reason.
- Rollback: delete the route and the `vercel.json` entry; no data dependencies.

### A Real Finding: Cron Auth Mechanism Didn't Match ARCHITECTURE.md

ARCHITECTURE.md §7 originally sketched a custom `x-cron-secret` header, checked *in addition to* the same HTTP Basic Auth used by `/admin`, on every `/api/seo/*` route. Before writing the route, I checked Vercel's current documentation rather than assume this was still accurate — `AGENTS.md` itself warns this environment's platform conventions may have moved past training data, and Vercel Cron specifically has: Vercel never sends a custom header, and Vercel's cron invoker never sends Basic Auth credentials at all. When a `CRON_SECRET` env var is set on the project, Vercel automatically sends it as `Authorization: Bearer <CRON_SECRET>` — a *different* header, and requiring Basic Auth in addition would have made the route permanently uncallable by Vercel's own cron system.

This isn't a design trade-off with multiple reasonable answers — it's an external platform fact with one correct resolution — so I corrected ARCHITECTURE.md §7 directly rather than treating it as a stop-and-discuss: cron-triggered routes use `CRON_SECRET` only (Vercel's actual mechanism); human-facing mutation routes and the future `/api/seo/status` endpoint use Basic Auth (unaffected, unchanged); the CMS webhook route uses its own signature scheme (unaffected, unchanged). Full corrected text and reasoning in ARCHITECTURE.md §7 itself. Flagging it here per your standing instruction to surface anything implementation reveals about the architecture, even when the resolution itself doesn't need a decision from you.

### Status: CLOSED

**Completed:** 2026-07-19. Vercel plan confirmed (Hobby — 300s/5min function ceiling, applies as a hard constraint to Milestone 5b's backfill chunking). `claude/exciting-johnson-nddaq1` merged into `main` and deployed to production with Paul's explicit go-ahead (a Vercel MCP connector became available, changing what's possible from this session — see below); confirmed via `curl https://www.naijagrillandspice.co.uk/api/seo/sync/ping` → `401 {"error":"Unauthorized"}`, proving the route is live (a real 401 for the right reason — no `CRON_SECRET` set yet — not a deployment failure). Runtime logs on the new deployment show zero errors.

**One item only Paul can complete:** setting `CRON_SECRET` in the Vercel dashboard (Project → Settings → Environment Variables) — this Vercel MCP connector has no environment-variable management tool at all (checked the full tool list), so this genuinely cannot be automated from here. Once set, Vercel's own scheduler takes over with zero further action — the next fire is `17 3 * * *` (3:17am UTC daily), and its result will be checkable via Vercel runtime logs or the Cron Jobs dashboard page without needing the secret's value.

### A Note on This Session's Growing Vercel Access

Milestone 4 was originally closed with "no Vercel access in this session" as a stated limitation (no token, no MCP connector, no `.vercel/` project link). Paul then connected a Vercel MCP connector mid-conversation, which is what made the merge-and-deploy step above possible at all. Before using it: confirmed which of the account's many Vercel projects was `naijagrillandspice.co.uk` (`prj_cqYkcBwQ0VZiisV1ppxFgx7MacCh`, named `naijagrill-uk`) rather than guessing, and confirmed the diff being merged touched zero existing site pages/components before asking Paul to approve the production deploy — the only new production-facing surface is the inert `/api/seo/sync/ping` route itself. This mirrors exactly how Supabase access grew earlier in the project (Milestone 1's PostgREST-only verification → Milestone 3's full SQL access once that connector was added) — each new tool connection is used as it becomes available, with the same verification rigor, not assumed in advance.

---

## Milestone 5 — GSC Sync Job

**Objective:** Pull real Search Console data, normalise it, and upsert it idempotently — the first real data flowing through the pipeline.

**Tasks:**
- [x] Implement `src/lib/seo/normalize.ts`: keyword normalization (ADR-008 rules) and URL normalization (ARCHITECTURE.md §3 rules) as pure, heavily-tested functions
- [x] Implement `src/lib/seo/gsc/client.ts`: JWT service-account auth, `searchanalytics.query` with pagination (25,000-row pages)
- [x] Implement `src/lib/seo/gsc/sync.ts`: orchestrates fetch → normalize → validate → upsert `keywords`/`pages`/`keyword_page_metrics` → wraps in `startSyncRun`/`completeSyncRun`
- [x] Implement row validation: reject `position < 1 or > 1000`, reject `clicks > impressions`, count rejects into `metadata.rejected_rows`
- [x] Implement `src/app/api/seo/sync/gsc/route.ts` (thin adapter over `sync.ts`)
- [x] **Milestone 5b:** first-sync backfill variant — `src/lib/seo/gsc/backfill.ts` + `src/app/api/seo/sync/gsc/backfill/route.ts`, chunked to Hobby's confirmed 300s ceiling (Milestone 4), resumable via `nextStartDate`

**Dependencies:** Milestones 1–4.

**Expected outputs:** Real keyword/page/metric rows in the database, sourced from the live GSC property. **Not yet achieved** — see "Code Complete, Integration Verification Pending" below.

**Database changes:** None (uses Milestone 1 tables).

**Files created:**
- `src/lib/seo/normalize.ts`, `normalize.test.ts` (26 tests)
- `src/lib/seo/gsc/client.ts`, `client.test.ts` (11 tests, including real RSA signature verification)
- `src/lib/seo/gsc/sync.ts`, `sync.test.ts` (9 tests)
- `src/lib/seo/gsc/backfill.ts`, `backfill.test.ts` (6 tests)
- `src/app/api/seo/sync/gsc/route.ts`, `route.test.ts` (5 tests)
- `src/app/api/seo/sync/gsc/backfill/route.ts`, `route.test.ts` (6 tests)
- `src/lib/seo/retry.ts`, `retry.test.ts` (6 tests, used here for the first time)

**Tests performed:**
- [x] Unit: `normalize.ts` — casing, whitespace collapse, leading article stripping, preposition preservation (confirmed "in" is never stripped), trailing slash removal, query param stripping, `www.` stripping, root path edge case, malformed-URL error — all 26 passing
- [x] Unit: validation rejects out-of-range position and `clicks > impressions` without aborting the batch — confirmed in `sync.test.ts`
- [x] Unit: `client.ts`'s JWT is cryptographically verified against a real (throwaway, test-only) RSA key pair — not just "looks like a JWT," the signature is actually checked with `crypto.verify()`
- [x] Unit: pagination (25,000-row page triggers a second request with `startRow=25000`), 429/5xx/network-error retry (via mocked `fetch`), exactly-one-re-auth-then-fail-fast on repeated 401/403, non-retryable 400 fails immediately — all against a mocked `fetch`, no real network calls
- [x] Unit: `backfill.ts`'s time-budget cutoff — precisely controlled via a mocked clock, confirms it stops mid-range and returns the correct `nextStartDate`, and that a resumed chunk starting from that date continues correctly
- [x] Unit: one failing day within a backfill range is recorded and skipped, not fatal to the rest of the range
- **Not performed — genuinely cannot be, no real credentials exist yet:**
  - Integration: run the job twice against the same date → idempotency proof against a real database
  - Integration: real curl trigger against the live GSC property → real rows appear
  - 16-month backfill actually run and cross-checked against GSC's own UI totals
  - Pagination path exercised against real data >25,000 rows/day (would need to be watched for once real syncs are running, regardless of credentials timing)

**Success criteria (DoD):**
- [ ] Two consecutive runs for the same day produce zero duplicate rows — **logic is upsert-based and unit-tested, but not proven against a real database yet**
- [ ] `sync_log` accurately reflects `records_processed`, duration, and any rejected rows — **same caveat**
- [ ] 16-month backfill completed at least once, confirmed against GSC's own UI totals — **blocked entirely on credentials existing**
- [ ] `ARCHITECTURE.md`'s "16-month retention" risk is retired — **not yet; GSC's 16-month window keeps ticking until a real backfill actually runs**

**Risks & rollback:**
- Risk (flagged in ARCHITECTURE.md itself): service-account auth setup, budget 2-3 days. **Materialized in practice** — Paul hit a real, undocumented-by-us blocker (an Organization Policy Administrator/Organization Administrator role split in Google Cloud, plus a project-vs-organization IAM scoping issue, plus a legacy-vs-managed constraint migration) that took multiple screenshot-guided rounds to resolve. Not finished as of this write-up — credentials don't exist yet.
- Risk: backfill duration vs. Vercel timeout. Mitigated exactly as planned: `runBackfillChunk` processes oldest-first, checks elapsed time before each day, and returns `nextStartDate` for the caller to resume — verified with a precisely controlled fake clock, not just reasoned about.
- Rollback: `DELETE FROM keyword_page_metrics WHERE site_id = ...` is safe and non-cascading to other tables; re-run the sync to repopulate. Applies equally to backfill data (tagged `metadata.backfill = true` for anyone auditing later which rows came from which path).

### Code Complete, Integration Verification Pending

Per your instruction to proceed without waiting for credentials ("we'll do all the api keys thing later... just do your job"): everything in this milestone that *can* be built and proven without a real GSC service account has been — 100 total unit tests (up from 66 before this milestone), all passing, including genuinely rigorous ones (real cryptographic signature verification on the JWT, a precisely clocked time-budget cutoff test, mocked-`fetch` coverage of every retry/auth-failure path). `npm run lint` and `npm run build` both clean.

**What this milestone is explicitly not claiming:** that any of this has talked to the real Google Search Console API. That's a categorically different kind of verification from unit tests with mocked HTTP responses, and I won't blur that line — same discipline as every other milestone in this project (Milestone 1 was explicit about "locally-verified against a faithful replica" vs. production-verified; this is the same distinction, one level further removed since there's no live credential to test against at all yet).

**Two genuinely new architectural decisions made during this milestone**, neither requiring a stop-and-discuss since both directly implement already-approved designs rather than introducing new trade-offs:
1. **Direct HTTP + hand-rolled JWT signing, no `googleapis` SDK** — implements ARCHITECTURE.md's own stated Technology Stack choice ("No SDK dependencies where avoidable"). Verified Google's current JWT-bearer OAuth2 flow and `searchanalytics.query` REST contract against their live documentation rather than trusting training data.
2. **`GscAuthError` as a third error category alongside `RetryableError` and plain `Error`** — `retry.ts`'s generic retry primitive doesn't know about re-auth; `gsc/client.ts` classifies 401/403 separately and handles exactly-one-re-auth-then-fail-fast itself, matching ENGINEERING_STANDARDS.md §6's specific wording for this case.

**When credentials exist:** re-open this milestone (don't silently mark it done) — run the daily sync once via curl, confirm real rows appear and match Search Console's own UI, run it a second time to prove idempotency for real, then run the backfill (expect several chunked invocations for the full 16 months) and cross-check totals. Only then are the DoD boxes above allowed to be checked.

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

- GSC/GA4 service account creation steps: `DEPLOYMENT.md` §8 (Milestone 2)
- Manual curl commands for each sync route:
  - `/api/seo/sync/ping` (Milestone 4):
    ```bash
    curl -H "Authorization: Bearer $CRON_SECRET" https://<your-deployment>/api/seo/sync/ping
    ```
    Matches exactly what Vercel Cron itself sends (`Authorization: Bearer <CRON_SECRET>`, GET) — see "Vercel Platform Findings" below. A 401 with no/wrong header, 200 with a `runId` and a real `sync_log` row on success.
- **Vercel plan timeout limits — confirmed from Vercel's current documentation** (fetched during Milestone 4, not assumed from training data, per `AGENTS.md`'s own warning that this environment's platform conventions may have moved) **and this account's actual plan confirmed directly by Paul: Hobby.** With Fluid Compute (Vercel's current default), Hobby allows up to 300s (5 min) per function — this is both the default *and* the maximum, no more headroom available; every Phase 1 job (GSC/GA4 daily sync, weekly retention) fits comfortably within it. Milestone 5b's 16-month GSC backfill must be chunked to fit inside this same 300s ceiling per invocation — a firm constraint now, not a "confirm later" placeholder. Hobby also caps cron jobs at once-per-day scheduling (irrelevant here — every Phase 1 cron job is already daily or less frequent) and only guarantees firing "within the specified hour," not the exact minute.
