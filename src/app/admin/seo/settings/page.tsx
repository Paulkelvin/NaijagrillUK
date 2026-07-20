import type { Metadata } from "next";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getPrimarySiteId } from "@/lib/seo/site";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata: Metadata = {
  title: "SEO Settings | NaijaGrill",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface SiteConfigRow {
  scoring_weights: Record<string, Record<string, number>> | null;
  conversion_events: Array<{ name: string; value: number }> | null;
}

interface LoadResult {
  data: SiteConfigRow | null;
  error: string | null;
}

async function loadSiteConfig(): Promise<LoadResult> {
  try {
    const siteId = await getPrimarySiteId();
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("site_configs")
      .select("scoring_weights, conversion_events")
      .eq("site_id", siteId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as SiteConfigRow, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function SeoSettingsPage() {
  const { data, error } = await loadSiteConfig();

  return (
    <main className="min-h-screen bg-[#0f0c0a] px-5 py-12 text-white md:px-10 md:py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80">SEO Intelligence Platform</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Settings</h1>
          <p className="mt-2 text-sm text-white/50">
            Scoring weights and conversion event values — used by every Phase 2 algorithm. Each module&apos;s weights
            must sum to 1.0.
          </p>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-200">
            Could not load site settings ({error}).
          </div>
        )}

        {!error && data && (
          <SettingsForm
            initialScoringWeights={data.scoring_weights ?? {}}
            initialConversionEvents={data.conversion_events ?? []}
          />
        )}
      </div>
    </main>
  );
}
