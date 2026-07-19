import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

/**
 * Resolves the one site this Phase 1 deployment operates on. ARCHITECTURE.md:
 * "Build for one, design for many" (ADR-003) — the schema is multi-site-ready
 * but Phase 1 targets exactly one. Throws if zero or more than one site
 * exists, since Phase 1 code has no way to disambiguate which site a sync
 * job is for — this is a deliberate Phase 1 simplification, not a hidden
 * assumption; revisit when multi-site sync jobs are actually built (Phase 4).
 */
export async function getPrimarySiteId(): Promise<string> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.from("sites").select("id");

  if (error) {
    throw new Error(`Failed to resolve primary site: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error("No site exists — seed one before running sync jobs.");
  }
  if (data.length > 1) {
    throw new Error(
      `Multiple sites exist (${data.length}) — getPrimarySiteId() is a Phase 1 single-site assumption and cannot resolve which one to use. This needs the Phase 4 multi-site sync design.`,
    );
  }

  return data[0].id as string;
}
