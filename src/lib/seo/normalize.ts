// Pure normalization functions — no I/O, no side effects. Applied before
// every insertion and lookup against keywords/pages (ARCHITECTURE.md §3).

// ============================================================================
// Keyword normalization (ADR-008 — conservative: catches true duplicates
// only, preserves semantic distinctions like prepositions).
// ============================================================================

const LEADING_ARTICLE_RE = /^(a|an|the) /;
const TRAILING_ARTICLE_RE = / (a|an|the)$/;

/**
 * Lowercase, trim, collapse internal whitespace, strip a single leading/
 * trailing article. Deliberately does NOT stem words or strip prepositions
 * — "food in Birmingham" and "food Birmingham" must remain distinct
 * (ARCHITECTURE.md's own rationale for this rule).
 *
 * Not applied recursively — "the a menu" strips only the outer "the",
 * yielding "a menu". This matches "strip leading/trailing articles" (one
 * layer, not iterative removal) and is still fully deterministic, which is
 * the actual requirement (this is always called on the raw keyword, never
 * re-applied to an already-normalized one, so mathematical idempotency
 * doesn't matter here).
 */
export function normalizeKeyword(raw: string): string {
  const collapsed = raw.toLowerCase().trim().replace(/\s+/g, " ");
  return collapsed.replace(LEADING_ARTICLE_RE, "").replace(TRAILING_ARTICLE_RE, "");
}

// ============================================================================
// URL / path normalization (ARCHITECTURE.md §3).
//
// Rule 3 ("remove query parameters except defined tracking exceptions") is
// never actually elaborated anywhere else in ARCHITECTURE.md — no exception
// list exists. Resolved here: this site (a restaurant with a fixed set of
// static routes) has no query-parameter-based content variation, so there
// are no real exceptions to define for Phase 1. All query parameters are
// stripped unconditionally. If a future business type genuinely needs
// query-param-based page differentiation (e.g. ecommerce faceting), that
// needs an explicit allowlist — likely business-type config in
// site_configs — designed when that need is real, not guessed at now.
// ============================================================================

/**
 * Normalizes a URL path in isolation — the shared primitive behind
 * normalizeUrl() (GSC, which reports full absolute URLs) and Milestone 6's
 * GA4 sync (which reports bare relative paths via the pagePath dimension,
 * never a full URL). Both need identical path rules; this is the one place
 * they're defined.
 */
export function normalizePath(rawPath: string): string {
  let path = rawPath.toLowerCase();
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  return path === "" ? "/" : path;
}

export interface NormalizedUrl {
  /** Normalized full URL: always https, www-stripped, matches pages.url. */
  url: string;
  /** Just the path portion: matches pages.path. */
  path: string;
}

/**
 * Normalizes a full absolute URL (GSC's `page` dimension always reports
 * one of these). Query string and fragment are dropped implicitly by using
 * the URL API's `.pathname` — they're separate components (`.search`,
 * `.hash`), never part of `.pathname` — so no explicit stripping code is
 * needed for rules 3/4.
 *
 * The output `url` deliberately does not necessarily match the page's real
 * browser-visible address when www is involved — e.g. the live site serves
 * `https://www.naijagrillandspice.co.uk/menu`, but this returns
 * `https://naijagrillandspice.co.uk/menu` (matching `sites.domain`, which
 * is itself www-stripped per rule 5). This is intentional: `pages.url`/
 * `pages.path` are internal, deduplicated identifiers, not a copy of the
 * page's canonical browser URL.
 */
export function normalizeUrl(raw: string): NormalizedUrl {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`normalizeUrl: not a valid absolute URL: "${raw}"`);
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const path = normalizePath(parsed.pathname);
  return { path, url: `https://${host}${path}` };
}
