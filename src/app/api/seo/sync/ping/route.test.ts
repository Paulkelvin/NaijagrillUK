import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCronSecret = vi.fn();
const mockIsCronSecretConfigured = vi.fn();
const mockGetPrimarySiteId = vi.fn();
const mockStartSyncRun = vi.fn();
const mockCompleteSyncRun = vi.fn();

vi.mock("@/lib/seo/config", () => ({
  getCronSecret: () => mockGetCronSecret(),
  isCronSecretConfigured: () => mockIsCronSecretConfigured(),
}));
vi.mock("@/lib/seo/site", () => ({
  getPrimarySiteId: () => mockGetPrimarySiteId(),
}));
vi.mock("@/lib/seo/sync-log", () => ({
  startSyncRun: (...args: unknown[]) => mockStartSyncRun(...args),
  completeSyncRun: (...args: unknown[]) => mockCompleteSyncRun(...args),
}));
vi.mock("@/lib/seo/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { GET } = await import("./route");

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/seo/sync/ping", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/seo/sync/ping", () => {
  it("returns 401 with no Authorization header", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("correct-secret");

    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(mockStartSyncRun).not.toHaveBeenCalled();
  });

  it("returns 401 with the wrong secret", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("correct-secret");

    const res = await GET(request({ authorization: "Bearer wrong-secret" }));
    expect(res.status).toBe(401);
    expect(mockStartSyncRun).not.toHaveBeenCalled();
  });

  it("returns 401 when CRON_SECRET isn't configured at all, even with a header present", async () => {
    mockIsCronSecretConfigured.mockReturnValue(false);

    const res = await GET(request({ authorization: "Bearer anything" }));
    expect(res.status).toBe(401);
    expect(mockGetCronSecret).not.toHaveBeenCalled();
  });

  it("rejects a header without the Bearer prefix", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("correct-secret");

    const res = await GET(request({ authorization: "correct-secret" }));
    expect(res.status).toBe(401);
  });

  it("returns 200 and completes the sync run with the correct secret", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("correct-secret");
    mockGetPrimarySiteId.mockResolvedValue("site-1");
    mockStartSyncRun.mockResolvedValue(42);
    mockCompleteSyncRun.mockResolvedValue(undefined);

    const promise = GET(request({ authorization: "Bearer correct-secret" }));
    await vi.advanceTimersByTimeAsync(1000);
    const res = await promise;

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, runId: 42 });
    expect(mockStartSyncRun).toHaveBeenCalledWith("site-1", "ping", "smoke-test");
    expect(mockCompleteSyncRun).toHaveBeenCalledWith(42, { status: "completed", recordsProcessed: 0 });
  });

  it("marks the run failed if the post-start work throws", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("correct-secret");
    mockGetPrimarySiteId.mockResolvedValue("site-1");
    mockStartSyncRun.mockResolvedValue(7);
    mockCompleteSyncRun
      .mockRejectedValueOnce(new Error("db unreachable"))
      .mockResolvedValueOnce(undefined);

    const promise = GET(request({ authorization: "Bearer correct-secret" }));
    await vi.advanceTimersByTimeAsync(1000);
    const res = await promise;

    expect(res.status).toBe(500);
    expect(mockCompleteSyncRun).toHaveBeenNthCalledWith(2, 7, {
      status: "failed",
      errorMessage: "db unreachable",
    });
  });

  it("returns 500 without calling completeSyncRun if startSyncRun itself throws", async () => {
    mockIsCronSecretConfigured.mockReturnValue(true);
    mockGetCronSecret.mockReturnValue("correct-secret");
    mockGetPrimarySiteId.mockResolvedValue("site-1");
    mockStartSyncRun.mockRejectedValue(new Error("insert failed"));

    const res = await GET(request({ authorization: "Bearer correct-secret" }));
    expect(res.status).toBe(500);
    expect(mockCompleteSyncRun).not.toHaveBeenCalled();
  });
});
