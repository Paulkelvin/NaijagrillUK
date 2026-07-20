import type { Metadata } from "next";
import { getPrimarySiteId } from "@/lib/seo/site";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { loadAnalyticsSummary, DEFAULT_TREND_WINDOW_DAYS, type AnalyticsSummary } from "@/lib/seo/intelligence/analytics-summary";
import { suggestContentFormat } from "@/lib/seo/intelligence/content-format";
import { TrendChart } from "@/components/admin/TrendChart";

export const metadata: Metadata = {
  title: "SEO Analytics | NaijaGrill",
  robots: { index: false, follow: false },
};

// Always read fresh data; never cache.
export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadKeywordText(supabase: any, keywordIds: string[]): Promise<Map<string, string>> {
  if (keywordIds.length === 0) return new Map();
  const { data, error } = await supabase.from("keywords").select("id, keyword").in("id", keywordIds);
  if (error) throw new Error(`Failed to fetch keywords: ${error.message}`);
  return new Map(((data ?? []) as Array<{ id: string; keyword: string }>).map((k) => [k.id, k.keyword]));
}

interface DiscoveredKeywordRow {
  id: string;
  keyword: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  search_intent: string | null;
  hasAction: boolean;
}

// Every keyword real long-tail discovery (keyword-discovery.ts) has
// found — not just the ones that happened to clear Opportunity Score's
// bar for an action. Found via a real gap: after the first production
// discovery run, 12 of 15 discovered keywords (including the single
// highest-volume one, 9,900/mo) weren't visible anywhere in the admin
// UI, since only the 3 that became actions showed up in the queue.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadDiscoveredKeywords(supabase: any, siteId: string): Promise<DiscoveredKeywordRow[]> {
  const { data: keywords, error } = await supabase
    .from("keywords")
    .select("id, keyword, search_volume, keyword_difficulty, search_intent")
    .eq("site_id", siteId)
    .eq("data_source", "dataforseo")
    .order("search_volume", { ascending: false });
  if (error) throw new Error(`Failed to fetch discovered keywords: ${error.message}`);
  if (!keywords || keywords.length === 0) return [];

  const { data: actions, error: actionsError } = await supabase
    .from("actions")
    .select("keyword_id")
    .in(
      "keyword_id",
      keywords.map((k: { id: string }) => k.id),
    )
    .in("status", ["queued", "in_progress", "completed"]);
  if (actionsError) throw new Error(`Failed to fetch actions: ${actionsError.message}`);
  const keywordIdsWithAction = new Set((actions ?? []).map((a: { keyword_id: string }) => a.keyword_id));

  return (keywords as Array<Omit<DiscoveredKeywordRow, "hasAction">>).map((k) => ({ ...k, hasAction: keywordIdsWithAction.has(k.id) }));
}

interface PageData {
  summary: AnalyticsSummary;
  keywordText: Map<string, string>;
  discoveredKeywords: DiscoveredKeywordRow[];
}

async function loadPageData(): Promise<{ data: PageData | null; error: string | null }> {
  try {
    const siteId = await getPrimarySiteId();
    const supabase = createSupabaseServiceRoleClient();
    const summary = await loadAnalyticsSummary(siteId);
    const keywordText = await loadKeywordText(
      supabase,
      summary.topKeywords.map((k) => k.keywordId),
    );
    const discoveredKeywords = await loadDiscoveredKeywords(supabase, siteId);
    return { data: { summary, keywordText, discoveredKeywords }, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function formatPercent(value: number | null): string {
  return value != null ? `${(value * 100).toFixed(1)}%` : "—";
}

function formatPosition(value: number | null): string {
  return value != null ? value.toFixed(1) : "—";
}

const INTENT_LABEL: Record<string, string> = {
  transactional: "Transactional",
  commercial: "Commercial",
  informational: "Informational",
  navigational: "Navigational",
};

// A starting suggestion, not gospel — see content-format.ts. Semantic
// color coding (separate from the site's amber accent) so the format
// reads at a glance: warm amber for "build a real page" (highest
// commitment), cool blue for "write an article", neutral for "just an
// FAQ line", muted red for "use your own judgment here".
const FORMAT_BADGE_CLASS: Record<string, string> = {
  "Dedicated page": "border-amber-300/30 bg-amber-300/10 text-amber-200",
  Article: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  "FAQ answer": "border-white/10 bg-white/[0.06] text-white/60",
  "Review manually": "border-red-400/30 bg-red-400/10 text-red-200",
};

export default async function SeoAnalyticsPage() {
  const { data, error } = await loadPageData();

  return (
    <main className="min-h-screen bg-[#0f0c0a] px-5 py-12 text-white md:px-10 md:py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80">SEO Intelligence Platform</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Analytics</h1>
          <p className="mt-2 text-sm text-white/50">
            Real Google Search Console performance — last {DEFAULT_TREND_WINDOW_DAYS} days, aggregated across every
            page and keyword.
          </p>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-200">
            Could not load analytics ({error}).
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatTile label="Clicks" value={data.summary.totals.clicks.toLocaleString()} />
              <StatTile label="Impressions" value={data.summary.totals.impressions.toLocaleString()} />
              <StatTile label="Avg. CTR" value={formatPercent(data.summary.totals.ctr)} />
              <StatTile label="Avg. position" value={formatPosition(data.summary.totals.avgPosition)} />
            </div>

            {data.summary.daily.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
                <TrendChart
                  dates={data.summary.daily.map((d) => d.date)}
                  clicks={data.summary.daily.map((d) => d.clicks)}
                  impressions={data.summary.daily.map((d) => d.impressions)}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/50">
                No ranking data yet for this period — check back once GSC has synced a few days of real traffic.
              </div>
            )}

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Top queries</h2>
              {data.summary.topKeywords.length === 0 ? (
                <p className="mt-3 text-sm text-white/40">No query data yet for this period.</p>
              ) : (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                        <th className="px-4 py-3 font-medium">Query</th>
                        <th className="px-4 py-3 text-right font-medium">Clicks</th>
                        <th className="px-4 py-3 text-right font-medium">Impressions</th>
                        <th className="px-4 py-3 text-right font-medium">CTR</th>
                        <th className="px-4 py-3 text-right font-medium">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.summary.topKeywords.map((k) => (
                        <tr key={k.keywordId} className="border-b border-white/5 last:border-0">
                          <td className="max-w-xs truncate px-4 py-3 text-white/80">{data.keywordText.get(k.keywordId) ?? "(unknown keyword)"}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-white/70">{k.clicks.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-white/70">{k.impressions.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-white/70">{formatPercent(k.ctr)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-white/70">{formatPosition(k.avgPosition)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Discovered keywords</h2>
              <p className="mt-1 text-xs text-white/40">
                Real long-tail keywords found around your niche, not just ones already in the action queue.
                &ldquo;Suggested format&rdquo; is a starting point based on intent and volume, not a strict rule.
              </p>
              {data.discoveredKeywords.length === 0 ? (
                <p className="mt-3 text-sm text-white/40">
                  No discovered keywords yet — the discovery job runs on the 1st of each month.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                        <th className="px-4 py-3 font-medium">Keyword</th>
                        <th className="px-4 py-3 text-right font-medium">Volume/mo</th>
                        <th className="px-4 py-3 text-right font-medium">Difficulty</th>
                        <th className="px-4 py-3 font-medium">Intent</th>
                        <th className="px-4 py-3 font-medium">Suggested format</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.discoveredKeywords.map((k) => {
                        const format = suggestContentFormat(k.search_intent, k.search_volume);
                        return (
                          <tr key={k.id} className="border-b border-white/5 last:border-0">
                            <td className="max-w-[16rem] truncate px-4 py-3 text-white/80">{k.keyword}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-white/70">{k.search_volume?.toLocaleString() ?? "—"}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-white/70">{k.keyword_difficulty ?? "—"}</td>
                            <td className="px-4 py-3 text-white/70">{k.search_intent ? (INTENT_LABEL[k.search_intent] ?? k.search_intent) : "—"}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${FORMAT_BADGE_CLASS[format]}`}>{format}</span>
                            </td>
                            <td className="px-4 py-3">
                              {k.hasAction ? (
                                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 text-xs text-amber-200">In queue</span>
                              ) : (
                                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs text-white/50">Not actioned</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
