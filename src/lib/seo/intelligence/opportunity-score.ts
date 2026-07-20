import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

// ARCHITECTURE.md §5.1 Opportunity Score — the headline scoring algorithm.
// Every DataForSEO-sourced input (search_volume, keyword_difficulty, cpc,
// search_intent) is nullable pre-Milestone-5/6, so every component here is
// null-safe by construction (PHASE_2_IMPLEMENTATION.md's Sequencing
// Decision) — this ships now, on GSC data alone, and improves
// automatically once DataForSEO data lands, with zero rework.

const RECENT_POSITION_WINDOW_DAYS = 7;
const FETCH_PAGE_SIZE = 1000;

/**
 * ARCHITECTURE.md §5.1's exact position_potential bucketing. "Striking
 * distance" (11-20) scores highest — the platform's stated thesis that
 * near-page-1 keywords are the best ROI target.
 */
export function positionPotential(bestPosition: number | null): number {
  if (bestPosition === null) return 0.3; // no ranking — new opportunity, unknown effort
  if (bestPosition <= 3) return 0.2;
  if (bestPosition <= 10) return 0.6;
  if (bestPosition <= 20) return 1.0;
  if (bestPosition <= 50) return 0.4;
  return 0.1;
}

/**
 * ARCHITECTURE.md gives the formula (1 - difficulty/100) but no null
 * behavior — keyword_difficulty is null for every keyword until Milestone
 * 5 runs. Resolved as a neutral 0.5, the same "unknown = neutral, not
 * zero" convention ARCHITECTURE.md's own intent_value rule already
 * establishes for its null case, applied consistently here too.
 */
export function difficultyScore(keywordDifficulty: number | null): number {
  if (keywordDifficulty === null) return 0.5;
  return 1 - keywordDifficulty / 100;
}

/** ARCHITECTURE.md §5.1's exact intent_value mapping, including its own explicit null/unknown → 0.5 rule. */
export function intentValue(searchIntent: string | null): number {
  switch (searchIntent) {
    case "transactional":
      return 1.0;
    case "commercial":
      return 0.8;
    case "informational":
      return 0.4;
    case "navigational":
      return 0.2;
    default:
      return 0.5;
  }
}

/**
 * volume_norm and business_value are both min(value/max, 1.0) ratios —
 * unlike difficulty_score/intent_value (direct formulaic/categorical
 * values with an established "unknown = neutral 0.5" convention), a
 * ratio with no numerator has no relative standing to report, so this
 * resolves to 0 rather than an arbitrary neutral value when the input or
 * the site-wide max is missing/zero.
 */
export function normalizedRatio(value: number | null, maxInSiteKeywords: number): number {
  if (value === null || maxInSiteKeywords <= 0) return 0;
  return Math.min(value / maxInSiteKeywords, 1.0);
}

export interface OpportunityWeights {
  volume: number;
  position: number;
  difficulty: number;
  intent: number;
  business_value: number;
}

export interface OpportunityComponents {
  positionPotential: number;
  difficultyScore: number;
  intentValue: number;
  volumeNorm: number;
  businessValue: number;
}

export function computeOpportunityScore(components: OpportunityComponents, weights: OpportunityWeights): number {
  return (
    (components.volumeNorm * (weights.volume ?? 0) +
      components.positionPotential * (weights.position ?? 0) +
      components.difficultyScore * (weights.difficulty ?? 0) +
      components.intentValue * (weights.intent ?? 0) +
      components.businessValue * (weights.business_value ?? 0)) *
    100
  );
}

export interface OpportunityScoreResult {
  keywordId: string;
  score: number;
  bestPosition: number | null;
  components: OpportunityComponents;
}

interface KeywordRow {
  id: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  search_intent: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchKeywords(supabase: any, siteId: string): Promise<KeywordRow[]> {
  const rows: KeywordRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("keywords")
      .select("id, search_volume, keyword_difficulty, cpc, search_intent")
      .eq("site_id", siteId)
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch keywords: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }
  return rows;
}

/** Best (lowest) position per keyword over the last 7 days, across any ranking page. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchBestRecentPositions(supabase: any, siteId: string): Promise<Map<string, number>> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - RECENT_POSITION_WINDOW_DAYS);
  const sinceDate = since.toISOString().slice(0, 10);

  const bestByKeyword = new Map<string, number>();
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("keyword_page_metrics")
      .select("keyword_id, position")
      .eq("site_id", siteId)
      .gte("date", sinceDate)
      .not("position", "is", null)
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch keyword_page_metrics: ${error.message}`);
    for (const row of (data ?? []) as Array<{ keyword_id: string; position: number }>) {
      const current = bestByKeyword.get(row.keyword_id);
      if (current === undefined || row.position < current) bestByKeyword.set(row.keyword_id, row.position);
    }
    if (!data || data.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }
  return bestByKeyword;
}

const DEFAULT_WEIGHTS: OpportunityWeights = {
  volume: 0.2,
  position: 0.35,
  difficulty: 0.15,
  intent: 0.15,
  business_value: 0.15,
};

/**
 * Scores every keyword on the site. Which subset actually surfaces in the
 * action queue (e.g. "not yet targeted") is Milestone 10's concern, not
 * this module's — same "score everything qualifying, let the orchestrator
 * decide" split as cannibalization.ts and content-decay.ts.
 */
export async function computeOpportunityScores(siteId: string): Promise<OpportunityScoreResult[]> {
  const supabase = createSupabaseServiceRoleClient();

  const [keywords, bestPositions] = await Promise.all([fetchKeywords(supabase, siteId), fetchBestRecentPositions(supabase, siteId)]);
  if (keywords.length === 0) return [];

  const { data: siteConfigRow, error: siteConfigError } = await supabase
    .from("site_configs")
    .select("scoring_weights")
    .eq("site_id", siteId)
    .single();
  if (siteConfigError || !siteConfigRow) {
    throw new Error(`Failed to load site_configs: ${siteConfigError?.message ?? "not found"}`);
  }
  const weights: OpportunityWeights = siteConfigRow.scoring_weights?.opportunity ?? DEFAULT_WEIGHTS;

  const maxVolume = Math.max(0, ...keywords.map((k) => k.search_volume ?? 0));
  const maxCpc = Math.max(0, ...keywords.map((k) => k.cpc ?? 0));

  return keywords.map((keyword): OpportunityScoreResult => {
    const bestPosition = bestPositions.get(keyword.id) ?? null;
    const components: OpportunityComponents = {
      positionPotential: positionPotential(bestPosition),
      difficultyScore: difficultyScore(keyword.keyword_difficulty),
      intentValue: intentValue(keyword.search_intent),
      volumeNorm: normalizedRatio(keyword.search_volume, maxVolume),
      businessValue: normalizedRatio(keyword.cpc, maxCpc),
    };
    return {
      keywordId: keyword.id,
      score: computeOpportunityScore(components, weights),
      bestPosition,
      components,
    };
  });
}
