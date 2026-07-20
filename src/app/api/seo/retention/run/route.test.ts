import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCronSecret = vi.fn();
const mockIsCronSecretConfigured = vi.fn();
const mockGetPrimarySiteId = vi.fn();
const mockRunRetention = vi.fn();

vi.mock("@/lib/seo/config", () => ({
  getCronSecret: () => mockGetCronSecret(),
  isCronSecretConfigured: () => mockIsCronSecretConfigured(),
}));
vi.mock("@/lib/seo/site", () => ({
  getPrimarySiteId: () => mockGetPrimarySiteId(),
}));
vi.mock("@/lib/seo/retention/run", () => ({
  runRetention: (...args: unknown[]) => mockRunRetention(...args),
}));
vi.mock("@/lib/seo/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("./route");

function request(searchParams: Record<string, string> = {}, headers: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/seo/retention/run");
  for (const [k, v] of Object.entries(searchParams)) url.searchParams.set(k, v);
  return new NextRequest(url, { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsCronSecretConfigured.mockReturnValue(true);
  mockGetCronSecret.mockReturnValue("secret");
  mockGetPrimarySiteId.mockResolvedValue("site-1");
});

describe("GET /api/seo/retention/run", () => {
  it("returns 401 without the correct secret", async () => {
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(mockRunRetention).not.toHaveBeenCalled();
  });

  it("defaults to a real (non-dry) run when dryRun is omitted", async () => {
    mockRunRetention.mockResolvedValue({ dryRun: false, keywordPageMetrics: {}, pageMetrics: {}, syncLog: {} });

    await GET(request({}, { authorization: "Bearer secret" }));
    expect(mockRunRetention).toHaveBeenCalledWith("site-1", { dryRun: false });
  });

  it("passes dryRun: true through only for the exact string 'true'", async () => {
    mockRunRetention.mockResolvedValue({ dryRun: true, keywordPageMetrics: {}, pageMetrics: {}, syncLog: {} });

    await GET(request({ dryRun: "true" }, { authorization: "Bearer secret" }));
    expect(mockRunRetention).toHaveBeenCalledWith("site-1", { dryRun: true });
  });

  it("treats any other dryRun value as a real run, not just 'false'", async () => {
    mockRunRetention.mockResolvedValue({ dryRun: false, keywordPageMetrics: {}, pageMetrics: {}, syncLog: {} });

    await GET(request({ dryRun: "yes" }, { authorization: "Bearer secret" }));
    expect(mockRunRetention).toHaveBeenCalledWith("site-1", { dryRun: false });
  });

  it("returns the result payload on success", async () => {
    const result = {
      dryRun: false,
      keywordPageMetrics: { rowsAggregated: 10, weeksWritten: 2, rowsDeleted: 10 },
      pageMetrics: { rowsAggregated: 5, weeksWritten: 1, rowsDeleted: 5 },
      syncLog: { rowsDeleted: 3 },
    };
    mockRunRetention.mockResolvedValue(result);

    const res = await GET(request({}, { authorization: "Bearer secret" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, ...result });
  });

  it("returns 500 with the error message when runRetention throws", async () => {
    mockRunRetention.mockRejectedValue(new Error("Failed to upsert keyword_page_metrics_weekly: constraint violation"));

    const res = await GET(request({}, { authorization: "Bearer secret" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "Failed to upsert keyword_page_metrics_weekly: constraint violation" });
  });
});
