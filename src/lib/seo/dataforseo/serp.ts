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
const TYPE_TO_SERP_FEATURE: Record<string, string> = {
  organic: "organic",
  featured_snippet: "featured_snippet",
  people_also_ask: "paa",
  local_pack: "local_pack",
  video: "video",
  images: "image",
};

interface SerpItem {
  type: string;
  rank_absolute: number | null;
  domain: string | null;
  url: string | null;
  title: string | null;
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
    return { keywordsEligible: 0, keywordsSynced: 0, keywordsRemaining: 0, snapshotsWritten: 0, budgetExceeded: false, cost: 0 };
  }

  const today = new Date().toISOString().slice(0, 10);
  let totalCost = 0;
  let snapshotsWritten = 0;
  let syncedCount = 0;
  let budgetExceeded = false;

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

    const items = (task.result?.[0]?.items ?? []).filter(
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
      const { error } = await supabase.from("serp_snapshots").upsert(rows, { onConflict: "keyword_id,date,position", ignoreDuplicates: true });
      if (error) throw new Error(`Failed to write serp_snapshots for "${keyword.keyword}": ${error.message}`);
      snapshotsWritten += rows.length;
    }

    syncedCount += 1;
  }

  if (totalCost > 0) {
    await recordSpend(supabase, siteId, PROVIDER, totalCost);
  }

  const result: SyncSerpSnapshotsResult = {
    keywordsEligible: keywords.length,
    keywordsSynced: syncedCount,
    keywordsRemaining: keywords.length - syncedCount,
    snapshotsWritten,
    budgetExceeded,
    cost: totalCost,
  };
  logger.info("dataforseo_serp_synced", { siteId, ...result });
  return result;
}
