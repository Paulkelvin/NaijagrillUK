# ADR-008: Keyword Normalisation — Conservative Approach

**Status:** Accepted
**Date:** 2026-07-18
**Author:** Paul Kelvin

## Problem

How aggressively should keywords be normalised for deduplication?

## Considered Alternatives

1. **Aggressive:** lowercase + stem + strip prepositions + strip articles.
2. **Conservative:** lowercase + trim + collapse spaces + strip articles only.
3. **None:** store exactly as received from GSC.

## Decision

Conservative (option 2).

## Reasoning

Aggressive normalisation merges keywords with different meanings. "Food in Birmingham" and "food Birmingham" have different search volumes and potentially different SERP results. Stemming "catering" to "cater" loses meaning. Conservative normalisation catches only true duplicates (case differences, extra spaces, leading "a/an/the") while preserving semantic distinctions.

## Trade-offs

May result in near-duplicate keywords that the user must merge manually. This is preferable to automatic merging that destroys data.
