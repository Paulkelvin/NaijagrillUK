# ADR-005: Server Components Over Separate API Layer

**Status:** Accepted
**Date:** 2026-07-18
**Author:** Paul Kelvin

## Problem

Should the admin UI read data through an API layer or directly from the database?

## Considered Alternatives

1. **REST API** between frontend and database.
2. **GraphQL API** for flexible querying.
3. **Server Components** querying the database directly.

## Decision

Server Components.

## Reasoning

The admin UI is the only consumer of this data. Building a REST or GraphQL API creates an abstraction layer with no consumers other than the UI we control. Server Components query the database directly with full type safety, zero serialisation overhead, and no API versioning. API routes exist only for external triggers (cron, webhooks) and client-side mutations.

## Trade-offs

If we later need to expose data to external consumers (a mobile app, a reporting tool), we'll need to build an API layer then. This is unlikely for Phase 1-3 and can be added incrementally.

## Future Implication

If multi-user access is needed (e.g., a client-facing dashboard), the Server Component approach still works — add authentication middleware, not an API layer.
