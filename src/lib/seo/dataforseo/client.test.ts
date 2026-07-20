import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetDataForSeoConfig = vi.fn();
vi.mock("@/lib/seo/config", () => ({
  getDataForSeoConfig: () => mockGetDataForSeoConfig(),
}));

const { callDataForSeoApi, DataForSeoAuthError } = await import("./client");

let fetchMock: ReturnType<typeof vi.fn>;

function envelope(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    status_code: 20000,
    status_message: "Ok.",
    cost: 0.05,
    tasks_count: 1,
    tasks_error: 0,
    tasks: [{ id: "task-1", status_code: 20000, status_message: "Ok.", cost: 0.05, result: [{ ok: true }] }],
    ...overrides,
  };
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  mockGetDataForSeoConfig.mockReturnValue({ login: "owner@naijagrillandspice.co.uk", password: "test-password" });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("callDataForSeoApi", () => {
  it("sends a base64-encoded Basic Auth header built from login:password", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => envelope() });

    await callDataForSeoApi("/v3/keywords_data/google_ads/search_volume/live", [{ keywords: ["jollof rice"] }]);

    const expected = `Basic ${Buffer.from("owner@naijagrillandspice.co.uk:test-password").toString("base64")}`;
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: expected, "Content-Type": "application/json" }),
        body: JSON.stringify([{ keywords: ["jollof rice"] }]),
      }),
    );
  });

  it("returns the parsed envelope on a successful call", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => envelope() });

    const result = await callDataForSeoApi("/v3/some/endpoint/live", [{}]);
    expect(result.status_code).toBe(20000);
    expect(result.tasks?.[0].result).toEqual([{ ok: true }]);
  });

  it("throws DataForSeoAuthError on 401 without retrying", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, headers: new Headers(), text: async () => "unauthorized" });

    await expect(callDataForSeoApi("/v3/some/endpoint/live", [{}])).rejects.toThrow(DataForSeoAuthError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws DataForSeoAuthError on 403 without retrying", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, headers: new Headers(), text: async () => "forbidden" });

    await expect(callDataForSeoApi("/v3/some/endpoint/live", [{}])).rejects.toThrow(DataForSeoAuthError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries on 429, honoring Retry-After, then succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 429, headers: new Headers({ "retry-after": "0" }), text: async () => "rate limited" })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => envelope() });

    const result = await callDataForSeoApi("/v3/some/endpoint/live", [{}]);
    expect(result.status_code).toBe(20000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries on a 5xx server error, then succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 503, headers: new Headers(), text: async () => "unavailable" })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => envelope() });

    const result = await callDataForSeoApi("/v3/some/endpoint/live", [{}]);
    expect(result.status_code).toBe(20000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries on a network error, then succeeds", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNRESET")).mockResolvedValueOnce({ ok: true, status: 200, json: async () => envelope() });

    const result = await callDataForSeoApi("/v3/some/endpoint/live", [{}]);
    expect(result.status_code).toBe(20000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws a plain (non-retryable) error for a 4xx that isn't 401/403/429", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, headers: new Headers(), text: async () => "bad request" });

    await expect(callDataForSeoApi("/v3/some/endpoint/live", [{}])).rejects.toThrow(/DataForSEO request failed \(400\)/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when the response's top-level status_code is outside the 20000-29999 success range, even with HTTP 200", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => envelope({ status_code: 40501, status_message: "Invalid Field." }),
    });

    await expect(callDataForSeoApi("/v3/some/endpoint/live", [{}])).rejects.toThrow(/DataForSEO API error 40501/);
  });
});
