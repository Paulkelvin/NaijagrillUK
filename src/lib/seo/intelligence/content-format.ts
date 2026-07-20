// Turns a discovered keyword's real intent + volume into a suggested
// content format — closing a real gap the user raised directly: "how do
// I know what to build around them, article, FAQ, and so on." A starting
// heuristic, not gospel (documented as such in the UI too) — real
// judgment can and should override it.

export type ContentFormat = "Dedicated page" | "Article" | "FAQ answer" | "Review manually";

// Below this volume, a keyword is too small to justify its own page or
// article regardless of intent — a single FAQ paragraph is the right
// amount of effort. Calibrated against this site's own real discoveries:
// "jollof rice pronunciation" (30/mo), "small chops price list uk"
// (20/mo) both clearly deserve a paragraph, not a page; "small chops near
// me" (110/mo, transactional) clearly deserves a real page. 50 sits
// between those two real examples.
const FAQ_VOLUME_CEILING = 50;

/**
 * - Transactional/commercial (someone ready to visit/order, or comparing
 *   options) + real enough volume → a dedicated page: they want "yes we
 *   serve this, here's how to get it," not a blog post.
 * - Informational (someone curious, not necessarily hungry-for-you today)
 *   → an article: builds real topical authority, wrong format for a hard
 *   sell.
 * - Below the volume ceiling, regardless of intent → an FAQ answer: not
 *   worth a dedicated URL.
 * - Navigational shouldn't reach this function at all (excluded upstream
 *   in keyword-discovery.ts, since it's someone else's brand name) — a
 *   null/unrecognized intent falls back to "Review manually" rather than
 *   guessing.
 */
export function suggestContentFormat(intent: string | null, searchVolume: number | null): ContentFormat {
  const volume = searchVolume ?? 0;
  if (volume <= FAQ_VOLUME_CEILING) return "FAQ answer";
  if (intent === "transactional" || intent === "commercial") return "Dedicated page";
  if (intent === "informational") return "Article";
  return "Review manually";
}
