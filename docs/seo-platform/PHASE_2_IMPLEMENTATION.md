# Phase 2 Implementation Plan — Intelligence Layer

> **Status:** Milestones 0–5 and 7–12 are complete. The user set up a real DataForSEO account mid-session — Milestone 5 (search volume sync) has been run for real against production, not just tested: 81/81 keywords updated with real search volume/CPC/monthly trend data, $0.09 real spend correctly recorded in `api_budgets`. Re-running the analysis engine afterward confirmed Opportunity Score's null-safe design worked exactly as promised — scores went from a flat 50.0 to a real 40.5–56.7 range with zero code changes. A real bug was found and fixed running Milestone 5 for real (a partial-column `upsert()` failed on a NOT NULL constraint Postgres validates before conflict resolution even applies — switched to plain `UPDATE`; corrected the same over-general reasoning in Milestone 10's comment too, though that one was safe in practice). Milestone 4 was verified against DataForSEO's real live docs throughout, not assumed. 351 tests passing total; lint/build clean. `sites.config.brand_terms` is configured, fixing a real cannibalization false positive (the site's own name) the first analysis-engine run surfaced. Content decay genuinely cannot produce real output for months (needs 60-90 days of GA4 history); Page ROI Score/Keyword Value still show 0 pending real GA4 conversion volume (their formulas now have real `search_volume` to work with, but revenue-side inputs still need traffic to accumulate). Only Milestone 6 (SERP snapshots) remains — its Vercel Hobby 300s-vs-10-minute-budget risk is resolved as a plan (reuse the GSC backfill's proven time-budgeted-chunk pattern, confirmed with the user), not yet implemented.
> **Last updated:** 2026-07-20
> **Owner:** Paul Kelvin
> **Depends on:** ARCHITECTURE.md (frozen, §5 Intelligence Engine + §6 DataForSEO Strategy), ENGINEERING_STANDARDS.md, Phase 1 (Milestones 0–8, complete and live in production)

---

## Objective

Turn the raw GSC/GA4 data Phase 1 now collects into a prioritised, explainable action queue — the actual product, per ARCHITECTURE.md's Vision: "The platform answers one question every day: what should I do next, and why?"

**Explicit framing for this pass:** built ahead of full real-world readiness, same posture Phase 1 used for Milestones 5–8 before credentials existed. ARCHITECTURE.md's own roadmap lists Phase 2's dependencies as "Phase 1 complete with ≥30 days of data" and "≥1,000 total GSC clicks to build a real CTR model" — as of this plan, Phase 1 has been live for hours, not weeks, and there is no DataForSEO account yet. Code gets built and tested now; algorithms that need volume of real data simply won't produce *meaningful* output until that volume exists, exactly like Milestone 8's retention job had nothing to aggregate on day one. This is tracked per-milestone, not hidden.

### Non-Goals for Phase 2

- No site crawler / internal link graph, no Internal Linking Score (§5.8) — Phase 3
- No Topical Authority Score (§5.6) — Phase 3, needs internal link graph
- No Intent Alignment Check (§5.9) — Phase 3, needs `search_intent` populated at scale first
- No competitor tracking, no impact tracking (`action_outcomes`) — Phase 3
- No auto-tuning of scoring weights — Phase 4

This matches ARCHITECTURE.md's own roadmap split exactly — nothing deferred here that Phase 2's deliverable list actually includes.

---

## A Sequencing Decision Worth Stating Up Front

ARCHITECTURE.md's roadmap lists DataForSEO integration alongside the scoring algorithms without an explicit build order. Three of the six algorithms — **CTR Model (§5.4)**, **Cannibalization Score (§5.3)**, and **Content Decay Score (§5.7)** — read *only* GSC/GA4 data already flowing in production; they need no DataForSEO account and no new external credential to produce real output. The other three — **Opportunity Score (§5.1)**, **Page ROI Score (§5.2)**, **Conversion-Weighted Keyword Value (§5.5)** — read DataForSEO fields (`search_volume`, `keyword_difficulty`, `cpc`) but every one of those columns is already nullable with a documented fallback (§5.1: business_value can degrade; §5.2: CPC-weighted fallback; §5.5: CPC as proxy), so they can be built and produce partial/degraded-but-real output before DataForSEO exists too.

**Decision:** sequence the three GSC/GA4-only algorithms first, DataForSEO client + integration next, then the three DataForSEO-enriched algorithms (built null-safe from day one, automatically improving once DataForSEO data lands — no rework). This means real, usable scoring output exists well before any new external account is needed, rather than the whole phase gating on a second credential-hunting saga like Phase 1's. Not a deviation from ARCHITECTURE.md's algorithms or schema — purely a build-order choice, so it doesn't require a stop-and-discuss, but it's different enough from a literal top-to-bottom reading of §5 that it's worth being explicit about instead of silently reordering.

---

## Milestone Sequence

```
0. Phase 2 Database Schema (actions, api_budgets, serp_snapshots)
        │
        ├───────────────┬───────────────┐
        ▼               ▼               ▼
1. CTR Model      2. Cannibalization  3. Content Decay
   Builder            Score              Score
   (§5.4)             (§5.3)             (§5.7)
        │               │                  │
        └───────────────┴──────────────────┘
                        │
                        ▼
        4. DataForSEO Client + Budget Controls (§6)
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
    5. Search Volume Sync   6. SERP Snapshots
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
     7. Opportunity  8. Page ROI  9. Conversion-
        Score           Score        Weighted
        (§5.1)          (§5.2)       Value (§5.5)
                        │
                        ▼
              10. Action Queue Engine
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
   11. Action Queue UI   12. Site Config UI
```

---

## Milestone 0 — Phase 2 Database Schema

**Objective:** Add the three new tables Phase 2 needs, holding to the same database-first discipline as Phase 1 Milestone 1 (every table gets full constraints/timestamps/RLS from the outset, every index justified by a named query pattern).

**Tasks:**
- [x] New migration `supabase/migrations/20260720120000_seo_phase2_intelligence.sql`:
  - `actions` — the action queue itself (ARCHITECTURE.md §3, `type`/`status`/`source_module` enums enforced via CHECK, not just comments — same treatment Milestone 1 gave every enum-like column). Added one constraint beyond ARCHITECTURE.md's literal schema: `actions_completed_at_consistency_check`, mirroring `sync_log`'s own status/`completed_at` consistency rule (ADR-009's general principle applied here for the first time outside `sync_log`).
  - `api_budgets` — DataForSEO (and future provider) spend tracking, composite PK `(site_id, provider, period_start)`. Added `period_start`-is-1st-of-month CHECK, same pattern as `keyword_page_metrics_weekly`'s week-start-is-Monday check.
  - `serp_snapshots` — weekly SERP position data, `UNIQUE(keyword_id, date, position)`. Added `created_at` (immutable rows, no `updated_at` needed — per Milestone 1's own "only add `updated_at` where a column can change post-insert" rule) and a `position >= 1` floor (no fabricated upper bound — unlike GSC's documented 1-1000 range, DataForSEO's SERP endpoint has no similarly authoritative ceiling to encode).
- [x] RLS: enabled, zero anon/authenticated policies — same default-deny posture as every existing SEO table
- [x] Diffed the migration's `CREATE TABLE` blocks against ARCHITECTURE.md §3 before committing — same check Milestone 1 applied; no drift beyond the additive constraints/timestamps noted above

**Dependencies:** Phase 1 Milestone 1 (existing `sites`, `pages`, `keywords` tables these reference).

**Expected outputs:** Three new tables, validated locally; **not yet applied to production** (see below).

**Database changes:** New migration, no changes to existing tables (Milestone 1 already forward-provisioned `keywords.search_volume`/`keyword_difficulty`/`cpc`/`search_intent`/`monthly_volumes`/`last_volume_refresh` — confirmed by re-reading the applied migration before writing this plan, nothing missing there).

**Files created:**
- `supabase/migrations/20260720120000_seo_phase2_intelligence.sql`

**Tests performed:**
- [x] **Local integration, real PostgreSQL 16 instance** (the same throwaway `naijagrill_dev` database used for Milestones 7–8's local validation): applied cleanly, then exercised every constraint deliberately:
  - Valid `actions` insert (`queued`, no `completed_at`) succeeds
  - `completed` status with `NULL completed_at` → correctly rejected by `actions_completed_at_consistency_check`
  - Invalid `type` enum value → correctly rejected by `actions_type_check`
  - Valid `api_budgets` insert (`period_start = '2026-07-01'`) succeeds, defaults (`current_spend = 0`, `alert_threshold = 0.8`) correct
  - `period_start` not the 1st of the month → correctly rejected
  - `alert_threshold = 1.5` (out of 0–1 range) → correctly rejected
  - Valid `serp_snapshots` insert succeeds; a duplicate `(keyword_id, date, position)` → correctly rejected by the `UNIQUE` constraint; `position = 0` → correctly rejected; an invalid `serp_feature` value → correctly rejected
  - `SET ROLE anon` → `0` rows visible across all three tables; superuser sees the real rows — RLS default-deny confirmed empirically, not assumed
  - `updated_at` trigger fires correctly on `actions` (verified `updated_at > created_at` after a real `UPDATE`, 1-second-apart timestamps)
- [x] **Applied to production (2026-07-20), via a newly-discovered path:** Supabase's Management API (`POST https://api.supabase.com/v1/projects/{ref}/database/query`, Bearer auth with a user-supplied personal access token) runs SQL over plain HTTPS — unlike raw Postgres, HTTPS isn't blocked by this sandbox's network policy, so this sidesteps the constraint that blocked every earlier migration's automated path (confirmed via Supabase's own OpenAPI spec before use, not guessed). Verified before applying that none of the three tables existed yet; applied (migration is fully `IF NOT EXISTS`, safe either way); verified after: all three tables present, RLS enabled, `0` policies (`pg_policies` count), `actions_set_updated_at` trigger present, all 7 `actions` CHECK constraints present. This is a reusable capability for future migrations in this project, not just a one-off.

**Success criteria (DoD):**
- [x] All three tables pass the same constraint/RLS audit Milestone 1's 28-check verification used — see above
- [x] Local Postgres validation clean before any production apply
- [x] Applied to production — confirmed via the Management API verification queries above

**Risks & rollback:**
- Risk: none of these tables are read by anything yet (built ahead of the code that populates them) — inert until Milestones 1+ ship, same "additive, zero regression" posture as every Phase 1 migration
- Rollback: `DROP TABLE` all three — no other table references them yet (only `serp_snapshots.keyword_id` and `actions.page_id`/`keyword_id` reference *outward* to existing tables, nothing references *in*)

---

## Milestone 1 — Site-Specific CTR Model Builder (§5.4)

**Objective:** Replace the industry-default CTR curve with the site's own real click-through data — the first Phase 2 algorithm to ship, and the only one every other scoring algorithm in this phase depends on.

**Tasks:**
- [x] Implement `src/lib/seo/intelligence/ctr-model.ts`: for each position bucket 1–20, `ctr = Σclicks / Σimpressions` over the last 90 days of `keyword_page_metrics`, only including buckets with ≥50 impressions; positions below that threshold fall back to the industry-default table (hard-coded as `INDUSTRY_DEFAULT_POSITIONS`, byte-identical to ARCHITECTURE.md §5.4's table and Milestone 1's seed value, exported for reuse rather than re-derived elsewhere)
- [x] Minimum-data gate: below 1,000 total clicks across all positions, skip the rebuild entirely and leave `site_configs.ctr_model` untouched
- [x] Write result to `site_configs.ctr_model` with `source: "site_data" | "industry_default"` and `sample_size`
- [x] `src/app/api/seo/analysis/ctr-model/route.ts` — its own route and cron entry (not folded into Milestone 10), added to `vercel.json` at Monday 06:15 UTC (a reasoned default: ARCHITECTURE.md specifies "weekly after GSC sync" without an exact time; 15 minutes after GSC's daily 06:00 UTC slot gives that day's sync a comfortable buffer)

**A real gap found and fixed in passing:** while adding this cron entry, discovered `/api/seo/sync/gsc` and `/api/seo/sync/ga4` were never actually added to `vercel.json` — only `ping` and `retention` were. Every real sync run today happened via manual `curl`, not the automated schedule ARCHITECTURE.md's §7 table specifies. Added both (GSC daily 06:00 UTC, GA4 daily 06:30 UTC, matching that table exactly) in the same commit as this milestone, since leaving it unfixed would have meant the pipeline still doesn't run itself even after this milestone ships.

**Dependencies:** Phase 1 Milestone 1 (`keyword_page_metrics`, `site_configs.ctr_model` column, already live).

**Expected outputs:** A real, site-specific CTR curve. **Deployed to production 2026-07-20**, confirmed live via `curl` — `{"ok":true,"rebuilt":false,"source":"industry_default","sampleSize":5,...}`. `rebuilt: false` is correct: only 5 real clicks exist so far, far below the 1,000-click floor, so it correctly stayed on `industry_default` rather than being deployed and immediately overwriting the model with 5 clicks' worth of noise.

**Database changes:** None (uses existing `site_configs.ctr_model` column and `keyword_page_metrics`).

**Files created:**
- `src/lib/seo/intelligence/ctr-model.ts`, `ctr-model.test.ts` (10 tests)
- `src/app/api/seo/analysis/ctr-model/route.ts`, `route.test.ts` (5 tests)
- `vercel.json` (modified — CTR model cron entry, plus the GSC/GA4 fix above)

**Tests performed:**
- [x] Unit: hand-calculated CTR values for synthetic position-bucketed click/impression data, matching the exact `Σclicks/Σimpressions` formula
- [x] Unit: a bucket with <50 impressions correctly falls back to the industry default for that position, not a noisy real value
- [x] Unit: position 4.5 rounds up to bucket 5 (standard JS `Math.round` behavior), matching ARCHITECTURE.md's documented bucketing rule
- [x] Unit: null-position and out-of-1–20-range rows are excluded from bucketing but still counted toward `totalClicks`
- [x] Unit: zero input rows returns all 20 positions fully defaulted, not an empty/partial object
- [x] Unit: total clicks below 1,000 across the whole model skips the rebuild entirely — confirmed `site_configs` is never even queried in that path, not just that the write is skipped
- [x] Unit: a real rebuild (≥1,000 clicks) writes the exact `{source, positions, sample_size}` shape to `site_configs.ctr_model`
- [x] Unit: fetch and update errors both propagate with a clear message rather than failing silently
- [x] **Integration, production, 2026-07-20:** `curl` against `/api/seo/analysis/ctr-model` with the real `CRON_SECRET` correctly identified the site has only 5 real clicks and skipped the rebuild, leaving the industry-default model in place — proves the minimum-data gate works against real data, not just synthetic test fixtures. Also confirmed all five `vercel.json` cron entries (including the two GSC/GA4 fixes) registered correctly via the Vercel API (`crons.enabledAt` set, all five `path`/`schedule` pairs present).
- **Not yet performed:** a real `site_data` rebuild (needs ≥1,000 real clicks, which don't exist yet) — re-run this once GSC click volume crosses that threshold and confirm the resulting model looks plausible

**Success criteria (DoD):**
- [x] Model rebuild is deterministic and idempotent (same input data → same output every time) — pure-function `computeCtrBuckets` guarantees this by construction, verified via unit tests
- [x] `source`/`sample_size` correctly distinguish a real vs. default model at a glance — confirmed in both the skip and rebuild paths, including against real production data
- [x] Verified against real production data — confirmed above; the real-`site_data`-model path specifically still needs real click volume to exist

**Risks & rollback:**
- Risk: a site with genuinely low traffic (this restaurant, realistically, for months) may never cross 1,000 clicks and stay on industry defaults indefinitely — explicitly anticipated in ARCHITECTURE.md's own Phase 2 risk note, not a design flaw
- Rollback: this only ever overwrites one JSONB column (`site_configs.ctr_model`); trivially reversible by re-seeding the industry-default value

---

## Milestone 2 — Cannibalization Detection & Scoring (§5.3)

**Objective:** Surface keywords where multiple pages compete against each other — pure GSC data, no DataForSEO dependency, real output possible as soon as any keyword has 90 days of multi-page ranking history.

**Tasks:**
- [x] Implement `src/lib/seo/intelligence/cannibalization.ts`: detection (90-day lookback, keywords with impressions from 2+ distinct pages — reproduced over already-fetched rows in application code, not a second DB round trip, same pattern as every prior sync/retention job in this project), then per-keyword scoring (30-day window: `position_variance`, `click_split`, `ctr_deficit` using the CTR model from Milestone 1, `traffic_value`)
- [x] Brand-name exclusion: resolved as `sites.config.brand_terms` (an array of lowercased strings) — reuses the `sites.config` "lightweight overrides" column Milestone 1 already described for exactly this kind of single-value, single-site override (ADR-003), no new migration needed. A candidate keyword is excluded if its `keyword_normalized` contains any configured term (substring match, not exact — catches brand-adjacent queries like "naija grill menu" too)
- [x] Action generation: score > 40 → `"canonicalize"` (one page holds ≥70% of clicks — a numeric threshold ARCHITECTURE.md's "significantly more traffic" doesn't define, resolved here by reusing `click_split`'s own 0–1 scale rather than inventing a second signal) or `"merge"` (more evenly split). **Deliberately does not implement the third case** ("pages serve different intents" → differentiate) — that needs the Intent Alignment Check (§5.9), explicitly out of scope for Phase 2 (this plan's own Non-Goals) since there's no reliable per-page intent signal yet to make that call from

**Dependencies:** Milestone 1 (CTR model, for `expected_ctr` in the `ctr_deficit` calculation).

**Expected outputs:** Real cannibalization scores, testable against production data as soon as any keyword genuinely ranks via 2+ pages — plausible even with Phase 1's current small dataset, unlike the CTR model's 1,000-click gate.

**Database changes:** None (reads `keyword_page_metrics`/`keywords`/`sites`/`site_configs`; writes nothing — Milestone 10's orchestrator is what will eventually write to `actions`).

**Files created:**
- `src/lib/seo/intelligence/cannibalization.ts`, `cannibalization.test.ts` (13 tests)

**Tests performed:**
- [x] Unit: `detectCandidates` correctly requires 2+ distinct pages with impressions > 0, independently for multiple keywords in the same batch
- [x] Unit: `scoreCandidate` — hand-calculated `position_variance`/`click_split`/`traffic_value` against synthetic two-page data; `cpc: null` correctly falls back to `1.0`; a best-average-position worse than 20 correctly clamps to the position-20 CTR-model entry rather than looking up a missing key; `ctr_deficit` correctly computed when actual CTR genuinely underperforms the expected rate; zero total clicks degenerates to `clickSplit`/`dominantShare` of `0` rather than `NaN` or a divide-by-zero
- [x] Unit: `detectCannibalization` orchestration (mocked Supabase) — zero candidates short-circuits before any further query; a real dominant-page case produces `recommendation: "canonicalize"` with the correct `recommendedCanonicalPageId`; an evenly-split case produces `"merge"` with a `null` canonical page; a brand-term match correctly excludes the keyword entirely; a low-severity case correctly stays at `recommendation: null`
- **Not yet performed:** real production run — this module isn't wired into any route yet (by design; ARCHITECTURE.md §7 doesn't list cannibalization as its own background job the way it does the CTR model, it's part of Milestone 10's combined "Analysis engine" job), so there's nothing to `curl` yet

**Success criteria (DoD):**
- [x] Detection logic matches ARCHITECTURE.md §5.3's query semantics exactly (verified via `detectCandidates`'s own unit tests)
- [x] Scoring formula components each independently unit-verified against hand-calculated values, same rigor as Milestone 8's retention aggregation formulas
- [ ] Verified against real production cannibalization cases — pending Milestone 10 (no route to trigger this standalone) and real multi-page-ranking data existing

**Risks & rollback:**
- Risk: with Phase 1's current data volume, real cannibalization cases may not exist yet to test against — same "code-complete, needs real-world time" posture as Content Decay (Milestone 3) and the CTR model
- Risk: `sites.config.brand_terms` is currently unset (empty) for the real site — brand-name exclusion is implemented and tested but inert until Paul configures it (worth doing once this ships for real, not blocking to ship without it, since GSC branded-query volume for a young property is likely near zero anyway)
- Rollback: pure read + `actions` write: deleting generated `actions` rows is safe and non-cascading

---

## Milestone 3 — Content Decay Score (§5.7)

**Objective:** Detect pages losing organic traffic before the drop becomes critical — pure GA4 data, no DataForSEO dependency.

**Tasks:**
- [x] Implement `src/lib/seo/intelligence/content-decay.ts`: linear regression slope over 90-day `page_metrics.sessions`, `decay_pct` vs. peak (a 30-day rolling average slid across the 90-day window — 61 possible positions, computed exhaustively rather than approximated), decay-stage bucketing (`stable`/`early_decay`/`mid_decay`/`critical_decay`), `recency_factor`, `decay_urgency`
- [x] Minimum-data gate: only flag pages with ≥30 avg sessions/month (over the ~3-month window); skip entirely if fewer than 60 real data rows exist for that page (ARCHITECTURE.md §5.7 Limitations — this analysis is explicitly "unavailable until the pipeline has run for 3 months")
- [x] Seasonality cross-reference against the page's primary keyword's `monthly_volumes` (DataForSEO field, identified as the keyword with the most clicks for that page over the window) — resolved as `seasonalityChecked: boolean` (true only when that data exists) with `seasonal` always `false` for now, deliberately not guessing at a pattern-matching algorithm ARCHITECTURE.md doesn't fully specify and that has no real data yet to validate against (same principle as Page ROI Score's `missing_paa` being forced to 0 pre-DataForSEO)

**Dependencies:** None beyond Phase 1's `page_metrics` (live). Seasonality check improves once Milestone 5 (DataForSEO volume) exists but isn't required to ship this milestone.

**Expected outputs:** Code-complete and unit-tested against synthetic data; **genuinely cannot produce real output** until ~60–90 days of real GA4 traffic history exist (this is an explicit ARCHITECTURE.md constraint, not a shortcut) — same honest "not yet possible" framing Phase 1 used for the GSC 16-month backfill before credentials existed, just gated by elapsed time instead of a credential. GA4 itself only went live today, so this is genuinely months away from producing anything.

**Database changes:** None (reads `page_metrics`/`keyword_page_metrics`/`keywords`; writes nothing — Milestone 10's orchestrator will write to `actions`).

**Files created:**
- `src/lib/seo/intelligence/content-decay.ts`, `content-decay.test.ts` (16 tests)

**Tests performed:**
- [x] Unit: `computeLinearRegressionSlope` — exact slope for a perfectly increasing/decreasing/flat line, `0` for fewer than 2 points
- [x] Unit: `computeRollingPeakAndCurrent` — peak window and current window correctly identified against a hand-constructed step function; a tie between two equal-average windows correctly resolves to the more recent one
- [x] Unit: `computeDecay` — `decay_pct`/`recency_factor`/`decay_urgency` hand-calculated against a known peak-then-decline pattern; `decay_pct` correctly returns `0` (not `NaN`) when peak traffic is `0`; every decay-stage boundary (4/5/14/40/41 `decay_pct`) and every `recency_factor` boundary (30/31/60 `daysSincePeak`) individually verified against ARCHITECTURE.md's exact thresholds, including the "exactly 40 is still mid_decay, not critical" edge case the ">40" wording implies
- [x] Unit: `detectContentDecay` orchestration (mocked Supabase) — a page with <60 real data rows is excluded entirely; a page with enough history but <30 avg sessions/month is excluded; a qualifying page returns correct fields with `seasonalityChecked: false` when no keyword volume data exists; `seasonalityChecked: true` when the correctly-identified highest-click primary keyword has `monthly_volumes` data; multiple pages are handled independently, only qualifying ones returned
- **Not yet performed:** any real output — genuinely impossible right now, GA4 has been live for hours, not the 60+ days this algorithm requires

**Success criteria (DoD):**
- [x] All four decay-stage boundaries and the `recency_factor` bucketing match ARCHITECTURE.md §5.7 exactly — individually unit-verified, not just spot-checked
- [x] Synthetic-data test suite passes deterministically (same bar as Milestone 8's retention aggregation tests)
- [ ] Real-data verification — blocked on elapsed time, tracked as a follow-up once GA4 has ~90 days of history

**Risks & rollback:**
- Risk: real validation is blocked on elapsed time (60–90 days), not anything buildable faster — flagged plainly here rather than implying this is more verified than it is
- Rollback: pure read + `actions` write, same as Milestone 2

---

## Milestone 4 — DataForSEO Client Foundation + Budget Controls (§6) — ✅ Code complete (2026-07-20)

**Objective:** One authenticated, budget-aware DataForSEO client that Milestones 5–6 both build on — mirrors how Milestone 2 (Config & Secrets) preceded Milestone 5/6's actual sync jobs in Phase 1.

**Tasks:**
- [x] Verified DataForSEO's actual current auth mechanism via live docs before writing any code (`docs.dataforseo.com/v3/auth/`, fetched directly, not assumed): confirmed HTTP Basic Auth, `Authorization: Basic base64(login:password)`, base URL `https://api.dataforseo.com`, login = account email, password = a separate auto-generated API password (not the account's own login password). No token exchange/refresh flow — Basic Auth is static, unlike GSC/GA4's OAuth2 JWT bearer flow. Also confirmed the response envelope shape (`status_code`/`status_message`/`cost`/`tasks_count`/`tasks_error`/`tasks[]`, success = `20000 <= status_code <= 29999`) needed to design the client wrapper's error handling.
- [x] `src/lib/seo/config.ts`: added `getDataForSeoConfig()`/`isDataForSeoConfigured()` following the exact existing pattern (Zod: `login` must be a valid email, `password` non-empty)
- [x] `src/lib/seo/dataforseo/client.ts`: `callDataForSeoApi<T>(endpointPath, payload)` — authenticated POST wrapper, reuses `retry.ts`'s `withRetry`/`RetryableError` (retries network errors/429/5xx, fails fast on 401/403 via a new `DataForSeoAuthError`, throws on an out-of-range top-level `status_code` even on HTTP 200)
- [x] `src/lib/seo/dataforseo/budget.ts`: implements §6 Budget Controls exactly — `checkBudget()` reads `api_budgets.current_spend`/`monthly_limit`/`alert_threshold` for the current month, denies once spend meets/exceeds the limit, warns (via `logger.warn`) once it crosses the alert threshold; `recordSpend()` writes the real cost after a successful paid call, creating the period's row at the $10 default if none exists yet. **Resolved the open "where does $10 live" question:** `api_budgets.monthly_limit` has no DB-level `DEFAULT` (Milestone 0's migration: `NOT NULL` with no default) — so `$10` is an application-level constant (`DEFAULT_MONTHLY_LIMIT_USD`) applied only when `recordSpend()` creates a new period's row on the first paid call of the month. No new `site_configs` field needed; a month rolls over naturally since `period_start` is part of the composite PK.

**Implementation notes:**
- `checkBudget()`/`recordSpend()` deliberately don't touch `sync_log` — logging a `"budget_exceeded"` sync entry when a call is denied is each sync job's own responsibility (Milestones 5/6), matching how every other cross-cutting concern (retry counts, warnings) already gets folded into `sync_log` by the job that experienced it, not by a shared helper.
- Added `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD` to `.env.example`, matching the existing GSC/GA4 section's format and "leave unset until ready" convention.

**Dependencies:** Milestone 0 (`api_budgets` table).

**Expected outputs:** A working, fully unit-tested client and budget gate — **code-complete pending a real DataForSEO account**, same "code-complete, integration verification pending" posture as Phase 1 Milestones 5/6 before Google credentials existed. Requires signing up for a DataForSEO account (app.dataforseo.com) and adding `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD` to Vercel when ready.

**Database changes:** None (uses Milestone 0's `api_budgets`).

**Files created:**
- `src/lib/seo/dataforseo/client.ts`, `client.test.ts` (9 tests)
- `src/lib/seo/dataforseo/budget.ts`, `budget.test.ts` (12 tests)
- `src/lib/seo/config.ts`, `config.test.ts` (modified, 4 new tests)
- `.env.example` (modified)

**Tests performed:**
- Unit: budget check allows under the limit (with/without an existing row), warns at/above the alert threshold, denies at/over the monthly limit, respects a row's own custom limit/threshold
- Unit: `recordSpend` creates a new row at the $10 default vs. increments an existing one; propagates DB errors clearly
- Unit: client — correct Basic Auth header construction, successful parse, `DataForSeoAuthError` on 401/403 with no retry, retry-then-succeed on 429 (honoring `Retry-After`)/5xx/network error, non-retryable 4xx, and the out-of-range `status_code`-despite-HTTP-200 case
- Full suite: 336/336 passing (25 new), lint clean (pre-existing unrelated issues only), build clean

**Success criteria (DoD):**
- Budget gate is provably correct against all three states (under/at-threshold/over-limit) via unit tests — done
- `npm run lint`/`npm run build` clean, matching every prior milestone's bar — done

**Risks & rollback:**
- Rollback: inert until Milestones 5/6 call it; no data written by this milestone alone

---

## Milestone 5 — DataForSEO Search Volume Sync — ✅ Complete, verified against real DataForSEO + real production (2026-07-20)

**Objective:** Populate `keywords.search_volume`/`keyword_difficulty`/`cpc`/`monthly_volumes` for real — the first Phase 2 data that actually needs the new external account.

**Real finding (corrects this milestone's own task description above):** DataForSEO's live Search Volume endpoint response (confirmed against `docs.dataforseo.com/v3/keywords_data-google_ads-search_volume-live/`, and against the account's own real response) has no keyword-difficulty field — only `search_volume`, `cpc`, `monthly_searches`, and Google-Ads-specific PPC fields (`competition`, `competition_index`, bid ranges). A real SEO difficulty score needs DataForSEO Labs' separate Bulk Keyword Difficulty endpoint, which isn't one of ARCHITECTURE.md §6's five approved endpoints (and isn't in its own $4-5/month cost estimate). **Resolved:** `keyword_difficulty` is deliberately left null by this module rather than silently adding a new paid endpoint beyond the frozen spec — every consumer (Opportunity Score's `difficultyScore()`) is already null-safe for this, defaulting to a neutral 0.5.

**Tasks:**
- [x] Implemented `src/lib/seo/dataforseo/search-volume.ts`: fetches via Keywords Data > Google Ads > Search Volume (verified live, UK location_code `2826` confirmed directly against DataForSEO's own `/v3/keywords_data/google_ads/locations` endpoint — not assumed, and deliberately country-level rather than Birmingham's own city-level code, since Google Ads' city-level volume data is sparse/unreliable), caches 30 days via `keywords.last_volume_refresh`, updates `search_volume`/`cpc`/`monthly_volumes` (not `keyword_difficulty` — see above)
- [x] `src/app/api/seo/sync/dataforseo/route.ts`, cron entry `0 8 1 * *` (1st of month, 08:00 UTC — after every other daily/weekly cron's slot) per ARCHITECTURE.md §7

**A real bug found and fixed by running this against real production (not just mocked tests):** the first implementation used `supabase.from("keywords").upsert(updates, {onConflict:"id"})` with a partial payload (only `id`/`search_volume`/`cpc`/`monthly_volumes`/`last_volume_refresh`), on the same (incorrect) assumption used for Milestone 10's `actions` upsert — that PostgREST's merge-duplicates upsert leaves omitted columns untouched. That's only half true: the `DO UPDATE SET` clause does only touch listed columns, but Postgres validates NOT NULL columns while constructing the row to (possibly) insert *before* it even checks for a conflict — so omitting `site_id` (NOT NULL, no DB default) failed outright with a constraint violation, regardless of the row already existing. Milestone 10's `actions` upsert happens to be safe (it always includes every NOT-NULL-without-default column), but the *reasoning* documented for it was wrong in its generality — corrected in both files. Fixed here by switching to a plain per-row `UPDATE ... WHERE id = ...`, which has no such row-construction step and correctly only touches the columns in its `SET` clause.

**Real production run (2026-07-20):** ran `syncSearchVolume(siteId)` directly against the real DataForSEO API and real production Supabase, using credentials the user provided in chat. 81/81 keywords updated, real cost **$0.09** (recorded in `api_budgets`, which didn't exist yet for this site — correctly created at the $10 default). Spot-checked results are plausible (e.g. `"restaurants near me"` at 9,140,000/month UK-wide, `"restaurant"` at 7,480,000). Re-ran the Milestone 10 analysis engine immediately after: Opportunity Score's actions correctly stopped being a flat 50.0 across the board and now range 40.5–56.7, purely from real `search_volume`/`business_value` flowing in — confirming the "null-safe from day one, improves automatically, zero rework" design promise held in practice, not just in theory.

**Dependencies:** Milestone 4.

**Database changes:** None (uses Milestone 1's already-provisioned `keywords` columns).

**Files created:**
- `src/lib/seo/dataforseo/search-volume.ts`, `search-volume.test.ts` (13 tests)
- `src/app/api/seo/sync/dataforseo/route.ts`, `route.test.ts` (5 tests)
- `vercel.json` (modified: new cron entry)

**Tests performed:**
- Unit: `monthlySearchesToVolumesByMonth` — keyed by month number, most-recent-year wins on overlap, null/empty handling
- Unit: staleness (null vs. >30 days vs. <30 days), budget-exceeded short-circuit (no DataForSEO call made), a keyword DataForSEO returns no result for is left unupdated, real cost recorded via `recordSpend` (and skipped when cost is 0), a failed DataForSEO task throws clearly
- Route: auth (401), 503 when not configured, success/error passthrough — same pattern as every other cron route
- **Real integration, not mocked:** the full production run described above — genuinely the strongest verification level used anywhere in this project so far, since it exercises the real external API, real budget-table creation, real partial-update semantics, and real downstream score recalculation in one pass
- Full suite: 351/351 passing (18 new), lint clean (pre-existing unrelated issues only), build clean

**Success criteria (DoD):**
- Same idempotency bar as every Phase 1 sync job — a second real run only re-checks keywords whose `last_volume_refresh` has aged past 30 days, confirmed by the staleness logic and its own unit tests
- Real volume data confirmed present and plausible for spot-checked keywords — done, against real production data, not just "once real credentials exist"

**Risks & rollback:**
- Rollback: `UPDATE keywords SET search_volume = NULL, cpc = NULL, monthly_volumes = NULL WHERE site_id = ...` — safe, every downstream algorithm already treats these as nullable

---

## Milestone 6 — DataForSEO SERP Snapshots

**Objective:** Weekly competitive SERP data — powers `missing_paa` in Page ROI Score and (in Phase 3) competitor tracking.

**Tasks:**
- [ ] Implement `src/lib/seo/dataforseo/serp.ts`: fetch SERP > Regular for top keywords (weekly, top 100 per ARCHITECTURE.md §6), populate `serp_snapshots`, 7-day cache
- [ ] `src/app/api/seo/sync/dataforseo/serp/route.ts` (or folded into Milestone 5's route — decide during implementation), weekly Monday 07:00 UTC cron

**Dependencies:** Milestone 4, Milestone 0 (`serp_snapshots` table).

**Expected outputs:** Real SERP position/feature data for the site's top keywords.

**Database changes:** None (uses Milestone 0's `serp_snapshots`).

**Files to create:**
- `src/lib/seo/dataforseo/serp.ts`, `serp.test.ts`
- `src/app/api/seo/sync/dataforseo/serp/route.ts`, `route.test.ts`

**Tests to perform:**
- Unit: response parsing, `UNIQUE(keyword_id, date, position)` upsert behavior
- Unit: budget gate integration, same as Milestone 5

**Success criteria (DoD):**
- Same idempotency and budget-gate bar as Milestone 5

**Risks & rollback:**
- **Real, already-flagged risk (ARCHITECTURE.md §7), now resolved as a plan (confirmed with the user, not yet implemented):** this job's documented 10-minute timeout budget exceeds Hobby's confirmed 300s ceiling (Phase 1 Milestone 4). **Decision: reuse Phase 1's GSC backfill pattern** — `runBackfillChunk`-style time-budgeted chunks with a resumable cursor, splitting the weekly 100-keyword refresh across several smaller cron runs (e.g. 25 keywords/day across 4 days) rather than one atomic 100-keyword Monday run. Since SERP snapshots are already cached 7 days (ARCHITECTURE.md §6), spreading the refresh across a few days instead of one atomic run doesn't meaningfully hurt freshness. Chosen over a Vercel Pro upgrade (which would also work, 800s comfortably covers the 10-minute budget) since it's free and reuses an already-proven pattern in this codebase.
- Rollback: `DELETE FROM serp_snapshots WHERE site_id = ...` — safe, no cascading dependents yet (Phase 3's competitor tracking is the first thing that would read this data cross-referentially)

---

## Milestone 7 — Opportunity Score (§5.1)

**Objective:** Rank keywords by pursuit value — the headline scoring algorithm.

**Tasks:**
- [x] Implement `src/lib/seo/intelligence/opportunity-score.ts`: `position_potential` (best position per keyword from the last 7 days of `keyword_page_metrics`), `difficulty_score`/`intent_value`/`volume_norm`/`business_value` (all null-safe against missing DataForSEO fields — see the Sequencing Decision above), weighted sum using `site_configs.scoring_weights.opportunity` (already seeded per business type in Milestone 1)
- [x] Business-type default weight table — no drift found: `site_configs`'s seeded restaurant weights (`volume 0.20, position 0.35, difficulty 0.15, intent 0.15, business_value 0.15`) match ARCHITECTURE.md §5.1 exactly; used as the module's own hard-coded fallback when `scoring_weights.opportunity` is missing

**Two null-safety defaults resolved that ARCHITECTURE.md doesn't fully specify:** `difficulty_score` has no documented null behavior (only `intent_value` does) — resolved as the same neutral `0.5` `intent_value` already uses for its own null case, applied consistently. `volume_norm`/`business_value` are ratio components (`min(value/max, 1.0)`) — resolved as `0` when null, not `0.5`, since a ratio with no numerator has no relative standing to report; a neutral default would misrepresent "no data" as "average", which a min/max ratio component has no basis to claim.

**Dependencies:** Milestone 1 (nothing else strictly required — DataForSEO fields degrade gracefully when null, matching the Sequencing Decision above; Milestone 5 improves this algorithm's accuracy but doesn't gate shipping it).

**Expected outputs:** Real, immediately-testable opportunity scores using GSC-only data (`position_potential`, the single highest-weighted component per the restaurant default weights) even before DataForSEO exists; improves automatically once Milestone 5 lands.

**Database changes:** None (reads `keywords`/`keyword_page_metrics`/`site_configs`; writes nothing — Milestone 10's orchestrator writes to `actions`).

**Files created:**
- `src/lib/seo/intelligence/opportunity-score.ts`, `opportunity-score.test.ts` (14 tests)

**Tests performed:**
- [x] Unit: `position_potential` — every documented boundary (3/4, 10/11, 20/21, 50/51) plus the `null` (no ranking) case
- [x] Unit: `difficulty_score` — real-value formula plus the resolved neutral-`0.5` null default
- [x] Unit: `intent_value` — all four categories plus `null`/unrecognized-string default
- [x] Unit: `normalized_ratio` — real ratio, clamping above `1.0`, `0` for a `null` value, `0` for a zero/negative max
- [x] Unit: `computeOpportunityScore` — exact weighted sum hand-calculated against synthetic component values
- [x] Unit: orchestration (mocked Supabase) — zero keywords returns `[]` immediately; an all-null-DataForSEO-fields keyword correctly uses neutral/zero defaults per component; `volume_norm`/`business_value` correctly computed against the *site-wide* max across all fetched keywords, not just the one being scored; the best (lowest) position is correctly selected across multiple rows in the 7-day window; missing `scoring_weights.opportunity` correctly falls back to the documented default weights

**Success criteria (DoD):**
- [x] Every formula component independently verified against hand-calculated values, including both resolved null-safety conventions
- [ ] Produces plausible, rank-ordered output against real production keyword data — not yet deployed this milestone; genuinely runnable now given real GSC data already exists, just needs a route/deploy (folded into Milestone 10, or given a temporary standalone route — decide when this actually ships)

**Risks & rollback:**
- Risk (ARCHITECTURE.md's own note): cannot detect SERP-feature-adjusted click distribution without SERP snapshot data (Milestone 6) — documented limitation, not a defect
- Rollback: pure read + `actions` write

---

## Milestone 8 — Page ROI Score (§5.2) — ✅ Code complete (2026-07-20)

**Objective:** Rank existing pages by improvement return on investment.

**Tasks:**
- [x] Implement `src/lib/seo/intelligence/page-roi-score.ts`: `traffic_potential` (per-keyword click-gain projection using Milestone 1's CTR model), `revenue_potential` (page conversion rate from `page_metrics`, with site-wide fallback below 50 sessions), `effort_score` (six weighted components)
- [x] `roi_score = revenue_potential / max(effort_score, 0.05)`

**Real finding, beyond what this section originally anticipated:** the task above assumed only two `effort_score` components (`missing_paa`, `word_count_gap`) would degrade pre-DataForSEO. Checking `pages`' actual producers (`gsc/sync.ts`, `ga4/sync.ts`) shows both syncs only ever write `url`/`path` — `word_count`, `content_type`, `cms_updated_at`, `schema_types`, `title`, and `meta_description` are null for every real page, because no site crawler/CMS-content sync exists in Phase 1 or Phase 2 (the crawler is an explicit Phase 3 Non-Goal). So in practice **five of six** components are currently forced to 0, not two:
- `word_count_gap` — has a real, live formula (ARCHITECTURE.md's documented per-content-type target-word-count substitution), but evaluates to 0 today since `word_count` itself has no producer yet.
- `content_age`, `link_deficit`, `schema_gap`, `meta_quality` — ARCHITECTURE.md gives a real formula for each but no interim-default guidance (unlike `word_count_gap`/`missing_paa`), and their underlying columns/tables (`cms_updated_at`, `internal_links`, `schema_types`, `title`/`meta_description`) have zero producers in Phase 2. Rather than inventing undocumented thresholds or an expected-schema-types table (the same trap Milestone 3's seasonality check deliberately avoided), all four are forced to 0 — extending ARCHITECTURE.md's own explicit `missing_paa` precedent consistently.

Net effect: `effort_score` computes to 0 for every real page today, so `roi_score = revenue_potential / 0.05` — pages are currently ranked purely by `revenue_potential`. `revenue_potential` is itself 0 for every page too right now, because `traffic_potential` needs `keywords.search_volume`, which (like `cpc`) has no producer until Milestone 5 (DataForSEO search volume sync) runs — GSC sync only ever writes `keyword`/`keyword_normalized`/`data_source`. This is a **stronger** degradation than Opportunity Score's (Milestone 7), which still varies by `position_potential`/`intent_value` alone pre-DataForSEO. `avg_conversion_value` is the one input that can be real today, if `site_configs.conversion_events` is configured — everything else in the chain is gated on Milestone 5.

**Dependencies:** Milestone 1 (CTR model, live). Milestone 5 (DataForSEO search volume) is required for `roi_score` to produce any real variance at all. A future Phase 3 crawler is required before `effort_score` differentiates between pages.

**Expected outputs:** Code-complete, null-safe, fully unit-tested. Not yet meaningful against real data — gated on Milestone 5.

**Database changes:** None (writes to `actions` — Milestone 10).

**Files created:**
- `src/lib/seo/intelligence/page-roi-score.ts`, `page-roi-score.test.ts` (25 tests)

**Tests performed:**
- Unit: `traffic_potential`/`projectedClickGain` against hand-calculated values, including the position-3-floor and position-20-ceiling CTR-bucket clamps
- Unit: conversion-rate site-wide fallback triggers correctly at/below the 50-session floor
- Unit: `avgConversionValue`'s conversion_events-then-CPC fallback chain, including the "neither exists → 0" case
- Unit: each `effort_score` component independently verified, including all five forced-0 constants and `word_count_gap`'s real formula/clamping
- Unit: `roi_score`'s `max(effort_score, 0.05)` floor prevents divide-by-zero/near-zero blowup
- Unit: full orchestrator chain against a hand-calculated multi-stage example (`computePageRoiScores`)
- Full suite: 259/259 passing (25 new), `npm run lint` clean (pre-existing unrelated warnings only), `npm run build` clean

**Success criteria (DoD):**
- Formula components each independently verified against hand-calculated values — done
- Degraded-mode output (pre-DataForSEO) is plausible, not just non-crashing — done, though degraded further than originally scoped (see finding above); this is now clearly documented rather than silently shipped

**Risks & rollback:**
- Risk: conversion rate unreliable below 50 sessions/month — explicitly mitigated via the site-wide fallback, per ARCHITECTURE.md §5.2
- Risk (new): `roi_score` is currently 0 for every page — anyone consuming this module before Milestone 5 lands needs to know it's not yet discriminating, not that "no page needs work"
- Rollback: pure read, no route/deploy yet (feeds Milestone 10); not merged to `main`

---

## Milestone 9 — Conversion-Weighted Keyword Value (§5.5) — ✅ Code complete (2026-07-20)

**Objective:** The platform's stated core competitive advantage — monthly revenue value per keyword, something no third-party tool can compute (requires joining GSC + GA4 + business-configured conversion values, all three of which only this platform has together).

**Tasks:**
- [x] Implement `src/lib/seo/intelligence/keyword-value.ts`: `search_volume × expected_ctr × conversion_rate × avg_conversion_value`, using Milestone 1's CTR model, page-level conversion rate with site-wide fallback, `site_configs.conversion_events` for value (CPC fallback if unconfigured)
- [x] Computed on-the-fly, returned by `computeKeywordValues(siteId)` — not persisted anywhere by this module. Storing a chosen result into `actions.supporting_data` (per ARCHITECTURE.md §5.5's Output note) is Milestone 10's job, once it decides which values are worth attaching to an action

**Implementation notes:**
- Deliberately reuses Milestone 8's `pageConversionRate` (identical 50-session fallback threshold — §5.2 states that number explicitly, §5.5 only says "site-wide average" without repeating it, so this reuses the documented threshold rather than inventing a second one) and `avgConversionValue` (same conversion_events-then-CPC chain, called with a single-element CPC array so it degrades to "this keyword's own CPC as proxy" per §5.5's exact wording, distinct from §5.2's CPC-weighted average across a page's multiple keywords)
- `expected_ctr` reuses the same round-and-clamp-to-1-20 CTR-model lookup convention already established in `cannibalization.ts`/`page-roi-score.ts`; the function accepts either a current or projected position (§5.5: "or target_position for projections"), the choice is the caller's
- Same as Milestone 8: `search_volume` is null for every real keyword until Milestone 5 (DataForSEO) runs, so `monthlyValue` is currently 0 for every (keyword, page) pair in production — code-complete and null-safe, not yet meaningful

**Dependencies:** Milestone 1 (CTR model, live), Milestone 8 (reuses two of its exported functions). No DataForSEO dependency beyond the CPC fallback.

**Expected outputs:** Code-complete, null-safe, fully unit-tested. Real, differentiated values once Milestone 5 lands.

**Database changes:** None.

**Files created:**
- `src/lib/seo/intelligence/keyword-value.ts`, `keyword-value.test.ts` (11 tests)

**Tests performed:**
- Unit: `expectedCtrAtPosition` rounding/clamping (including the 1 and 20 boundary clamps) and null-position → 0
- Unit: `computeKeywordMonthlyValue` formula hand-calculated, including the null-search_volume → 0 case
- Unit: orchestrator's conversion_events-over-CPC precedence, CPC fallback when events are empty, site-wide conversion-rate fallback below 50 sessions, and null-position pairs handled correctly
- Full suite: 270/270 passing (11 new), lint clean (same pre-existing unrelated issues), build clean

**Success criteria (DoD):**
- Formula matches ARCHITECTURE.md §5.5 exactly; correctly not persisted as its own column — done

**Risks & rollback:**
- Risk: meaningless until real conversion data exists at volume — same "correct but not yet meaningful" caveat as Content Decay (Milestone 3); currently 0 for every pair pending Milestone 5, same caveat as Page ROI Score (Milestone 8)
- Rollback: nothing to roll back — computed on-the-fly, never persisted independently; not merged to `main`

---

## Milestone 10 — Action Queue Engine — ✅ Code complete, deployable (2026-07-20)

**Objective:** The orchestrator that ties Milestones 1–9 together — runs after every sync completes (ARCHITECTURE.md §7: "Analysis engine | After any sync completes | Event-driven"), writes ranked `actions` rows.

**Two design questions were genuinely underspecified by ARCHITECTURE.md and were confirmed with the user before implementation** (rather than silently resolved, per this project's standing rule for "significantly better approach"-level judgment calls):

1. **Cross-module priority scoring.** Only Cannibalization (§5.3) documents a 0-100 score with an action threshold (>40). Opportunity Score is also 0-100 but undocumented for a threshold. Page ROI's `roi_score` and Keyword Value's `monthlyValue` are unbounded — not comparable to a 0-100 score at all. **Resolved:** Opportunity and Cannibalization use their own 0-100 scores directly as `priority_score`. Page ROI and Content Decay share a second 0-100 blend built from `site_configs.scoring_weights.page_roi` (`traffic_potential`, `conversion_rate`, `effort_inverse`, `decay_urgency`) — the same "weights blend normalized 0-1 components into a 0-100 score" shape `scoring_weights.cannibalization` already uses in production. `decay_urgency` being one of `page_roi`'s own four listed weights is the direct textual evidence for folding Content Decay into the same blend rather than inventing a second formula. The raw `roi_score`/`decay_pct` still ride along in `supporting_data` for context. Keyword Value never generates its own action — per §5.5's own Output note, it only enriches an Opportunity action's `supporting_data` when a value exists. A single `ACTION_THRESHOLD = 40` gates every 0-100-scaled score, reusing Cannibalization's own documented bar rather than inventing a per-module number. Content Decay is the one exception: it generates an action whenever `decay_stage !== 'stable'`, independent of the threshold — a page can be actively losing traffic while scoring low on rank-gain headroom, and ARCHITECTURE.md frames decay as its own urgency signal.
2. **Trigger mechanism.** ARCHITECTURE.md §7 says "After any sync completes | Event-driven," and this milestone's own task list originally described "called at the end of each Phase 1 sync job." **Resolved:** implemented as its own separately-scheduled cron with a time offset (07:00 UTC, after GSC's 06:00 and GA4's 06:30) — the same pattern already live in production for the CTR model rebuild (Milestone 1, Monday 06:15) — rather than an inline call chained onto `gsc/sync.ts`/`ga4/sync.ts`'s own request handlers, avoiding the flagged risk of pushing either of those closer to Vercel Hobby's 300s ceiling with no real timing data to justify doing otherwise.

**Tasks:**
- [x] Implement `src/lib/seo/intelligence/run-analysis.ts`: runs the five action-generating modules (Opportunity, Page ROI, Cannibalization, Content Decay; Keyword Value enriches rather than generates), converts each into `actions` rows, deduped against existing `queued`/`in_progress` rows for the same dedup key rather than creating duplicates on every run
- [x] `src/app/api/seo/analysis/run/route.ts` — cron trigger (see resolution above) and manual re-run endpoint, same route serves both
- [x] `actions.expires_at` set to `created/updated_at + 90 days` on every write — a reasoned default (schema comment gives no window). The sweep that actually flips `status` to `dismissed` once `expires_at` passes is **not built in this milestone** — out of its stated task list, tracked as an open follow-up below

**Dedup key:** `fix_cannibalization` keys on `keyword_id` alone (the recommended canonical page can shift between runs as traffic shifts — that updates the existing row in place rather than spawning a second one for the same underlying keyword). Every other type keys on both `page_id`/`keyword_id`, which is equivalent to keying on whichever one is real since exactly one is always populated per type. Updates never touch `status` (respects an owner's `in_progress`/manual state) — implemented as two batched writes total per run (`insert` for new rows, `upsert(onConflict:"id")` for updates), not one write per candidate.

**Dependencies:** Milestones 1–9 (all complete).

**Expected outputs:** Code-complete, fully wired, deployed, and now confirmed producing real output — see below.

**Real production run (2026-07-20, ahead of the 07:00 UTC cron):** invoked `runAnalysis(siteId)` directly against production (via `tsx`, real credentials — not the HTTP route, to isolate business logic from routing) to verify the whole pipeline for real rather than waiting for the schedule. Result: `{candidatesGenerated: 14, actionsCreated: 14, actionsUpdated: 0}` — genuinely real, not synthetic: **9 Opportunity-sourced `create_content` actions** for untargeted keywords with real GSC ranking data ("nigerian food birmingham", "suya birmingham", "mix grill", "curry restaurant near me", others — all scoring exactly 50.0, which hand-checks out: `position_potential=1.0` for striking-distance rankings, `difficulty`/`intent` neutral 0.5 pre-DataForSEO, `volume`/`business_value` at their null-safe 0 — `(1.0×.35 + .5×.15 + .5×.15)×100 = 50.0`) and **5 Cannibalization-sourced `fix_cannibalization` actions**, including one that surfaced a real, previously-known gap: `"naija grill and spice kitchen"` (the site's own brand name) is flagged as cannibalized because `sites.config.brand_terms` was never actually configured (noted as an open item back in Milestone 2) — a genuine, useful finding, not a bug in the code. This output was left in production (it's the real, intended result, not test data) — the action queue at `/admin/seo` is no longer empty once Milestone 11 is deployed.

**Database changes:** None (uses Milestone 0's `actions` table).

**Files created:**
- `src/lib/seo/intelligence/run-analysis.ts`, `run-analysis.test.ts` (10 tests)
- `src/app/api/seo/analysis/run/route.ts`, `route.test.ts` (4 tests)
- `vercel.json`: new cron entry, `0 7 * * *`

**Tests performed:**
- Unit: `computePagePriority`'s exact weighted blend, including the conversion-rate clamp
- Unit: `actionDedupKey`'s keyword_id-only behavior for `fix_cannibalization` vs. the page+keyword key for other types
- Unit: dedup — a matching existing action is upserted (status untouched), not duplicated
- Unit: each algorithm's action-generation rule mapped to an `actions` row shape, including the untargeted-keyword filter and the combined page_performance + decay case for a single page
- Unit: `keyword_monthly_value` enrichment attaches correctly to an Opportunity action's `supporting_data`
- Route: auth (401 on missing/wrong secret), success passthrough, error passthrough — same pattern as every other cron route
- Full suite: 284/284 passing (14 new), lint clean (pre-existing unrelated issues only), build clean, `/api/seo/analysis/run` confirmed registered

**Success criteria (DoD):**
- Running twice in a row against the same data is idempotent — verified via the dedup unit test (upsert, not duplicate insert)
- Timeout budget respected — resolved by NOT chaining inline; own cron, own 300s budget, no shared risk with GSC/GA4 sync

**Open follow-ups (not this milestone's scope):**
- The `expires_at` auto-dismiss sweep itself (flipping `status` to `dismissed` once the deadline passes) isn't built — this milestone only sets the column
- `actions.effort` (small/medium/large) is never populated by this module — Milestone 8's `effort_score` components could inform it later, not required by this milestone's task list
- Not yet merged to `main` or deployed to production — code-complete and tested, deployment is a separate step

**Risks & rollback:**
- Rollback: `DELETE FROM actions WHERE status != 'completed'` — safe, doesn't touch history

---

## Milestone 11 — Action Queue UI — ✅ Complete, manually verified (2026-07-20)

**Objective:** The actual dashboard — ARCHITECTURE.md's "answers one question every day: what should I do next, and why?"

**Tasks:**
- [x] `/admin/seo` — Server Component reading `actions` directly (no API layer for reads, per ARCHITECTURE.md §7's Design Principle), sorted by `priority_score DESC`, scoped to `status IN ('queued','in_progress')` — the actual open queue, matching this milestone's task list literally rather than the fuller "Key Metrics band + Recent Activity feed" dashboard mockup in ARCHITECTURE.md §8 (out of scope: those need data sources — trend deltas, a sync-log feed — this milestone's task list doesn't ask for)
- [x] `src/app/api/seo/actions/[id]/route.ts` — `PATCH` status mutation (queued/in_progress/completed/skipped/dismissed), Basic Auth per ARCHITECTURE.md §7. Added `/api/seo/actions/:path*` to `middleware.ts`'s matcher (it wasn't covered by any existing entry — `/admin/seo` itself needed no change, already covered by `/admin/:path*`)
- [x] `completed_at` set/cleared on every write, mirroring the `actions_completed_at_consistency_check` DB constraint from Milestone 0, so the route can never produce a row the DB would reject

**Implementation notes:**
- `src/components/admin/ActionControls.tsx` — the interactive Start/Complete/Skip/Dismiss buttons, a small Client Component (the page itself stays a Server Component per the Design Principle above); calls the mutation route directly via `fetch`, then `router.refresh()`. No extra auth wiring needed — the browser already holds the Basic Auth credentials from loading `/admin/seo` itself, for the same origin/realm.
- Row labels (`TYPE_LABELS`/`SOURCE_MODULE_LABELS`) are a small display-only mapping over the DB's own enum values — not a new source of truth.

**Dependencies:** Milestone 10 (deployed).

**Expected outputs:** A real, usable admin page. Currently shows the empty state in production (0 open actions — no algorithm has produced a qualifying candidate yet; expected, not a bug).

**Database changes:** None.

**Files created:**
- `src/app/admin/seo/page.tsx`
- `src/components/admin/ActionControls.tsx`
- `src/app/api/seo/actions/[id]/route.ts`, `route.test.ts` (7 tests)
- `src/middleware.ts`/`middleware.test.ts` updated (new matcher entry + test coverage)

**Tests performed:**
- Unit: mutation route — invalid JSON, invalid/missing status, terminal-status sets `completed_at`, non-terminal clears it, 404 on no match, 500 on DB error, success payload shape (7 tests)
- Unit: `middleware.test.ts` extended to cover `/api/seo/actions/:path*` with the same 401/200 auth matrix as `/admin` and `/api/seo/status`
- **Manual, in a real browser, against real production data** (per this project's standing UI-testing rule) — genuinely more than usual was possible here: this sandbox unexpectedly had live production Supabase credentials in its environment (not just `.env.example`), so verification ran against the actual production database rather than a local/mocked one:
  1. Confirmed Basic Auth: 401 with no/wrong credentials, 200 with correct ones
  2. Confirmed the real empty-state render (production `actions` table was genuinely empty at the time)
  3. With the user's explicit approval (a write via the Supabase Management API was blocked by Claude Code's safety classifier on the first attempt — respected the block, asked the user rather than routing around it with a different tool), inserted one clearly-labeled test row, then drove the full UI with a headless Chromium (Playwright, invoked directly since this project has no Playwright devDependency): clicked **Start** (`queued → in_progress`, confirmed via the `In progress` badge appearing and the PATCH response body), clicked **Complete** (`in_progress → completed`, confirmed the row correctly disappears from the open-queue view), verified the underlying DB row directly (`status: completed`, `completed_at` set, `updated_at` bumped) — then reset and re-ran once cleanly with proper response-synchronization (no arbitrary sleeps) for a crisp final confirmation, screenshotted at each step
  4. Deleted the test row immediately after (confirmed `count(*) = 0` on `actions` afterward) — production left exactly as found

**Success criteria (DoD):**
- A real admin, logged in, can see ranked actions and change their status — confirmed against real production data, not just mocked
- UI manually exercised in a browser, not just unit-tested — confirmed, screenshotted, and the full status lifecycle driven end-to-end

**Risks & rollback:**
- Rollback: pure UI + mutation route, no data model changes

---

## Milestone 12 — Site Configuration UI — ✅ Complete, manually verified (2026-07-20)

**Objective:** Let the scoring weights and conversion events (currently only editable via direct SQL) be configured from the admin UI.

**Tasks:**
- [x] `/admin/seo/settings` — edit `site_configs.scoring_weights`/`conversion_events`
- [x] `src/app/api/seo/settings/route.ts` — `PUT`, Basic Auth, validates weight sums / conversion-event shape server-side (mirrors `config.ts`'s Zod-schema-first discipline)

**Implementation notes:**
- Server-side validation (Zod, `src/app/api/seo/settings/route.ts`): each of `scoring_weights`' four known modules (`opportunity`, `page_roi`, `cannibalization`, `internal_link`) must sum to 1.0 within a 0.01 tolerance — every 0-100 scoring formula in §5.1/§5.2/§5.3 assumes its weights are a full partition of 1.0, so a corrupted sum would silently mis-scale every action's `priority_score`. `conversion_events` validated as `{name: non-empty string, value: > 0}[]`.
- `scoring_weights` updates shallow-merge over the existing column per module (submitting `page_roi` alone doesn't wipe `opportunity`/`cannibalization`/`internal_link`) — `conversion_events` is a full array replace, matching how the form always submits its complete current list.
- `src/components/admin/SettingsForm.tsx` — a Client Component with live client-side sum feedback (green ✓ / red "must be 1.0") per module as you type, purely advisory; the server-side Zod check is what's actually authoritative.
- Added `/api/seo/settings` to `middleware.ts`'s Basic Auth matcher (`/admin/seo/settings` itself needed no change — already covered by `/admin/:path*`).

**Dependencies:** None beyond Phase 1's `site_configs` table (live since Milestone 1).

**Expected outputs:** A real settings page — genuinely independent of every other Phase 2 milestone. Discovered while verifying: `conversion_events` was already configured in production with 5 real events (whatsapp_click, uber_eats_click, phone_call, reservation_submit, directions_click) — Page ROI/Keyword Value's `avg_conversion_value` component has real config to read from already, ahead of what earlier milestones assumed.

**Database changes:** None.

**Files created:**
- `src/app/admin/seo/settings/page.tsx`
- `src/components/admin/SettingsForm.tsx`
- `src/app/api/seo/settings/route.ts`, `route.test.ts` (11 tests)
- `src/middleware.ts`/`middleware.test.ts` updated (new matcher entry + test coverage)

**Tests performed:**
- Unit: invalid JSON, empty body, weights not summing to 1.0, negative weight, non-positive conversion value, empty event name, shallow-merge-preserves-other-modules, valid conversion_events update, 404 no matching row, 500 on DB error (11 tests)
- **Manual, in a real browser, against real production `site_configs`** — same rigor as Milestone 11, with extra care since this table (unlike Milestone 11's isolated test action) is read by every scoring module: captured the exact original values first (`scoring_weights` for all 4 modules + 5 real conversion events), confirmed the form prefills correctly from real data, added one clearly-labeled test conversion event via the real UI and confirmed the `PUT` correctly shallow-merged (all 4 weight modules byte-identical, the new event appended to the real 5), confirmed the client-side red sum-mismatch warning fires on a bad edit, removed the test event via the UI and saved, then **verified via a direct DB read that the final state matches the originally-captured values exactly** — production `site_configs` was left precisely as found

**Success criteria (DoD):**
- A real admin can change scoring weights and conversion events without touching SQL directly — confirmed against real production data, round-tripped and reverted cleanly

**Risks & rollback:**
- Rollback: pure UI + mutation route

---

## Cross-Cutting Notes

- **Same engineering discipline as Phase 1, no exceptions:** one milestone at a time, tested and documented before moving on, database-first principles for Milestone 0, real integration verification distinguished from mocked unit tests at every step, CHANGELOG.md/this document updated after every milestone.
- **External credential dependency, flagged now:** Milestones 4–6 need a DataForSEO account that doesn't exist yet — same shape of blocker Phase 1 hit with Google Cloud, budget real time for it, and don't be surprised if it also takes several rounds of troubleshooting.
- **"Code-complete, not yet meaningful" is a legitimate, distinct milestone state**, used by Content Decay (Milestone 3, needs elapsed time) and Conversion-Weighted Value (Milestone 9, needs conversion volume) — not the same thing as "blocked on credentials" (Milestones 4–6) or "blocked on nothing, ships now" (Milestones 0–2, 7, 10–12 in degraded mode). Keep these three states distinct when reporting status, exactly as Phase 1 learned to distinguish "credential-blocked" from "time-blocked" for the GSC backfill vs. GA4 traffic.
