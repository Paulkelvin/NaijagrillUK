import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { detectCannibalization } from "./cannibalization";
import { detectContentDecay } from "./content-decay";
import { computeOpportunityScores, normalizedRatio } from "./opportunity-score";
import { computePageRoiScores } from "./page-roi-score";
import { computeKeywordValues } from "./keyword-value";
import { logger } from "@/lib/seo/logger";

// ARCHITECTURE.md §7's analysis engine: runs the five action-generating
// modules (§5.1 Opportunity, §5.2 Page ROI, §5.3 Cannibalization, §5.5
// Keyword Value, §5.7 Content Decay — §5.4's CTR model is an input, not an
// action generator) and turns each one's output into `actions` rows.
//
// Cross-module priority scoring: only Cannibalization (§5.3) documents an
// explicit 0-100 score with an action threshold (>40). Opportunity Score
// is also 0-100 but undocumented for a threshold. Page ROI's `roi_score`
// and Keyword Value's `monthlyValue` are unbounded, not comparable to a
// 0-100 score at all. Resolved (confirmed with the user before building
// this file) as: Opportunity and Cannibalization use their own 0-100
// scores directly as priority_score. Page ROI and Content Decay share a
// second, separate 0-100 blend built from `site_configs.scoring_weights
// .page_roi` (`traffic_potential`, `conversion_rate`, `effort_inverse`,
// `decay_urgency`) — the same "weights blend normalized 0-1 components
// into a 0-100 score" shape `scoring_weights.cannibalization` already
// uses in production. `decay_urgency` being one of page_roi's own four
// weights is the direct textual evidence for folding Content Decay into
// the same blend rather than inventing a second formula: both algorithms
// are fundamentally "how urgently should I improve this existing page."
// The raw `roi_score`/`decay_pct` still ride along in `supporting_data`
// for context. Keyword Value never generates its own action — per §5.5's
// own Output note ("Used by the Opportunity Score... stored in
// actions.supporting_data for display"), it only enriches an Opportunity
// action's supporting_data when a value exists for that keyword/page.
//
// A single ACTION_THRESHOLD (40) gates every 0-100-scaled score
// consistently — reusing Cannibalization's own documented bar rather than
// inventing a different one per module, since ARCHITECTURE.md gives no
// other module its own number. Content Decay is the one exception: it
// generates an action whenever decay_stage isn't "stable", independent of
// the threshold — a page can be actively losing traffic while still
// scoring low on the blended priority (little rank-gain headroom left),
// and ARCHITECTURE.md frames decay as its own urgency signal, not a
// ranked-opportunity one.
const ACTION_THRESHOLD = 40;

// actions.expires_at's schema comment says "auto-dismiss stale actions"
// but §5 never specifies a window. 90 days is a reasoned default — roughly
// one GSC/GA4 trailing-window's worth of relevance, long enough that a
// real but slow-moving issue isn't dismissed out from under an owner who
// hasn't gotten to it yet. This module only sets the column; the sweep
// that actually flips status to "dismissed" once expires_at passes isn't
// built here — out of Milestone 10's stated task list, tracked as an open
// follow-up (see PHASE_2_IMPLEMENTATION.md).
const EXPIRES_AFTER_DAYS = 90;

// Real gap found reviewing the queue: Opportunity Score (§5.1) has no
// volume ceiling the way keyword-discovery.ts's long-tail filter does, so
// it was generating create_content actions for keywords GSC shows real
// impressions for but that are far too broad/generic for a single-location
// restaurant to ever meaningfully rank content for — e.g. "restaurants
// near me" (9.14M/mo) and "restaurant" (7.48M/mo) both surfaced as
// top-priority "opportunities" alongside "mix grill" (9,900/mo, a real
// menu-item keyword this business can actually win). A flat ceiling can't
// perfectly separate generic catch-alls from genuine niche demand (some
// borderline "near me" terms slip through under it too), but it does catch
// the multi-million-scale head terms that were clearly never actionable,
// without excluding real opportunities like "mix grill" that happen to
// have decent volume. 50,000 sits well above the real menu-item keywords
// already in this site's queue and well below the multi-million noise.
const MAX_ACTIONABLE_VOLUME = 50_000;

interface PagePriorityWeights {
  traffic_potential: number;
  conversion_rate: number;
  effort_inverse: number;
  decay_urgency: number;
}

const DEFAULT_PAGE_ROI_WEIGHTS: PagePriorityWeights = {
  traffic_potential: 0.35,
  conversion_rate: 0.3,
  effort_inverse: 0.2,
  decay_urgency: 0.15,
};

export interface PagePriorityComponents {
  trafficPotentialNorm: number;
  conversionRate: number;
  effortInverse: number;
  decayUrgencyNorm: number;
}

/** The blended 0-100 priority shared by Page ROI and Content Decay actions — see top-of-file comment. */
export function computePagePriority(components: PagePriorityComponents, weights: PagePriorityWeights): number {
  return (
    (components.trafficPotentialNorm * (weights.traffic_potential ?? 0) +
      Math.min(Math.max(components.conversionRate, 0), 1) * (weights.conversion_rate ?? 0) +
      components.effortInverse * (weights.effort_inverse ?? 0) +
      components.decayUrgencyNorm * (weights.decay_urgency ?? 0)) *
    100
  );
}

export type ActionType =
  | "create_content"
  | "update_content"
  | "add_internal_link"
  | "fix_cannibalization"
  | "fix_technical"
  | "update_meta"
  | "add_schema";

export type SourceModule =
  | "keyword_intelligence"
  | "page_performance"
  | "cannibalization"
  | "internal_linking"
  | "competitor"
  | "content_brief"
  | "decay";

export interface ActionCandidate {
  type: ActionType;
  sourceModule: SourceModule;
  priorityScore: number;
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supportingData: Record<string, any>;
  pageId: string | null;
  keywordId: string | null;
}

/**
 * The dedup key an action is matched against existing non-terminal rows
 * by. fix_cannibalization keys on keyword_id alone (not page_id too) —
 * the recommended canonical page can shift between runs as traffic
 * shifts, and that should update the existing row in place, not spawn a
 * second one for the same underlying cannibalized keyword. Every other
 * type has exactly one of page_id/keyword_id populated, so keying on both
 * is equivalent to keying on whichever one is real.
 */
export function actionDedupKey(candidate: Pick<ActionCandidate, "type" | "sourceModule" | "pageId" | "keywordId">): string {
  if (candidate.type === "fix_cannibalization") {
    return `${candidate.type}::${candidate.sourceModule}::kw:${candidate.keywordId ?? ""}`;
  }
  return `${candidate.type}::${candidate.sourceModule}::kw:${candidate.keywordId ?? ""}::pg:${candidate.pageId ?? ""}`;
}

interface KeywordDisplayRow {
  id: string;
  keyword: string;
  is_target: boolean | null;
  search_volume: number | null;
}

interface PageDisplayRow {
  id: string;
  path: string;
}

interface ExistingActionRow {
  id: string;
  type: string;
  source_module: string;
  page_id: string | null;
  keyword_id: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchKeywordsByIds(supabase: any, ids: string[]): Promise<Map<string, KeywordDisplayRow>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase.from("keywords").select("id, keyword, is_target, search_volume").in("id", ids);
  if (error) throw new Error(`Failed to fetch keywords for display: ${error.message}`);
  return new Map((data ?? []).map((k: KeywordDisplayRow) => [k.id, k]));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPagesByIds(supabase: any, ids: string[]): Promise<Map<string, PageDisplayRow>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase.from("pages").select("id, path").in("id", ids);
  if (error) throw new Error(`Failed to fetch pages for display: ${error.message}`);
  return new Map((data ?? []).map((p: PageDisplayRow) => [p.id, p]));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchExistingOpenActions(supabase: any, siteId: string): Promise<Map<string, ExistingActionRow>> {
  const { data, error } = await supabase
    .from("actions")
    .select("id, type, source_module, page_id, keyword_id")
    .eq("site_id", siteId)
    .in("status", ["queued", "in_progress"]);
  if (error) throw new Error(`Failed to fetch existing actions: ${error.message}`);
  const map = new Map<string, ExistingActionRow>();
  for (const row of (data ?? []) as ExistingActionRow[]) {
    map.set(actionDedupKey({ type: row.type as ActionType, sourceModule: row.source_module as SourceModule, pageId: row.page_id, keywordId: row.keyword_id }), row);
  }
  return map;
}

export interface RunAnalysisResult {
  candidatesGenerated: number;
  actionsCreated: number;
  actionsUpdated: number;
}

/**
 * Runs all five action-generating modules and writes their output to
 * `actions`, deduped against existing non-terminal rows so re-running
 * against unchanged data doesn't grow the table. ARCHITECTURE.md §7:
 * "Analysis engine | After any sync completes | Event-driven" — in this
 * project that's implemented as its own separately-scheduled cron with a
 * time offset (confirmed with the user), the same pattern already live
 * for Milestone 1's CTR model rebuild, rather than an inline call chained
 * onto gsc/sync.ts or ga4/sync.ts's own request handlers — avoiding the
 * risk of pushing either of those closer to Vercel Hobby's 300s ceiling
 * with no real timing data to justify doing otherwise.
 */
export async function runAnalysis(siteId: string): Promise<RunAnalysisResult> {
  const supabase = createSupabaseServiceRoleClient();

  const [cannibalization, contentDecay, opportunities, pageRois, keywordValues, siteConfigResult] = await Promise.all([
    detectCannibalization(siteId),
    detectContentDecay(siteId),
    computeOpportunityScores(siteId),
    computePageRoiScores(siteId),
    computeKeywordValues(siteId),
    supabase.from("site_configs").select("scoring_weights").eq("site_id", siteId).single(),
  ]);

  const { data: siteConfigRow, error: siteConfigError } = siteConfigResult;
  if (siteConfigError || !siteConfigRow) {
    throw new Error(`Failed to load site_configs: ${siteConfigError?.message ?? "not found"}`);
  }
  const pageRoiWeights: PagePriorityWeights = siteConfigRow.scoring_weights?.page_roi ?? DEFAULT_PAGE_ROI_WEIGHTS;

  const decayByPageId = new Map(contentDecay.map((d) => [d.pageId, d]));
  const maxTrafficPotential = Math.max(0, ...pageRois.map((r) => r.trafficPotential));
  const maxDecayUrgency = Math.max(0, ...contentDecay.map((d) => d.decayUrgency));
  const keywordValueByPair = new Map(keywordValues.map((v) => [`${v.keywordId}::${v.pageId}`, v.monthlyValue]));

  const keywordIds = new Set<string>();
  const pageIds = new Set<string>();
  for (const o of opportunities) keywordIds.add(o.keywordId);
  for (const c of cannibalization) {
    keywordIds.add(c.keywordId);
    if (c.recommendedCanonicalPageId) pageIds.add(c.recommendedCanonicalPageId);
  }
  for (const r of pageRois) pageIds.add(r.pageId);
  for (const d of contentDecay) pageIds.add(d.pageId);

  const [keywordById, pageById] = await Promise.all([
    fetchKeywordsByIds(supabase, Array.from(keywordIds)),
    fetchPagesByIds(supabase, Array.from(pageIds)),
  ]);

  const candidates: ActionCandidate[] = [];

  for (const o of opportunities) {
    if (o.score <= ACTION_THRESHOLD) continue;
    const keyword = keywordById.get(o.keywordId);
    if (!keyword || keyword.is_target === true) continue;
    if (keyword.search_volume !== null && keyword.search_volume > MAX_ACTIONABLE_VOLUME) continue;
    candidates.push({
      type: "create_content",
      sourceModule: "keyword_intelligence",
      priorityScore: o.score,
      title: `Target "${keyword.keyword}"`,
      description: `Opportunity score ${o.score.toFixed(1)} — best position ${o.bestPosition ?? "unranked"}, not yet targeted by a dedicated page.`,
      supportingData: { opportunityScore: o.score, components: o.components, bestPosition: o.bestPosition },
      pageId: null,
      keywordId: o.keywordId,
    });
  }

  for (const c of cannibalization) {
    if (!c.recommendation) continue;
    const keyword = keywordById.get(c.keywordId);
    candidates.push({
      type: "fix_cannibalization",
      sourceModule: "cannibalization",
      priorityScore: c.score,
      title: `Cannibalization on "${keyword?.keyword ?? c.keywordId}"`,
      description: `${c.pageIds.length} pages compete for this keyword. Recommendation: ${c.recommendation}.`,
      supportingData: {
        score: c.score,
        positionVarianceNorm: c.positionVarianceNorm,
        clickSplit: c.clickSplit,
        ctrDeficitNorm: c.ctrDeficitNorm,
        trafficValueNorm: c.trafficValueNorm,
        recommendation: c.recommendation,
        pageIds: c.pageIds,
      },
      pageId: c.recommendedCanonicalPageId,
      keywordId: c.keywordId,
    });
  }

  for (const r of pageRois) {
    const decay = decayByPageId.get(r.pageId);
    const priority = computePagePriority(
      {
        trafficPotentialNorm: normalizedRatio(r.trafficPotential, maxTrafficPotential),
        conversionRate: r.pageConversionRate,
        effortInverse: 1 - r.effortScore,
        decayUrgencyNorm: decay ? normalizedRatio(decay.decayUrgency, maxDecayUrgency) : 0,
      },
      pageRoiWeights,
    );
    const page = pageById.get(r.pageId);
    const pagePath = page?.path ?? r.pageId;

    if (priority > ACTION_THRESHOLD) {
      candidates.push({
        type: "update_content",
        sourceModule: "page_performance",
        priorityScore: priority,
        title: `Improve ${pagePath}`,
        description: `Blended priority ${priority.toFixed(1)} — raw ROI ${r.roiScore.toFixed(2)}, revenue potential ${r.revenuePotential.toFixed(2)}.`,
        supportingData: {
          roiScore: r.roiScore,
          trafficPotential: r.trafficPotential,
          revenuePotential: r.revenuePotential,
          effortScore: r.effortScore,
          pagePriorityBlend: priority,
        },
        pageId: r.pageId,
        keywordId: null,
      });
    }

    if (decay && decay.decayStage !== "stable") {
      candidates.push({
        type: "update_content",
        sourceModule: "decay",
        priorityScore: priority,
        title: `${decay.decayStage.replace("_", " ")} on ${pagePath}`,
        description: `Traffic down ${decay.decayPct.toFixed(1)}% from its peak, ${decay.daysSincePeak} days ago.`,
        supportingData: {
          decayPct: decay.decayPct,
          decayStage: decay.decayStage,
          daysSincePeak: decay.daysSincePeak,
          recencyFactor: decay.recencyFactor,
          decayUrgency: decay.decayUrgency,
          pagePriorityBlend: priority,
        },
        pageId: decay.pageId,
        keywordId: null,
      });
    }
  }

  // Note: computePageRoiScores iterates every row in the `pages` table
  // unconditionally, and detectContentDecay's results are always a subset
  // of that same table — so every content-decay page is guaranteed to
  // already appear in `pageRois`, and the decay-action generation above
  // (inside the `pageRois` loop) covers every decaying page. No separate
  // pass is needed here.

  // Enrich opportunity candidates with keyword_monthly_value when one
  // exists for that keyword against any page it currently ranks on
  // (ARCHITECTURE.md §5.5's own stated use: display-only, inside another
  // module's supporting_data).
  for (const candidate of candidates) {
    if (candidate.type !== "create_content" || !candidate.keywordId) continue;
    for (const [key, value] of keywordValueByPair) {
      if (key.startsWith(`${candidate.keywordId}::`) && value > 0) {
        candidate.supportingData.keywordMonthlyValue = value;
        break;
      }
    }
  }

  const existingByKey = await fetchExistingOpenActions(supabase, siteId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRES_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const toInsert: Array<Record<string, unknown>> = [];
  const toUpdate: Array<Record<string, unknown>> = [];

  for (const candidate of candidates) {
    const existing = existingByKey.get(actionDedupKey(candidate));
    const row = {
      site_id: siteId,
      type: candidate.type,
      priority_score: candidate.priorityScore,
      title: candidate.title,
      description: candidate.description,
      source_module: candidate.sourceModule,
      supporting_data: candidate.supportingData,
      page_id: candidate.pageId,
      keyword_id: candidate.keywordId,
      expires_at: expiresAt,
      updated_at: now.toISOString(),
    };
    if (existing) {
      toUpdate.push({ id: existing.id, ...row });
    } else {
      toInsert.push({ ...row, status: "queued" });
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("actions").insert(toInsert);
    if (error) throw new Error(`Failed to insert actions: ${error.message}`);
  }
  if (toUpdate.length > 0) {
    // upsert()'s DO UPDATE SET clause only touches the columns present in
    // `row` (status/completed_at/created_at correctly stay untouched on a
    // real conflict) — but every NOT-NULL-without-a-DB-default column
    // (site_id/type/priority_score/title/source_module) still has to be
    // in the payload regardless, since Postgres validates row construction
    // before it even checks for a conflict. `row` above includes all of
    // them, so this is safe — see search-volume.ts's syncSearchVolume for
    // the failure mode when a NOT NULL column is left out (caught running
    // that module for real against production, not from docs alone).
    const { error } = await supabase.from("actions").upsert(toUpdate, { onConflict: "id" });
    if (error) throw new Error(`Failed to update actions: ${error.message}`);
  }

  logger.info("analysis_run_complete", {
    siteId,
    candidatesGenerated: candidates.length,
    actionsCreated: toInsert.length,
    actionsUpdated: toUpdate.length,
  });

  return { candidatesGenerated: candidates.length, actionsCreated: toInsert.length, actionsUpdated: toUpdate.length };
}
