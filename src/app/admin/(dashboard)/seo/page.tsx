import type { Metadata } from "next";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getPrimarySiteId } from "@/lib/seo/site";
import { ActionControls } from "@/components/admin/ActionControls";

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
}

interface QueueResult {
  rows: ActionRow[];
  error: string | null;
}

async function loadOpenActions(): Promise<QueueResult> {
  try {
    const siteId = await getPrimarySiteId();
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("actions")
      .select("id, type, priority_score, status, title, description, source_module, effort, estimated_impact, created_at")
      .eq("site_id", siteId)
      .in("status", OPEN_STATUSES)
      .order("priority_score", { ascending: false });

    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []) as ActionRow[], error: null };
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

function ActionCard({ action, rank }: { action: ActionRow; rank: number }) {
  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
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
        </div>
        <ActionControls actionId={action.id} status={action.status} />
      </div>
    </li>
  );
}

export default async function SeoActionQueuePage() {
  const { rows, error } = await loadOpenActions();

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
              <ActionCard key={action.id} action={action} rank={index + 1} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
