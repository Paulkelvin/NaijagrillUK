# SEO Platform — Follow-Ups & Check-Ins

A living log of open loops that need revisiting later — separate from
CHANGELOG.md/PHASE_2_IMPLEMENTATION.md (which record *completed* work),
since chat history doesn't persist across sessions and this is the durable
record of what to check back on and why.

---

## Check back in a few weeks (~mid-to-late August 2026)

On 2026-07-22, real content/product changes went live for 5 keyword
opportunities (see CHANGELOG.md Milestone 17 for the cannibalization fix,
and the same day's later commits for the rest). None of these had
meaningful click data yet as of the change — that's expected, and exactly
why this needs a real re-check once Google has had time to react.

**How to check:** query `keyword_page_metrics` for each `keyword_id` below
over the most recent 30 days, compare `avg_position`/`clicks` against the
baseline row. Also check `actions.outcome` for the 5 `fix_cannibalization`
action rows below — the platform's own outcome-tracking
(`measureActionOutcomes`, `action-outcomes.ts`) will auto-classify them
`improved`/`unchanged`/`declined` ~30 days after `completed_at`
(2026-07-22), no manual query needed for those 5 specifically.

| Keyword | Volume/mo | Baseline position (2026-07-22) | What changed | keyword_id |
|---|---|---|---|---|
| mix grill | 9,900 | 17 (thin, 1 impression) | New "Mixed Grill" menu item created (£40); on-page category/copy fixed | `c7961f60-ed31-4122-849f-5b883e151a1c` |
| jollof rice near me | 2,400 | unranked | Jollof Rice made a featured item; explicit "jollof rice" added to hero/meta (was generic "rice plates") | `ba370f31-2399-48bd-97d2-b179b67137da` |
| suya birmingham | 50 | 12 (thin, via the now-rewritten blog post — will likely shift) | Local phrasing added to Grill & Suya section + Beef Suya description | `aafc6601-9fd4-4789-a7b4-fc66565b0ffc` |
| suya place near me | 40 | 14 (thin, via homepage) | Same as above | `0ce8cac5-f5e5-403a-8bc8-d66c86da7f41` |
| small chops near me | 110 | unranked | Local phrasing added to Small Chops Platter description | `79083198-b5a8-4ba5-9b65-534b3d47d410` |
| nigerian restaurant birmingham | 590 | 38.3 (0 clicks, captured as `baseline_metrics`) | Cannibalization fixed: blog post rewritten off this query, homepage now sole target | `761a9b52-a600-4b8d-bbf1-d309d4047a15` |
| nigerian restaurant in birmingham uk | 590 | 37.0 (0 clicks, captured as `baseline_metrics`) | Same | `72ba2c1b-cb55-4fb9-b7fb-f1cb4fc1acaa` |
| nigerian restaurants in birmingham uk | 590 | 37.3 (0 clicks, captured as `baseline_metrics`) | Same | `80d299f6-8435-4327-b139-d7183cab14e8` |
| handsworth restaurants | 70 | 44.5 (0 clicks, captured as `baseline_metrics`) | Same | `34102972-ef36-4712-bf4c-bb4e045b2d24` |
| nigerian food in birmingham | 110 | 52.0 (0 clicks, captured as `baseline_metrics`) | Same | `13a8b8d7-ae84-4a50-bec2-84fcc89555c1` |

**Also worth checking:**
- Did `/blog/jollof-rice-origin-story` (the rewritten post) get indexed and start picking up impressions for "jollof rice origin" (320/mo, difficulty 10)? That was the whole point of the rewrite.
- Is the Mixed Grill menu item generating any real Uber Eats interest? It's currently `orderable: false` (no delivery listing set up) — dine-in/collection only until that's added.
- Real photo still needed for Mixed Grill — it's using the jollof rice fallback image.

---

## Known weak spots / open gaps

Honest list of things found but not fully resolved — not hidden, just not
in scope for what was asked at the time.

1. **"Improve /" (homepage `update_content` action) — data is currently too
   thin/noisy to give specific, trustworthy recommendations.** Fixed the
   worst distortion (a shared `MAX_ACTIONABLE_VOLUME` ceiling, see
   CHANGELOG.md), but even after that fix, most of the homepage's
   remaining "good position" keywords (e.g. "grilled food near me" at
   position 2, "food restaurants near me" at position 2) turned out to be
   a **single GSC data point** — one impression, one day — not a real,
   repeatable ranking. Page ROI Score's effort components (`content_age`,
   `missing_paa`, `link_deficit`, `schema_gap`, `meta_quality`) are also
   all forced to 0 — no site crawler exists yet (explicit Phase 3
   Non-Goal), so there's no real signal for *what specifically* to improve
   beyond what this session already did (cannibalization consolidation +
   dish-keyword strengthening). Revisit once several more weeks of real
   GSC history exist — the thin-data problem should resolve on its own as
   more days accumulate.
2. **"good food near me" (12,100/mo) and "curry restaurant near me"
   (6,600/mo)** — deliberately left un-actioned. Both clear the 50,000
   volume ceiling but are still generic/borderline-relevant ("curry"
   isn't quite Nigerian cuisine). Worth a real judgment call later, not
   an automatic one.
3. **The "at-the-centre" Sanity section category-mapping fix was scoped to
   Mixed Grill only** (`categoryOverrideByTitle` in `src/app/(main)/menu/page.tsx`).
   If another dish gets added to that section in Sanity Studio in future,
   it'll default to showing under "Rice Specials" (the existing bulk
   mapping) unless it also gets a title override. Not a bug today — Party
   Jollof and Egusi & Pounded Yam both happen to fit "Rice Specials"/are
   close enough — but worth knowing if a future addition looks
   miscategorized on `/menu`.
4. **Two parallel menu-item pricing tiers exist** (`menu-*` prefixed docs,
   e.g. Beef Suya £10.99, vs `menuItem-*` prefixed docs, e.g. Suya £18) —
   confirmed both render live on `/menu` (not a dead/duplicate-data bug),
   presumably an intentional "everyday" vs "signature sharing" tier
   structure. Flagged here only because it was surprising on first look;
   worth confirming with the user it's genuinely intended if it comes up
   again.

---

*Last updated: 2026-07-22. Add to this file rather than replacing it —
it's meant to accumulate, not reset each session.*
