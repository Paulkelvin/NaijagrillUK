import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCronSecret, isCronSecretConfigured, isGa4Configured } from "@/lib/seo/config";
import { syncGa4 } from "@/lib/seo/ga4/sync";
import { logger } from "@/lib/seo/logger";
import { getPrimarySiteId } from "@/lib/seo/site";

// Thin adapter over ga4/sync.ts — same pattern as
// src/app/api/seo/sync/gsc/route.ts and src/app/api/seo/sync/ping/route.ts.
export const dynamic = "force-dynamic";

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

  if (!isGa4Configured()) {
    return NextResponse.json({ error: "GA4 is not configured" }, { status: 503 });
  }

  try {
    const siteId = await getPrimarySiteId();
    const result = await syncGa4(siteId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
