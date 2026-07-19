import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCronSecret = vi.fn();
const mockIsCronSecretConfigured = vi.fn();
const mockIsGscConfigured = vi.fn();
const mockGetPrimarySiteId = vi.fn();
const mockRunBackfillChunk = vi.fn();

vi.mock("@/lib/seo/config", () => ({
  getCronSecret: () => mockGetCronSecret(),
  isCronSecretConfigured: () => mockIsCronSecretConfigured(),
  isGscConfigured: () => mockIsGscConfigured(),
}));
vi.mock("@/lib/seo/site", () => ({
  getPrimarySiteId: () => mockGetPrimarySiteId(),
}));
vi.mock("@/lib/seo/gsc/backfill", () => ({
  runBackfillChunk: (...args: unknown[]) => mockRunBackfillChunk(...args),
}));
vi.mock("@/lib/seo/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("./route");

function request(searchParams: Record<string, string> = {}, headers: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/seo/sync/gsc/backfill");
  for (const [k, v] of Object.entries(searchParams)) url.searchParams.set(k, v);
  return new NextRequest(url, { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsCronSecretConfigured.mockReturnValue(true);
  mockGetCronSecret.mockReturnValue("secret");
  mockIsGscConfigured.mockReturnValue(true);
  mockGetPrimarySiteId.mockResolvedValue("site-1");
});

describe("GET /api/seo/sync/gsc/backfill", () => {
  it("returns 401 without the correct secret", async () => {
    const res = await GET(request({}, {}));
    expect(res.status).toBe(401);
    expect(mockRunBackfillChunk).not.toHaveBeenCalled();
  });

  it("returns 503 when GSC isn't configured", async () => {
    mockIsGscConfigured.mockReturnValue(false);
    const res = await GET(request({}, { authorization: "Bearer secret" }));
    expect(res.status).toBe(503);
  });

  it("passes explicit startDate/endDate query params through", async () => {
    mockRunBackfillChunk.mockResolvedValue({ datesProcessed: ["2026-07-01"], datesFailed: [], nextStartDate: null });

    const res = await GET(
      request({ startDate: "2026-07-01", endDate: "2026-07-01" }, { authorization: "Bearer secret" }),
    );

    expect(res.status).toBe(200);
    expect(mockRunBackfillChunk).toHaveBeenCalledWith("site-1", "2026-07-01", "2026-07-01", 280_000);
  });

  it("defaults startDate to ~16 months ago and endDate to 3 days ago when omitted", async () => {
    mockRunBackfillChunk.mockResolvedValue({ datesProcessed: [], datesFailed: [], nextStartDate: null });

    await GET(request({}, { authorization: "Bearer secret" }));

    const [, startDate, endDate] = mockRunBackfillChunk.mock.calls[0];
    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(startDate < endDate).toBe(true);
  });

  it("returns the chunk result including nextStartDate for resuming", async () => {
    mockRunBackfillChunk.mockResolvedValue({
      datesProcessed: ["2026-01-01", "2026-01-02"],
      datesFailed: [],
      nextStartDate: "2026-01-03",
    });

    const res = await GET(request({}, { authorization: "Bearer secret" }));
    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      datesProcessed: ["2026-01-01", "2026-01-02"],
      datesFailed: [],
      nextStartDate: "2026-01-03",
    });
  });

  it("returns 500 when runBackfillChunk throws", async () => {
    mockRunBackfillChunk.mockRejectedValue(new Error("no site exists"));
    const res = await GET(request({}, { authorization: "Bearer secret" }));
    expect(res.status).toBe(500);
  });
});
