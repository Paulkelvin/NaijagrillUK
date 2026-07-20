import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCronSecret, isCronSecretConfigured, isDataForSeoConfigured } from "@/lib/seo/config";
import { syncSearchVolume } from "@/lib/seo/dataforseo/search-volume";
import { logger } from "@/lib/seo/logger";
import { getPrimarySiteId } from "@/lib/seo/site";

// Same auth pattern as every other cron-triggered route. ARCHITECTURE.md §7
// Background Jobs: "DataForSEO volume refresh | Cron | 1st of month | 2 min"
// — comfortably under Vercel Hobby's 300s ceiling, no chunking needed
// (unlike Milestone 6's SERP snapshots, which will need it).
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

  if (!isDataForSeoConfigured()) {
    return NextResponse.json({ error: "DataForSEO is not configured" }, { status: 503 });
  }

  try {
    const siteId = await getPrimarySiteId();
    const result = await syncSearchVolume(siteId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
