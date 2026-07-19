# ADR-009: Server-Side Timestamp Generation for Constraint-Checked Columns

**Status:** Accepted
**Date:** 2026-07-19
**Author:** Claude, on behalf of Paul Kelvin (Milestone 3 implementation)

## Problem

`sync_log`'s `sync_log_completed_after_started_check` CHECK constraint (`completed_at >= started_at`) compares two timestamps: `started_at`, set by Postgres via `DEFAULT now()` at `INSERT` time, and `completed_at`, which `completeSyncRun()` originally computed application-side (`new Date().toISOString()`) and sent as part of the `UPDATE`.

This failed in practice. During Milestone 3's integration testing against the real production database, two separate network round-trips (an `INSERT`, then — after real, measurable application work — an `UPDATE`) with roughly 150ms of genuine elapsed wall-clock time between them still violated the constraint. The only explanation is that the application process's clock and the Postgres host's clock disagreed by more than that gap. In any real deployment, the application (Vercel) and the database (Supabase) are different machines with independently-synced clocks — this was never a sandbox-only artifact, it's an inherent property of comparing a client-computed timestamp against a server-computed one.

## Considered Alternatives

1. **Client-computed timestamp** (original implementation). Simple, but fundamentally races against clock skew between two independently-clocked machines — not a rare edge case, a structural property of the architecture.
2. **Loosen the constraint with a tolerance window** (e.g., `completed_at >= started_at - interval '5 seconds'`). Shrinks the failure window without removing its cause; still assumes a bound on skew that isn't actually guaranteed.
3. **Retry on constraint violation with a later timestamp.** Adds complexity to what should be a simple write; papers over the race rather than removing it.
4. **Server-side timestamp via a `BEFORE UPDATE` trigger.** The database sets `completed_at = now()` itself whenever `status` moves away from `'started'`, and the application stops sending `completed_at` entirely.

## Decision

Option 4 — server-side timestamp generation via trigger.

## Reasoning

Any invariant that compares two timestamps must have both computed by the same clock, or the invariant is only probabilistically true. A `BEFORE UPDATE` trigger guarantees this unconditionally: `started_at` (set at `INSERT`) and `completed_at` (set at `UPDATE`, by this trigger) are both always Postgres's own `now()`. Verified directly against production: a deliberately backdated `completed_at` (10 seconds before `started_at` — far worse than the ~150ms skew actually observed) is correctly overridden every time, and the invariant holds unconditionally rather than "usually."

This mirrors the existing `seo_set_updated_at()` trigger pattern already established in the core schema migration — not a new mechanism, an extension of one already in use.

## Trade-offs

- One more trigger to reason about per table that needs this pattern. Accepted — the alternative is a correctness bug that manifests intermittently and non-deterministically in production, which is worse.
- The application can no longer set `completed_at` to an arbitrary value even if it had a legitimate reason to (e.g., backfilling historical sync data with a known completion time). No such use case exists today; if one arises, it would need a deliberate, explicit escape hatch (e.g., a separate backfill-only column or function), not a reason to remove this guarantee from the normal write path.

## General Principle (for future tables)

**Any column whose value is compared against a database-generated timestamp in a CHECK constraint should itself be database-generated, not application-supplied.** This applies beyond `sync_log` — any future table with a similar "started/completed" or "created/expired" pair of constrained timestamps should default to this pattern rather than trusting application clocks.

## Related

- `supabase/migrations/20260719000000_sync_log_server_side_completed_at.sql` — the fix
- `supabase/migrations/20260719193100_harden_trigger_function_search_path.sql` — follow-up hardening (pinned `search_path` on both trigger functions, per Supabase's own security advisor; unrelated to the clock-skew issue itself, applied in the same session since the tooling was available)
- `docs/seo-platform/PHASE_1_IMPLEMENTATION.md` Milestone 3 — full narrative and validation record
