import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCronSecret = vi.fn();
const mockIsCronSecretConfigured = vi.fn();
const mockIsGa4Configured = vi.fn();
const mockGetPrimarySiteId = vi.fn();
const mockSyncGa4 = vi.fn();

vi.mock("@/lib/seo/config", () => ({
  getCronSecret: () => mockGetCronSecret(),
  isCronSecretConfigured: () => mockIsCronSecretConfigured(),
  isGa4Configured: () => mockIsGa4Configured(),
}));
vi.mock("@/lib/seo/site", () => ({
  getPrimarySiteId: () => mockGetPrimarySiteId(),
}));
vi.mock("@/lib/seo/ga4/sync", () => ({
  syncGa4: (...args: unknown[]) => mockSyncGa4(...args),
}));
vi.mock("@/lib/seo/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("./route");

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/seo/sync/ga4", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/seo/sync/ga4", () => {
  it("returns 401 with no Authorization header", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("secret");

    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(mockSyncGa4).not.toHaveBeenCalled();
  });

  it("returns 401 with the wrong secret", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("secret");

    const res = await GET(request({ authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 503 when authorized but GA4 isn't configured", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("secret");
    mockIsGa4Configured.mockReturnValue(false);

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(503);
    expect(mockSyncGa4).not.toHaveBeenCalled();
  });

  it("delegates to syncGa4 and returns its result on success", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("secret");
    mockIsGa4Configured.mockReturnValue(true);
    mockGetPrimarySiteId.mockResolvedValue("site-1");
    mockSyncGa4.mockResolvedValue({ runId: 7, recordsProcessed: 42, rejectedCount: 1, newPageCount: 2 });

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, runId: 7, recordsProcessed: 42, rejectedCount: 1, newPageCount: 2 });
    expect(mockSyncGa4).toHaveBeenCalledWith("site-1");
  });

  it("returns 500 with the error message when syncGa4 throws", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("secret");
    mockIsGa4Configured.mockReturnValue(true);
    mockGetPrimarySiteId.mockResolvedValue("site-1");
    mockSyncGa4.mockRejectedValue(new Error("GA4 runReport failed (500)"));

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "GA4 runReport failed (500)" });
  });
});
