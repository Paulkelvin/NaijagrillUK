import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCronSecret = vi.fn();
const mockIsCronSecretConfigured = vi.fn();
const mockIsDataForSeoConfigured = vi.fn();
const mockGetPrimarySiteId = vi.fn();
const mockSyncSearchVolume = vi.fn();

vi.mock("@/lib/seo/config", () => ({
  getCronSecret: () => mockGetCronSecret(),
  isCronSecretConfigured: () => mockIsCronSecretConfigured(),
  isDataForSeoConfigured: () => mockIsDataForSeoConfigured(),
}));
vi.mock("@/lib/seo/site", () => ({
  getPrimarySiteId: () => mockGetPrimarySiteId(),
}));
vi.mock("@/lib/seo/dataforseo/search-volume", () => ({
  syncSearchVolume: (...args: unknown[]) => mockSyncSearchVolume(...args),
}));
vi.mock("@/lib/seo/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("./route");

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/seo/sync/dataforseo", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsCronSecretConfigured.mockReturnValue(true);
  mockGetCronSecret.mockReturnValue("secret");
  mockIsDataForSeoConfigured.mockReturnValue(true);
  mockGetPrimarySiteId.mockResolvedValue("site-1");
});

describe("GET /api/seo/sync/dataforseo", () => {
  it("returns 401 with no Authorization header", async () => {
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(mockSyncSearchVolume).not.toHaveBeenCalled();
  });

  it("returns 401 with the wrong secret", async () => {
    const res = await GET(request({ authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 503 when DataForSEO is not configured", async () => {
    mockIsDataForSeoConfigured.mockReturnValue(false);
    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(503);
    expect(mockSyncSearchVolume).not.toHaveBeenCalled();
  });

  it("delegates to syncSearchVolume and returns its result on success", async () => {
    mockSyncSearchVolume.mockResolvedValue({ skipped: false, keywordsChecked: 12, keywordsUpdated: 12, cost: 0.001 });

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, skipped: false, keywordsChecked: 12, keywordsUpdated: 12, cost: 0.001 });
    expect(mockSyncSearchVolume).toHaveBeenCalledWith("site-1");
  });

  it("returns 500 with the error message when syncSearchVolume throws", async () => {
    mockSyncSearchVolume.mockRejectedValue(new Error("DataForSEO search volume task failed: Invalid Field."));

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "DataForSEO search volume task failed: Invalid Field." });
  });
});
