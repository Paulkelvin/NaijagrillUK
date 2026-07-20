import { createSign } from "node:crypto";
import { getGa4Config } from "@/lib/seo/config";
import { RetryableError, withRetry } from "@/lib/seo/retry";

// Direct HTTP calls, no SDK (ARCHITECTURE.md's Technology Stack: "No SDK
// dependencies where avoidable") — same hand-rolled JWT bearer flow as
// gsc/client.ts, verified independently for GA4 during Milestone 6.
//
// GA4 Data API v1 runReport contract verified against Google's live docs
// (2026-07-20), not assumed from training data:
//   POST https://analyticsdata.googleapis.com/v1beta/properties/{id}:runReport
//   Row values are wrapped objects — {"value": "<string>"} — for both
//   dimensionValues and metricValues, never bare strings.
//   limit/offset are string-encoded int64 (default limit 10,000, max 250,000).
//   Response includes rowCount (total matching rows), which gives an exact
//   pagination end condition instead of GSC's "short page" heuristic.
//
// One correction to ARCHITECTURE.md §4.2's request example: its "conversions"
// metric was renamed to "keyEvents" as part of Google's GA4-wide Key Events
// rename (deprecatedApiNames now lists "conversions" as the legacy name for
// this exact metric, migration completed June 2026, confirmed via live
// search — not present in training data). This module requests "keyEvents".
// No behavioral change: same underlying metric, current API name.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
// Well under the API's 250,000-row max — a single restaurant site's daily
// pagePath report never approaches even the 10,000 default.
const ROW_LIMIT = 100_000;

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Builds and signs the JWT assertion for Google's service-account OAuth2
 * flow. Exported directly for testing, same rationale as gsc/client.ts.
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

/** Thrown on 401/403 — same one-re-auth-then-fail-fast contract as GscAuthError. */
export class Ga4AuthError extends Error {}

export async function fetchAccessToken(): Promise<string> {
  const { clientEmail, privateKey } = getGa4Config();
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
    throw new Error(`GA4 token exchange failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as AccessTokenResponse;
  return data.access_token;
}

interface Ga4Value {
  value: string;
}

interface Ga4Row {
  dimensionValues: Ga4Value[];
  metricValues: Ga4Value[];
}

interface Ga4RunReportResponse {
  rows?: Ga4Row[];
  rowCount?: number;
}

interface RunReportRequest {
  dimensions: string[];
  metrics: string[];
  date: string;
  dimensionFilter?: unknown;
}

async function runReportPage(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>,
): Promise<Ga4RunReportResponse> {
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`;

  const { result } = await withRetry(async () => {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new RetryableError(`GA4 network error: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (response.status === 401 || response.status === 403) {
      throw new Ga4AuthError(`GA4 auth rejected (${response.status})`);
    }
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : undefined;
      throw new RetryableError("GA4 rate limited (429)", retryAfterMs);
    }
    if (response.status >= 500) {
      throw new RetryableError(`GA4 server error (${response.status})`);
    }
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`GA4 runReport failed (${response.status}): ${errBody}`);
    }

    return (await response.json()) as Ga4RunReportResponse;
  });

  return result;
}

/**
 * Runs one report to completion, paginating via rowCount (exact, unlike
 * GSC's short-page heuristic). One access token is fetched up front and
 * reused across all pages; on 401/403 mid-pagination, exactly one fresh
 * token is fetched and the failing page retried once.
 */
async function runReport(propertyId: string, request: RunReportRequest): Promise<Ga4Row[]> {
  let accessToken = await fetchAccessToken();

  const buildBody = (offset: number) => ({
    dimensions: request.dimensions.map((name) => ({ name })),
    metrics: request.metrics.map((name) => ({ name })),
    dateRanges: [{ startDate: request.date, endDate: request.date }],
    ...(request.dimensionFilter ? { dimensionFilter: request.dimensionFilter } : {}),
    limit: String(ROW_LIMIT),
    offset: String(offset),
  });

  const allRows: Ga4Row[] = [];
  let offset = 0;

  for (;;) {
    const body = buildBody(offset);
    let page: Ga4RunReportResponse;
    try {
      page = await runReportPage(accessToken, propertyId, body);
    } catch (err) {
      if (!(err instanceof Ga4AuthError)) throw err;
      accessToken = await fetchAccessToken();
      page = await runReportPage(accessToken, propertyId, body);
    }

    const rows = page.rows ?? [];
    allRows.push(...rows);
    offset += rows.length;
    const rowCount = page.rowCount ?? rows.length;
    if (rows.length === 0 || offset >= rowCount) break;
  }

  return allRows;
}

export interface Ga4PageMetricRow {
  pagePath: string;
  sessions: number;
  engagedSessions: number;
  // Null propagated straight through from GA4 rather than coerced to 0 —
  // page_metrics.bounce_rate/avg_engagement_time are nullable specifically
  // to distinguish "zero-session day" (undefined rate) from "measured 0".
  // GA4 has not been observed against real data yet (no credentials exist
  // as of this milestone; see PHASE_1_IMPLEMENTATION.md) to confirm whether
  // it omits these fields or returns "0" for zero-session pagePaths — this
  // only treats an explicitly empty value string as null, never guesses.
  bounceRate: number | null;
  avgSessionDuration: number | null;
  conversions: number;
  purchaseRevenue: number;
}

const PAGE_METRIC_DIMENSIONS = ["pagePath"];
const PAGE_METRIC_NAMES = [
  "sessions",
  "engagedSessions",
  "bounceRate",
  "averageSessionDuration",
  "keyEvents",
  "purchaseRevenue",
];

export interface FetchPageMetricsResult {
  rows: Ga4PageMetricRow[];
}

function parseNumberOrNull(raw: string | undefined): number | null {
  if (raw === undefined || raw === "") return null;
  return Number(raw);
}

/** Fetches GA4's per-page session/engagement/conversion metrics for one day. */
export async function fetchPageMetrics(date: string): Promise<FetchPageMetricsResult> {
  const { propertyId } = getGa4Config();
  const rows = await runReport(propertyId, { dimensions: PAGE_METRIC_DIMENSIONS, metrics: PAGE_METRIC_NAMES, date });

  return {
    rows: rows.map((row): Ga4PageMetricRow => {
      const [pagePath] = row.dimensionValues.map((v) => v.value);
      const [sessions, engagedSessions, bounceRate, avgSessionDuration, conversions, purchaseRevenue] =
        row.metricValues.map((v) => v.value);
      return {
        pagePath,
        sessions: Number(sessions ?? "0"),
        engagedSessions: Number(engagedSessions ?? "0"),
        bounceRate: parseNumberOrNull(bounceRate),
        avgSessionDuration: parseNumberOrNull(avgSessionDuration),
        conversions: Number(conversions ?? "0"),
        purchaseRevenue: Number(purchaseRevenue ?? "0"),
      };
    }),
  };
}

export interface Ga4ConversionRow {
  pagePath: string;
  eventName: string;
  eventCount: number;
}

export interface FetchConversionBreakdownResult {
  rows: Ga4ConversionRow[];
}

/**
 * Second report (ARCHITECTURE.md §4.2 "For conversion breakdown"): eventName
 * added as a dimension, filtered to exactly the events configured in
 * site_configs.conversion_events via an inListFilter. Skips the network call
 * entirely when no events are configured — site_configs.conversion_events
 * defaults to '[]', so this is the expected state until a business
 * configures its own events.
 */
export async function fetchConversionBreakdown(date: string, eventNames: string[]): Promise<FetchConversionBreakdownResult> {
  if (eventNames.length === 0) return { rows: [] };

  const { propertyId } = getGa4Config();
  const rows = await runReport(propertyId, {
    dimensions: ["pagePath", "eventName"],
    metrics: ["eventCount"],
    date,
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: { values: eventNames },
      },
    },
  });

  return {
    rows: rows.map((row): Ga4ConversionRow => {
      const [pagePath, eventName] = row.dimensionValues.map((v) => v.value);
      const [eventCount] = row.metricValues.map((v) => v.value);
      return { pagePath, eventName, eventCount: Number(eventCount ?? "0") };
    }),
  };
}
