import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { logger } from "@/lib/seo/logger";

// ARCHITECTURE.md §5.4 Site-Specific CTR Model. Pure GSC data — no
// DataForSEO dependency, buildable and testable against real production
// data from day one (PHASE_2_IMPLEMENTATION.md's Sequencing Decision).

const LOOKBACK_DAYS = 90;
const MIN_IMPRESSIONS_PER_BUCKET = 50;
const MIN_TOTAL_CLICKS = 1000;
const MAX_POSITION_BUCKET = 20;
const FETCH_PAGE_SIZE = 1000;

/**
 * ARCHITECTURE.md §5.4's own industry-default table, byte-identical to the
 * seed value Milestone 1 wrote into site_configs.ctr_model. Duplicated
 * here (not read back from the DB) so this module has a definite fallback
 * even if a future migration ever changes the seed default — the model
 * rebuild's fallback behavior shouldn't depend on what happened to be
 * seeded once, only on ARCHITECTURE.md's documented defaults.
 */
export const INDUSTRY_DEFAULT_POSITIONS: Readonly<Record<string, number>> = Object.freeze({
  "1": 0.28, "2": 0.15, "3": 0.11, "4": 0.08, "5": 0.06,
  "6": 0.045, "7": 0.04, "8": 0.035, "9": 0.03, "10": 0.025,
  "11": 0.015, "12": 0.012, "13": 0.01, "14": 0.008, "15": 0.007,
  "16": 0.006, "17": 0.005, "18": 0.005, "19": 0.004, "20": 0.004,
});

interface MetricRow {
  position: number | null;
  impressions: number;
  clicks: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchRecentMetrics(supabase: any, siteId: string, sinceDate: string): Promise<MetricRow[]> {
  const rows: MetricRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("keyword_page_metrics")
      .select("position, impressions, clicks")
      .eq("site_id", siteId)
      .gte("date", sinceDate)
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch keyword_page_metrics: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }
  return rows;
}

/**
 * Buckets rows by rounded position (ARCHITECTURE.md's documented CTR
 * position-bucketing rule: "round fractional positions to nearest
 * integer") and computes Σclicks/Σimpressions per bucket. Rows with no
 * position, or a rounded position outside 1-20 (the model only covers
 * that range), are excluded from bucketing but still count toward
 * totalClicks for the minimum-data gate.
 */
export function computeCtrBuckets(rows: MetricRow[]): { positions: Record<string, number>; totalClicks: number } {
  const totalClicks = rows.reduce((sum, r) => sum + r.clicks, 0);

  const buckets = new Map<number, { clicks: number; impressions: number }>();
  for (const row of rows) {
    if (row.position === null) continue;
    const bucket = Math.round(row.position);
    if (bucket < 1 || bucket > MAX_POSITION_BUCKET) continue;
    const existing = buckets.get(bucket) ?? { clicks: 0, impressions: 0 };
    existing.clicks += row.clicks;
    existing.impressions += row.impressions;
    buckets.set(bucket, existing);
  }

  const positions: Record<string, number> = {};
  for (let pos = 1; pos <= MAX_POSITION_BUCKET; pos++) {
    const bucket = buckets.get(pos);
    positions[String(pos)] =
      bucket && bucket.impressions >= MIN_IMPRESSIONS_PER_BUCKET
        ? bucket.clicks / bucket.impressions
        : INDUSTRY_DEFAULT_POSITIONS[String(pos)];
  }

  return { positions, totalClicks };
}

export interface CtrModelResult {
  rebuilt: boolean;
  source: "site_data" | "industry_default";
  sampleSize: number;
  positions: Record<string, number>;
}

/**
 * Rebuilds site_configs.ctr_model from the last 90 days of real GSC data.
 * Below MIN_TOTAL_CLICKS total clicks, the rebuild is skipped entirely —
 * site_configs.ctr_model is left untouched (still whatever it was, whether
 * that's the Milestone 1 industry-default seed or a previous real model)
 * rather than being overwritten with a noisy partial result computed from
 * too little data.
 */
export async function rebuildCtrModel(siteId: string): Promise<CtrModelResult> {
  const supabase = createSupabaseServiceRoleClient();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - LOOKBACK_DAYS);
  const sinceDate = since.toISOString().slice(0, 10);

  const rows = await fetchRecentMetrics(supabase, siteId, sinceDate);
  const { positions, totalClicks } = computeCtrBuckets(rows);

  if (totalClicks < MIN_TOTAL_CLICKS) {
    logger.info("ctr_model_rebuild_skipped", { siteId, totalClicks, minRequired: MIN_TOTAL_CLICKS });
    return { rebuilt: false, source: "industry_default", sampleSize: totalClicks, positions: { ...INDUSTRY_DEFAULT_POSITIONS } };
  }

  const ctrModel = { source: "site_data" as const, positions, sample_size: totalClicks };

  const { error } = await supabase.from("site_configs").update({ ctr_model: ctrModel }).eq("site_id", siteId);
  if (error) throw new Error(`Failed to update site_configs.ctr_model: ${error.message}`);

  logger.info("ctr_model_rebuilt", { siteId, sampleSize: totalClicks });
  return { rebuilt: true, source: "site_data", sampleSize: totalClicks, positions };
}
