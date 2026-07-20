# ADR-011: Action Outcome Tracking Stored in `supporting_data`, Not New Columns

**Status:** Accepted
**Date:** 2026-07-20
**Author:** Claude, on behalf of Paul Kelvin (Milestone 13 implementation)

## Problem

After all 12 original Phase 2 milestones shipped, the user asked directly whether the platform has a feedback loop, and specifically asked for the real gap identified in that answer to be closed: nothing measured whether *completing* a specific action actually improved rankings or traffic. Building that requires persisting two new pieces of state per action — a "before" snapshot captured at completion time, and an "after" snapshot captured later — plus an outcome classification.

The natural way to store this is dedicated `actions` columns (`baseline_metrics`, `outcome_metrics`, `outcome`, `outcome_measured_at`) with a CHECK constraint on `outcome`'s enum and a partial index for the measurement job's query — the same pattern every other schema addition in this project has used (Milestones 0, 7). That requires a migration.

This session's sandbox has no working path to apply one against production. Direct Postgres is network-blocked (confirmed again this session: `psql` against `DATABASE_URL` fails with no connection, matching Milestone 7's original finding). The Supabase Management API route used successfully in Milestone 0 (`POST https://api.supabase.com/v1/projects/{ref}/database/query`, Bearer PAT) needs a personal access token that isn't available in this session's environment.

## Considered Alternatives

1. **Block the feature, ask the user for a fresh Supabase PAT or to run the migration by hand via the SQL editor.** Correct long-term shape, but stalls a real, explicitly-requested improvement on an unrelated infrastructure gap that has nothing to do with whether the feature itself is a good idea.
2. **Store outcome-tracking data in `actions.supporting_data`** (JSONB, NOT NULL, already the designed extensibility point every action-generating module uses for its own module-specific context — see `run-analysis.ts`'s `supportingData` on every `ActionCandidate`). No migration needed; ships immediately.
3. **A new, separate table just for outcome tracking**, also needing a migration — no advantage over option 1 for this session's actual blocker (DDL access), and it fragments outcome data away from the action it describes.

## Decision

Option 2 — `actions.supporting_data.outcomeTracking`.

## Reasoning

`supporting_data` already exists precisely to hold "this is real, useful, module-specific context that doesn't need its own column" — every action type already stores its own shape there (`opportunityScore`/`components` for Opportunity, `positionVarianceNorm`/`recommendation` for Cannibalization, and so on). Outcome tracking fits that description exactly: it's per-action, read far more often as a whole JSON blob (rendered in the UI) than queried by its individual fields, and this project's real scale (dozens of actions, not thousands) means the two things a dedicated column would buy — a CHECK constraint and a partial index — matter far less here than they would at a larger scale.

This is explicitly a workaround for an environmental constraint, not a claim that JSONB is the better long-term design. It's documented here, in the same "state the deviation, don't hide it" discipline as every other resolved gap in this project, specifically so it's easy to find and reverse later.

## Trade-offs

- **No DB-level enum constraint on `outcome`.** Only `action-outcomes.ts`'s `classifyOutcome()` guarantees it's one of `improved`/`unchanged`/`declined` — a direct write from anywhere else in the codebase (there is none today) could write an invalid value with nothing stopping it at the database layer.
- **No partial index for "completed actions pending measurement."** `measureActionOutcomes()` instead fetches every completed action for the site and filters in application code. Fine today; would need revisiting if this project's action volume ever grew into the hundreds.
- **Promoting this to real columns is a small, low-risk follow-up**, not a rewrite — the JSON shape (`baselineMetrics`/`outcomeMetrics`/`outcome`/`outcomeMeasuredAt`) was chosen to map onto four dedicated columns directly, once a real migration path is available again.

## Related

- `src/lib/seo/intelligence/action-outcomes.ts` — the module itself, with the same reasoning restated at the top of the file
- `src/app/api/seo/actions/[id]/route.ts` — where the baseline gets captured, on the transition into `completed`
- `src/app/api/seo/analysis/outcomes/route.ts` — the daily cron that measures outcomes 30 days later
- PHASE_2_IMPLEMENTATION.md Milestone 13 — full implementation record
- ADR-007 (JSONB Configuration Over Hard-Coded Business Logic) — a related but distinct precedent: that ADR chose JSONB over hard-coded logic for flexibility; this one chose JSONB over a migration for environmental access reasons, on a column (`supporting_data`) that was already JSONB before this decision
