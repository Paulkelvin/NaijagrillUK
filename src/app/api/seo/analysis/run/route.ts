import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCronSecret, isCronSecretConfigured } from "@/lib/seo/config";
import { runAnalysis } from "@/lib/seo/intelligence/run-analysis";
import { logger } from "@/lib/seo/logger";
import { getPrimarySiteId } from "@/lib/seo/site";

// Same auth pattern as every other cron-triggered route. ARCHITECTURE.md
// §7: "Analysis engine | After any sync completes | Event-driven" —
// implemented as its own cron with a time offset (07:00 UTC, after GSC's
// 06:00 and GA4's 06:30), the same pattern already live for the CTR
// model rebuild, rather than an inline call chained onto gsc/sync.ts or
// ga4/sync.ts's own handlers (confirmed with the user — see
// run-analysis.ts's top-of-file comment). This route also doubles as the
// manual re-run endpoint per ARCHITECTURE.md §7's route list — the same
// Bearer-token auth covers both call sites, there's nothing that needs to
// distinguish "cron" from "manual".
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  if (!isCronSecretConfigured()) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const provided = Buffer.from(authHeader.slice("Bearer ".length));
  const expected = Buffer.from(getCronSecret());
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    logger.warn("cron_auth_rejected", { path: request.nextUrl.pathname });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const siteId = await getPrimarySiteId();
    const result = await runAnalysis(siteId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
