import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCronSecret = vi.fn();
const mockIsCronSecretConfigured = vi.fn();
const mockGetPrimarySiteId = vi.fn();
const mockRebuildCtrModel = vi.fn();

vi.mock("@/lib/seo/config", () => ({
  getCronSecret: () => mockGetCronSecret(),
  isCronSecretConfigured: () => mockIsCronSecretConfigured(),
}));
vi.mock("@/lib/seo/site", () => ({
  getPrimarySiteId: () => mockGetPrimarySiteId(),
}));
vi.mock("@/lib/seo/intelligence/ctr-model", () => ({
  rebuildCtrModel: (...args: unknown[]) => mockRebuildCtrModel(...args),
}));
vi.mock("@/lib/seo/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("./route");

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/seo/analysis/ctr-model", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsCronSecretConfigured.mockReturnValue(true);
  mockGetCronSecret.mockReturnValue("secret");
  mockGetPrimarySiteId.mockResolvedValue("site-1");
});

describe("GET /api/seo/analysis/ctr-model", () => {
  it("returns 401 with no Authorization header", async () => {
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(mockRebuildCtrModel).not.toHaveBeenCalled();
  });

  it("returns 401 with the wrong secret", async () => {
    const res = await GET(request({ authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("delegates to rebuildCtrModel and returns its result on success", async () => {
    mockRebuildCtrModel.mockResolvedValue({
      rebuilt: true,
      source: "site_data",
      sampleSize: 1500,
      positions: { "1": 0.3 },
    });

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      rebuilt: true,
      source: "site_data",
      sampleSize: 1500,
      positions: { "1": 0.3 },
    });
    expect(mockRebuildCtrModel).toHaveBeenCalledWith("site-1");
  });

  it("returns 500 with the error message when rebuildCtrModel throws", async () => {
    mockRebuildCtrModel.mockRejectedValue(new Error("Failed to update site_configs.ctr_model: boom"));

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "Failed to update site_configs.ctr_model: boom" });
  });
});
