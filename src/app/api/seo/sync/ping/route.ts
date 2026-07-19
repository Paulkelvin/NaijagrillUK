import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCronSecret, isCronSecretConfigured } from "@/lib/seo/config";
import { logger } from "@/lib/seo/logger";
import { getPrimarySiteId } from "@/lib/seo/site";
import { completeSyncRun, startSyncRun } from "@/lib/seo/sync-log";

// Infrastructure smoke test (Milestone 4) — proves cron -> auth -> job ->
// sync_log end to end before any real GSC/GA4 integration exists.
//
// Vercel Cron always triggers via GET and, when a CRON_SECRET env var is
// set on the project, automatically sends it as `Authorization: Bearer
// <CRON_SECRET>` — confirmed against Vercel's current documentation during
// this milestone (this corrects ARCHITECTURE.md's original sketch, which
// assumed a custom x-cron-secret header Vercel does not actually send; see
// ARCHITECTURE.md §7 "Authentication" for the corrected reference).
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  if (!isCronSecretConfigured()) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const provided = Buffer.from(authHeader.slice("Bearer ".length));
  const expected = Buffer.from(getCronSecret());
  // timingSafeEqual throws on length mismatch rather than returning false.
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    logger.warn("cron_auth_rejected", { path: request.nextUrl.pathname });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let runId: number;
  try {
    const siteId = await getPrimarySiteId();
    runId = await startSyncRun(siteId, "ping", "smoke-test");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("ping_start_failed", { error: message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await completeSyncRun(runId, { status: "completed", recordsProcessed: 0 });
    return NextResponse.json({ ok: true, runId });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    try {
      await completeSyncRun(runId, { status: "failed", errorMessage });
    } catch {
      // sync_log itself is unreachable — nothing more to do here. The row
      // (if it exists) stays "started"; Milestone 7's stale-run detection
      // is the designed catch-all for exactly this case.
    }
    return NextResponse.json({ ok: false, error: errorMessage, runId }, { status: 500 });
  }
}
