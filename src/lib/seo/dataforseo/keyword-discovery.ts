import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { callDataForSeoApi } from "./client";
import { checkBudget, recordSpend } from "./budget";
import { logger } from "@/lib/seo/logger";
import { normalizeKeyword } from "@/lib/seo/normalize";

// Real keyword discovery — added at explicit user request, closing a real
// limitation every other DataForSEO module in this codebase has: Search
// Volume and SERP only ever enrich keywords Google Search Console already
// reports an impression for. If the site has *never* shown up for a
// valuable search term — not even on page 10 — nothing in this system
// could ever find it. This module can, using DataForSEO Labs' real
// keyword-idea endpoint, seeded from this site's own real niche terms
// (not generic restaurant SEO).
//
// Verified against DataForSEO's live docs before writing this (not
// assumed): docs.dataforseo.com/v3/dataforseo_labs-google-related_keywords-live/.
// Real cost is ~$0.01/seed keyword request (their own documented example),
// not the $0.05/seed ARCHITECTURE.md §6's original plan estimated.
const ENDPOINT = "/v3/dataforseo_labs/google/related_keywords/live";

// Country-level, matching search-volume.ts's own reasoning: Google's
// keyword-idea data is standard practice at country granularity; city-level
// volume data is too sparse to be a meaningful discovery filter.
const UK_LOCATION_CODE = 2826;
const LANGUAGE_CODE = "en";
// How many "hops" of related-keyword expansion DataForSEO does from the
// seed (0-4, their default is 1) — 1 keeps results genuinely related to
// the seed rather than drifting into unrelated territory a few hops out.
const DEPTH = 1;
const RESULTS_LIMIT_PER_SEED = 100;
// "Decent volume" floor for a long-tail local-business term — real local
// search terms rarely clear four figures, so this is deliberately low
// rather than the four-figure-plus floor a national/ecommerce site might
// use. Not specified anywhere in ARCHITECTURE.md; a new, reasoned
// convention for this module, same as action-outcomes.ts's thresholds.
const MIN_SEARCH_VOLUME = 10;
// "Long-tail" heuristic: 3+ words. A 1-2 word term ("suya", "jollof rice")
// is exactly the big, competitive kind of keyword the user asked this
// module to filter OUT, not surface as a new discovery.
const MIN_WORD_COUNT = 3;
const PROVIDER = "dataforseo" as const;

// Real, niche-grounded seeds — derived from this site's own real top
// keywords and brand (naija grill & spice kitchen: Nigerian food,
// Handsworth/Birmingham, real menu items), not invented generic terms.
// Overridable per-site via sites.config.seed_keywords (the same
// lightweight-JSONB-override column brand_terms already uses) since a
// real business niche isn't something this module should guess forever.
export const DEFAULT_SEED_KEYWORDS = [
  "nigerian food birmingham",
  "jollof rice",
  "suya",
  "small chops",
  "west african restaurant birmingham",
  "handsworth restaurants",
  "nigerian restaurant birmingham",
  "nigerian catering birmingham",
];

const VALID_INTENTS = new Set(["informational", "navigational", "commercial", "transactional"]);

export function isLongTail(keyword: string): boolean {
  return keyword.trim().split(/\s+/).length >= MIN_WORD_COUNT;
}

interface RelatedKeywordItem {
  keyword_data: {
    keyword: string;
    keyword_info: { search_volume: number | null; cpc: number | null } | null;
    keyword_properties: { keyword_difficulty: number | null } | null;
    search_intent_info: { main_intent: string | null } | null;
  } | null;
}

export interface DiscoveredKeywordCandidate {
  keyword: string;
  keywordNormalized: string;
  searchVolume: number;
  cpc: number | null;
  keywordDifficulty: number | null;
  searchIntent: string | null;
}

/**
 * Filters + normalizes one seed's raw API response into real candidates:
 * long-tail only, real volume at/above the floor, no navigational intent,
 * deduped by normalized form. The API's own `filters` param already asks
 * for volume >= the floor — this re-checks defensively rather than
 * trusting it blindly, same discipline as every other DataForSEO
 * response in this codebase.
 *
 * Navigational intent is excluded outright, not just left neutral: found
 * via a real production run of this module — 2 of its first 17 real
 * results ("empress restaurant birmingham", "...pershore road") turned
 * out to be a *competitor's own business name*, surfaced because a
 * generic niche seed happened to relate to it. That's structurally
 * un-actionable for this system's purpose (you cannot rank content for
 * someone else's brand search), unlike informational/commercial/
 * transactional intent, which are all real content opportunities.
 */
export function extractCandidates(items: RelatedKeywordItem[]): DiscoveredKeywordCandidate[] {
  const seen = new Set<string>();
  const candidates: DiscoveredKeywordCandidate[] = [];

  for (const item of items) {
    const kd = item.keyword_data;
    if (!kd?.keyword) continue;
    if (!isLongTail(kd.keyword)) continue;

    const searchVolume = kd.keyword_info?.search_volume ?? null;
    if (searchVolume === null || searchVolume < MIN_SEARCH_VOLUME) continue;

    if (kd.search_intent_info?.main_intent === "navigational") continue;

    const keywordNormalized = normalizeKeyword(kd.keyword);
    if (seen.has(keywordNormalized)) continue;
    seen.add(keywordNormalized);

    const intent = kd.search_intent_info?.main_intent ?? null;

    candidates.push({
      keyword: kd.keyword,
      keywordNormalized,
      searchVolume,
      cpc: kd.keyword_info?.cpc ?? null,
      keywordDifficulty: kd.keyword_properties?.keyword_difficulty ?? null,
      searchIntent: intent && VALID_INTENTS.has(intent) ? intent : null,
    });
  }

  return candidates;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchSeedKeywords(supabase: any, siteId: string): Promise<string[]> {
  const { data, error } = await supabase.from("sites").select("config").eq("id", siteId).single();
  if (error) throw new Error(`Failed to load site config: ${error.message}`);
  const configured = data?.config?.seed_keywords;
  return Array.isArray(configured) && configured.length > 0 ? (configured as string[]) : DEFAULT_SEED_KEYWORDS;
}

interface ExistingKeywordRow {
  id: string;
  keyword_difficulty: number | null;
  search_intent: string | null;
}

const FETCH_PAGE_SIZE = 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchExistingKeywordsByNormalized(supabase: any, siteId: string): Promise<Map<string, ExistingKeywordRow>> {
  const byNormalized = new Map<string, ExistingKeywordRow>();
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("keywords")
      .select("id, keyword_normalized, keyword_difficulty, search_intent")
      .eq("site_id", siteId)
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch existing keywords: ${error.message}`);
    for (const row of (data ?? []) as Array<ExistingKeywordRow & { keyword_normalized: string }>) {
      byNormalized.set(row.keyword_normalized, { id: row.id, keyword_difficulty: row.keyword_difficulty, search_intent: row.search_intent });
    }
    if (!data || data.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }
  return byNormalized;
}

export interface DiscoverKeywordsResult {
  skipped: boolean;
  reason?: "budget_exceeded";
  seedsQueried: number;
  candidatesFound: number;
  keywordsInserted: number;
  keywordsEnriched: number;
  cost: number;
}

/**
 * Runs every configured seed keyword through DataForSEO's Related
 * Keywords endpoint, keeps only real long-tail/decent-volume candidates
 * not already tracked, and either inserts them as brand-new keywords
 * (is_target=false, data_source='dataforseo' — they flow through the
 * existing Opportunity Score / content-brief / analytics pipeline
 * automatically, no separate surface needed) or, for a candidate that
 * happens to match an existing keyword missing its difficulty/intent,
 * opportunistically backfills those two fields for free (the response
 * was already paid for either way).
 */
export async function discoverKeywords(siteId: string): Promise<DiscoverKeywordsResult> {
  const supabase = createSupabaseServiceRoleClient();

  const budgetCheck = await checkBudget(supabase, siteId, PROVIDER);
  if (!budgetCheck.allowed) {
    logger.warn("dataforseo_keyword_discovery_budget_exceeded", { siteId, currentSpend: budgetCheck.currentSpend, monthlyLimit: budgetCheck.monthlyLimit });
    return { skipped: true, reason: "budget_exceeded", seedsQueried: 0, candidatesFound: 0, keywordsInserted: 0, keywordsEnriched: 0, cost: 0 };
  }

  const [seeds, existingByNormalized] = await Promise.all([fetchSeedKeywords(supabase, siteId), fetchExistingKeywordsByNormalized(supabase, siteId)]);

  let totalCost = 0;
  let seedsQueried = 0;
  const seenThisRun = new Set<string>();
  const toInsert: Array<Record<string, unknown>> = [];
  const toEnrich: Array<{ id: string; values: Record<string, unknown> }> = [];

  try {
    for (const [index, seed] of seeds.entries()) {
      if (index > 0) {
        const midCheck = await checkBudget(supabase, siteId, PROVIDER);
        if (!midCheck.allowed) {
          logger.warn("dataforseo_keyword_discovery_budget_exceeded", { siteId, currentSpend: midCheck.currentSpend, monthlyLimit: midCheck.monthlyLimit });
          break;
        }
      }

      const response = await callDataForSeoApi<{ items: RelatedKeywordItem[] }>(ENDPOINT, [
        {
          keyword: seed,
          location_code: UK_LOCATION_CODE,
          language_code: LANGUAGE_CODE,
          depth: DEPTH,
          limit: RESULTS_LIMIT_PER_SEED,
          filters: [["keyword_data.keyword_info.search_volume", ">", MIN_SEARCH_VOLUME]],
        },
      ]);
      totalCost += response.cost;
      seedsQueried += 1;

      const task = response.tasks?.[0];
      if (!task || task.status_code < 20000 || task.status_code > 29999) {
        logger.warn("dataforseo_keyword_discovery_task_failed", { siteId, seed, statusMessage: task?.status_message });
        continue;
      }

      const items = task.result?.[0]?.items ?? [];
      for (const candidate of extractCandidates(items)) {
        if (seenThisRun.has(candidate.keywordNormalized)) continue;
        seenThisRun.add(candidate.keywordNormalized);

        const existing = existingByNormalized.get(candidate.keywordNormalized);
        if (existing) {
          const values: Record<string, unknown> = {};
          if (existing.keyword_difficulty === null && candidate.keywordDifficulty !== null) values.keyword_difficulty = candidate.keywordDifficulty;
          if (existing.search_intent === null && candidate.searchIntent !== null) values.search_intent = candidate.searchIntent;
          if (Object.keys(values).length > 0) toEnrich.push({ id: existing.id, values });
          continue;
        }

        toInsert.push({
          site_id: siteId,
          keyword: candidate.keyword,
          keyword_normalized: candidate.keywordNormalized,
          search_volume: candidate.searchVolume,
          cpc: candidate.cpc,
          keyword_difficulty: candidate.keywordDifficulty,
          search_intent: candidate.searchIntent,
          is_target: false,
          data_source: PROVIDER,
          last_volume_refresh: new Date().toISOString(),
        });
      }
    }

    let keywordsInserted = 0;
    if (toInsert.length > 0) {
      const { error } = await supabase.from("keywords").insert(toInsert);
      if (error) throw new Error(`Failed to insert discovered keywords: ${error.message}`);
      keywordsInserted = toInsert.length;
    }

    let keywordsEnriched = 0;
    for (const row of toEnrich) {
      const { error } = await supabase.from("keywords").update(row.values).eq("id", row.id);
      if (error) {
        logger.warn("dataforseo_keyword_discovery_enrich_failed", { siteId, keywordId: row.id, error: error.message });
        continue;
      }
      keywordsEnriched += 1;
    }

    logger.info("dataforseo_keyword_discovery_synced", { siteId, seedsQueried, candidatesFound: seenThisRun.size, keywordsInserted, keywordsEnriched, cost: totalCost });
    return { skipped: false, seedsQueried, candidatesFound: seenThisRun.size, keywordsInserted, keywordsEnriched, cost: totalCost };
  } finally {
    if (totalCost > 0) {
      await recordSpend(supabase, siteId, PROVIDER, totalCost);
    }
  }
}
