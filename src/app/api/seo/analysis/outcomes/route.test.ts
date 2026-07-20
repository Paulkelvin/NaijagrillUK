import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCronSecret = vi.fn();
const mockIsCronSecretConfigured = vi.fn();
const mockGetPrimarySiteId = vi.fn();
const mockMeasureActionOutcomes = vi.fn();

vi.mock("@/lib/seo/config", () => ({
  getCronSecret: () => mockGetCronSecret(),
  isCronSecretConfigured: () => mockIsCronSecretConfigured(),
}));
vi.mock("@/lib/seo/site", () => ({
  getPrimarySiteId: () => mockGetPrimarySiteId(),
}));
vi.mock("@/lib/seo/intelligence/action-outcomes", () => ({
  measureActionOutcomes: (...args: unknown[]) => mockMeasureActionOutcomes(...args),
}));
vi.mock("@/lib/seo/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("./route");

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/seo/analysis/outcomes", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsCronSecretConfigured.mockReturnValue(true);
  mockGetCronSecret.mockReturnValue("secret");
  mockGetPrimarySiteId.mockResolvedValue("site-1");
});

describe("GET /api/seo/analysis/outcomes", () => {
  it("returns 401 with no Authorization header", async () => {
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(mockMeasureActionOutcomes).not.toHaveBeenCalled();
  });

  it("returns 401 with the wrong secret", async () => {
    const res = await GET(request({ authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("delegates to measureActionOutcomes and returns its result on success", async () => {
    mockMeasureActionOutcomes.mockResolvedValue({ measured: 3, pending: 1 });

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, measured: 3, pending: 1 });
    expect(mockMeasureActionOutcomes).toHaveBeenCalledWith("site-1");
  });

  it("returns 500 with the error message when measureActionOutcomes throws", async () => {
    mockMeasureActionOutcomes.mockRejectedValue(new Error("Failed to fetch completed actions: boom"));

    const res = await GET(request({ authorization: "Bearer secret" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "Failed to fetch completed actions: boom" });
  });
});
