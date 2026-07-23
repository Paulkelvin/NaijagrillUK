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

*Add a new `## Day N — date` section each cycle. Don't delete prior days —
this is the record of what's already been used.*
