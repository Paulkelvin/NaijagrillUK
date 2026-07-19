import { generateKeyPairSync, createVerify } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetGscConfig = vi.fn();
vi.mock("@/lib/seo/config", () => ({
  getGscConfig: () => mockGetGscConfig(),
}));

const { createSignedJwt, fetchAccessToken, fetchSearchAnalytics, GscAuthError } = await import("./client");

function base64urlDecode(segment: string): Buffer {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/").padEnd(segment.length + ((4 - (segment.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
}

// Real RSA key pair, generated fresh for this test file only — never
// committed or reused. Lets us verify the JWT signature is actually
// cryptographically correct, not just "looks like a JWT".
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  mockGetGscConfig.mockReturnValue({
    clientEmail: "seo-platform@test-project.iam.gserviceaccount.com",
    privateKey,
    propertyUrl: "https://www.naijagrillandspice.co.uk",
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
    expect(claims.scope).toBe("https://www.googleapis.com/auth/webmasters.readonly");
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
    await expect(fetchAccessToken()).rejects.toThrow(/GSC token exchange failed \(400\)/);
  });
});

function tokenResponse() {
  return { ok: true, json: async () => ({ access_token: "tok", token_type: "Bearer", expires_in: 3600 }) };
}

function gscRow(query: string, page: string, overrides: Partial<Record<string, number>> = {}) {
  return {
    keys: [query, page],
    clicks: overrides.clicks ?? 1,
    impressions: overrides.impressions ?? 10,
    ctr: overrides.ctr ?? 0.1,
    position: overrides.position ?? 5,
  };
}

describe("fetchSearchAnalytics", () => {
  it("returns all rows for a single-page response", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ rows: [gscRow("jollof rice", "https://www.naijagrillandspice.co.uk/menu")] }) });

    const { rows } = await fetchSearchAnalytics("2026-07-01");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({ query: "jollof rice", page: "https://www.naijagrillandspice.co.uk/menu", clicks: 1, impressions: 10, ctr: 0.1, position: 5 });
  });

  it("paginates when a page returns exactly the row limit", async () => {
    const fullPage = Array.from({ length: 25000 }, (_, i) => gscRow(`kw${i}`, "https://x.com/p"));
    const partialPage = [gscRow("last one", "https://x.com/p")];

    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ rows: fullPage }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ rows: partialPage }) });

    const { rows } = await fetchSearchAnalytics("2026-07-01");
    expect(rows).toHaveLength(25001);

    // second page request used startRow=25000
    const secondCallBody = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(secondCallBody.startRow).toBe(25000);
  });

  it("retries on a 429 and succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: false, status: 429, headers: new Headers(), text: async () => "rate limited" })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ rows: [gscRow("q", "https://x.com/p")] }) });

    const { rows } = await fetchSearchAnalytics("2026-07-01");
    expect(rows).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3); // token + 429 + retry success
  }, 15000);

  it("retries on a 5xx and succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => "unavailable" })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ rows: [] }) });

    const { rows } = await fetchSearchAnalytics("2026-07-01");
    expect(rows).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  }, 15000);

  it("does not retry a plain 400 — fails immediately", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: false, status: 400, text: async () => "bad request" });

    await expect(fetchSearchAnalytics("2026-07-01")).rejects.toThrow(/GSC query failed \(400\)/);
    expect(fetchMock).toHaveBeenCalledTimes(2); // token + one failed attempt, no retries
  });

  it("re-authenticates once on a 401 and succeeds with the fresh token", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse()) // initial token
      .mockResolvedValueOnce({ ok: false, status: 401, text: async () => "expired" }) // first attempt fails
      .mockResolvedValueOnce(tokenResponse()) // re-auth
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ rows: [gscRow("q", "https://x.com/p")] }) }); // retry succeeds

    const { rows } = await fetchSearchAnalytics("2026-07-01");
    expect(rows).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("fails fast after a second consecutive auth failure — does not retry indefinitely", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: false, status: 401, text: async () => "expired" })
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: false, status: 403, text: async () => "still bad" });

    await expect(fetchSearchAnalytics("2026-07-01")).rejects.toThrow(GscAuthError);
    expect(fetchMock).toHaveBeenCalledTimes(4); // exactly one re-auth attempt, then fail
  });

  it("retries on a network error (fetch throws)", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ rows: [] }) });

    const { rows } = await fetchSearchAnalytics("2026-07-01");
    expect(rows).toEqual([]);
  }, 15000);
});
