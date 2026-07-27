# Content Calendar — 3-Week Posting Streak

Started 2026-07-22, at the user's explicit request: a recurring content
cadence across Google Business Profile Posts, the website blog, and
Instagram, roughly every 2 days for 3 weeks. This file is the durable
record of what's already been suggested/posted, so future sessions (or
this one, resumed via the scheduled Routine below) don't repeat an idea
or lose track of where the streak is.

**Cadence mechanism:** a Routine (`trig_...`, see below) fires into this
session roughly every 2 days to generate the next batch. Cron uses
even-day-of-month stepping (`0 9 2-31/2 * *`), which is a close but not
exact "every 2 days" — month-boundary gaps can occasionally be 1 or 3
days depending on month length. Good enough for a content cadence, not
worth over-engineering.

**Format each cycle:** one Google Business Profile Post idea, one website
article/blog idea, one Instagram post idea — deliberately not all telling
the identical story, so the three platforms don't feel like copy-paste
of each other.

**Related:** OPERATIONS_CHECKLIST.md covers the wider recurring routine this
streak sits inside (review responses, listing checks, monthly Search Console
review, and the rule to always check for an existing post before writing a
new article).

---

## Day 1 — 2026-07-22

- **Google Business Post:** Suya spotlight — ties directly to real SEO
  work done today on "suya birmingham"/"suya place near me". Final photo:
  `beef-suya-alt-birmingham-handsworth.jpg` (the first suya photo sent
  was rejected by the user as not liked; a second real photo — the one
  actually used on the site's own Beef Suya menu item — was pulled from
  Sanity's CDN and sent as the replacement).
- **Website article:** ~~"What Is Suya?"~~ **Correction — that post
  already existed** (published 2026-05-28, found while doing the
  cannibalization check before writing anything). Redirected to **"What
  Is Ayamase? Nigeria's Bold Green Pepper 'Designer Stew'"** instead —
  genuinely uncovered topic, real sourced history (Ikenne-Remo/Ogun
  State origin, the "designer stew" reputation), a real photo already
  available (`ayamase-birmingham-handsworth.jpg`). Published:
  `/blog/what-is-ayamase-designer-stew`. Note: no fresh DataForSEO volume
  data backs this pick (no live DataForSEO access from this sandbox,
  see FOLLOW_UPS.md) — chosen on topic fit + existing photo availability,
  not a precise search-volume number the way jollof-rice-origin-story was.
- **Instagram post:** Mixed Grill launch — new, genuinely exciting
  product, strongest visual story of anything shipped this session.
  Still needs a real photo (placeholder as of today) — a Canva graphic
  was requested but blocked by the Canva connector repeatedly
  disconnecting from the session; not yet resolved.

## Reddit tip assessment (r/GoogleMyBusiness, 2026-07-22)

User shared an anecdotal post claiming a 7-review business outranked
100+ review competitors via: (1) an FAQ block matching real Maps search
queries, (2) photo filenames containing the target keyword, (3) a review
link encouraging "text + photos" in reviews. Treated as an unverified,
single-anecdote claim (classic Reddit case-study bait, no controlled
comparison, small sample) — not adopted wholesale. But two of the three
claims are things this session already independently verified via real
Google documentation/2026 SEO research: image filename relevance (see
the earlier image-naming conversation) and FAQ content matching real
search queries (see the Q&A/"Ask Maps" research). The third — encouraging
reviewers to leave text + photos, not just a star rating — is a
legitimate, low-effort addition worth folding into the cadence (e.g. as
a periodic Google Post reminding customers to leave a review with a
photo), even though the specific Reddit anecdote itself isn't treated as
proven.

---

## Day 2 — 2026-07-24

Checked first: no existing blog post covers Efo Riro specifically or the
"jollof rice tesco" angle (both confirmed against the current live post
list before picking these).

- **Google Business Post:** Efo Riro spotlight — real Uber Eats item
  ("Efo Riro with Swallow (Halal)"), a real photo already available
  (`efo-riro-swallow-birmingham.jpg`, sent to the user 2026-07-22), not
  yet featured anywhere.
  > **A proper bowl of Efo Riro 🍲**
  > Spinach and pepper stew, deep and savoury, served the traditional way
  > with your choice of swallow. One of the dishes that shows what
  > Nigerian cooking is really about.
  CTA: Order Online.
- **Website article:** ✅ **PUBLISHED 2026-07-27** —
  `/blog/jollof-rice-mix-vs-real-thing`. Targets the real, previously
  un-actioned tracked keyword **"jollof rice tesco"** (260/mo, queued
  since Milestone 15's discovery run). Cannibalization check run first
  against all 17 existing posts: distinct from
  `what-is-jollof-rice-a-beginners-guide` (definition),
  `jollof-rice-origin-story` (history) and
  `why-party-jollof-belongs-on-a-premium-table` (brand positioning) —
  this one is a practical cooking comparison. Internal-linked to the
  origin story rather than restating any of it.

  Facts grounded before writing (Tropical Sun jollof seasoning really is
  stocked at Tesco), and deliberately written as an honest comparison —
  "use the packet on a Tuesday, it's fine" — rather than a bait-and-switch
  that trashes shop-bought to sell a table. **Known caveat, stated when
  the keyword was first flagged and still true:** "jollof rice tesco" is
  supermarket-shopper intent, not restaurant intent, so it will likely
  draw non-local traffic that never converts. Justified on topical
  authority around jollof (the site's strongest pillar) rather than
  direct conversion — worth revisiting if it pulls volume but zero
  engagement.
- **Instagram post:** Halal certification spotlight — a real
  differentiator found while auditing the live Uber Eats listing (nearly
  every dish there is explicitly labelled "(Halal)"), which currently
  isn't surfaced on the website or social at all, and ties to a real,
  still-open keyword ("halal places to eat near me", queued/un-actioned).
  Can reuse the existing "Is Nigerian Food Halal?" blog post
  (`/blog/nigerian-food-dietary-requirements-birmingham`, already live)
  as the link-out rather than needing new long-form content.

---

*Add a new `## Day N — date` section each cycle. Don't delete prior days —
this is the record of what's already been used.*
