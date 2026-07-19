// Shared retry helper (ENGINEERING_STANDARDS.md §6). Deliberately decoupled
// from any specific HTTP client's error shape: callers classify their own
// errors (a 429/5xx/network-timeout from whatever library they use becomes
// a RetryableError; a 4xx or validation error is thrown as-is and never
// retried). withRetry() only knows how to back off and count.

/**
 * Thrown by a caller to signal a transient, retryable failure (429, 5xx,
 * network timeout). Any other thrown error type propagates immediately —
 * no retry, matching "not retryable: 4xx other than 429, validation
 * errors, auth failures after one re-auth attempt" (ENGINEERING_STANDARDS.md
 * §6). Re-auth-then-fail-fast is caller-specific (e.g. gsc/client.ts
 * refreshing a JWT once) and isn't this module's concern.
 */
export class RetryableError extends Error {
  /** Overrides the computed exponential delay for the next attempt, e.g.
   *  from a 429's Retry-After header (milliseconds). */
  retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = "RetryableError";
    this.retryAfterMs = retryAfterMs;
  }
}

export interface WithRetryOptions {
  /**
   * Maximum number of RETRY attempts — not total invocations. Matches
   * ARCHITECTURE.md §4.1's "3 retries with exponential backoff (2s, 4s,
   * 8s)": the default of 3 means up to 4 total calls to fn() (1 initial +
   * 3 retries), producing exactly 3 backoff delays.
   */
  maxAttempts?: number;
  baseDelayMs?: number;
  /** Injectable for tests, so a retry-exhaustion test doesn't take 14s of
   *  real wall-clock time waiting on 2s+4s+8s of actual delays. */
  sleep?: (ms: number) => Promise<void>;
}

export interface RetryResult<T> {
  result: T;
  retryCount: number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Runs fn(), retrying on RetryableError with exponential backoff
 * (baseDelayMs * 2^attempt), up to maxAttempts retries. Any other thrown
 * error propagates immediately. Returns both the result and how many
 * retries it took, so callers can fold that into sync_log.metadata.retry_count.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: WithRetryOptions = {},
): Promise<RetryResult<T>> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 2000;
  const sleep = options.sleep ?? defaultSleep;

  let retryCount = 0;

  for (;;) {
    try {
      const result = await fn();
      return { result, retryCount };
    } catch (err) {
      if (!(err instanceof RetryableError) || retryCount >= maxAttempts) {
        throw err;
      }
      const delay = err.retryAfterMs ?? baseDelayMs * 2 ** retryCount;
      retryCount += 1;
      await sleep(delay);
    }
  }
}
