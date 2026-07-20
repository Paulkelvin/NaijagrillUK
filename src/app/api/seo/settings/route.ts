import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getPrimarySiteId } from "@/lib/seo/site";

// Authentication is enforced by src/proxy.ts (its matcher covers this
// exact path — ARCHITECTURE.md §7), not here — same boundary as /admin and
// /api/seo/status.
export const dynamic = "force-dynamic";

// site_configs.scoring_weights must sum to 1.0 per module for its 0-100
// scoring formulas to mean what their own documentation says (ARCHITECTURE.md
// §5.1/§5.2/§5.3 each compute "(component * weight + ...) * 100" assuming
// the weights are a full partition of 1.0). A small tolerance absorbs
// realistic floating-point input (e.g. three weights of 0.333...).
const WEIGHT_SUM_TOLERANCE = 0.01;

function weightModuleSchema(moduleName: string) {
  return z
    .record(z.string(), z.number().min(0, `${moduleName} weights must be >= 0`))
    .refine((weights) => Object.keys(weights).length > 0, { message: `${moduleName} must have at least one weight` })
    .refine(
      (weights) => Math.abs(Object.values(weights).reduce((sum, v) => sum + v, 0) - 1) <= WEIGHT_SUM_TOLERANCE,
      { message: `${moduleName} weights must sum to 1.0 (within ${WEIGHT_SUM_TOLERANCE})` },
    );
}

// Every key site_configs.scoring_weights actually uses (Milestone 0's seed
// default + Milestone 10's page_roi blend) — mirrors config.ts's
// Zod-schema-first discipline (validate a known shape, don't accept
// arbitrary JSON into a column every scoring module trusts).
const scoringWeightsSchema = z
  .object({
    opportunity: weightModuleSchema("opportunity").optional(),
    page_roi: weightModuleSchema("page_roi").optional(),
    cannibalization: weightModuleSchema("cannibalization").optional(),
    internal_link: weightModuleSchema("internal_link").optional(),
  })
  .strict();

const conversionEventSchema = z.object({
  name: z.string().min(1, "Conversion event name is required"),
  value: z.number().gt(0, "Conversion event value must be greater than 0"),
});

const settingsUpdateSchema = z
  .object({
    scoring_weights: scoringWeightsSchema.optional(),
    conversion_events: z.array(conversionEventSchema).optional(),
  })
  .refine((data) => data.scoring_weights !== undefined || data.conversion_events !== undefined, {
    message: "Provide at least one of scoring_weights or conversion_events",
  });

function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ");
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = settingsUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ ok: false, error: formatIssues(result.error) }, { status: 400 });
  }

  try {
    const siteId = await getPrimarySiteId();
    const supabase = createSupabaseServiceRoleClient();

    // scoring_weights is a per-module partial update — merge shallowly over
    // the existing value rather than replacing the whole JSONB column, so
    // submitting one module's weights doesn't wipe the other three.
    const updates: Record<string, unknown> = {};
    if (result.data.scoring_weights) {
      // maybeSingle(), not single() — a missing row is a legitimate,
      // already-handled outcome (see the 404 below, matching the same
      // "site_configs row not found" response the update path already
      // returns when conversion_events-only requests hit a missing row).
      // single() would instead throw a PostgREST "no rows" error here,
      // producing an inconsistent 500 for the exact same underlying
      // condition depending on which field happened to be in the request.
      const { data: existing, error: fetchError } = await supabase
        .from("site_configs")
        .select("scoring_weights")
        .eq("site_id", siteId)
        .maybeSingle();
      if (fetchError) throw new Error(`Failed to load existing scoring_weights: ${fetchError.message}`);
      if (!existing) {
        return NextResponse.json({ ok: false, error: "site_configs row not found" }, { status: 404 });
      }
      updates.scoring_weights = { ...(existing.scoring_weights ?? {}), ...result.data.scoring_weights };
    }
    if (result.data.conversion_events) {
      updates.conversion_events = result.data.conversion_events;
    }

    const { data, error } = await supabase
      .from("site_configs")
      .update(updates)
      .eq("site_id", siteId)
      .select("scoring_weights, conversion_events")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json({ ok: false, error: "site_configs row not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
