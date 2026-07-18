# ADR-002: PostgreSQL (Supabase) Over Time-Series Database

**Status:** Accepted
**Date:** 2026-07-18
**Author:** Paul Kelvin

## Problem

Keyword-page metrics are time-series data. Should we use a specialised time-series database?

## Considered Alternatives

1. **TimescaleDB** — PostgreSQL extension optimised for time-series.
2. **ClickHouse** — columnar database, fast analytical queries.
3. **Plain PostgreSQL** via Supabase — already in use.

## Decision

Plain PostgreSQL (Supabase).

## Reasoning

For a single site with ~500 keywords, daily data produces ~180,000 rows/year. With weekly aggregation after 6 months, the active daily table stays under ~90,000 rows. PostgreSQL handles this without any performance concern. Adding TimescaleDB or ClickHouse introduces new infrastructure, deployment complexity, and operational burden for zero measurable benefit at this scale. The weekly aggregation table (`keyword_page_metrics_weekly`) provides long-term trend data without the storage cost of daily granularity.

## Re-evaluation Trigger

If the system tracks 10+ sites with 1,000+ keywords each, and query performance on the metrics tables exceeds 500ms, evaluate TimescaleDB as a drop-in extension.
