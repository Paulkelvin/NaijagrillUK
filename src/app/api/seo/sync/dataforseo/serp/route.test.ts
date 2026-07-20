import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCronSecret = vi.fn();
const mockIsCronSecretConfigured = vi.fn();
const mockIsDataForSeoConfigured = vi.fn();
const mockGetPrimarySiteId = vi.fn();
const mockSyncSerpSnapshots = vi.fn();

vi.mock("@/lib/seo/config", () => ({
  getCronSecret: () => mockGetCronSecret(),
  isCronSecretConfigured: () => mockIsCronSecretConfigured(),
  isDataForSeoConfigured: () => mockIsDataForSeoConfigured(),
}));
vi.mock("@/lib/seo/site", () => ({
  getPrimarySiteId: () => mockGetPrimarySiteId(),
}));
vi.mock("@/lib/seo/dataforseo/serp", () => ({
  syncSerpSnapshots: (...args: unknown[]) => mockSyncSerpSnapshots(...args),
}));
vi.mock("@/lib/seo/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("./route");

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/seo/sync/dataforseo/serp", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsCronSecretConfigured.mockReturnValue(true);
  mockGetCronSecret.mockReturnValue("secret");
  mockIsDataForSeoConfigured.mockReturnValue(true);
  mockGetPrimarySiteId.mockResolvedValue("site-1");
});

describe("GET /api/seo/sync/dataforseo/serp", () => {
  it("returns 401 with no Authorization header", async () => {
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(mockSyncSerpSnapshots).not.toHaveBeenCalled();
  });

  it("returns 401 with the wrong secret", async () => {
    const res = await GET(request({ authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 503 when DataForSEO is not configured", async () => {
    mockIsDataForSeoConfigured.mockReturnValue(false);
    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(503);
    expect(mockSyncSerpSnapshots).not.toHaveBeenCalled();
  });

  it("delegates to syncSerpSnapshots with the 280s time budget and returns its result", async () => {
    mockSyncSerpSnapshots.mockResolvedValue({
      keywordsEligible: 20,
      keywordsSynced: 20,
      keywordsRemaining: 0,
      snapshotsWritten: 140,
      budgetExceeded: false,
      cost: 0.7,
    });

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, keywordsEligible: 20, keywordsSynced: 20, keywordsRemaining: 0, snapshotsWritten: 140, budgetExceeded: false, cost: 0.7 });
    expect(mockSyncSerpSnapshots).toHaveBeenCalledWith("site-1", 280_000);
  });

  it("returns 500 with the error message when syncSerpSnapshots throws", async () => {
    mockSyncSerpSnapshots.mockRejectedValue(new Error("Failed to load site: boom"));

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "Failed to load site: boom" });
  });
});
