import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { callDataForSeoApi } from "./client";
import { checkBudget, recordSpend } from "./budget";
import { logger } from "@/lib/seo/logger";

// ARCHITECTURE.md §6: "Keywords Data > Google > Search Volume | Volume,
// CPC, difficulty, monthly trends | $0.05 / 1,000 keywords | Monthly".
//
// Real finding from verifying the live endpoint before writing this
// (docs.dataforseo.com/v3/keywords_data-google_ads-search_volume-live/,
// confirmed against DataForSEO's own real response shape, not assumed):
// this endpoint's response has no keyword-difficulty field at all —
// `competition`/`competition_index` are Google Ads PPC competition
// metrics, not an SEO difficulty score. A real difficulty score needs
// DataForSEO Labs' separate Bulk Keyword Difficulty endpoint, which
// isn't one of §6's five approved endpoints (and isn't in its own $4-5/
// month cost estimate). Rather than silently adding a new paid endpoint
// beyond the frozen spec, `keywords.keyword_difficulty` is left null by
// this module — every consumer (Opportunity Score's `difficultyScore()`)
// is already null-safe for exactly this case, defaulting to a neutral
// 0.5, so nothing breaks; it just doesn't differentiate on difficulty
// yet. Flagged to the user rather than guessed.
const ENDPOINT = "/v3/keywords_data/google_ads/search_volume/live";

// United Kingdom (country-level), confirmed live against DataForSEO's own
// /v3/keywords_data/google_ads/locations during this milestone — not
// assumed. City-level codes exist (Birmingham, England = 1006524) but
// Google Ads' own city-level search-volume data is sparse/unreliable for
// most cities; country-level is standard practice for local-SEO keyword
// tooling and matches this endpoint's typical usage.
const UK_LOCATION_CODE = 2826;
const LANGUAGE_CODE = "en";

// DataForSEO's documented per-request cap.
const MAX_KEYWORDS_PER_REQUEST = 1000;

// ARCHITECTURE.md §6 Caching Strategy: "Search volume data: Cache for 30
// days. Volume doesn't change faster than monthly."
const CACHE_DAYS = 30;

const PROVIDER = "dataforseo" as const;

interface KeywordRow {
  id: string;
  keyword: string;
}

interface SearchVolumeApiResult {
  keyword: string;
  search_volume: number | null;
  cpc: number | null;
  monthly_searches: Array<{ year: number; month: number; search_volume: number }> | null;
}

/**
 * Collapses DataForSEO's year-aware monthly trend (up to 24 months of
 * history) into keywords.monthly_volumes' documented shape — keyed by
 * month number only, "for seasonality" (Milestone 1's own schema
 * comment), one value per month-of-year. When the same month number
 * appears more than once across years, the most recent occurrence wins
 * (DataForSEO returns oldest-to-newest, so a straightforward left-to-right
 * overwrite naturally keeps the latest).
 */
export function monthlySearchesToVolumesByMonth(
  monthlySearches: Array<{ year: number; month: number; search_volume: number }> | null,
): Record<string, number> | null {
  if (!monthlySearches || monthlySearches.length === 0) return null;
  const byMonth: Record<string, number> = {};
  for (const entry of monthlySearches) {
    byMonth[String(entry.month)] = entry.search_volume;
  }
  return byMonth;
}

function isStale(lastVolumeRefresh: string | null): boolean {
  if (!lastVolumeRefresh) return true;
  const refreshedAt = new Date(lastVolumeRefresh).getTime();
  const cutoff = Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000;
  return refreshedAt < cutoff;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchKeywordsNeedingRefresh(supabase: any, siteId: string): Promise<KeywordRow[]> {
  const { data, error } = await supabase.from("keywords").select("id, keyword, last_volume_refresh").eq("site_id", siteId);
  if (error) throw new Error(`Failed to fetch keywords: ${error.message}`);
  return ((data ?? []) as Array<KeywordRow & { last_volume_refresh: string | null }>).filter((k) => isStale(k.last_volume_refresh));
}

export interface SyncSearchVolumeResult {
  skipped: boolean;
  reason?: "budget_exceeded";
  keywordsChecked: number;
  keywordsUpdated: number;
  cost: number;
}

/**
 * Refreshes search_volume/cpc/monthly_volumes for every keyword whose
 * last_volume_refresh is null or older than 30 days. keyword_difficulty
 * is deliberately never touched — see top-of-file comment.
 */
export async function syncSearchVolume(siteId: string): Promise<SyncSearchVolumeResult> {
  const supabase = createSupabaseServiceRoleClient();

  const budgetCheck = await checkBudget(supabase, siteId, PROVIDER);
  if (!budgetCheck.allowed) {
    logger.warn("dataforseo_search_volume_budget_exceeded", { siteId, currentSpend: budgetCheck.currentSpend, monthlyLimit: budgetCheck.monthlyLimit });
    return { skipped: true, reason: "budget_exceeded", keywordsChecked: 0, keywordsUpdated: 0, cost: 0 };
  }

  const keywords = await fetchKeywordsNeedingRefresh(supabase, siteId);
  if (keywords.length === 0) {
    return { skipped: false, keywordsChecked: 0, keywordsUpdated: 0, cost: 0 };
  }

  const nowIso = new Date().toISOString();
  let totalCost = 0;
  let updatedCount = 0;

  // The whole loop (both the paid calls and the DB writes below) runs
  // inside try/finally so that recordSpend always sees whatever totalCost
  // was actually charged, even if a later chunk's task fails or a DB write
  // throws partway through. Previously recordSpend only ran after the loop
  // finished normally, so any error from a batch after the first one — a
  // failed task, a DB error — silently dropped every dollar already spent
  // on the batches (and rows) before it, letting real spend drift ahead of
  // what api_budgets.current_spend tracks (found via code review, not a
  // hypothetical: this is the same category of bug as the upsert issue
  // Milestone 5 found in production).
  try {
    for (const [batchIndex, batch] of chunk(keywords, MAX_KEYWORDS_PER_REQUEST).entries()) {
      // The budget was already checked once, above, before any keywords
      // were even fetched — but that's only a fast-path check for the
      // "already over budget" case. A site with more than
      // MAX_KEYWORDS_PER_REQUEST stale keywords issues more than one paid
      // call in this loop, and the first batch's spend could push the
      // account over the limit before a later batch fires — so every
      // batch after the first re-checks, same as serp.ts already does per
      // keyword.
      if (batchIndex > 0) {
        const midCheck = await checkBudget(supabase, siteId, PROVIDER);
        if (!midCheck.allowed) {
          logger.warn("dataforseo_search_volume_budget_exceeded", { siteId, currentSpend: midCheck.currentSpend, monthlyLimit: midCheck.monthlyLimit });
          break;
        }
      }

      const response = await callDataForSeoApi<SearchVolumeApiResult>(ENDPOINT, [
        { location_code: UK_LOCATION_CODE, language_code: LANGUAGE_CODE, keywords: batch.map((k) => k.keyword) },
      ]);
      totalCost += response.cost;

      const task = response.tasks?.[0];
      if (!task || task.status_code < 20000 || task.status_code > 29999) {
        throw new Error(`DataForSEO search volume task failed: ${task?.status_message ?? "no task in response"}`);
      }

      const resultByKeyword = new Map((task.result ?? []).map((r) => [r.keyword, r]));
      const updates = batch
        .map((k) => {
          const result = resultByKeyword.get(k.keyword);
          if (!result) return null;
          return {
            id: k.id,
            search_volume: result.search_volume,
            cpc: result.cpc,
            monthly_volumes: monthlySearchesToVolumesByMonth(result.monthly_searches),
            last_volume_refresh: nowIso,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      // Plain per-row UPDATE, not upsert. These rows always already exist
      // (found via the earlier SELECT) — an UPDATE's SET clause only ever
      // touches the columns listed, correctly leaving
      // keyword/keyword_normalized/site_id/keyword_difficulty/is_target/
      // data_source untouched. upsert() looked equivalent but isn't: Postgres
      // validates NOT NULL columns while constructing the row to (possibly)
      // insert *before* it even checks for a conflict, so a partial payload
      // missing a NOT NULL column like site_id fails outright — confirmed
      // the hard way, running this for real against production, not
      // something the row-construction distinction is obvious from
      // PostgREST's docs alone.
      //
      // A single row's UPDATE failing is logged and skipped rather than
      // aborting the rest of the batch — this keyword was already paid
      // for as part of this batch's single API call, so the money's spent
      // either way; skipping the write just means it stays stale and gets
      // retried on the next scheduled sync, same as any keyword this run
      // never got to.
      for (const row of updates) {
        const { id, ...values } = row;
        const { error } = await supabase.from("keywords").update(values).eq("id", id);
        if (error) {
          logger.warn("dataforseo_search_volume_update_failed", { siteId, keywordId: id, error: error.message });
          continue;
        }
        updatedCount += 1;
      }
    }
  } finally {
    if (totalCost > 0) {
      await recordSpend(supabase, siteId, PROVIDER, totalCost);
    }
  }

  logger.info("dataforseo_search_volume_synced", { siteId, keywordsChecked: keywords.length, keywordsUpdated: updatedCount, cost: totalCost });
  return { skipped: false, keywordsChecked: keywords.length, keywordsUpdated: updatedCount, cost: totalCost };
}
