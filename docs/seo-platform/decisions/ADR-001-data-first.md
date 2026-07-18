# ADR-001: Data-First Architecture

**Status:** Accepted
**Date:** 2026-07-18
**Author:** Paul Kelvin

## Problem

Should the system be organised around analytical modules (feature-first) or around the data pipeline (data-first)?

## Considered Alternatives

1. **Module-first:** Build each analysis feature independently, each with its own data fetching.
2. **Data-first:** Build a shared normalised data layer, then analysis as views on top.

## Decision

Data-first.

## Reasoning

Module-first architectures duplicate data fetching logic, create inconsistencies when modules see different snapshots of the same data, and make cross-module analysis (e.g., cannibalization + decay) difficult. The hardest engineering problem is data normalisation and joining, not the analysis logic. Solving it once in a shared layer reduces total complexity.

## Trade-offs

Slower to show the first feature (pipeline before product). Mitigated by shipping the striking distance report in Phase 1 — simple analysis on top of clean data.
