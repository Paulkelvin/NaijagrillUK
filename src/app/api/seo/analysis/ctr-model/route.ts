import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCronSecret, isCronSecretConfigured } from "@/lib/seo/config";
import { rebuildCtrModel } from "@/lib/seo/intelligence/ctr-model";
import { logger } from "@/lib/seo/logger";
import { getPrimarySiteId } from "@/lib/seo/site";

// Same auth pattern as every other cron-triggered route. ARCHITECTURE.md
// §7: "CTR model rebuild | Cron | Weekly after GSC sync" — scheduled
// Monday 06:15 UTC in vercel.json, 15 minutes after GSC's daily 06:00 UTC
// slot (a reasoned default: no exact time is specified beyond "after GSC
// sync", chosen to give that day's sync a comfortable buffer to finish).
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

  try {
    const siteId = await getPrimarySiteId();
    const result = await rebuildCtrModel(siteId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
