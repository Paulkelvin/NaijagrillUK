import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCronSecret = vi.fn();
const mockIsCronSecretConfigured = vi.fn();
const mockIsDataForSeoConfigured = vi.fn();
const mockGetPrimarySiteId = vi.fn();
const mockDiscoverKeywords = vi.fn();

vi.mock("@/lib/seo/config", () => ({
  getCronSecret: () => mockGetCronSecret(),
  isCronSecretConfigured: () => mockIsCronSecretConfigured(),
  isDataForSeoConfigured: () => mockIsDataForSeoConfigured(),
}));
vi.mock("@/lib/seo/site", () => ({
  getPrimarySiteId: () => mockGetPrimarySiteId(),
}));
vi.mock("@/lib/seo/dataforseo/keyword-discovery", () => ({
  discoverKeywords: (...args: unknown[]) => mockDiscoverKeywords(...args),
}));
vi.mock("@/lib/seo/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("./route");

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/seo/sync/dataforseo/discover", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsCronSecretConfigured.mockReturnValue(true);
  mockGetCronSecret.mockReturnValue("secret");
  mockIsDataForSeoConfigured.mockReturnValue(true);
  mockGetPrimarySiteId.mockResolvedValue("site-1");
});

describe("GET /api/seo/sync/dataforseo/discover", () => {
  it("returns 401 with no Authorization header", async () => {
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(mockDiscoverKeywords).not.toHaveBeenCalled();
  });

  it("returns 401 with the wrong secret", async () => {
    const res = await GET(request({ authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 503 when DataForSEO is not configured", async () => {
    mockIsDataForSeoConfigured.mockReturnValue(false);
    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(503);
    expect(mockDiscoverKeywords).not.toHaveBeenCalled();
  });

  it("delegates to discoverKeywords and returns its result on success", async () => {
    mockDiscoverKeywords.mockResolvedValue({ skipped: false, seedsQueried: 8, candidatesFound: 14, keywordsInserted: 10, keywordsEnriched: 4, cost: 0.08 });

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, skipped: false, seedsQueried: 8, candidatesFound: 14, keywordsInserted: 10, keywordsEnriched: 4, cost: 0.08 });
    expect(mockDiscoverKeywords).toHaveBeenCalledWith("site-1");
  });

  it("returns 500 with the error message when discoverKeywords throws", async () => {
    mockDiscoverKeywords.mockRejectedValue(new Error("Failed to insert discovered keywords: boom"));

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "Failed to insert discovered keywords: boom" });
  });
});
