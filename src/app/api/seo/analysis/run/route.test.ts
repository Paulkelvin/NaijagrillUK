import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCronSecret = vi.fn();
const mockIsCronSecretConfigured = vi.fn();
const mockGetPrimarySiteId = vi.fn();
const mockRunAnalysis = vi.fn();

vi.mock("@/lib/seo/config", () => ({
  getCronSecret: () => mockGetCronSecret(),
  isCronSecretConfigured: () => mockIsCronSecretConfigured(),
}));
vi.mock("@/lib/seo/site", () => ({
  getPrimarySiteId: () => mockGetPrimarySiteId(),
}));
vi.mock("@/lib/seo/intelligence/run-analysis", () => ({
  runAnalysis: (...args: unknown[]) => mockRunAnalysis(...args),
}));
vi.mock("@/lib/seo/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("./route");

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/seo/analysis/run", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsCronSecretConfigured.mockReturnValue(true);
  mockGetCronSecret.mockReturnValue("secret");
  mockGetPrimarySiteId.mockResolvedValue("site-1");
});

describe("GET /api/seo/analysis/run", () => {
  it("returns 401 with no Authorization header", async () => {
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(mockRunAnalysis).not.toHaveBeenCalled();
  });

  it("returns 401 with the wrong secret", async () => {
    const res = await GET(request({ authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("delegates to runAnalysis and returns its result on success", async () => {
    mockRunAnalysis.mockResolvedValue({ candidatesGenerated: 5, actionsCreated: 3, actionsUpdated: 2 });

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, candidatesGenerated: 5, actionsCreated: 3, actionsUpdated: 2 });
    expect(mockRunAnalysis).toHaveBeenCalledWith("site-1");
  });

  it("returns 500 with the error message when runAnalysis throws", async () => {
    mockRunAnalysis.mockRejectedValue(new Error("Failed to load site_configs: boom"));

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "Failed to load site_configs: boom" });
  });
});
