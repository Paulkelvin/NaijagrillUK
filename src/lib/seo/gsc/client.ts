import { createSign } from "node:crypto";
import { getGscConfig } from "@/lib/seo/config";
import { RetryableError, withRetry } from "@/lib/seo/retry";

// Direct HTTP calls, no SDK (ARCHITECTURE.md's Technology Stack: "No SDK
// dependencies where avoidable") — hand-rolled JWT bearer flow
// (RFC 7523 / Google's service-account OAuth2 flow, verified against
// Google's current docs during Milestone 5, not assumed from training data).

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const ROW_LIMIT = 25000;

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Builds and signs the JWT assertion for Google's service-account OAuth2
 * flow. Exported directly for testing — verifying the signature is
 * cryptographically correct doesn't require any network access.
 */
export function createSignedJwt(clientEmail: string, privateKey: string, nowSec = Math.floor(Date.now() / 1000)): string {
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: nowSec,
    exp: nowSec + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claimSet))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = base64url(signer.sign(privateKey));
  return `${unsigned}.${signature}`;
}

interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/** Thrown on 401/403 — callers get exactly one re-auth-and-retry attempt,
 *  then must fail fast (ENGINEERING_STANDARDS.md §6). Distinct from
 *  RetryableError: a bad token needs refreshing, not blind retrying. */
export class GscAuthError extends Error {}

export async function fetchAccessToken(): Promise<string> {
  const { clientEmail, privateKey } = getGscConfig();
  const assertion = createSignedJwt(clientEmail, privateKey);

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GSC token exchange failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as AccessTokenResponse;
  return data.access_token;
}

export interface GscRow {
  query: string;
  page: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface GscQueryResponse {
  rows?: Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

async function queryPage(
  accessToken: string,
  propertyUrl: string,
  date: string,
  startRow: number,
): Promise<GscRow[]> {
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`;

  const { result } = await withRetry(async () => {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: date,
          endDate: date,
          dimensions: ["query", "page"],
          rowLimit: ROW_LIMIT,
          startRow,
        }),
      });
    } catch (err) {
      throw new RetryableError(`GSC network error: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (response.status === 401 || response.status === 403) {
      throw new GscAuthError(`GSC auth rejected (${response.status})`);
    }
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : undefined;
      throw new RetryableError("GSC rate limited (429)", retryAfterMs);
    }
    if (response.status >= 500) {
      throw new RetryableError(`GSC server error (${response.status})`);
    }
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GSC query failed (${response.status}): ${body}`);
    }

    return (await response.json()) as GscQueryResponse;
  });

  return (result.rows ?? []).map((row) => ({
    query: row.keys[0],
    page: row.keys[1],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));
}

export interface FetchSearchAnalyticsResult {
  rows: GscRow[];
}

/**
 * Fetches every row for a single day, paginating (ARCHITECTURE.md §4.1:
 * 25,000-row pages, increment startRow until a short page is returned).
 * One access token is fetched up front and reused across all pages;
 * on a 401/403 mid-pagination, exactly one fresh token is fetched and the
 * failing page retried once — a second auth failure propagates
 * immediately (fail fast, don't burn budget on a bad credential).
 */
export async function fetchSearchAnalytics(date: string): Promise<FetchSearchAnalyticsResult> {
  const { propertyUrl } = getGscConfig();
  let accessToken = await fetchAccessToken();

  const allRows: GscRow[] = [];
  let startRow = 0;

  for (;;) {
    let page: GscRow[];
    try {
      page = await queryPage(accessToken, propertyUrl, date, startRow);
    } catch (err) {
      if (!(err instanceof GscAuthError)) throw err;
      accessToken = await fetchAccessToken();
      page = await queryPage(accessToken, propertyUrl, date, startRow);
    }

    allRows.push(...page);
    if (page.length < ROW_LIMIT) break;
    startRow += ROW_LIMIT;
  }

  return { rows: allRows };
}
