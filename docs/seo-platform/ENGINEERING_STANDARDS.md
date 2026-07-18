# SEO Intelligence Platform — Engineering Standards

> **Status:** Living document. Applies to all phases of the SEO platform.
> **Last updated:** 2026-07-18
> **Owner:** Paul Kelvin

These standards extend (never contradict) the conventions already used in the NaijaGrill codebase — Server Actions with `"use server"`, `isXConfigured()` guards, kebab-case files, snake_case SQL. Where the existing codebase already has a working pattern (e.g. `isSupabaseConfigured()` in `src/lib/supabase/server.ts`), the SEO platform reuses it rather than inventing a parallel one.

---

## 1. Folder Structure

```
src/
  app/
    api/seo/
      sync/ping/route.ts          # infra smoke test (Milestone 4)
      sync/gsc/route.ts           # GSC sync trigger
      sync/ga4/route.ts           # GA4 sync trigger
      retention/run/route.ts      # weekly archival job
      status/route.ts             # observability endpoint
    admin/seo/                     # deferred to final Phase 1 milestone
  lib/seo/
    config.ts                      # env var validation, isXConfigured() guards
    logger.ts                      # structured JSON logger
    sync-log.ts                    # sync_log read/write helpers
    retry.ts                       # shared withRetry() helper
    normalize.ts                   # keyword + URL normalization (pure functions)
    types.ts                       # shared TypeScript types for the SEO domain
    gsc/
      client.ts                    # GSC API client (auth + searchanalytics.query)
      sync.ts                      # orchestration: fetch → normalize → upsert
    ga4/
      client.ts
      sync.ts
    retention/
      run.ts

supabase/migrations/
  <timestamp>_seo_platform_core.sql
  <timestamp>_seo_observability_views.sql
  ...

docs/seo-platform/
  ARCHITECTURE.md
  CHANGELOG.md
  ENGINEERING_STANDARDS.md
  PHASE_1_IMPLEMENTATION.md
  decisions/ADR-*.md
```

**Rule:** Route handlers under `src/app/api/seo/*` are thin adapters only — auth check, call a function from `src/lib/seo/*`, return JSON. All real logic lives in `src/lib/seo/*` so it can be unit-tested without mocking `NextRequest`.

Test files are colocated with source (`normalize.ts` → `normalize.test.ts`), matching how a small codebase stays navigable — no parallel `tests/` tree to keep in sync.

---

## 2. Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| TypeScript files | kebab-case | `sync-log.ts` |
| React components | PascalCase | `SyncStatusCard.tsx` |
| Functions, variables | camelCase | `startSyncRun()` |
| DB tables, columns | snake_case | `keyword_page_metrics` |
| SQL migration files | `YYYYMMDDHHMMSS_snake_case_description.sql` | `20260719000000_seo_platform_core.sql` |
| Env vars | `SCREAMING_SNAKE_CASE`, prefixed by source | `GSC_PRIVATE_KEY`, `DATAFORSEO_LOGIN` |
| API routes | `/api/seo/<domain>/<action>` | `/api/seo/sync/gsc` |
| Config guards | `isXConfigured()` boolean | `isGscConfigured()` |

---

## 3. Error Handling Strategy

- **Sync jobs never throw uncaught.** Every job wraps its body in `try/catch/finally`. The `finally` (or catch, re-throw pattern below) always closes out the `sync_log` row — a job that crashes without logging its own failure is worse than one that fails loudly.

```ts
const run = await startSyncRun(siteId, "gsc", "searchanalytics.query");
try {
  const result = await doSync();
  await completeSyncRun(run.id, { status: "completed", recordsProcessed: result.count });
  return result;
} catch (err) {
  await completeSyncRun(run.id, { status: "failed", errorMessage: toErrorMessage(err) });
  throw err; // surfaces as a 500 to the caller/cron for visibility
}
```

- **Expected vs unexpected errors are handled differently:**
  - Row-level validation failures (bad `position`, `clicks > impressions`) → log and skip the row, keep processing, record the count in `sync_log.metadata.rejected_rows`. Never abort a whole sync over one bad row.
  - Auth/network/5xx errors → retry per the Retry Strategy (§6), then fail the whole run if retries are exhausted.
- Every `catch` block logs via `logger.error(...)` with context (source, run id, keyword/page if relevant). No silent swallowing.
- API routes return a consistent error shape: `{ error: string, code: string }` with an appropriate HTTP status (401 for auth, 400 for bad input, 500 for unexpected).

---

## 4. Logging Strategy

- **Structured JSON to stdout**, one object per line — Vercel captures stdout automatically, no logging service needed at this scale.

```ts
logger.info("gsc_sync_completed", { siteId, runId, recordsProcessed: 1247, durationMs: 8214 });
```

- **Levels:** `debug` (local dev only), `info` (job start/complete, row counts), `warn` (budget threshold crossed, stale dataset detected, rows rejected), `error` (job failed, auth failed).
- **Never log secrets** (private keys, tokens, passwords) — not even at `debug`.
- Two logging layers exist for two different questions:
  - **Console/stdout logs** → "what happened right now" (real-time debugging via Vercel's log viewer).
  - **`sync_log` table** → "what happened historically, queryable" (the durable record the Observability layer reads from). The console log is ephemeral; `sync_log` is the source of truth for the 8 observability questions in §9.

---

## 5. Background Job Architecture

```
Vercel Cron (vercel.json) → API route (/api/seo/*) → CRON_SECRET check
    → job function (src/lib/seo/*) → sync_log wrapper → JSON response
```

- Each job is a **pure async function** independent of the HTTP layer — testable by calling it directly in a unit/integration test, no `NextRequest` mocking required.
- Jobs are **idempotent** by construction (upsert on the schema's unique constraints — see ARCHITECTURE.md §4 "Deduplication Strategy"). Safe to re-run manually, safe if a cron fires twice.
- **Timeouts:** confirm the Vercel plan's function timeout before building the GSC backfill job (Hobby: 10s default / 60s max with `maxDuration`; Pro: up to 300s). The 16-month backfill (Milestone 5b) may need chunking into multiple invocations if the timeout is short — flagged as an open risk in PHASE_1_IMPLEMENTATION.md.

---

## 6. Retry Strategy

- Shared helper: `src/lib/seo/retry.ts` — `withRetry(fn, { maxAttempts = 3, baseDelayMs = 2000 })`.
- **Retryable:** `429` (respect `Retry-After` header if present), `5xx`, network timeouts/connection errors.
- **Not retryable:** `4xx` other than `429`, validation errors, auth failures after re-auth attempt (fail fast, don't burn budget retrying a bad credential).
- Backoff: exponential — 2s, 4s, 8s between attempts.
- Retries happen **inside** the job function, not at the platform level — Vercel Cron does not reliably retry failed invocations, so the job must be self-sufficient.
- Every retry increments `sync_log.metadata.retry_count` so it's queryable (see Observability, §9).

---

## 7. Configuration Management

- All configuration reads go through `src/lib/seo/config.ts`. **Never read `process.env` directly** outside this module — mirrors the existing `isSupabaseConfigured()` pattern in `src/lib/supabase/server.ts`.
- Each external source gets a Zod-validated config getter and a boolean guard: `getGscConfig()` / `isGscConfigured()`, `getGa4Config()` / `isGa4Configured()`, `getDataForSeoConfig()` / `isDataForSeoConfigured()`.
- **Site-level tunables** (scoring weights, conversion events, refresh schedules) live in `site_configs` JSONB per ADR-007 — never in environment variables. Env vars are for secrets and connection details only.
- Malformed config fails fast and loud at job start (not mid-sync) with a clear error identifying which variable is missing/malformed.

---

## 8. Testing Strategy

No test framework exists in the repo yet (`package.json` has none). Phase 1 introduces **Vitest** — fast, no browser dependency, fits a pipeline-heavy phase with no UI to test.

| Test type | Tool | Scope | When it runs |
|-----------|------|-------|---------------|
| Unit | Vitest | Pure functions: `normalize.ts`, `retry.ts`, `config.ts` parsing, scoring math (Phase 2+) | `npm test`, every commit |
| Integration | Vitest + real/local Supabase | Sync jobs: idempotency, upsert correctness, validation rejection | Manual, gated behind `RUN_INTEGRATION_TESTS=1` (needs live credentials) |
| Manual QA | curl runbook | Cron auth, end-to-end job triggering, production verification | Once per milestone, documented in PHASE_1_IMPLEMENTATION.md |
| E2E / browser | — | Not used in Phase 1 (no UI shipped until the final, deferred milestone) | N/A |

- `npm test` runs unit tests only — must stay fast and credential-free so it can run on every commit without secrets.
- Integration tests are opt-in because they need real GSC/GA4/Supabase credentials that shouldn't be required just to run `npm test` locally.
- Each milestone in PHASE_1_IMPLEMENTATION.md has its own "Tests to perform" checklist — that checklist is the authoritative QA gate for marking the milestone done, not a suggestion.

---

## 9. Observability Requirements

Built in from Milestone 3 onward, not bolted on later. Every sync job must produce enough data in `sync_log` (and `sync_log.metadata`) to answer:

| Question | Answered by |
|----------|-------------|
| When did each source last sync? | `MAX(started_at)` per `source` where `status = 'completed'` |
| Which jobs failed? | `sync_log` rows where `status = 'failed'`, most recent first |
| How many retries occurred? | `sync_log.metadata.retry_count` |
| DataForSEO credits consumed? | `SUM(api_credits_used)` per month (table ready Phase 1, populated Phase 2) |
| How long did each sync take? | `completed_at - started_at` |
| How many rows were imported? | `sync_log.records_processed` |
| Are there stale datasets? | Last successful sync per source vs. `site_configs.refresh_schedules` interval |
| Are there pipeline warnings? | `sync_log.metadata.warnings[]` (rejected rows, budget thresholds, near-timeout runs) |

`sync_log.metadata` shape (all jobs write this consistently):

```json
{
  "retry_count": 0,
  "rejected_rows": 0,
  "warnings": [],
  "backfill": false
}
```

Realized as: two SQL views (`sync_status_summary`, `stale_datasets`) plus one authenticated JSON endpoint (`/api/seo/status`) — not a dashboard. See PHASE_1_IMPLEMENTATION.md Milestone 7.

---

## 10. Documentation Requirements

- **ARCHITECTURE.md** — update only when implementation reveals an actual design change (a new table, a changed algorithm, a reversed decision). Do not update it for implementation-detail churn.
- **CHANGELOG.md** — update at the end of every milestone under `[Unreleased]` (Added / Changed / Fixed).
- **PHASE_1_IMPLEMENTATION.md** — tick each milestone's checkbox on completion with a one-line note (date + what shipped).
- **New ADR** — written when implementation makes a genuinely new architectural choice not already covered (e.g., the choice of Vitest, or a retry library). Use the existing ADR template in `decisions/`.
- **Code comments** — same global rule as the rest of the codebase: none by default; add one only when the *why* isn't obvious from the code itself (a workaround, a non-obvious constraint).

---

## 11. Git Workflow & Commit Conventions

- Continue the existing repo convention (see `git log`): imperative-mood subject line, capitalized, no trailing period, under ~72 characters. No `feat:`/`fix:` prefixes — this repo doesn't use them.
- **One commit per milestone** (or per logical unit within a large milestone) — not one giant commit for all of Phase 1. Makes `git bisect` and rollback meaningful.
- Work continues on the session's designated branch unless told otherwise.
- Never commit `.env.local` or any file containing real secrets.
- **Migrations are append-only.** Never edit a migration file after it has been applied to any environment — write a new migration instead. This is standard SQL migration discipline and matches how `20260609000000_initial_schema.sql` is already treated (untouched since creation).

---

## 12. Technical Risk → Simplest Production-Quality Solution

Applied before each milestone begins (also itemized per-milestone in PHASE_1_IMPLEMENTATION.md):

| Risk | Simplest production-quality mitigation |
|------|----------------------------------------|
| GSC service-account auth is fiddly (private key formatting, domain property verification) | Isolate auth into `gsc/client.ts` behind `isGscConfigured()`; test auth alone (Milestone 4/5) before building sync logic on top of it |
| Vercel function timeout vs. 16-month backfill duration | Confirm the actual plan limit first; if too short, chunk the backfill into repeated invocations keyed by date range rather than reaching for a queue |
| Vercel Cron doesn't retry failed invocations | Retries live inside the job function (`withRetry`), not relied upon from the platform |
| A crashed job leaves `sync_log` stuck in `"started"` forever | `stale_datasets` view treats a `"started"` row older than 2× the expected job duration as a failure signal |
| Private key `\n` escaping in env vars | One `normalizePrivateKey()` helper in `config.ts`, unit-tested with both escaped and real-newline input |
| Schema drift between `ARCHITECTURE.md` and the actual migration | Migration SQL is copy-derived from the architecture doc's schema block, diffed against it before commit |
| Manual Supabase SQL-editor migration application (no CLI pipeline yet) | Document the exact copy-paste runbook per migration in PHASE_1_IMPLEMENTATION.md; matches how the existing initial migration was already applied |
