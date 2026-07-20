import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { callDataForSeoApi } from "./client";
import { checkBudget, recordSpend } from "./budget";
import { logger } from "@/lib/seo/logger";

// ARCHITECTURE.md §6: "SERP > Regular | Top 10 results, SERP features,
// PAA | $0.035 / SERP | Weekly (top 100 keywords)".
//
// Real finding from verifying the live endpoint before writing this
// (docs.dataforseo.com/v3/serp-se-type-live-advanced/): unlike Search
// Volume (up to 1000 keywords batched into one request), "each Live SERP
// API call can contain only one task" — one HTTP round trip per keyword.
// That, plus the real Vercel Hobby 300s-vs-ARCHITECTURE's-10-minute-budget
// risk flagged back in Milestone 6's own plan section, is why this module
// is time-budgeted per call, not a single unbounded loop.
const ENDPOINT = "/v3/serp/google/organic/live/advanced";

// Birmingham, West Midlands, England, UK (city-level) — confirmed live
// against DataForSEO's own /v3/keywords_data/google_ads/locations during
// Milestone 5, reused here. Deliberately city-level, unlike
// search-volume.ts's country-level choice: SERP rankings — especially
// local pack / "near me" results — are genuinely geography-sensitive in a
// way aggregate search volume data isn't.
const BIRMINGHAM_LOCATION_CODE = 1006524;
const LANGUAGE_CODE = "en";
const DEVICE = "desktop";

// ARCHITECTURE.md §6 Caching Strategy: "SERP snapshots: Cache for 7 days."
const CACHE_DAYS = 7;
// ARCHITECTURE.md §6: "Weekly (top 100 keywords)" — ranked by search_volume
// (the most literal reading of "top" once real DataForSEO data exists;
// ARCHITECTURE.md doesn't specify the ranking basis).
const TOP_KEYWORDS_LIMIT = 100;

const PROVIDER = "dataforseo" as const;

// DataForSEO's own documented `items[].type` values vs. this schema's
// CHECK-constrained serp_feature enum (Milestone 0's migration). Anything
// not in this map (paid, knowledge_graph, carousel, answer_box, jobs,
// news, events, shopping, related_searches, etc.) is skipped — this
// schema only tracks organic-ish/feature types relevant to an SEO
// platform, not paid ads or rich-result chrome.
//
// "people_also_ask" is deliberately NOT in this map — real PAA questions
// are extracted separately below, into paa_questions, not serp_snapshots.
// A PAA item has no domain/url/position (it's a question, not a ranked
// result), so it could never pass this table's NOT NULL columns anyway;
// routing it through this map was the original mistake (found via a real
// production check: 423 organic rows, 0 PAA rows, ever).
const TYPE_TO_SERP_FEATURE: Record<string, string> = {
  organic: "organic",
  featured_snippet: "featured_snippet",
  local_pack: "local_pack",
  video: "video",
  images: "image",
};

// A "people_also_ask" top-level item's real question text is nested one
// level deeper, in its own `items[]` array of these — confirmed against
// DataForSEO's live docs while fixing the original gap, not assumed.
interface PeopleAlsoAskElement {
  type: string;
  title: string;
}

interface SerpItem {
  type: string;
  rank_absolute: number | null;
  domain: string | null;
  url: string | null;
  title: string | null;
  // Present (and populated) only on a "people_also_ask" item.
  items?: PeopleAlsoAskElement[] | null;
}

interface SerpApiResult {
  keyword: string;
  items: SerpItem[] | null;
}

interface StaleKeyword {
  id: string;
  keyword: string;
}

function normalizeDomain(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

function toIsoDate(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchTopStaleKeywords(supabase: any, siteId: string): Promise<StaleKeyword[]> {
  const { data: topKeywords, error } = await supabase
    .from("keywords")
    .select("id, keyword")
    .eq("site_id", siteId)
    .order("search_volume", { ascending: false, nullsFirst: false })
    .limit(TOP_KEYWORDS_LIMIT);
  if (error) throw new Error(`Failed to fetch keywords: ${error.message}`);
  if (!topKeywords || topKeywords.length === 0) return [];

  const since = toIsoDate(CACHE_DAYS);
  const { data: recentSnapshots, error: snapshotError } = await supabase
    .from("serp_snapshots")
    .select("keyword_id")
    .eq("site_id", siteId)
    .gte("date", since)
    .in(
      "keyword_id",
      topKeywords.map((k: StaleKeyword) => k.id),
    );
  if (snapshotError) throw new Error(`Failed to fetch serp_snapshots: ${snapshotError.message}`);

  const freshIds = new Set((recentSnapshots ?? []).map((s: { keyword_id: string }) => s.keyword_id));
  return (topKeywords as StaleKeyword[]).filter((k) => !freshIds.has(k.id));
}

export interface SyncSerpSnapshotsResult {
  keywordsEligible: number;
  keywordsSynced: number;
  keywordsRemaining: number;
  snapshotsWritten: number;
  paaQuestionsWritten: number;
  budgetExceeded: boolean;
  cost: number;
}

/**
 * Refreshes SERP snapshots for the top `TOP_KEYWORDS_LIMIT` keywords (by
 * search_volume) whose most recent snapshot is older than 7 days (or
 * missing). Time-budgeted, not a single unbounded loop — stops cleanly
 * once `timeBudgetMs` elapses and returns how many keywords are still
 * pending. Unlike Phase 1's GSC backfill (a bounded, one-time historical
 * range needing an explicit resumable cursor), this is a *recurring*
 * refresh job: the 7-day staleness check itself is the resumability
 * signal — whatever a run doesn't get to just stays stale and gets
 * picked up by the next scheduled run, no separate cursor state needed.
 * Also re-checks the budget before every single keyword (not once for the
 * whole batch), so a run stops the instant the monthly limit would be
 * exceeded rather than committing to a full batch upfront.
 */
export async function syncSerpSnapshots(siteId: string, timeBudgetMs: number): Promise<SyncSerpSnapshotsResult> {
  const startedAt = Date.now();
  const supabase = createSupabaseServiceRoleClient();

  const { data: siteRow, error: siteError } = await supabase.from("sites").select("domain").eq("id", siteId).single();
  if (siteError || !siteRow) throw new Error(`Failed to load site: ${siteError?.message ?? "not found"}`);
  const ownDomain = normalizeDomain(siteRow.domain);

  const keywords = await fetchTopStaleKeywords(supabase, siteId);
  if (keywords.length === 0) {
    return { keywordsEligible: 0, keywordsSynced: 0, keywordsRemaining: 0, snapshotsWritten: 0, paaQuestionsWritten: 0, budgetExceeded: false, cost: 0 };
  }

  const today = new Date().toISOString().slice(0, 10);
  let totalCost = 0;
  let snapshotsWritten = 0;
  let paaQuestionsWritten = 0;
  let syncedCount = 0;
  let budgetExceeded = false;

  // try/finally so recordSpend always sees the real totalCost accumulated
  // so far, even if a DB write throws partway through the loop — without
  // this, an error on (say) keyword 47 of a 100-keyword run would drop
  // the ~$1.60 already spent on keywords 1-46 from api_budgets entirely,
  // letting real spend drift ahead of what the budget module tracks
  // (found via code review; same category of bug search-volume.ts had).
  try {
    for (const keyword of keywords) {
      if (Date.now() - startedAt >= timeBudgetMs) break;

      const budgetCheck = await checkBudget(supabase, siteId, PROVIDER);
      if (!budgetCheck.allowed) {
        logger.warn("dataforseo_serp_budget_exceeded", { siteId, currentSpend: budgetCheck.currentSpend, monthlyLimit: budgetCheck.monthlyLimit });
        budgetExceeded = true;
        break;
      }

      const response = await callDataForSeoApi<SerpApiResult>(ENDPOINT, [
        { keyword: keyword.keyword, location_code: BIRMINGHAM_LOCATION_CODE, language_code: LANGUAGE_CODE, device: DEVICE },
      ]);
      totalCost += response.cost;

      const task = response.tasks?.[0];
      if (!task || task.status_code < 20000 || task.status_code > 29999) {
        logger.warn("dataforseo_serp_task_failed", { siteId, keyword: keyword.keyword, statusMessage: task?.status_message });
        syncedCount += 1;
        continue;
      }

      const allItems = task.result?.[0]?.items ?? [];

      const items = allItems.filter(
        (item): item is SerpItem & { rank_absolute: number; domain: string; url: string } =>
          item.rank_absolute !== null && !!item.domain && !!item.url && Boolean(TYPE_TO_SERP_FEATURE[item.type]),
      );
      const rows = items.map((item) => ({
        site_id: siteId,
        keyword_id: keyword.id,
        date: today,
        position: item.rank_absolute,
        url: item.url,
        domain: item.domain,
        is_own_site: normalizeDomain(item.domain) === ownDomain,
        serp_feature: TYPE_TO_SERP_FEATURE[item.type],
        title: item.title,
      }));

      if (rows.length > 0) {
        // Rows are immutable once inserted (schema comment) — ignoreDuplicates
        // rather than a DO UPDATE, so a re-run within the same day is a safe
        // no-op instead of silently overwriting an existing snapshot.
        //
        // A write failure here is logged and skipped rather than thrown —
        // this keyword's SERP call was already paid for either way, and
        // aborting the rest of the run over one bad write would also lose
        // every keyword still queued after it (same reasoning as the task-
        // failure case just above, now applied consistently to DB errors
        // too instead of the run dying on the first one).
        const { error } = await supabase.from("serp_snapshots").upsert(rows, { onConflict: "keyword_id,date,position", ignoreDuplicates: true });
        if (error) {
          logger.warn("dataforseo_serp_write_failed", { siteId, keyword: keyword.keyword, error: error.message });
        } else {
          snapshotsWritten += rows.length;
        }
      }

      // Real PAA questions, at zero extra cost — this SERP call already
      // includes them, they were just never read correctly before. See
      // the TYPE_TO_SERP_FEATURE comment above for why they don't belong
      // in serp_snapshots.
      const paaQuestions = [
        ...new Set(
          allItems
            .filter((item) => item.type === "people_also_ask")
            .flatMap((item) => item.items ?? [])
            .map((el) => el.title?.trim())
            .filter((title): title is string => Boolean(title)),
        ),
      ];
      if (paaQuestions.length > 0) {
        const paaRows = paaQuestions.map((question) => ({ site_id: siteId, keyword_id: keyword.id, date: today, question }));
        const { error: paaError } = await supabase.from("paa_questions").upsert(paaRows, { onConflict: "keyword_id,date,question", ignoreDuplicates: true });
        if (paaError) {
          logger.warn("dataforseo_paa_write_failed", { siteId, keyword: keyword.keyword, error: paaError.message });
        } else {
          paaQuestionsWritten += paaRows.length;
        }
      }

      syncedCount += 1;
    }
  } finally {
    if (totalCost > 0) {
      await recordSpend(supabase, siteId, PROVIDER, totalCost);
    }
  }

  const result: SyncSerpSnapshotsResult = {
    keywordsEligible: keywords.length,
    keywordsSynced: syncedCount,
    keywordsRemaining: keywords.length - syncedCount,
    snapshotsWritten,
    paaQuestionsWritten,
    budgetExceeded,
    cost: totalCost,
  };
  logger.info("dataforseo_serp_synced", { siteId, ...result });
  return result;
}
