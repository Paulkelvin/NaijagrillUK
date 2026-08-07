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
- **Website article:** ✅ **PUBLISHED 2026-07-27** — `/blog/what-is-asun`.

  **First attempt was published and then withdrawn same day.** A
  "Shop-Bought Jollof Rice Mix vs the Real Thing" piece targeting
  **"jollof rice tesco"** (260/mo) went live, and the user rejected it
  immediately: supermarket content isn't related to the business. They
  were right, and this was a self-inflicted miss — the exact same
  intent-mismatch concern had been raised when the keyword was first
  discovered ("could be people searching for a Tesco-bought jollof mix,
  not your restaurant, in which case it's not a fit"), then published
  anyway on a topical-authority argument. Deleted ~10 minutes after
  publishing, before indexing.

  **Rule going forward: search volume does not override brand fit.**
  "jollof rice tesco" should now be treated as permanently out of scope,
  not re-suggested in a later cycle. Retire it from the queue rather than
  leaving it to resurface.

  **Replacement, published same day:** "What Is Asun? Nigeria's Smoky,
  Spicy Grilled Goat". Chosen because it's the obvious gap in the site's
  already-working "What Is X?" series (amala, egusi, suya, ayamase, efo
  riro, pepper soup, small chops, jollof — no asun), and asun is a real
  menu item on both the website and Uber Eats. Facts grounded first
  (Yoruba origin, Ondo/Ekiti states, the name meaning "to smoke/roast").
  Includes an asun-vs-suya section, since those two are genuinely
  confused and the site sells both.

  **Photo gap, handled honestly:** no asun photo exists in the CMS (one
  of three gaps, with Gizdodo and the Peppered Turkey combo). Deliberately
  did *not* reuse the Beef Suya photo — the article's whole argument is
  that suya and asun are different dishes, so labelling a suya skewer
  photo as asun would contradict the text and put a false claim in the
  alt text. Using a neutral house image until a real asun photo exists.
  **Swap it when one is taken.**
- **Instagram post:** Halal certification spotlight — a real
  differentiator found while auditing the live Uber Eats listing (nearly
  every dish there is explicitly labelled "(Halal)"), which currently
  isn't surfaced on the website or social at all, and ties to a real,
  still-open keyword ("halal places to eat near me", queued/un-actioned).
  Can reuse the existing "Is Nigerian Food Halal?" blog post
  (`/blog/nigerian-food-dietary-requirements-birmingham`, already live)
  as the link-out rather than needing new long-form content.

---

## Day 3 — 2026-07-29

Selection method this cycle: cross-referenced every live menu item against
(a) whether a real photo exists in the CMS and (b) whether any existing
article covers it. That surfaced the genuine gaps rather than guessing.
Deliberately avoids Day 1's suya/Mixed Grill and Day 2's efo riro/halal
angles.

- **Google Business Post:** Small Chops Platter — real menu item (£9.99
  site / on Uber Eats as "Puff Puff (Halal)" and the platter), real photo
  already in hand (`small-chops-platter-handsworth.jpg`, sent 2026-07-22),
  and it ties directly to "small chops near me" (110/mo), which had on-page
  copy work done on 2026-07-22 but has never been posted about.
  > **Small chops, done properly 🍢**
  > Puff puff, samosas, spring rolls and peppered chicken — the Nigerian
  > party starter, built for sharing. Order for the table or send it
  > straight to your door.
  CTA: Order Online.
- **Website article:** ✅ **PUBLISHED 2026-07-27** — `/blog/what-is-nigerian-grilled-fish`. The clearest
  remaining gap in the "What Is X?" series. Grilled Fish is a real menu
  item on **both** the website (£18.99) and Uber Eats (Grilled Tilapia,
  £20–24, the higher-ticket end of the menu), **has a real photo**
  (`naijagrill-grilled-fish-yam-plantain.jpg`) — unlike asun, which had to
  ship on a neutral house image — and no article touches it. Angle: whole
  tilapia, the pepper marinade, why it's served with fried yam and
  plantain, and how it differs from the peppered hake dish also on the
  menu. Cannibalization check clean: `what-is-nigerian-pepper-soup` is a
  broth, not grilled fish. Shipped with the **real** grilled fish photo
  (unlike asun). Includes a "grilled fish or peppered fish?" section that
  explicitly separates the two fish dishes on the menu — they get ordered
  interchangeably by mistake, so it does double duty as customer guidance
  and internal differentiation between two live menu items.
- **Instagram post:** Ewa Agoyin with plantain — mashed beans in smoky
  palm-oil pepper sauce. Chosen partly because the user personally flagged
  this dish when correcting a mislabelled photo on 2026-07-22, so the
  photo (`ewa-agoyin-plantain-birmingham-handsworth.jpg`) is confirmed
  accurate by them. Visually distinctive, and it's a "if you know, you
  know" dish that suits Instagram better than search — the kind of post
  that earns comments from people who grew up eating it.

**Alternative GBP post held in reserve** (not used yet, worth rotating in
around Day 5–6): a review request. Google tracks review *velocity* and
response rate as real ranking factors, and the research this session
supports asking for reviews that include **text and a photo**, not just a
star rating. Low effort, genuinely useful, and hasn't been used yet.

---

## Day 4 — 2026-07-31

Two deliberate shifts this cycle. First, the Google Post now **follows** an
article rather than running independently — Day 3 published the grilled
fish piece, so Day 4 promotes that dish, which gets the article in front of
people instead of leaving it to search alone. Second, Instagram breaks the
dish-photo run: Days 1–3 were all food (Mixed Grill, halal, ewa agoyin), so
this one shows the room instead.

- **Google Business Post:** Grilled Fish — the premium end of the menu
  (£18.99 site, £20–24 on Uber Eats as Grilled Tilapia), real photo in the
  CMS, and it now has a supporting article published 2026-07-27 to link to.
  > **Whole grilled fish, straight off the fire 🔥🐟**
  > Marinated in pepper and spice, grilled until the skin chars, served
  > with fried yam and sweet plantain. Made to be shared.
  CTA: Order Online (or Learn More → the new article).
- **Website article:** ✅ **PUBLISHED 2026-07-27** — `/blog/what-is-nigerian-fried-rice`. The last obvious
  gap in the "What Is X?" series with a real photo already available
  (`naijagrill-fried-rice-peppered-hake-plantain.jpg`). Real menu item on
  both channels (£12.99 site, "Naija Fried Rice" on Uber Eats).
  Cannibalization check clean: confirmed **zero** existing posts mention
  fried rice in title or excerpt. Angle: what makes it Nigerian rather than
  Chinese-style (curry powder and thyme rather than soy, the liver/protein,
  the vegetable mix), and — the genuinely useful part — **jollof or fried
  rice?**, which is the actual question customers weigh at the counter.

  **Real cannibalization risk caught by checking body text, not just
  titles:** `what-is-jollof-rice-a-beginners-guide` already carried an FAQ
  answering "What is the difference between jollof rice and fried rice?" —
  exactly this article's planned centrepiece. A title-and-excerpt check
  (which is what the first pass did) would have missed it entirely.
  Resolved with the same hub-and-spoke fix used when the jollof origin
  story overlapped that guide's history section: the new article owns the
  comparison in full, and the guide's FAQ was rewritten to answer briefly
  then point here, so the two pages stop competing for the same query.
  **Lesson for future cycles: check `pt::text(body)` and FAQ questions,
  not just titles and excerpts.**
- **Instagram post:** the dining room. Photos exist
  (`naija-grill-and-spice-room1.jpg`, `room2.jpg`). Three straight food
  posts is enough — atmosphere is what supports the "premium Nigerian
  dining" positioning the site's own copy claims, and it's the thing a
  photo of a plate can't communicate. Also useful ahead of any push on
  reservations, since people book a *room* as much as a meal.

**Still held in reserve** (unused, worth rotating in around Day 5–6): the
review request post — text-and-photo reviews, tied to review velocity and
response rate as real ranking factors.

---

## Day 5 — 2026-08-02

First cycle to run the **full-depth** cannibalization scan up front (title +
excerpt + `pt::text(body)` + FAQ questions across all 20 posts) rather than
discovering an overlap mid-write, per the Day 4 lesson. Results below are
from that scan, not assumption.

- **Google Business Post:** the **review request** — held in reserve since
  Day 3 and now due. Four dish posts in a row (suya, efo riro, small chops,
  grilled fish) is enough; this is the first post asking for something
  rather than showing something. Grounded in real ranking research from
  this session: review *velocity* and response rate carry real weight
  (~16–20% of local ranking factors), and reviews containing **text and a
  photo** are worth more than a bare star rating.
  > **Eaten with us recently? 🌟**
  > A quick review genuinely helps people in Birmingham find us — and if
  > you can add a line about what you ate and a photo of the plate, even
  > better. Thank you for backing a local kitchen.
  CTA: Learn More → `BUSINESS.reviews.leaveReviewUrl`.
- **Website article:** "What Is Ewa Agoyin?" — **zero** occurrences of
  "ewa agoyin"/"agoyin" anywhere across all 20 posts (title, excerpt, body
  or FAQs), so this is genuinely uncovered. Verified the four "beans" hits
  are unrelated: gbegiri (black-eyed beans) in the amala piece, iru
  (fermented locust beans) in ayamase and efo riro, and green beans in
  fried rice. Real menu item ("Beans with Plantain", £8.99), and the photo
  is the one the **user personally corrected** on 2026-07-22
  (`ewa-agoyin-plantain-birmingham-handsworth.jpg`), so its accuracy is
  confirmed by them rather than assumed by me. Angle: the Agege/Lagos
  street-food origin, why the beans are mashed rather than stewed, the
  smoky burnt-pepper sauce that defines it, and why it's eaten with
  plantain or bread. One adjacency to handle carefully in the writing:
  `what-is-amala` describes gbegiri as a bean soup — different dish,
  different technique, worth a sentence distinguishing them rather than
  ignoring the overlap.
- **Instagram post:** Puff Puff. Deliberately chosen *despite* appearing in
  four existing articles — that matters for search, not for Instagram,
  where there's no cannibalization to cause. Visually it's one of the
  strongest things on the menu (golden, round, uniform) and it has a real
  photo. Follows Day 4's dining-room post, so the feed alternates food and
  atmosphere rather than running one type into the ground.

**Reserve list now empty** — the review post has been used. Ideas worth
considering for Day 6+: behind-the-scenes at the grill (no photo exists
yet), a staff/founder post, or the three dishes still missing photos
entirely (Asun, Gizdodo, Peppered Turkey combo) once someone shoots them.

---

## Day 6 — 2026-08-04

**Day 5's article was never written.** Checked the live post list before
planning this cycle: still 20 posts, no ewa agoyin. It was suggested, the
user didn't ask for it, and the routine fired again. Rather than stack a
sixth article suggestion on top of an unwritten fifth, **the article slot
this cycle is Day 5's carried forward, not a new topic.** Ideas are cheap;
published pages are the asset.

- **Google Business Post:** Nigerian Fried Rice — continues the Day 4
  pattern of the Google Post *following* an article rather than running
  independently. `/blog/what-is-nigerian-fried-rice` published 2026-07-27,
  real photo in the CMS, real menu item (£12.99 site, "Naija Fried Rice"
  on Uber Eats).
  > **Naija fried rice, not the takeaway kind 🍚**
  > Cooked in seasoned stock, lifted with curry and thyme, stirred through
  > with vegetables. Lighter than jollof and completely its own thing.
  CTA: Learn More → the article, or Order Online.
- **Website article:** ✅ **PUBLISHED 2026-07-27** — `/blog/what-is-ewa-agoyin` (carried over from Day 5, backlog now clear). Full-depth scan re-run this cycle and it
  remains genuinely uncovered (zero occurrences of "ewa agoyin"/"agoyin"
  across all 20 posts). Everything in the Day 5 entry still applies: real
  menu item (£8.99), user-verified photo, and the gbegiri adjacency in
  `what-is-amala` to distinguish rather than ignore.

  Shipped with a real hook rather than a generic explainer: the dish is
  named after the **Agoyin/Aganyin people** of present-day Benin and Togo
  who brought it to Lagos from the 1960s — so it isn't originally Nigerian
  at all, which is the same kind of genuinely surprising angle that made
  the jollof origin story work. Includes the planned gbegiri distinction
  (soup vs mashed dish) rather than ignoring the adjacency.

  **Real discrepancy found while writing, needs a decision:** the menu
  lists this as **"Beans with Plantain"** and describes it as *"stewed
  beans"*, but the user calls it ewa agoyin — and genuine ewa agoyin is
  **mashed**, not stewed, under a burnt-pepper sauce. The article's closing
  line was deliberately written to describe the menu item accurately
  ("beans with fried plantain and pepper sauce") rather than assert the two
  are the same. If the kitchen does make it the real way, renaming the menu
  item to "Ewa Agoyin" is a free win — it's what people actually search and
  what the owner himself calls it. If it genuinely is stewed rather than
  mashed, the current name is the honest one and should stay.
- **Instagram post:** Amala, Ewedu & Gbegiri (Abula) — visually the most
  distinctive thing on the menu: near-black amala, green ewedu, ochre
  gbegiri, all in one bowl. Real photo exists
  (`abula-assorted-meat-birmingham.jpg`, sent 2026-07-22). Alternates back
  to food after Day 5's puff puff, and it's a dish that reliably pulls a
  reaction from people who grew up on it.

**Honest limitation of this log, worth stating once:** it records what was
*suggested*, and articles can be verified as published (they're on the
site). Google Posts and Instagram posts cannot — there's no visibility
into whether those were actually posted. Treat the GBP/Instagram entries
as a queue of ideas, not a record of completed work.

---

*Add a new `## Day N — date` section each cycle. Don't delete prior days —
this is the record of what's already been used.*
