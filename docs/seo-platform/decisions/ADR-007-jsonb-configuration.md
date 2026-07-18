# ADR-007: JSONB Configuration Over Hard-Coded Business Logic

**Status:** Accepted
**Date:** 2026-07-18
**Author:** Paul Kelvin

## Problem

Different business types need different scoring weights, conversion events, and intent priorities. How should this be configurable?

## Considered Alternatives

1. **Hard-coded per business type** (if/else branches in scoring logic).
2. **JSONB configuration** in the database, read at scoring time.
3. **Configuration files** committed to the repository.

## Decision

JSONB in `site_configs` table.

## Reasoning

Scoring weights need to be adjustable without code deployments. Different sites on the same instance need independent configuration. JSONB in PostgreSQL is queryable, indexable, and doesn't require schema migrations when new config keys are added. Default configurations per business type are provided as seed data, not code branches.

## Trade-offs

JSONB is less type-safe than explicit columns. Mitigated by a TypeScript interface that validates config shape at the application layer before writing to the database.
