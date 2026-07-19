import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCronSecret, isCronSecretConfigured, isGscConfigured } from "@/lib/seo/config";
import { syncGsc } from "@/lib/seo/gsc/sync";
import { logger } from "@/lib/seo/logger";
import { getPrimarySiteId } from "@/lib/seo/site";

// Thin adapter over gsc/sync.ts — all real logic lives there and is
// unit-testable without an HTTP layer (ENGINEERING_STANDARDS.md §5). Auth
// pattern matches src/app/api/seo/sync/ping/route.ts exactly.
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

  if (!isGscConfigured()) {
    return NextResponse.json({ error: "GSC is not configured" }, { status: 503 });
  }

  try {
    const siteId = await getPrimarySiteId();
    const result = await syncGsc(siteId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
