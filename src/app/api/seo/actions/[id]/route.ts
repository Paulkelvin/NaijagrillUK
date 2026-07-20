import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { captureActionMetrics } from "@/lib/seo/intelligence/action-outcomes";

// Authentication is enforced by src/proxy.ts (its matcher covers this
// exact path — ARCHITECTURE.md §7), not here — same boundary as /admin and
// /api/seo/status, deliberately not duplicated per-route.
export const dynamic = "force-dynamic";

const VALID_STATUSES = ["queued", "in_progress", "completed", "skipped", "dismissed"] as const;
type ActionStatus = (typeof VALID_STATUSES)[number];
// Mirrors the actions_completed_at_consistency_check DB constraint
// (Milestone 0): a terminal status requires completed_at set, a
// non-terminal one requires it null. Set on every write, not just
// forward transitions, so this stays correct even if a status is ever
// reverted from a terminal state back to queued/in_progress.
const TERMINAL_STATUSES: readonly ActionStatus[] = ["completed", "skipped", "dismissed"];

function isValidStatus(value: unknown): value is ActionStatus {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const status = (body as { status?: unknown } | null)?.status;
  if (!isValidStatus(status)) {
    return NextResponse.json({ ok: false, error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServiceRoleClient();
    const completedAt = TERMINAL_STATUSES.includes(status) ? new Date().toISOString() : null;
    const updates: Record<string, unknown> = { status, completed_at: completedAt };

    // Only "completed" gets outcome-tracked (see action-outcomes.ts) — a
    // skipped/dismissed action was never acted on, so there's nothing to
    // measure the effect of. Captured only on the transition INTO
    // completed, not on every PATCH that happens to already be completed
    // (e.g. a duplicate request), so re-marking an already-completed
    // action never overwrites a real baseline with a stale one.
    if (status === "completed") {
      const { data: existing, error: fetchError } = await supabase
        .from("actions")
        .select("status, keyword_id, page_id")
        .eq("id", id)
        .maybeSingle();
      if (fetchError) throw new Error(fetchError.message);

      if (existing && existing.status !== "completed") {
        const baselineMetrics = await captureActionMetrics(supabase, { keywordId: existing.keyword_id, pageId: existing.page_id });
        if (baselineMetrics) {
          updates.baseline_metrics = baselineMetrics;
        }
      }
    }

    const { data, error } = await supabase
      .from("actions")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json({ ok: false, error: "Action not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, action: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
