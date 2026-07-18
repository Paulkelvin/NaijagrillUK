# Database Operations Runbook

> **Status:** Living document — the operational counterpart to ARCHITECTURE.md §3 and ENGINEERING_STANDARDS.md.
> **Last updated:** 2026-07-18
> **Owner:** Paul Kelvin

This is the runbook for actually operating the SEO platform's database — creating it, migrating it, seeding it, backing it up, restoring it, rolling it back, and diagnosing it when something goes wrong. Where a procedure below is marked **(tested)**, it was executed for real — either against a local PostgreSQL 16 instance replicating Supabase's role model, or against the production Supabase project via `@supabase/supabase-js` — during Milestone 1/2 of `PHASE_1_IMPLEMENTATION.md`. Where it's marked **(documented, not executed from this environment)**, the commands are correct and ready to run, but this environment's network policy could not exercise them directly — see "A Note on Environment Access" below before assuming a gap in rigor rather than a genuine tooling boundary.

---

## A Note on Environment Access

This project has two ways to reach the database:

1. **Supabase REST API (PostgREST)** — via `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Reachable over HTTPS, works from any environment with normal internet access, including this one.
2. **Direct PostgreSQL connection** — via `DATABASE_URL` (added after Milestone 1, server-side only). This is a raw Postgres wire-protocol connection (`postgresql://postgres:...@db.<project-ref>.supabase.co:5432/postgres`), needed for anything PostgREST can't do: `psql`, `pg_dump`/`pg_restore`, direct `pg_catalog` introspection, running migration files with `psql -f`.

**This specific sandboxed session cannot use #2.** Its network policy proxies HTTPS only; raw-TCP database connections are explicitly and categorically unsupported (confirmed via the proxy's own documentation — this is a stated policy boundary, not a bug to route around, and this runbook does not attempt to). `DATABASE_URL` also resolves to an IPv6-only address by default for Supabase's direct-connection host, which is a second, independent reason a plain `psql` from here would fail even if raw TCP were allowed.

**This is very likely not true for you, your CI, or a real deploy environment** — a normal machine or CI runner has standard outbound TCP and will reach `DATABASE_URL` fine. Every procedure below that needs #2 is written to be run by you (or CI), not by me from this session. Where I needed to validate a procedure's *correctness* without being able to run it against the real database, I ran it against a local PostgreSQL 16 instance instead (same engine version Supabase runs) and say so explicitly.

**Least privilege:** `DATABASE_URL` connects as the `postgres` role — full administrative access. Per your instruction, it is a server-side-only credential: not in `NEXT_PUBLIC_*` vars, never referenced from client code, and used only for the operational tasks in this document (migrations, backups, diagnostics) — never as an application runtime dependency. The app itself continues to use the Supabase client (`src/lib/supabase/server.ts`) with the service-role key for all normal reads/writes.

---

## 1. Creating a Fresh Database

**When you'd do this:** setting up a new environment (a second Supabase project, a local dev replica) from nothing.

### Against a new Supabase project

1. Create the project in the Supabase dashboard.
2. Copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `DATABASE_URL` into that environment's config.
3. Run every migration in `supabase/migrations/`, in filename order (they're timestamp-prefixed) — see §2.
4. Verify per §11 (Operational Troubleshooting) or re-run the same verification approach as Milestone 1's production check.

### Against a local PostgreSQL instance (dev/test) — **(tested)**

Supabase's role model (`anon`/`authenticated` with broad `GRANT`s, RLS as the actual gate; `service_role` with `BYPASSRLS`) isn't present in a vanilla `CREATE DATABASE`. Recreate it:

```bash
psql -U postgres <<'SQL'
CREATE ROLE anon NOLOGIN NOINHERIT;
CREATE ROLE authenticated NOLOGIN NOINHERIT;
CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
CREATE DATABASE naijagrill_dev OWNER postgres;
GRANT ALL ON DATABASE naijagrill_dev TO anon, authenticated, service_role;
SQL

psql -U postgres -d naijagrill_dev <<'SQL'
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
SQL
```

Then apply migrations per §2. This exact sequence is what was used to validate every migration in Milestones 1 and this operations runbook.

---

## 2. Running Migrations

Migrations live in `supabase/migrations/`, one `.sql` file per change, named `YYYYMMDDHHMMSS_description.sql`, applied in filename order.

### Against production Supabase

Two supported methods:

**A. SQL editor (current practice)** — the method used for both migrations to date. Open the Supabase dashboard's SQL editor, paste the migration file's contents, run it. Simple, visible, no local tooling required. This is what was used to apply `20260718000000_seo_platform_core.sql` to production.

**B. `psql` via `DATABASE_URL`** — for anyone with a normal (non-sandboxed) network:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/<file>.sql
```

`ON_ERROR_STOP=1` is not optional — without it, `psql` continues past a failed statement and you can end up with a partially-applied migration that looks like it succeeded.

Both methods are equivalent — same SQL, same database. Pick B when you want migrations scriptable (CI, a setup script) rather than a manual paste.

### Applying a new migration — checklist

1. Write the migration as a new, timestamped file. Never edit a file that has already been applied anywhere (see §8, and the Milestone 1 finding about the pre-existing initial migration).
2. Validate it locally first (§1's local setup + `psql -f`), exactly as Milestones 1 did, before it ever touches production.
3. Diff the new file's `CREATE TABLE`/`ALTER TABLE` blocks against `ARCHITECTURE.md` if it changes the schema — catch drift before applying, not after.
4. Apply via method A or B above.
5. Run the relevant verification queries from §11.
6. Update `CHANGELOG.md` and, if the migration changes the design (not just adds to it), `ARCHITECTURE.md`.

---

## 3. Seeding Data

The core migration (`20260718000000_seo_platform_core.sql`) seeds one `sites` row (`naijagrillandspice.co.uk`, `business_type = 'restaurant'`) and its matching `site_configs` row (restaurant conversion-event preset) via `INSERT ... ON CONFLICT DO NOTHING` — safe to re-run, never duplicates.

**To seed an additional site** (e.g., a second property once the platform goes multi-site per ADR-003), either:
- Add a new, separate migration with its own `INSERT ... ON CONFLICT (domain) DO NOTHING` (preferred — keeps seed data in version control, consistent with how the first site was added), or
- Insert directly via the Supabase dashboard / `psql` for a one-off, non-repeatable addition (acceptable for genuinely ad hoc test data, not for anything that should exist in every environment).

**To re-seed after a reset:** re-running the core migration (idempotent, §2) restores the seed row if it's missing, without touching anything else.

---

## 4. Resetting Development Databases

**(tested)** — this is literally the loop used to validate every migration in Milestone 1 and this document.

```bash
# Local dev/test database only. Never point this at production —
# DROP DATABASE is irreversible and this whole section assumes a
# throwaway local instance.
psql -U postgres -c "DROP DATABASE IF EXISTS naijagrill_dev;"
psql -U postgres -c "DROP ROLE IF EXISTS anon; DROP ROLE IF EXISTS authenticated; DROP ROLE IF EXISTS service_role;"
# then repeat §1's "local PostgreSQL instance" steps, then §2 to reapply migrations
```

If you only want to clear *data*, not the schema (keep tables/constraints, remove rows), truncate in dependency order rather than recreating the database:

```sql
TRUNCATE TABLE
  sync_log, page_metrics_weekly, page_metrics,
  keyword_page_metrics_weekly, keyword_page_metrics,
  cluster_keywords, keywords, pages, topic_clusters, site_configs, sites
  RESTART IDENTITY CASCADE;
```

`RESTART IDENTITY` resets the `BIGINT GENERATED ALWAYS AS IDENTITY` sequences (`keyword_page_metrics.id` etc.) back to 1; `CASCADE` here means "cascade the truncate to anything with an FK into these tables" (there is nothing outside this list), not a data-integrity risk. After truncating, re-run the core migration to restore seed data (§3).

**Never run either of these against production.** They exist for local/CI environments only.

---

## 5. Backup Procedures

**(tested against a local replica; commands below are what you'd run against `DATABASE_URL` for production — see "A Note on Environment Access")**

```bash
pg_dump "$DATABASE_URL" --no-owner --no-privileges -f backup_$(date +%Y%m%d_%H%M%S).sql
```

- `--no-owner --no-privileges`: the dump shouldn't try to recreate Supabase's own role ownership/grants on restore — those already exist in any Supabase project you'd restore into.
- Plain-SQL format (the default, no `-F` flag) rather than custom format (`-F c`): human-readable, diffable, restorable with plain `psql` (no `pg_restore` dependency). At Phase 1's data volume (a few hundred thousand rows at most per ARCHITECTURE.md's own estimate) this is fast enough; revisit custom format only if dump/restore time becomes a real problem at much larger scale.
- Tested end-to-end locally: seeded a row, dumped, restored into a fresh database, confirmed the row was present and correct.

**What backup Supabase already gives you for free:** Supabase's own managed daily backups (and point-in-time recovery on paid plans) cover the whole project, including these tables, with zero extra setup. The `pg_dump` procedure above is for **portable, on-demand, project-independent** backups (before a risky migration, before a schema change you're not 100% sure about) — a supplement to Supabase's own backups, not a replacement. Check your Supabase plan's backup retention and confirm it meets your needs; this document doesn't control that setting.

**What to back up before:** any migration that drops or alters an existing column/table (Phase 1's migrations so far are additive-only — new tables — so this hasn't been a live risk yet, but will matter starting whenever a future migration modifies existing SEO tables).

---

## 6. Restore Procedures

**(tested)**

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backup_<timestamp>.sql
```

Restoring into a database that already has the same tables will fail on `CREATE TABLE` (no `IF NOT EXISTS` in a `pg_dump` output) — restores are meant for an empty/fresh database, not layered onto an existing one. If you need to restore over an existing database:

1. Take a fresh backup of the *current* state first (so a bad restore is itself recoverable).
2. Drop and recreate the target database (§4's reset procedure, or Supabase's own project-level restore if using their managed backups).
3. Restore the backup file.

**Tested locally:** seeded data → `pg_dump` → restore into a brand-new database → confirmed identical row content and schema.

---

## 7. Rollback Strategy

**(tested — and this testing caught a real bug in the original plan, corrected here)**

If a migration needs to be undone (not "fix forward with a new migration" — see §8 for why that's preferred — but a genuine emergency revert), Milestone 1's write-up in `PHASE_1_IMPLEMENTATION.md` documented a `DROP TABLE` sequence in reverse dependency order. **That documented order was wrong** — it doesn't account for the circular foreign key between `pages` and `topic_clusters` (`pages.topic_cluster_id → topic_clusters.id` and `topic_clusters.pillar_page_id → pages.id`). Verified by actually running it: dropping `pages` before `topic_clusters` fails with `cannot drop table pages because other objects depend on it`.

**Correct rollback for `20260718000000_seo_platform_core.sql`**, tested clean in a transaction (`BEGIN` ... `ROLLBACK`) against a local replica seeded with production-equivalent data — 4 pre-existing tables confirmed untouched, all 11 SEO tables confirmed dropped:

```sql
BEGIN;

-- Break the circular FK first, or neither pages nor topic_clusters can be
-- dropped before the other.
ALTER TABLE public.topic_clusters DROP CONSTRAINT topic_clusters_pillar_page_id_fkey;

DROP TABLE public.sync_log;
DROP TABLE public.page_metrics_weekly;
DROP TABLE public.page_metrics;
DROP TABLE public.keyword_page_metrics_weekly;
DROP TABLE public.keyword_page_metrics;
DROP TABLE public.cluster_keywords;
DROP TABLE public.keywords;
DROP TABLE public.pages;
DROP TABLE public.topic_clusters;
DROP TABLE public.site_configs;
DROP TABLE public.sites;
DROP FUNCTION public.seo_set_updated_at();

COMMIT; -- change to ROLLBACK to dry-run this without actually dropping anything
```

This is deliberately **not** embedded as a comment inside the migration file itself — `PHASE_1_IMPLEMENTATION.md`'s Milestone 1 write-up said it would be, which was inaccurate (corrected there with a pointer to this section). A rollback script belongs in the runbook a human reaches for during an incident, not buried as a comment in an already-applied, append-only migration file no one re-opens.

**Before running this against production:** take a backup first (§5) — this is destructive and, unlike the migration itself, is not idempotent or safe to re-run.

**Preferred alternative — forward-only correction:** per your standing instruction to preserve append-only migration discipline, a genuine schema mistake should usually be fixed with a *new* migration (e.g., `ALTER TABLE ... DROP COLUMN` + re-add correctly) rather than this full rollback. This rollback exists for the genuine emergency case (the whole SEO platform addition needs to be backed out), not routine fixes.

---

## 8. Migration History Discipline

Migrations in this project are **append-only** — an applied migration file is never edited, per your explicit instruction. If a later milestone finds a problem in an already-applied migration:

- **Preferred:** write a new, forward-only migration that corrects it (e.g., `ALTER TABLE` to fix a constraint, a new `DROP POLICY IF EXISTS` + `CREATE POLICY` pair to make an existing policy idempotent).
- **Known example currently left as-is, by your decision:** the original `20260609000000_initial_schema.sql` has four `CREATE POLICY` statements with no `IF NOT EXISTS` guard, so re-running it against a database where it already succeeded once fails on the second run (`policy ... already exists`). This is a real gap in "the full migration sequence is safe to re-run from scratch," but per your instruction it's left untouched unless it becomes a genuine operational problem. If that day comes, the fix is a small forward-only migration:

  ```sql
  DROP POLICY IF EXISTS "Allow anonymous insert on reservations" ON public.reservations;
  CREATE POLICY "Allow anonymous insert on reservations" ON public.reservations
    FOR INSERT TO anon, authenticated WITH CHECK (true);
  -- repeat for event_inquiries, newsletter_leads, contact_messages
  ```

  Not applied now — recorded here so the fix is ready if/when it's needed, without touching migration history today.

---

## 9. Production Deployment Checklist

Before applying any new migration to the production Supabase project:

- [ ] Migration is a new, timestamped file — nothing edited in place
- [ ] Validated locally first (§1 + §2) — applies cleanly, and if it's meant to be idempotent, re-applying it a second time is also clean
- [ ] Diffed against `ARCHITECTURE.md` if it touches the schema — any intentional deviation is written down (see Milestone 1's "Differences from Architecture" as the template), not silent
- [ ] A backup exists (§5) if the migration alters or drops anything (not required for purely additive migrations like Milestone 1's, but mandatory once migrations start modifying existing tables)
- [ ] `CHANGELOG.md` drafted (finalize after apply)
- [ ] Rollback plan identified — either "just don't merge this migration's dependents if it fails" (additive migrations) or the explicit `DROP`/`ALTER` sequence (destructive migrations)
- [ ] Apply via SQL editor or `psql "$DATABASE_URL"` (§2)
- [ ] Run post-apply verification (§11) — table existence, RLS behavior, seed data, at minimum
- [ ] Update `CHANGELOG.md` and `PHASE_1_IMPLEMENTATION.md` (or the relevant milestone doc) with the result

---

## 10. Environment Variable Requirements

| Variable | Used for | Scope |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | REST API (PostgREST) base URL | Public — safe in client code |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side reads, gated entirely by RLS | Public — safe in client code |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side reads/writes, bypasses RLS | **Server-only.** Never in `NEXT_PUBLIC_*`, never sent to the client |
| `DATABASE_URL` | Direct `psql`/`pg_dump`/migration tooling — everything PostgREST can't do | **Server-only, operational use only.** Never in `NEXT_PUBLIC_*`, never an application runtime dependency, never referenced from any code path that ships to the browser. Used exclusively for the procedures in this document |

`isSupabaseConfigured()` (`src/lib/supabase/server.ts`) already guards all app code against `SUPABASE_SERVICE_ROLE_KEY` being unset. `DATABASE_URL` has no equivalent guard because no application code depends on it — only the operational procedures in this document and, going forward, any migration/ops tooling in `scripts/` (none exists yet).

---

## 11. Operational Troubleshooting

**"I can't tell if a migration actually applied."**
Run the relevant checks from Milestone 1's production verification (`PHASE_1_IMPLEMENTATION.md`): confirm table existence, seed data, and RLS behavior via the Supabase client, or `\dt`/`\d <table>` via `psql "$DATABASE_URL"` if you have normal network access.

**"Re-running the full migration sequence from scratch fails."**
Almost certainly the known `CREATE POLICY` non-idempotency in the original migration (§8) — it fails on the *first* file, not the SEO platform's. Confirm with the exact error message; `policy "..." already exists` confirms it.

**"RLS seems to be blocking something it shouldn't, or allowing something it shouldn't."**
Check `pg_policies` for the table in question — Milestone 1 confirmed zero rows there for all 11 SEO tables. If a policy shows up unexpectedly, someone added one outside a tracked migration — treat that as a genuine incident (an untracked schema change), not a config toggle to flip back quietly.

**"A CHECK constraint is rejecting data I think should be valid."**
The constraint name in the error message maps directly to the Constraint Summary in Milestone 1's write-up — e.g. `keyword_page_metrics_clicks_le_impressions_check` means the ingestion code (or the source data) produced `clicks > impressions`, which per ARCHITECTURE.md §4.1 should have already been filtered out at the application layer before the insert was attempted. Check the sync job's validation logic first; the database constraint firing means the application-layer check either has a bug or was bypassed.

**"I need to inspect indexes/constraints directly and don't have `DATABASE_URL` access from where I'm working."**
Run this from the Supabase SQL editor (works from any browser, no local tooling needed) and it'll give you the same `pg_catalog` view a local `psql` session would:

```sql
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
SELECT conrelid::regclass AS table_name, conname, contype FROM pg_constraint
  WHERE connamespace = 'public'::regnamespace ORDER BY table_name, conname;
```

**"`gen_random_uuid()` fails on a fresh local Postgres."**
It's built into PostgreSQL 13+ core (confirmed on the 16.13 instance used throughout this project's local validation) — if it fails, you're likely on an older Postgres or a stripped-down image missing the function; install/enable the `pgcrypto` extension as a fallback (`CREATE EXTENSION IF NOT EXISTS pgcrypto;`), though this shouldn't be necessary on any currently-supported Postgres version.

**"IPv6 / connection errors reaching `db.<project-ref>.supabase.co` directly."**
Supabase's direct-connection hostname resolves IPv6-only by default. If your network doesn't have IPv6 egress (confirmed to be the case in this sandboxed session), use Supabase's connection pooler hostname instead (`aws-0-<region>.pooler.supabase.com`, found on the project's Database Settings page), which supports IPv4.
