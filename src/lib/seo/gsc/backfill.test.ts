import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSyncGsc = vi.fn();
vi.mock("./sync", () => ({
  syncGsc: (...args: unknown[]) => mockSyncGsc(...args),
}));

const { runBackfillChunk } = await import("./backfill");

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runBackfillChunk", () => {
  it("processes every day in the range and reports nextStartDate: null when done", async () => {
    mockSyncGsc.mockResolvedValue(undefined);

    const result = await runBackfillChunk("site-1", "2026-07-01", "2026-07-03", 60_000);

    expect(result.datesProcessed).toEqual(["2026-07-01", "2026-07-02", "2026-07-03"]);
    expect(result.datesFailed).toEqual([]);
    expect(result.nextStartDate).toBeNull();
    expect(mockSyncGsc).toHaveBeenCalledTimes(3);
  });

  it("passes isBackfill: true through to syncGsc", async () => {
    mockSyncGsc.mockResolvedValue(undefined);
    await runBackfillChunk("site-1", "2026-07-01", "2026-07-01", 60_000);
    expect(mockSyncGsc).toHaveBeenCalledWith("site-1", "2026-07-01", { isBackfill: true });
  });

  it("handles a single-day range", async () => {
    mockSyncGsc.mockResolvedValue(undefined);
    const result = await runBackfillChunk("site-1", "2026-07-01", "2026-07-01", 60_000);
    expect(result.datesProcessed).toEqual(["2026-07-01"]);
    expect(result.nextStartDate).toBeNull();
  });

  it("records a failed day and continues rather than aborting the whole backfill", async () => {
    mockSyncGsc
      .mockResolvedValueOnce(undefined) // day 1 ok
      .mockRejectedValueOnce(new Error("GSC query failed (500)")) // day 2 fails
      .mockResolvedValueOnce(undefined); // day 3 ok

    const result = await runBackfillChunk("site-1", "2026-07-01", "2026-07-03", 60_000);

    expect(result.datesProcessed).toEqual(["2026-07-01", "2026-07-03"]);
    expect(result.datesFailed).toEqual(["2026-07-02"]);
    expect(result.nextStartDate).toBeNull();
    expect(mockSyncGsc).toHaveBeenCalledTimes(3);
  });

  it("stops early and returns nextStartDate when the time budget is exhausted", async () => {
    let now = 0;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    // Each syncGsc call "takes" 100ms of simulated time.
    mockSyncGsc.mockImplementation(async () => {
      now += 100;
    });

    // Budget only allows 2 days worth of work (200ms) before the check
    // trips on the 3rd iteration.
    const result = await runBackfillChunk("site-1", "2026-07-01", "2026-07-10", 200);

    expect(result.datesProcessed).toEqual(["2026-07-01", "2026-07-02"]);
    expect(result.nextStartDate).toBe("2026-07-03");
  });

  it("a resumed chunk starting from nextStartDate picks up exactly where the previous one stopped", async () => {
    mockSyncGsc.mockResolvedValue(undefined);
    const result = await runBackfillChunk("site-1", "2026-07-03", "2026-07-05", 60_000);
    expect(result.datesProcessed).toEqual(["2026-07-03", "2026-07-04", "2026-07-05"]);
  });
});
