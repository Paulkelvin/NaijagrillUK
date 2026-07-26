# Operations Checklist — What to Check, and How Often

The recurring, human-side routine for keeping NaijaGrill visible. Separate
from the other docs in this folder:

- **FOLLOW_UPS.md** — one-off open loops with a specific "check back" date
- **CONTENT_CALENDAR.md** — the rolling record of what's already been posted
- **this file** — the repeating routine that never "finishes"

Everything below is a task that genuinely needs a person. Anything the
platform already does on its own is listed at the bottom under
"Already automated — don't duplicate these", so this list stays short
enough to actually follow.

---

## Every 2 days — the posting streak

Driven by a scheduled routine that generates each batch (see
CONTENT_CALENDAR.md). Your part is the posting itself:

- [ ] **Google Business Profile post** — the single highest-value recurring
      action on this list. Research is consistent that weekly-or-better
      posting lifts click-through in the local panel and feeds Google's AI
      Overview summaries, even though posts are **not** a direct ranking
      factor. Always attach a real photo and a CTA button.
- [ ] **Instagram post**
- [ ] **Website article** — only when one is actually due; forcing a weak
      article is worse than skipping. See the cannibalization rule below.

**Before publishing any new article, every time:** check the existing post
list for overlap first. This is not theoretical — a "What Is Suya?" article
was drafted on 2026-07-22 before discovering one already existed from May,
and the whole Milestone 17 cannibalization fix (5 flagged keywords, one root
cause) came from exactly this mistake being made earlier.

---

## Daily-ish (2 minutes)

- [ ] **New Google reviews → respond.** Aim for within 24 hours. Review
      response rate is a real, controllable ranking factor — profiles
      responding to 80%+ of reviews see a measurable boost, and review
      *velocity* (a steady trickle) matters more than total count.
- [ ] **Uber Eats listing is actually accepting orders.** Added to this list
      because on 2026-07-22 the live listing showed **"Delivery
      unavailable"** while every "Order on Uber Eats" button on the website
      pointed straight at it. A dead ordering link costs real money silently.

---

## Weekly (10 minutes)

- [ ] **`/admin/seo` — the action queue.** What the platform thinks you
      should do next, ranked. Mark things completed as you do them, so the
      30-day outcome tracking can actually measure whether they worked.
- [ ] **`/admin/seo/analytics`** — real clicks/impressions/position trend,
      plus the Discovered Keywords table with its suggested content format.
- [ ] **Ask a happy customer for a review** — ideally one that includes
      **text and a photo**, not just a star rating. Steady velocity beats
      occasional bursts.

---

## Monthly (30 minutes)

- [ ] **Google Search Console → Page indexing.** Is the "not indexed" count
      moving in the right direction? (18 pages as of 2026-07-26 — see
      FOLLOW_UPS.md for the duplicate-sitemap fix and what to do if it
      hasn't improved.)
- [ ] **New keyword discovery landed.** The discovery job runs on the 1st of
      each month. Check `/admin/seo/analytics` for genuinely new long-tail
      keywords worth acting on.
- [ ] **DataForSEO spend** — real cost has been running roughly $0.10-$0.50
      per month. A sudden jump means something is looping.
- [ ] **NAP consistency on any new listing.** Name, address and phone must
      match *exactly* everywhere. Google cross-references these, and
      inconsistency undermines the whole citation effort. Known live
      inconsistency to resolve: the website says "NaijaGrill" while Uber Eats
      says "NAIJA GRILL & SPICE KITCHEN LTD" — pick one canonical format and
      use it on every new listing from here on.
- [ ] **Work through one more directory listing** from the tier list
      (Tier 1: Bing Places, Apple Business Connect, Yell, FreeIndex.
      Tier 2: TripAdvisor first, then Just Eat.
      Tier 3 halal-specific: Dine Halal, Halal Friendly List,
      AllahuAkbar.co.uk — genuinely differentiating, since nearly every dish
      on the Uber Eats menu is labelled Halal but this isn't surfaced
      anywhere else). Quality beats volume: ~40-50 *consistent* listings
      outperform 100+ sloppy ones.

---

## Quarterly (1 hour)

- [ ] **Menu drift check.** The website menu and the real Uber Eats menu
      were found to be substantially different on 2026-07-22 — different
      dish names *and* different prices (website Jollof Rice £12.99 vs Uber
      Eats £6.00). Confirm any difference is deliberate (dine-in vs delivery
      pricing is normal) rather than drift nobody noticed.
- [ ] **Google Business Profile completeness.** Primary category is the
      single most important controllable local ranking factor — confirm it's
      still something specific ("Nigerian restaurant"), not a generic
      "Restaurant". Check hours, attributes, photos and the menu are all
      still accurate.
- [ ] **Re-check the "Recent results" section on `/admin/seo`** — the
      platform's own measurement of whether completed actions actually
      improved rankings, ~30 days after completion. This is the honest
      feedback loop; read it even when it says "unchanged".

---

## Already automated — don't duplicate these

Listed so this checklist stays focused on real human work. All run on
Vercel cron (see `vercel.json`):

| What | When |
|---|---|
| Google Search Console sync | daily, 06:00 UTC |
| GA4 sync | daily, 06:30 UTC |
| Analysis engine (regenerates the action queue) | daily, 07:00 UTC |
| Action outcome measurement | daily, 07:30 UTC |
| SERP snapshots + PAA capture | daily, 09:00 UTC |
| CTR model rebuild | weekly, Mondays |
| Data retention/rollup | weekly, Sundays |
| DataForSEO search volume refresh | monthly, 1st |
| Keyword discovery | monthly, 1st |

---

*Last updated: 2026-07-26. This is a living document — adjust the cadences
if they turn out to be wrong in practice rather than following them
mechanically.*
