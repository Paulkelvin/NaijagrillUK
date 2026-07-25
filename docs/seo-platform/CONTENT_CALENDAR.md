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

---

## Day 1 — 2026-07-22

- **Google Business Post:** Suya spotlight — ties directly to real SEO
  work done today on "suya birmingham"/"suya place near me". Photo:
  `beef-suya-birmingham-handsworth.jpg` (already sent to the user).
- **Website article:** "What Is Suya? The Story Behind Nigeria's Favourite
  Grilled Meat" — mirrors the successful jollof-rice-origin-story
  playbook (real informational demand, low competition, builds topical
  authority) rather than repeating the same commercial pitch elsewhere.
- **Instagram post:** Mixed Grill launch — new, genuinely exciting
  product, strongest visual story of anything shipped this session.
  Needs a real photo (still using a placeholder as of today).

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

## Cadence check-in, 2026-07-25

No `trig_...` Routine actually exists for this account (`list_triggers`
returned empty) — the "fires automatically every ~2 days" mechanism
described above was never actually created, or was lost. Day 2 below was
requested manually by the user rather than landing on its own on 24 July
as planned. Flagged to the user; the Routine can be (re)created once
confirmed wanted.

Also: Day 1's plan above listed "What Is Suya?" as the website article,
but the actual live blog post that day (confirmed via the real Sanity
dataset, not the plan) was **"Where Does Jollof Rice Really Come From?"**
(`jollof-rice-origin-story`, 2026-07-22), followed the next day by **"What
Is Ayamase? Nigeria's Bold Green Pepper 'Designer Stew'"**
(`what-is-ayamase-designer-stew`, 2026-07-23) — a live-content check
this time confirmed a dedicated "What Is Suya?" post already existed
(`what-is-suya-everything-you-need-to-know`, since 2026-05-28), so the
plan correctly got overridden rather than publishing a cannibalizing
duplicate. Lesson: treat this file as intent, and always verify against
the real Sanity dataset before writing new content, not just this log.

## Day 2 — 2026-07-25

Cannibalization check performed against the live Sanity dataset (public
`26qme93a`/`production` GROQ query) before picking today's angle, not just
this file:
- Full existing blog slug/title list pulled and reviewed.
- Candidate topic "What Is Ofada Stew?" rejected — the Ayamase post
  (2026-07-23) already states "It's also widely called ofada stew" and
  covers that ground; a separate post would split the same search intent.
- "Efo Riro" checked and cleared: it only appears in passing inside
  listicle posts (`best-nigerian-food-to-try-in-birmingham`,
  `nigerian-takeaway-in-birmingham-top-dishes-to-try`,
  `what-to-order-at-a-nigerian-restaurant-for-the-first-time`) — no
  dedicated page targets it, so a "What Is Efo Riro?" explainer doesn't
  compete with anything live. Real GSC-based `detectCannibalization()`
  scoring (ARCHITECTURE.md §5.3) wasn't run — no Supabase credentials in
  this environment, and it needs live query data that a brand-new page
  wouldn't have yet anyway.

- **Google Business Post:** Review-with-photo reminder — the one concrete,
  low-effort idea kept from the 2026-07-22 Reddit tip assessment above,
  not yet used in the streak. Photo: existing dining-room shot, not a
  dish photo.
- **Website article:** "What Is Efo Riro?" — continues the "what is
  [dish]" explainer series (egusi, amala, pepper soup, suya, jollof,
  small chops, ayamase) with the one real menu item (`menu-efo-riro`,
  £14.99) that had no dedicated explainer yet. Photo:
  `naijagrill-efo-riro-soup.jpg`.
- **Instagram post:** Ayamase spotlight — the 2026-07-23 blog post never
  got a matching Instagram push; the dish's bold green colour is a strong
  visual for the feed. Photo: `naijagrill-white-rice-ayamase-stew.jpg`.

---

*Add a new `## Day N — date` section each cycle. Don't delete prior days —
this is the record of what's already been used.*
