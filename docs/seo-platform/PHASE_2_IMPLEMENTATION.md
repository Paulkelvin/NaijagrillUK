# Phase 2 Implementation Plan — Intelligence Layer

> **Status:** In progress. Milestones 0 (schema) and 1 (CTR model) both deployed to production (2026-07-20), verified via `curl`. The CTR model correctly stays on industry defaults for now (only 5 real clicks exist). In passing, found and fixed a real Phase 1 gap: `/api/seo/sync/gsc` and `/api/seo/sync/ga4` were never actually wired into `vercel.json`'s cron schedule — the entire pipeline (GSC, GA4, CTR model, retention, ping) now runs on its own schedule, confirmed registered via the Vercel API. Milestones 2 (cannibalization) and 3 (content decay) are both code-complete and unit-tested — neither has a route/deploy yet, since neither is its own background job (both feed into Milestone 10's combined analysis engine). Content decay genuinely cannot produce real output for months (needs 60-90 days of GA4 history that doesn't exist yet). Milestones 4–12 not started.
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
- **Not yet performed:** applied to production. Same DB-access constraints as every prior Phase 1 migration apply here too (no Supabase MCP connector reachable this session, no direct Postgres egress) — needs the SQL editor (paste `20260720120000_seo_phase2_intelligence.sql`'s contents) or a working MCP connection.

**Success criteria (DoD):**
- [x] All three tables pass the same constraint/RLS audit Milestone 1's 28-check verification used — see above
- [x] Local Postgres validation clean before any production apply
- [ ] Applied to production — **pending**

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

## Milestone 4 — DataForSEO Client Foundation + Budget Controls (§6)

**Objective:** One authenticated, budget-aware DataForSEO client that Milestones 5–6 both build on — mirrors how Milestone 2 (Config & Secrets) preceded Milestone 5/6's actual sync jobs in Phase 1.

**Tasks:**
- [ ] Verify DataForSEO's actual current auth mechanism via their live API docs before writing any code (per this project's standing discipline — Phase 1 caught real drift doing exactly this for GSC/GA4/Vercel; DataForSEO is reported to use HTTP Basic Auth with a login/password pair rather than OAuth2/JWT, distinct enough from the Google APIs that this needs independent verification, not an assumption carried over)
- [ ] `src/lib/seo/config.ts`: add `getDataForSeoConfig()`/`isDataForSeoConfigured()` following the exact existing pattern (Zod schema, fail-fast on missing/malformed)
- [ ] `src/lib/seo/dataforseo/client.ts`: authenticated request wrapper, reusing `retry.ts`'s `withRetry`/`RetryableError`
- [ ] `src/lib/seo/dataforseo/budget.ts`: implements §6 Budget Controls exactly — check `api_budgets.current_spend < monthly_limit` before every call, log a warning at `alert_threshold` (default 0.8), skip the call and log `sync_log` status `"budget_exceeded"` at 100%, default monthly limit $10/site (matches `site_configs`-adjacent config, not yet modeled — decide during implementation whether this is a new `site_configs` field or lives directly in `api_budgets` as ARCHITECTURE.md's schema already implies via `monthly_limit`)

**Dependencies:** Milestone 0 (`api_budgets` table).

**Expected outputs:** A working, unit-tested client — **code-complete pending a real DataForSEO account**, same "code-complete, integration verification pending" posture as Phase 1 Milestones 5/6 before Google credentials existed. Requires Paul to sign up for a DataForSEO account and add its credentials to Vercel when ready — a new external-account dependency, flagged now rather than discovered mid-milestone.

**Database changes:** None (uses Milestone 0's `api_budgets`).

**Files to create:**
- `src/lib/seo/dataforseo/client.ts`, `client.test.ts`
- `src/lib/seo/dataforseo/budget.ts`, `budget.test.ts`
- `src/lib/seo/config.ts` (modified)

**Tests to perform:**
- Unit: budget check correctly allows calls under the limit, warns at the alert threshold, skips and logs at/over the limit — all against a mocked Supabase client, same pattern as every Phase 1 sync job's tests
- Unit: retry/auth-failure classification, mirroring the rigor of `gsc/client.test.ts`/`ga4/client.test.ts` (real signature verification if the auth scheme turns out to need one; DataForSEO's actual mechanism determines this — see Tasks note)

**Success criteria (DoD):**
- Budget gate is provably correct against all three states (under/at-threshold/over-limit) via unit tests
- `npm run lint`/`npm run build` clean, matching every prior milestone's bar

**Risks & rollback:**
- Risk: DataForSEO's real auth/response format may differ from what's assumed here — resolve via live docs when this milestone actually starts, same discipline applied throughout Phase 1
- Rollback: inert until Milestones 5/6 call it; no data written by this milestone alone

---

## Milestone 5 — DataForSEO Search Volume Sync

**Objective:** Populate `keywords.search_volume`/`keyword_difficulty`/`cpc`/`monthly_volumes` for real — the first Phase 2 data that actually needs the new external account.

**Tasks:**
- [ ] Implement `src/lib/seo/dataforseo/search-volume.ts`: fetch via Keywords Data > Google > Search Volume, cache 30 days (`keywords.last_volume_refresh`), update the four fields above
- [ ] `src/app/api/seo/sync/dataforseo/route.ts`, cron entry (1st of month per ARCHITECTURE.md §7)

**Dependencies:** Milestone 4.

**Expected outputs:** Real search volume/difficulty/CPC data — blocked entirely on the DataForSEO account existing, same shape of blocker Phase 1 had with Google Cloud.

**Database changes:** None (uses Milestone 1's already-provisioned `keywords` columns).

**Files to create:**
- `src/lib/seo/dataforseo/search-volume.ts`, `search-volume.test.ts`
- `src/app/api/seo/sync/dataforseo/route.ts`, `route.test.ts`
- `vercel.json` (modified)

**Tests to perform:**
- Unit: response parsing against DataForSEO's actual (verified, not assumed) response shape
- Unit: 30-day cache correctly skips keywords refreshed within the window
- Unit: budget gate (Milestone 4) correctly short-circuits when the monthly limit is hit mid-run

**Success criteria (DoD):**
- Same idempotency bar as every Phase 1 sync job: two consecutive runs produce no duplicate/conflicting state
- Once real credentials exist: real volume data confirmed present and plausible for a spot-checked keyword

**Risks & rollback:**
- Risk: DataForSEO response parsing complexity, flagged in ARCHITECTURE.md's own Phase 2 risk note — budget real time for this specifically
- Rollback: `UPDATE keywords SET search_volume = NULL, keyword_difficulty = NULL, cpc = NULL, monthly_volumes = NULL WHERE ...` — safe, every downstream algorithm already treats these as nullable

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
- **Real, already-flagged risk (ARCHITECTURE.md §7):** this job's documented 10-minute timeout budget exceeds Hobby's confirmed 300s ceiling (Phase 1 Milestone 4). This needs an actual decision when this milestone starts — chunk it the same way Phase 1's GSC backfill was chunked (`nextStartDate`-style resumable batches), or this specific job requires a Pro-plan upgrade. **Not resolved by this plan — flagged for a stop-and-discuss at milestone start**, per this project's standing rule about presenting options rather than silently picking one for a genuine trade-off.
- Rollback: `DELETE FROM serp_snapshots WHERE site_id = ...` — safe, no cascading dependents yet (Phase 3's competitor tracking is the first thing that would read this data cross-referentially)

---

## Milestone 7 — Opportunity Score (§5.1)

**Objective:** Rank keywords by pursuit value — the headline scoring algorithm.

**Tasks:**
- [ ] Implement `src/lib/seo/intelligence/opportunity-score.ts`: `position_potential` (from recent `keyword_page_metrics`), `difficulty_score`/`intent_value`/`volume_norm`/`business_value` (all null-safe against missing DataForSEO fields — see the Sequencing Decision above), weighted sum using `site_configs.scoring_weights.opportunity` (already seeded per business type in Milestone 1)
- [ ] Business-type default weight table (already documented in ARCHITECTURE.md §5.1, already seeded in `site_configs` — confirm no drift between what's live and what's specified)

**Dependencies:** Milestone 1 (nothing else strictly required — DataForSEO fields degrade gracefully when null, matching the Sequencing Decision above; Milestone 5 improves this algorithm's accuracy but doesn't gate shipping it).

**Expected outputs:** Real, immediately-testable opportunity scores using GSC-only data (`position_potential`, the single highest-weighted component per the restaurant default weights) even before DataForSEO exists; improves automatically once Milestone 5 lands.

**Database changes:** None (writes to `actions` via Milestone 10).

**Files to create:**
- `src/lib/seo/intelligence/opportunity-score.ts`, `opportunity-score.test.ts`

**Tests to perform:**
- Unit: each formula component (`position_potential` bucketing, `difficulty_score`, `intent_value` mapping, `volume_norm`, `business_value`) hand-calculated against synthetic keyword data
- Unit: null `search_volume`/`keyword_difficulty`/`cpc`/`search_intent` degrade to documented defaults rather than throwing or producing `NaN`
- Unit: business-type weight lookup matches the exact table in ARCHITECTURE.md §5.1

**Success criteria (DoD):**
- Produces plausible, rank-ordered output against real production keyword data using GSC-only fields, before any DataForSEO data exists

**Risks & rollback:**
- Risk (ARCHITECTURE.md's own note): cannot detect SERP-feature-adjusted click distribution without SERP snapshot data (Milestone 6) — documented limitation, not a defect
- Rollback: pure read + `actions` write

---

## Milestone 8 — Page ROI Score (§5.2)

**Objective:** Rank existing pages by improvement return on investment.

**Tasks:**
- [ ] Implement `src/lib/seo/intelligence/page-roi-score.ts`: `traffic_potential` (per-keyword click-gain projection using Milestone 1's CTR model), `revenue_potential` (page conversion rate from `page_metrics`, with site-wide fallback below 50 sessions), `effort_score` (six weighted components — `missing_paa` forced to 0 until Milestone 6 exists, `word_count_gap` uses the documented per-content-type defaults until a content-brief data source exists in Phase 3)
- [ ] `roi_score = revenue_potential / max(effort_score, 0.05)`

**Dependencies:** Milestone 1 (CTR model). Milestone 6 improves `effort_score`'s `missing_paa` component but doesn't gate shipping.

**Expected outputs:** Real ROI-ranked pages using GA4 conversion data + GSC keyword data, degraded-but-real `effort_score` until DataForSEO exists.

**Database changes:** None (writes to `actions`).

**Files to create:**
- `src/lib/seo/intelligence/page-roi-score.ts`, `page-roi-score.test.ts`

**Tests to perform:**
- Unit: `traffic_potential` click-gain projection against synthetic multi-keyword page data
- Unit: conversion-rate site-wide fallback triggers correctly below the 50-session floor
- Unit: each `effort_score` component independently verified, including the two that degrade to defaults pre-DataForSEO
- Unit: `roi_score`'s `max(effort_score, 0.05)` floor prevents divide-by-zero/near-zero blowup

**Success criteria (DoD):**
- Formula components each independently verified against hand-calculated values
- Degraded-mode output (pre-DataForSEO) is plausible, not just non-crashing

**Risks & rollback:**
- Risk: conversion rate unreliable below 50 sessions/month — explicitly mitigated via the site-wide fallback, per ARCHITECTURE.md §5.2
- Rollback: pure read + `actions` write

---

## Milestone 9 — Conversion-Weighted Keyword Value (§5.5)

**Objective:** The platform's stated core competitive advantage — monthly revenue value per keyword, something no third-party tool can compute (requires joining GSC + GA4 + business-configured conversion values, all three of which only this platform has together).

**Tasks:**
- [ ] Implement `src/lib/seo/intelligence/keyword-value.ts`: `search_volume × expected_ctr × conversion_rate × avg_conversion_value`, using Milestone 1's CTR model, page-level conversion rate with site-wide fallback, `site_configs.conversion_events` for value (CPC fallback if unconfigured)
- [ ] Computed on-the-fly, stored in `actions.supporting_data` per ARCHITECTURE.md §5.5 — explicitly not a persisted column

**Dependencies:** Milestone 1 (CTR model). No DataForSEO dependency beyond the CPC fallback (degrades gracefully, matching Milestones 7–8's pattern).

**Expected outputs:** Real per-keyword monthly value estimates as soon as any page has both keyword and conversion data — immediately testable against production.

**Database changes:** None.

**Files to create:**
- `src/lib/seo/intelligence/keyword-value.ts`, `keyword-value.test.ts`

**Tests to perform:**
- Unit: formula hand-calculated against synthetic keyword/page/conversion data
- Unit: CPC fallback triggers correctly when `site_configs.conversion_events` is empty (Milestone 1's default seed state)

**Success criteria (DoD):**
- Formula matches ARCHITECTURE.md §5.5 exactly; correctly not persisted as its own column

**Risks & rollback:**
- Risk: meaningless until real conversion data exists at volume — same "correct but not yet meaningful" caveat as Content Decay (Milestone 3)
- Rollback: nothing to roll back — computed on-the-fly, never persisted independently

---

## Milestone 10 — Action Queue Engine

**Objective:** The orchestrator that ties Milestones 1–9 together — runs after every sync completes (ARCHITECTURE.md §7: "Analysis engine | After any sync completes | Event-driven"), writes ranked `actions` rows.

**Tasks:**
- [ ] Implement `src/lib/seo/intelligence/run-analysis.ts`: runs all six scoring modules, converts each algorithm's "Action generation" rules (already specified per-algorithm in §5.1–§5.7) into `actions` rows — dedupe against existing non-completed actions for the same `page_id`/`keyword_id`/`type` rather than creating duplicates on every run
- [ ] `src/app/api/seo/analysis/run/route.ts` — both the event-driven trigger (called at the end of each Phase 1 sync job — a real integration point into `gsc/sync.ts`/`ga4/sync.ts`, needs care not to blow their own timeout budgets) and a manual re-run endpoint per ARCHITECTURE.md §7's route list
- [ ] `actions.expires_at` — auto-dismiss stale actions logic (mentioned in the schema comment, behavior not otherwise specified in §5 — resolve during implementation with a documented default, e.g. 90 days, flagged as a reasoned default rather than a hidden assumption)

**Dependencies:** Milestones 1–9.

**Expected outputs:** A real, populated `actions` table reflecting all six algorithms' current output.

**Database changes:** None (uses Milestone 0's `actions` table).

**Files to create:**
- `src/lib/seo/intelligence/run-analysis.ts`, `run-analysis.test.ts`
- `src/app/api/seo/analysis/run/route.ts`, `route.test.ts`

**Tests to perform:**
- Unit: dedup logic — re-running against unchanged underlying data doesn't create duplicate `actions` rows for the same open issue
- Unit: each algorithm's action-generation rule correctly maps to an `actions` row shape (`type`/`source_module`/`priority_score`/`supporting_data`)
- Integration: triggered from the end of a real `gsc/sync.ts` run without blowing its own timeout budget

**Success criteria (DoD):**
- Running twice in a row against the same data is idempotent — no duplicate/runaway `actions` growth
- Timeout budget respected when chained after a real sync job

**Risks & rollback:**
- Risk: chaining onto the end of `gsc/sync.ts`/`ga4/sync.ts` risks pushing those jobs closer to Hobby's 300s ceiling — may need to become its own separately-triggered step instead of literally inline; decide during implementation with real timing data, not guessed now
- Rollback: `DELETE FROM actions WHERE status != 'completed'` — safe, doesn't touch history

---

## Milestone 11 — Action Queue UI

**Objective:** The actual dashboard — ARCHITECTURE.md's "answers one question every day: what should I do next, and why?"

**Tasks:**
- [ ] `/admin/seo` — Server Component reading `actions` directly (no API layer for reads, per ARCHITECTURE.md §7's Design Principle), sorted by `priority_score DESC`
- [ ] `src/app/api/seo/actions/[id]/route.ts` — status mutation (queued/in_progress/completed/skipped/dismissed), Basic Auth per ARCHITECTURE.md §7 (same mechanism as `/admin`, `/api/seo/status`)

**Dependencies:** Milestone 10.

**Expected outputs:** A real, usable admin page.

**Database changes:** None.

**Files to create:**
- `src/app/admin/seo/page.tsx` (or wherever the existing `/admin` structure conventions place it — check `src/app/admin/` before assuming a path)
- `src/app/api/seo/actions/[id]/route.ts`, `route.test.ts`

**Tests to perform:**
- Unit: mutation route auth (same pattern as `middleware.test.ts`)
- Manual: exercise the actual UI in a browser per this project's standing UI-testing requirement — start the dev server, verify the golden path and status-change interactions before calling this done

**Success criteria (DoD):**
- A real admin, logged in, can see ranked actions and change their status
- UI manually exercised in a browser, not just unit-tested (per this project's standing rule for frontend work)

**Risks & rollback:**
- Rollback: pure UI + mutation route, no data model changes

---

## Milestone 12 — Site Configuration UI

**Objective:** Let the scoring weights and conversion events (currently only editable via direct SQL) be configured from the admin UI.

**Tasks:**
- [ ] `/admin/seo/settings` — edit `site_configs.scoring_weights`/`conversion_events`
- [ ] `src/app/api/seo/settings/route.ts` — `PUT`, Basic Auth, validates weight sums / conversion-event shape server-side (mirrors `config.ts`'s Zod-schema-first discipline)

**Dependencies:** None beyond Phase 1's `site_configs` table (live since Milestone 1).

**Expected outputs:** A real settings page — genuinely independent of every other Phase 2 milestone, could be built any time.

**Database changes:** None.

**Files to create:**
- `src/app/admin/seo/settings/page.tsx`
- `src/app/api/seo/settings/route.ts`, `route.test.ts`

**Tests to perform:**
- Unit: server-side validation rejects malformed weight objects / conversion-event shapes
- Manual: exercise in a browser, same standing rule as Milestone 11

**Success criteria (DoD):**
- A real admin can change scoring weights and conversion events without touching SQL directly

**Risks & rollback:**
- Rollback: pure UI + mutation route

---

## Cross-Cutting Notes

- **Same engineering discipline as Phase 1, no exceptions:** one milestone at a time, tested and documented before moving on, database-first principles for Milestone 0, real integration verification distinguished from mocked unit tests at every step, CHANGELOG.md/this document updated after every milestone.
- **External credential dependency, flagged now:** Milestones 4–6 need a DataForSEO account that doesn't exist yet — same shape of blocker Phase 1 hit with Google Cloud, budget real time for it, and don't be surprised if it also takes several rounds of troubleshooting.
- **"Code-complete, not yet meaningful" is a legitimate, distinct milestone state**, used by Content Decay (Milestone 3, needs elapsed time) and Conversion-Weighted Value (Milestone 9, needs conversion volume) — not the same thing as "blocked on credentials" (Milestones 4–6) or "blocked on nothing, ships now" (Milestones 0–2, 7, 10–12 in degraded mode). Keep these three states distinct when reporting status, exactly as Phase 1 learned to distinguish "credential-blocked" from "time-blocked" for the GSC backfill vs. GA4 traffic.
