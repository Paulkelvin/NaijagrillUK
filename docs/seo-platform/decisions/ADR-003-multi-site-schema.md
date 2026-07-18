# ADR-003: Multi-Site Schema Design With Single-Site Phase 1

**Status:** Accepted
**Date:** 2026-07-18
**Author:** Paul Kelvin

## Problem

The platform should eventually support multiple sites and business types. Should multi-site support be built now or later?

## Considered Alternatives

1. **Build for one site, add multi-site later.** Simpler initial development, but requires schema migration and query refactoring later.
2. **Design multi-site schema now, build one site's features.** Slightly more complex queries (every query includes `site_id`), but zero migration cost later.

## Decision

Option 2 — multi-site schema now, single-site features first.

## Reasoning

Adding `site_id` to every table and query is a small upfront cost (an extra `WHERE` clause). Retrofitting it later requires migrating every table, updating every query, and risking bugs in data isolation. The schema cost is paid once; the migration cost would be paid in every table.

## Trade-offs

Every query is slightly more complex. Mitigated by a helper function that injects `site_id` filtering.
