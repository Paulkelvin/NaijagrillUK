import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCronSecret, isCronSecretConfigured, isGscConfigured } from "@/lib/seo/config";
import { runBackfillChunk } from "@/lib/seo/gsc/backfill";
import { logger } from "@/lib/seo/logger";
import { getPrimarySiteId } from "@/lib/seo/site";

// Milestone 5b — manual, one-time (or resumed) operation. Deliberately NOT
// registered in vercel.json's crons block; the daily gsc sync route is the
// only one that runs on a schedule. Trigger by hand:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//     "https://<deployment>/api/seo/sync/gsc/backfill?startDate=2025-03-19&endDate=2026-07-16"
// then repeat with startDate=<nextStartDate from the response> until
// nextStartDate comes back null.
export const dynamic = "force-dynamic";
// Explicit, not left to the platform default -- see
// PHASE_1_IMPLEMENTATION.md Milestone 4 for the confirmed Hobby ceiling
// (300s is both this account's default AND its hard maximum; revisit if
// the plan ever changes).
export const maxDuration = 300;

/** 20s margin under Hobby's 300s hard ceiling, for response
 *  serialization/cold-start overhead outside the fetch/upsert loop itself. */
const TIME_BUDGET_MS = 280_000;

/** GSC's own retention window (ARCHITECTURE.md §4.1). */
const DEFAULT_BACKFILL_MONTHS = 16;

function isAuthorized(request: NextRequest): boolean {
  if (!isCronSecretConfigured()) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const provided = Buffer.from(authHeader.slice("Bearer ".length));
  const expected = Buffer.from(getCronSecret());
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

function defaultStartDate(): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - DEFAULT_BACKFILL_MONTHS);
  return d.toISOString().slice(0, 10);
}

function defaultEndDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 3); // GSC's 2-3 day data delay
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    logger.warn("cron_auth_rejected", { path: request.nextUrl.pathname });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGscConfigured()) {
    return NextResponse.json({ error: "GSC is not configured" }, { status: 503 });
  }

  const startDate = request.nextUrl.searchParams.get("startDate") ?? defaultStartDate();
  const endDate = request.nextUrl.searchParams.get("endDate") ?? defaultEndDate();

  try {
    const siteId = await getPrimarySiteId();
    const result = await runBackfillChunk(siteId, startDate, endDate, TIME_BUDGET_MS);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
