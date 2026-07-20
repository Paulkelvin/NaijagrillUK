import type { Metadata } from "next";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getPrimarySiteId } from "@/lib/seo/site";
import { ActionControls } from "@/components/admin/ActionControls";
import { fetchContentBriefs, type KeywordContentBrief } from "@/lib/seo/intelligence/content-brief";

export const metadata: Metadata = {
  title: "SEO Action Queue | NaijaGrill",
  robots: { index: false, follow: false },
};

// Always read fresh data; never cache the queue.
export const dynamic = "force-dynamic";

const OPEN_STATUSES = ["queued", "in_progress"] as const;

interface ActionRow {
  id: string;
  type: string;
  priority_score: number;
  status: string;
  title: string;
  description: string | null;
  source_module: string;
  effort: string | null;
  estimated_impact: string | null;
  created_at: string;
  keyword_id: string | null;
}

interface QueueResult {
  rows: ActionRow[];
  error: string | null;
  briefs: Map<string, KeywordContentBrief>;
}

// Real content-brief context per keyword-linked action — see
// content-brief.ts. Batched in one query (not per-card) since this
// project's real scale is a handful of open actions at a time.
async function loadOpenActions(): Promise<QueueResult> {
  try {
    const siteId = await getPrimarySiteId();
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("actions")
      .select("id, type, priority_score, status, title, description, source_module, effort, estimated_impact, created_at, keyword_id")
      .eq("site_id", siteId)
      .in("status", OPEN_STATUSES)
      .order("priority_score", { ascending: false });

    if (error) return { rows: [], error: error.message, briefs: new Map() };
    const rows = (data ?? []) as ActionRow[];
    const keywordIds = [...new Set(rows.map((r) => r.keyword_id).filter((id): id is string => id !== null))];
    const briefs = await fetchContentBriefs(supabase, keywordIds);
    return { rows, error: null, briefs };
  } catch (err) {
    return { rows: [], error: err instanceof Error ? err.message : String(err), briefs: new Map() };
  }
}

// The feedback-loop surface: did completing an action actually work? See
// src/lib/seo/intelligence/action-outcomes.ts for how baselineMetrics/
// outcome get written. Read-only — no schema migration was available in
// the build environment when this shipped, so outcome data lives in
// supporting_data rather than a dedicated column/index (documented in
// full in action-outcomes.ts). At this project's real scale (a handful of
// completed actions), fetching every completed action for the site and
// filtering in JS is simpler and just as fast as a JSONB path filter.
const RECENT_RESULTS_LIMIT = 10;
const RECENT_RESULTS_FETCH_LIMIT = 50;

interface MetricsSnapshot {
  window: "keyword" | "page";
  avgPosition?: number | null;
  clicks?: number;
  sessions?: number;
  conversionValue?: number;
}

interface OutcomeTracking {
  baselineMetrics: MetricsSnapshot;
  outcomeMetrics?: MetricsSnapshot;
  outcome?: "improved" | "unchanged" | "declined";
  outcomeMeasuredAt?: string;
}

interface CompletedActionRow {
  id: string;
  type: string;
  title: string;
  source_module: string;
  completed_at: string;
  supporting_data: { outcomeTracking?: OutcomeTracking } | null;
}

interface RecentResultsResult {
  rows: CompletedActionRow[];
  error: string | null;
}

async function loadRecentOutcomes(): Promise<RecentResultsResult> {
  try {
    const siteId = await getPrimarySiteId();
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("actions")
      .select("id, type, title, source_module, completed_at, supporting_data")
      .eq("site_id", siteId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(RECENT_RESULTS_FETCH_LIMIT);

    if (error) return { rows: [], error: error.message };
    const withOutcome = ((data ?? []) as CompletedActionRow[])
      .filter((row) => row.supporting_data?.outcomeTracking?.outcome)
      .slice(0, RECENT_RESULTS_LIMIT);
    return { rows: withOutcome, error: null };
  } catch (err) {
    return { rows: [], error: err instanceof Error ? err.message : String(err) };
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const TYPE_LABELS: Record<string, string> = {
  create_content: "Create content",
  update_content: "Update content",
  add_internal_link: "Add internal link",
  fix_cannibalization: "Fix cannibalization",
  fix_technical: "Fix technical issue",
  update_meta: "Update meta",
  add_schema: "Add schema",
};

const SOURCE_MODULE_LABELS: Record<string, string> = {
  keyword_intelligence: "Keyword opportunity",
  page_performance: "Page ROI",
  cannibalization: "Cannibalization",
  internal_linking: "Internal linking",
  competitor: "Competitor",
  content_brief: "Content brief",
  decay: "Content decay",
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs text-white/70">
      {children}
    </span>
  );
}

function ContentBriefSection({ brief }: { brief: KeywordContentBrief | undefined }) {
  if (!brief || brief.competitors.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-white/40">
        Who&apos;s ranking above you{brief.ownPosition != null ? ` (you: #${brief.ownPosition})` : ""} — real Google
        results as of {formatDate(brief.snapshotDate)}
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {brief.competitors.map((c) => (
          <li key={`${c.domain}-${c.position}`} className="flex items-start gap-2 text-sm text-white/70">
            <span className="mt-0.5 shrink-0 text-xs text-white/30">#{c.position}</span>
            <span className="min-w-0">
              <span className="truncate">{c.title ?? c.domain}</span>{" "}
              <span className="text-xs text-white/40">({c.domain})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionCard({ action, rank, brief }: { action: ActionRow; rank: number; brief: KeywordContentBrief | undefined }) {
  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-amber-300/90">#{rank}</span>
            <h2 className="text-base font-semibold text-white">{action.title}</h2>
          </div>
          {action.description && <p className="mt-1.5 text-sm text-white/60">{action.description}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{TYPE_LABELS[action.type] ?? action.type}</Badge>
            <Badge>{SOURCE_MODULE_LABELS[action.source_module] ?? action.source_module}</Badge>
            <Badge>Priority {action.priority_score.toFixed(0)}</Badge>
            {action.effort && <Badge>Effort: {action.effort}</Badge>}
            {action.estimated_impact && <Badge>{action.estimated_impact}</Badge>}
            {action.status === "in_progress" && <Badge>In progress</Badge>}
            <span className="self-center text-xs text-white/40">since {formatDate(action.created_at)}</span>
          </div>
          <ContentBriefSection brief={brief} />
        </div>
        <ActionControls actionId={action.id} status={action.status} />
      </div>
    </li>
  );
}

const OUTCOME_BADGE_CLASS: Record<string, string> = {
  improved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  declined: "border-red-400/30 bg-red-400/10 text-red-200",
  unchanged: "border-white/10 bg-white/[0.06] text-white/70",
};

const OUTCOME_LABEL: Record<string, string> = {
  improved: "Improved",
  declined: "Declined",
  unchanged: "No change",
};

function formatMetricsChange(baseline: MetricsSnapshot, current: MetricsSnapshot): string | null {
  if (baseline.window === "keyword" && current.window === "keyword") {
    const parts: string[] = [];
    if (baseline.avgPosition != null && current.avgPosition != null) {
      parts.push(`Position ${baseline.avgPosition.toFixed(1)} → ${current.avgPosition.toFixed(1)}`);
    }
    parts.push(`Clicks ${baseline.clicks ?? 0} → ${current.clicks ?? 0}`);
    return parts.join(" · ");
  }
  if (baseline.window === "page" && current.window === "page") {
    return `Sessions ${baseline.sessions ?? 0} → ${current.sessions ?? 0}`;
  }
  return null;
}

function formatCompletedDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function RecentResults({ rows, error }: RecentResultsResult) {
  if (error || rows.length === 0) return null; // quiet on error/empty — this section is a bonus, not core to the page

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Recent results</h2>
      <p className="mt-1 text-xs text-white/40">
        Did completing an action actually help? Measured {"~"}
        30 days after completion against real ranking/traffic data.
      </p>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => {
          const tracking = row.supporting_data?.outcomeTracking;
          if (!tracking?.outcome) return null;
          const change = tracking.outcomeMetrics ? formatMetricsChange(tracking.baselineMetrics, tracking.outcomeMetrics) : null;
          return (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-white/80">{row.title}</p>
                {change && <p className="mt-0.5 text-xs text-white/40">{change}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/30">{formatCompletedDate(row.completed_at)}</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${OUTCOME_BADGE_CLASS[tracking.outcome]}`}>
                  {OUTCOME_LABEL[tracking.outcome]}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default async function SeoActionQueuePage() {
  const [{ rows, error, briefs }, recentResults] = await Promise.all([loadOpenActions(), loadRecentOutcomes()]);

  return (
    <main className="min-h-screen bg-[#0f0c0a] px-5 py-12 text-white md:px-10 md:py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80">SEO Intelligence Platform</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Action Queue</h1>
          <p className="mt-2 text-sm text-white/50">
            {rows.length > 0
              ? `${rows.length} open action${rows.length === 1 ? "" : "s"}, ranked by priority.`
              : "What to do next, ranked by priority — currently empty."}
          </p>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-200">
            Could not load the action queue ({error}). If this is a fresh setup, make sure{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code> are configured.
          </div>
        )}

        {!error && rows.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/50">
            No open actions right now. The analysis engine runs daily at 07:00 UTC — check back after the next run, or
            after real ranking data has had time to accumulate.
          </div>
        )}

        {rows.length > 0 && (
          <ul className="space-y-4">
            {rows.map((action, index) => (
              <ActionCard key={action.id} action={action} rank={index + 1} brief={action.keyword_id ? briefs.get(action.keyword_id) : undefined} />
            ))}
          </ul>
        )}

        <RecentResults {...recentResults} />
      </div>
    </main>
  );
}
