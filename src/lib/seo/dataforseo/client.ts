import { getDataForSeoConfig } from "@/lib/seo/config";
import { RetryableError, withRetry } from "@/lib/seo/retry";

// Direct HTTP calls, no SDK (ARCHITECTURE.md's Technology Stack: "No SDK
// dependencies where avoidable"). DataForSEO uses plain HTTP Basic Auth —
// login (account email) + an auto-generated API password, base64-encoded
// in the Authorization header on every request. No token exchange, no
// refresh flow (unlike GSC/GA4's OAuth2 JWT bearer flow) — verified against
// docs.dataforseo.com/v3/auth/ during this milestone, not assumed from
// training data (same discipline Phase 1 applied to GSC/GA4/Vercel).

const BASE_URL = "https://api.dataforseo.com";
// DataForSEO's own documented convention: a request-level (or task-level)
// status_code in [20000, 29999] means success; anything else is an error,
// even though the HTTP transport status itself may still be 200.
const SUCCESS_STATUS_MIN = 20000;
const SUCCESS_STATUS_MAX = 29999;

/** Thrown on HTTP 401/403 — bad credentials. Unlike GSC's GscAuthError,
 *  there's no token to refresh and retry with (Basic Auth is static), so
 *  this always fails fast rather than being caught and retried by a caller. */
export class DataForSeoAuthError extends Error {}

function authHeader(): string {
  const { login, password } = getDataForSeoConfig();
  return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
}

export interface DataForSeoTask<T> {
  id: string;
  status_code: number;
  status_message: string;
  cost: number;
  result: T[] | null;
}

export interface DataForSeoResponse<T> {
  status_code: number;
  status_message: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: DataForSeoTask<T>[] | null;
}

/**
 * Calls a DataForSEO "_live" endpoint (synchronous — result available in
 * the same response, no task_post/task_get polling needed) with a single
 * task payload. `endpointPath` is the path after the base URL, e.g.
 * "/v3/keywords_data/google_ads/search_volume/live".
 *
 * Throws DataForSeoAuthError on 401/403 (fail fast, not retryable).
 * Retries on network errors, 429 (honoring Retry-After), and 5xx via
 * retry.ts's withRetry, matching every other client in this codebase.
 * Throws a plain Error if the top-level response status_code is outside
 * the documented 20000-29999 success range — callers that need per-task
 * status (a batch of multiple tasks can partially fail) should inspect
 * `tasks[].status_code` themselves; this only validates the envelope.
 */
export async function callDataForSeoApi<T>(endpointPath: string, payload: unknown[]): Promise<DataForSeoResponse<T>> {
  const { result } = await withRetry(async () => {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}${endpointPath}`, {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      throw new RetryableError(`DataForSEO network error: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (response.status === 401 || response.status === 403) {
      throw new DataForSeoAuthError(`DataForSEO auth rejected (${response.status})`);
    }
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : undefined;
      throw new RetryableError("DataForSEO rate limited (429)", retryAfterMs);
    }
    if (response.status >= 500) {
      throw new RetryableError(`DataForSEO server error (${response.status})`);
    }
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`DataForSEO request failed (${response.status}): ${body}`);
    }

    return (await response.json()) as DataForSeoResponse<T>;
  });

  if (result.status_code < SUCCESS_STATUS_MIN || result.status_code > SUCCESS_STATUS_MAX) {
    throw new Error(`DataForSEO API error ${result.status_code}: ${result.status_message}`);
  }

  return result;
}
