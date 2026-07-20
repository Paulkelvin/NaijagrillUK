import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCronSecret, isCronSecretConfigured } from "@/lib/seo/config";
import { logger } from "@/lib/seo/logger";
import { runRetention } from "@/lib/seo/retention/run";
import { getPrimarySiteId } from "@/lib/seo/site";

// Same auth pattern as every other /api/seo/sync/* cron route. Budgeted 5
// minutes (ARCHITECTURE.md's roadmap table) — explicit maxDuration matches
// Hobby's confirmed 300s ceiling (Milestone 4), same precedent as the GSC
// backfill route.
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

/**
 * `?dryRun=true` computes and returns the same result shape without
 * writing or deleting anything — see run.ts's own doc comment for why this
 * is mandatory before the first real pass. Any value other than exactly
 * "true" is treated as a real run, matching how every other boolean query
 * param on this project behaves (explicit opt-in to the safe mode, not the
 * destructive one, on ambiguous input would be the wrong default here —
 * accidentally *skipping* a real run is far cheaper than accidentally
 * *not* skipping one).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    logger.warn("cron_auth_rejected", { path: request.nextUrl.pathname });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";

  try {
    const siteId = await getPrimarySiteId();
    const result = await runRetention(siteId, { dryRun });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
