# ADR-004: Manual Topic Clustering Over Embeddings

**Status:** Accepted
**Date:** 2026-07-18
**Author:** Paul Kelvin

## Problem

How should keywords be grouped into topic clusters?

## Considered Alternatives

1. **Automated clustering using embeddings** (compute semantic similarity between keywords, apply k-means or hierarchical clustering).
2. **Manual tagging** through the admin UI.
3. **Hybrid:** manual grouping with AI-suggested clusters.

## Decision

Manual tagging in Phase 1. Hybrid in Phase 3+.

## Reasoning

For a site with 50-200 target keywords, manual grouping takes 30 minutes and produces more accurate clusters than any algorithm. The site owner understands their business taxonomy better than an embedding model. Automated clustering introduces engineering complexity (embedding model selection, distance thresholds, cluster count heuristics) that's disproportionate to the value it adds for a small keyword set.

At 500+ keywords, manual grouping becomes tedious. At that scale, introduce AI-suggested clusters that the user can accept, modify, or reject.

## Trade-offs

Requires manual effort from the user. Mitigated by making the UI fast (drag-and-drop keywords into clusters).

## Re-evaluation Trigger

When any single site exceeds 500 target keywords.
