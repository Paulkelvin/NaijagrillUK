import { generateKeyPairSync, createVerify } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetGa4Config = vi.fn();
vi.mock("@/lib/seo/config", () => ({
  getGa4Config: () => mockGetGa4Config(),
}));

const { createSignedJwt, fetchAccessToken, fetchPageMetrics, fetchConversionBreakdown, Ga4AuthError } = await import(
  "./client"
);

function base64urlDecode(segment: string): Buffer {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/").padEnd(segment.length + ((4 - (segment.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
}

// Real RSA key pair, generated fresh for this test file only — never
// committed or reused. Lets us verify the JWT signature is actually
// cryptographically correct, not just "looks like a JWT" (same rationale as
// gsc/client.test.ts).
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  mockGetGa4Config.mockReturnValue({
    clientEmail: "seo-platform@test-project.iam.gserviceaccount.com",
    privateKey,
    propertyId: "123456789",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("createSignedJwt", () => {
  it("produces a JWT with a header, claim set, and a signature verifiable against the public key", () => {
    const nowSec = 1700000000;
    const jwt = createSignedJwt("seo-platform@test-project.iam.gserviceaccount.com", privateKey, nowSec);
    const [headerPart, claimPart, signaturePart] = jwt.split(".");

    const header = JSON.parse(base64urlDecode(headerPart).toString());
    expect(header).toEqual({ alg: "RS256", typ: "JWT" });

    const claims = JSON.parse(base64urlDecode(claimPart).toString());
    expect(claims.iss).toBe("seo-platform@test-project.iam.gserviceaccount.com");
    expect(claims.scope).toBe("https://www.googleapis.com/auth/analytics.readonly");
    expect(claims.aud).toBe("https://oauth2.googleapis.com/token");
    expect(claims.iat).toBe(nowSec);
    expect(claims.exp).toBe(nowSec + 3600);

    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${headerPart}.${claimPart}`);
    verifier.end();
    const isValid = verifier.verify(publicKey, base64urlDecode(signaturePart));
    expect(isValid).toBe(true);
  });
});

describe("fetchAccessToken", () => {
  it("exchanges the signed JWT for an access token", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "test-access-token", token_type: "Bearer", expires_in: 3600 }),
    });

    const token = await fetchAccessToken();
    expect(token).toBe("test-access-token");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://oauth2.googleapis.com/token",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws a clear error when the token exchange fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => "invalid_grant" });
    await expect(fetchAccessToken()).rejects.toThrow(/GA4 token exchange failed \(400\)/);
  });
});

function tokenResponse() {
  return { ok: true, json: async () => ({ access_token: "tok", token_type: "Bearer", expires_in: 3600 }) };
}

function ga4Row(dimensionValues: string[], metricValues: string[]) {
  return {
    dimensionValues: dimensionValues.map((value) => ({ value })),
    metricValues: metricValues.map((value) => ({ value })),
  };
}

function pageMetricRow(pagePath: string, overrides: Partial<Record<string, string>> = {}) {
  return ga4Row(
    [pagePath],
    [
      overrides.sessions ?? "10",
      overrides.engagedSessions ?? "6",
      overrides.bounceRate ?? "0.25",
      overrides.avgSessionDuration ?? "42.5",
      overrides.keyEvents ?? "1",
      overrides.purchaseRevenue ?? "0",
    ],
  );
}

describe("fetchPageMetrics", () => {
  it("returns all rows for a single-page response, requesting keyEvents not conversions", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ rows: [pageMetricRow("/menu")], rowCount: 1 }) });

    const { rows } = await fetchPageMetrics("2026-07-01");
    expect(rows).toEqual([
      {
        pagePath: "/menu",
        sessions: 10,
        engagedSessions: 6,
        bounceRate: 0.25,
        avgSessionDuration: 42.5,
        conversions: 1,
        purchaseRevenue: 0,
      },
    ]);

    const requestBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(requestBody.metrics).toContainEqual({ name: "keyEvents" });
    expect(requestBody.metrics).not.toContainEqual({ name: "conversions" });
  });

  it("treats an empty metric value string as null, not 0", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ rows: [pageMetricRow("/menu", { bounceRate: "", avgSessionDuration: "" })], rowCount: 1 }),
      });

    const { rows } = await fetchPageMetrics("2026-07-01");
    expect(rows[0].bounceRate).toBeNull();
    expect(rows[0].avgSessionDuration).toBeNull();
  });

  it("paginates using rowCount to know when to stop", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ rows: [pageMetricRow("/a"), pageMetricRow("/b"), pageMetricRow("/c")], rowCount: 5 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ rows: [pageMetricRow("/d"), pageMetricRow("/e")], rowCount: 5 }),
      });

    const { rows } = await fetchPageMetrics("2026-07-01");
    expect(rows).toHaveLength(5);
    expect(fetchMock).toHaveBeenCalledTimes(3); // token + 2 report pages

    const secondPageBody = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(secondPageBody.offset).toBe("3");
  });

  it("retries on a 429 and succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: false, status: 429, headers: new Headers(), text: async () => "rate limited" })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ rows: [], rowCount: 0 }) });

    const { rows } = await fetchPageMetrics("2026-07-01");
    expect(rows).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  }, 15000);

  it("retries on a 5xx and succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => "unavailable" })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ rows: [], rowCount: 0 }) });

    const { rows } = await fetchPageMetrics("2026-07-01");
    expect(rows).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  }, 15000);

  it("does not retry a plain 400 — fails immediately", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: false, status: 400, text: async () => "bad request" });

    await expect(fetchPageMetrics("2026-07-01")).rejects.toThrow(/GA4 runReport failed \(400\)/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("re-authenticates once on a 401 and succeeds with the fresh token", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: false, status: 401, text: async () => "expired" })
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ rows: [pageMetricRow("/menu")], rowCount: 1 }) });

    const { rows } = await fetchPageMetrics("2026-07-01");
    expect(rows).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("fails fast after a second consecutive auth failure — does not retry indefinitely", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: false, status: 401, text: async () => "expired" })
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: false, status: 403, text: async () => "still bad" });

    await expect(fetchPageMetrics("2026-07-01")).rejects.toThrow(Ga4AuthError);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("retries on a network error (fetch throws)", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ rows: [], rowCount: 0 }) });

    const { rows } = await fetchPageMetrics("2026-07-01");
    expect(rows).toEqual([]);
  }, 15000);
});

describe("fetchConversionBreakdown", () => {
  it("skips the network call entirely when no events are configured", async () => {
    const { rows } = await fetchConversionBreakdown("2026-07-01", []);
    expect(rows).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("filters to exactly the configured event names via an inListFilter", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ rows: [ga4Row(["/contact", "whatsapp_click"], ["3"])], rowCount: 1 }),
      });

    const { rows } = await fetchConversionBreakdown("2026-07-01", ["whatsapp_click", "phone_click"]);
    expect(rows).toEqual([{ pagePath: "/contact", eventName: "whatsapp_click", eventCount: 3 }]);

    const requestBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(requestBody.dimensionFilter).toEqual({
      filter: { fieldName: "eventName", inListFilter: { values: ["whatsapp_click", "phone_click"] } },
    });
  });
});
