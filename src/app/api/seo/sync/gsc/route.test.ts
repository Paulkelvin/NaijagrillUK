import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCronSecret = vi.fn();
const mockIsCronSecretConfigured = vi.fn();
const mockIsGscConfigured = vi.fn();
const mockGetPrimarySiteId = vi.fn();
const mockSyncGsc = vi.fn();

vi.mock("@/lib/seo/config", () => ({
  getCronSecret: () => mockGetCronSecret(),
  isCronSecretConfigured: () => mockIsCronSecretConfigured(),
  isGscConfigured: () => mockIsGscConfigured(),
}));
vi.mock("@/lib/seo/site", () => ({
  getPrimarySiteId: () => mockGetPrimarySiteId(),
}));
vi.mock("@/lib/seo/gsc/sync", () => ({
  syncGsc: (...args: unknown[]) => mockSyncGsc(...args),
}));
vi.mock("@/lib/seo/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("./route");

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/seo/sync/gsc", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/seo/sync/gsc", () => {
  it("returns 401 with no Authorization header", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("secret");

    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(mockSyncGsc).not.toHaveBeenCalled();
  });

  it("returns 401 with the wrong secret", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("secret");

    const res = await GET(request({ authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 503 when authorized but GSC isn't configured", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("secret");
    mockIsGscConfigured.mockReturnValue(false);

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(503);
    expect(mockSyncGsc).not.toHaveBeenCalled();
  });

  it("delegates to syncGsc and returns its result on success", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("secret");
    mockIsGscConfigured.mockReturnValue(true);
    mockGetPrimarySiteId.mockResolvedValue("site-1");
    mockSyncGsc.mockResolvedValue({ runId: 7, recordsProcessed: 42, rejectedCount: 1 });

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, runId: 7, recordsProcessed: 42, rejectedCount: 1 });
    expect(mockSyncGsc).toHaveBeenCalledWith("site-1");
  });

  it("returns 500 with the error message when syncGsc throws", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("secret");
    mockIsGscConfigured.mockReturnValue(true);
    mockGetPrimarySiteId.mockResolvedValue("site-1");
    mockSyncGsc.mockRejectedValue(new Error("GSC query failed (500)"));

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "GSC query failed (500)" });
  });
});
