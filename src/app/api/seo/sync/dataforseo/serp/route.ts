import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCronSecret, isCronSecretConfigured, isDataForSeoConfigured } from "@/lib/seo/config";
import { syncSerpSnapshots } from "@/lib/seo/dataforseo/serp";
import { logger } from "@/lib/seo/logger";
import { getPrimarySiteId } from "@/lib/seo/site";

// Same auth pattern as every other cron-triggered route. ARCHITECTURE.md §7
// budgets this job at 10 minutes, which exceeds Vercel Hobby's confirmed
// 300s ceiling (Phase 1 Milestone 4) — resolved (confirmed with the user)
// by running this DAILY rather than weekly, each run time-budgeted to
// ~280s. The 7-day cache staleness check inside syncSerpSnapshots is what
// actually spreads the "top 100 keywords" refresh across several days;
// this route itself is a thin trigger, same shape as every other sync
// route.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** 20s margin under Hobby's 300s hard ceiling, matching the GSC backfill's
 *  own TIME_BUDGET_MS convention. */
const TIME_BUDGET_MS = 280_000;

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

  if (!isDataForSeoConfigured()) {
    return NextResponse.json({ error: "DataForSEO is not configured" }, { status: 503 });
  }

  try {
    const siteId = await getPrimarySiteId();
    const result = await syncSerpSnapshots(siteId, TIME_BUDGET_MS);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
