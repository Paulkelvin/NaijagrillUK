# ADR-006: Cron-Based Pipelines Over Event-Driven

**Status:** Accepted
**Date:** 2026-07-18
**Author:** Paul Kelvin

## Problem

How should data sync jobs be triggered?

## Considered Alternatives

1. **Cron-based:** scheduled jobs at fixed intervals.
2. **Event-driven:** jobs triggered by upstream events (e.g., GSC data becomes available).
3. **Queue-based:** jobs placed in a message queue, processed by workers.

## Decision

Cron-based with webhook supplements.

## Reasoning

GSC and GA4 data becomes available on a predictable schedule (daily, with a 2-3 day delay). There's no upstream event to subscribe to — you poll on a schedule. Queue-based infrastructure (Redis, BullMQ, SQS) adds operational complexity that's unjustified for 4-5 daily jobs. Vercel Cron (or a simple external cron service) triggers API routes. CMS changes are the exception — those come via webhook and are handled immediately.

## Trade-offs

Data is only as fresh as the cron interval. For daily SEO data, this is fine — nobody makes SEO decisions based on hourly data changes.

## Note

The intelligence engine (analysis/scoring) runs as an inline function call after each sync completes — this is a direct invocation triggered by the sync, not a separate event-driven system.
