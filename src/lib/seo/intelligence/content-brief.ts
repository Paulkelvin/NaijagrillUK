// Turns already-collected SERP data (src/lib/seo/dataforseo/serp.ts) into
// real, per-keyword competitive context for the action queue — "who's
// actually ranking above you, with what title" — instead of a bare
// "target this keyword" label. No new DataForSEO cost: this reads
// serp_snapshots rows already paid for and stored by the existing weekly
// sync.
//
// Deliberately does NOT include "People Also Ask" questions, even though
// ARCHITECTURE.md's original 5-endpoint DataForSEO plan and this
// project's own SERP sync both mention PAA: checked real production data
// while building this and found zero PAA rows ever stored, for a
// structural reason, not a bug in this module. DataForSEO nests each real
// question one level deeper than a top-level SERP item
// (`people_also_ask` items contain a `people_also_ask_element[]` array,
// each with its own `title` holding one question) — serp.ts reads
// `item.title`/`item.domain`/`item.url` directly off the top-level item,
// which is correct for organic/local_pack but structurally can't surface
// a PAA question. Separately, `serp_snapshots.domain`/`url`/`position`
// are all NOT NULL, organic-result-shaped columns — a PAA question has
// none of those. Fixing this needs either a schema change (a new
// nullable-friendly table) or a differently-shaped write path, and no
// migration path was available when this shipped — flagged here rather
// than silently promising PAA content that doesn't exist.

const COMPETITOR_LIMIT = 5;

export interface CompetitorResult {
  domain: string;
  title: string | null;
  position: number;
}

export interface KeywordContentBrief {
  keywordId: string;
  snapshotDate: string;
  ownPosition: number | null;
  /** Real organic competitors ranking above/around you, best position first. */
  competitors: CompetitorResult[];
}

interface SerpRow {
  keyword_id: string;
  date: string;
  domain: string;
  title: string | null;
  position: number;
  is_own_site: boolean;
}

/**
 * One brief per keyword, batched (not one query per action — this project's
 * real scale is a handful of open actions, so a single `in()` query covers
 * all of them). Only the single most recent snapshot date per keyword is
 * used — a real SERP result from three weeks ago isn't "who's ranking
 * above you" anymore.
 */
export async function fetchContentBriefs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  keywordIds: string[],
): Promise<Map<string, KeywordContentBrief>> {
  if (keywordIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("serp_snapshots")
    .select("keyword_id, date, domain, title, position, is_own_site")
    .in("keyword_id", keywordIds)
    .eq("serp_feature", "organic")
    .order("date", { ascending: false });
  if (error) throw new Error(`Failed to fetch serp_snapshots: ${error.message}`);

  const latestByKeyword = new Map<string, { date: string; rows: SerpRow[] }>();
  for (const row of (data ?? []) as SerpRow[]) {
    let entry = latestByKeyword.get(row.keyword_id);
    if (!entry) {
      entry = { date: row.date, rows: [] };
      latestByKeyword.set(row.keyword_id, entry);
    }
    // Rows arrive ordered by date desc, so the first date seen per
    // keyword is its most recent — anything older is a superseded
    // snapshot and gets skipped rather than mixed in.
    if (row.date !== entry.date) continue;
    entry.rows.push(row);
  }

  const briefs = new Map<string, KeywordContentBrief>();
  for (const [keywordId, entry] of latestByKeyword) {
    const sorted = [...entry.rows].sort((a, b) => a.position - b.position);
    const own = sorted.find((r) => r.is_own_site);
    const competitors: CompetitorResult[] = sorted
      .filter((r) => !r.is_own_site)
      .slice(0, COMPETITOR_LIMIT)
      .map(({ domain, title, position }) => ({ domain, title, position }));
    briefs.set(keywordId, { keywordId, snapshotDate: entry.date, ownPosition: own?.position ?? null, competitors });
  }
  return briefs;
}
