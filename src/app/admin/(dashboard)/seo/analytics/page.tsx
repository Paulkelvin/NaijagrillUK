import type { Metadata } from "next";
import { getPrimarySiteId } from "@/lib/seo/site";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { loadAnalyticsSummary, DEFAULT_TREND_WINDOW_DAYS, type AnalyticsSummary } from "@/lib/seo/intelligence/analytics-summary";
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

interface PageData {
  summary: AnalyticsSummary;
  keywordText: Map<string, string>;
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
    return { data: { summary, keywordText }, error: null };
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
          </>
        )}
      </div>
    </main>
  );
}
