import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getPrimarySiteId } from "@/lib/seo/site";

// Authentication is enforced by src/middleware.ts (its matcher covers this
// exact path — ARCHITECTURE.md §7), not here — same boundary as /admin,
// deliberately not duplicated per-route.
export const dynamic = "force-dynamic";

const RECENT_WINDOW_DAYS = 7;

interface RecentLogRow {
  metadata: { retry_count?: unknown; warnings?: unknown } | null;
}

export async function GET() {
  try {
    const siteId = await getPrimarySiteId();
    const supabase = createSupabaseServiceRoleClient();
    const since = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const [syncStatusSummaryRes, staleDatasetsRes, syncFailuresRecentRes, recentLogsRes] = await Promise.all([
      supabase.from("sync_status_summary").select("*").eq("site_id", siteId),
      supabase.from("stale_datasets").select("*").eq("site_id", siteId),
      supabase.from("sync_failures_recent").select("*").eq("site_id", siteId),
      supabase.from("sync_log").select("metadata").eq("site_id", siteId).gte("started_at", since),
    ]);

    const results = [
      ["sync_status_summary", syncStatusSummaryRes],
      ["stale_datasets", staleDatasetsRes],
      ["sync_failures_recent", syncFailuresRecentRes],
      ["sync_log", recentLogsRes],
    ] as const;
    for (const [name, res] of results) {
      if (res.error) throw new Error(`Failed to query ${name}: ${res.error.message}`);
    }

    let totalRetries = 0;
    let totalWarnings = 0;
    for (const row of (recentLogsRes.data ?? []) as RecentLogRow[]) {
      const metadata = row.metadata ?? {};
      totalRetries += typeof metadata.retry_count === "number" ? metadata.retry_count : 0;
      totalWarnings += Array.isArray(metadata.warnings) ? metadata.warnings.length : 0;
    }

    return NextResponse.json({
      ok: true,
      syncStatusSummary: syncStatusSummaryRes.data ?? [],
      staleDatasets: staleDatasetsRes.data ?? [],
      syncFailuresRecent: syncFailuresRecentRes.data ?? [],
      recentWindow: { days: RECENT_WINDOW_DAYS, totalRetries, totalWarnings },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
