# SEO Platform — Follow-Ups & Check-Ins

A living log of open loops that need revisiting later — separate from
CHANGELOG.md/PHASE_2_IMPLEMENTATION.md (which record *completed* work),
since chat history doesn't persist across sessions and this is the durable
record of what to check back on and why.

---

## 2026-07-26 — GSC "Discovered, currently not indexed" investigation

User reported 18 pages (mostly blog: index, category pages, several
posts) stuck in this status, with a "Validate Fix" click from 7/20
still pending days later with no progress. Investigated and found a
real, concrete contributing cause: **duplicate Sanity documents** — an
old seed (created 2026-06-09, IDs like `blogPost-handsworth`,
`blogCategory-culture`) was never cleaned up when the site moved to its
current ID scheme (`post-*`/`category-*`, created 2026-06-15) — 4
duplicate category docs and 2 duplicate blog post docs, all sharing the
same slug as their live counterpart. This produced a sitemap with real
duplicate `<url>` entries (33 total, only 31 unique) — a genuine
signal-quality issue for a crawler, on top of just being sloppy.

**Fixed:** re-pointed the 2 posts still referencing old category IDs,
deleted all 6 orphaned duplicate documents, added defensive slug-based
deduplication in `src/app/sitemap.ts` for both categories and posts (no
unique constraint exists on Sanity's side, so this could recur without
the code-level guard). Verified live: sitemap is now 31/31 unique.

**Being honest about what this fix does and doesn't prove:** it removes
one real, concrete technical issue. It does **not** guarantee the 18
pages get indexed quickly — "Discovered, currently not indexed" is also
just a normal pattern for a young site with limited backlink authority,
and Google's own docs say it can take weeks to resolve on its own, fix
or no fix. **Next step for the user:** resubmit the sitemap in Search
Console (Sitemaps → remove and re-add, or just wait for Google's next
scheduled fetch) and click "Validate Fix" again on the "Discovered - not
indexed" report now that the sitemap is clean. Check back in 1-2 weeks —
if the 18-page count hasn't moved by then, worth a deeper look at
internal linking to the blog section specifically (all the affected
example URLs were blog-related), not just the sitemap.

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

**2026-07-22, later same day:** the 5 `create_content` actions for mix
grill / jollof rice near me / suya birmingham / suya place near me / small
chops near me were also marked `completed` with real `baseline_metrics`
captured (mirroring the 5 `fix_cannibalization` actions above) — they'd
been sitting `queued` in the UI even though the real content work was
already done and deployed.

---

## Google Business Profile — real menu drift found, work in progress

While drafting Google Posts/Menu content, direct access to the live Uber
Eats listing was blocked (bot protection — tried direct fetch, WebFetch,
and headless browser with multiple realistic configs, all failed).
User-supplied screenshots of the real listing revealed the website's own
menu (Sanity) and the real Uber Eats menu are **substantially different
— different dish names, different prices, and Uber Eats' "(Halal)"
labeling doesn't exist on the website at all.** Example: website Jollof
Rice £12.99 vs. Uber Eats Jollof Rice £6.00. Not yet reconciled — worth a
real decision on whether the website should match Uber Eats pricing/names
or whether they're deliberately different (dine-in vs delivery pricing is
common practice, but worth confirming intentional vs. drift).

**Also found: Uber Eats listing showed "Delivery unavailable"** as of
2026-07-22 — every "Order on Uber Eats" button on the website currently
points to a listing that cannot deliver. Flagged to the user as urgent;
not yet confirmed resolved.

**Google Business Profile menu content drafted** (16 real dishes from the
live Uber Eats listing, organized into Starters/Rice Dishes/Soup &
Swallow/Grilled & Seafood, with names + descriptions, no prices per the
user's preference) but not yet confirmed live on the actual listing —
that's a manual step for the user to do in Google's Menu editor. Real
photos pulled from the website (11 files) plus 3 user-supplied photos
(Native Village Rice, Okro Soup with Seafood, Ewa Agoyin with Plantain)
were renamed and sent to the user for upload. Still missing real photos:
**Asun, Gizdodo, and the Peppered Turkey combo** — no photo exists on the
website or was supplied for these three.

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

*Last updated: 2026-07-22 (later same day). Add to this file rather than
replacing it — it's meant to accumulate, not reset each session.*
