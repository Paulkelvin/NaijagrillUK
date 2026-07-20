// Turns already-collected SERP data (src/lib/seo/dataforseo/serp.ts) into
// real, per-keyword competitive context for the action queue — "who's
// actually ranking above you, with what title, and what people actually
// ask about it" — instead of a bare "target this keyword" label. No new
// DataForSEO cost: this reads serp_snapshots/paa_questions rows already
// paid for and stored by the existing weekly sync.
//
// PAA questions were a known gap for a while: DataForSEO nests each real
// question one level deeper than a top-level SERP item, and
// serp_snapshots' domain/url/position (all NOT NULL) can't hold a
// question at all — serp.ts now captures them into their own
// paa_questions table instead (Milestone 16), which is what this module
// reads from.

const COMPETITOR_LIMIT = 5;
const PAA_LIMIT = 6;

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
  /** Real "People Also Ask" questions Google shows for this keyword. */
  paaQuestions: string[];
}

interface SerpRow {
  keyword_id: string;
  date: string;
  domain: string;
  title: string | null;
  position: number;
  is_own_site: boolean;
}

interface PaaRow {
  keyword_id: string;
  date: string;
  question: string;
}

/**
 * Batched (not one query per action — this project's real scale is a
 * handful of open actions, so a single `in()` query covers all of them)
 * grouping of any date-stamped rows down to just the single most recent
 * date per keyword — shared logic between serp_snapshots and
 * paa_questions, since both need the same "don't mix in a 3-week-old
 * snapshot" rule.
 */
function latestByKeyword<T extends { keyword_id: string; date: string }>(rows: T[]): Map<string, { date: string; rows: T[] }> {
  const result = new Map<string, { date: string; rows: T[] }>();
  for (const row of rows) {
    let entry = result.get(row.keyword_id);
    if (!entry) {
      entry = { date: row.date, rows: [] };
      result.set(row.keyword_id, entry);
    }
    // Rows arrive ordered by date desc, so the first date seen per
    // keyword is its most recent — anything older is a superseded
    // snapshot and gets skipped rather than mixed in.
    if (row.date !== entry.date) continue;
    entry.rows.push(row);
  }
  return result;
}

/**
 * One brief per keyword. Only the single most recent snapshot date per
 * keyword is used for both competitors and PAA questions — a real SERP
 * result from three weeks ago isn't "who's ranking above you" anymore.
 */
export async function fetchContentBriefs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  keywordIds: string[],
): Promise<Map<string, KeywordContentBrief>> {
  if (keywordIds.length === 0) return new Map();

  const [serpResult, paaResult] = await Promise.all([
    supabase
      .from("serp_snapshots")
      .select("keyword_id, date, domain, title, position, is_own_site")
      .in("keyword_id", keywordIds)
      .eq("serp_feature", "organic")
      .order("date", { ascending: false }),
    supabase.from("paa_questions").select("keyword_id, date, question").in("keyword_id", keywordIds).order("date", { ascending: false }),
  ]);
  if (serpResult.error) throw new Error(`Failed to fetch serp_snapshots: ${serpResult.error.message}`);
  if (paaResult.error) throw new Error(`Failed to fetch paa_questions: ${paaResult.error.message}`);

  const latestSerpByKeyword = latestByKeyword((serpResult.data ?? []) as SerpRow[]);
  const latestPaaByKeyword = latestByKeyword((paaResult.data ?? []) as PaaRow[]);

  const keywordIdsWithData = new Set([...latestSerpByKeyword.keys(), ...latestPaaByKeyword.keys()]);
  const briefs = new Map<string, KeywordContentBrief>();
  for (const keywordId of keywordIdsWithData) {
    const serpEntry = latestSerpByKeyword.get(keywordId);
    const sorted = serpEntry ? [...serpEntry.rows].sort((a, b) => a.position - b.position) : [];
    const own = sorted.find((r) => r.is_own_site);
    const competitors: CompetitorResult[] = sorted
      .filter((r) => !r.is_own_site)
      .slice(0, COMPETITOR_LIMIT)
      .map(({ domain, title, position }) => ({ domain, title, position }));

    const paaEntry = latestPaaByKeyword.get(keywordId);
    const paaQuestions = paaEntry ? paaEntry.rows.map((r) => r.question).slice(0, PAA_LIMIT) : [];

    briefs.set(keywordId, {
      keywordId,
      snapshotDate: serpEntry?.date ?? paaEntry!.date,
      ownPosition: own?.position ?? null,
      competitors,
      paaQuestions,
    });
  }
  return briefs;
}
