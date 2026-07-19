import { syncGsc } from "./sync";

export interface BackfillResult {
  datesProcessed: string[];
  datesFailed: string[];
  /** null means the whole [startDate, endDate] range is done. Otherwise,
   *  call again with this as startDate to continue where this chunk left off. */
  nextStartDate: string | null;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** ISO YYYY-MM-DD strings compare correctly with plain string comparison. */
function isAfter(a: string, b: string): boolean {
  return a > b;
}

/**
 * Milestone 5b: processes one day at a time, oldest first, from startDate
 * through endDate, until either the range is exhausted or timeBudgetMs is
 * spent — then returns where it left off so the same caller (the backfill
 * route) can be invoked again to continue. This is the chunking strategy
 * for fitting a 16-month backfill inside Hobby's 300s/request ceiling
 * (PHASE_1_IMPLEMENTATION.md Milestone 4's confirmed finding).
 *
 * Safe to interrupt and resume freely — every day's sync is independently
 * idempotent (syncGsc's upserts). One failing day is recorded (via that
 * day's own sync_log row, status="failed") and skipped rather than
 * aborting the whole backfill — 15 months of good history shouldn't be
 * blocked by one bad day.
 */
export async function runBackfillChunk(
  siteId: string,
  startDate: string,
  endDate: string,
  timeBudgetMs: number,
): Promise<BackfillResult> {
  const startedAt = Date.now();
  const datesProcessed: string[] = [];
  const datesFailed: string[] = [];

  let currentDate = startDate;
  while (!isAfter(currentDate, endDate)) {
    if (Date.now() - startedAt >= timeBudgetMs) {
      return { datesProcessed, datesFailed, nextStartDate: currentDate };
    }

    try {
      await syncGsc(siteId, currentDate, { isBackfill: true });
      datesProcessed.push(currentDate);
    } catch {
      // syncGsc already recorded the failure in that day's own sync_log
      // row (status="failed", error_message set) -- nothing more to do
      // here besides tracking it and moving on.
      datesFailed.push(currentDate);
    }

    currentDate = addDays(currentDate, 1);
  }

  return { datesProcessed, datesFailed, nextStartDate: null };
}
