// A deliberately small, dependency-free fixed-window rate limiter.
//
// Honest limitation, stated up front: this is in-memory, and this app runs
// on Vercel's serverless/fluid compute — so the counter is per-instance and
// resets on cold start. A determined attacker with enough patience (or luck
// hitting fresh instances) can exceed the nominal limit. It is NOT a
// substitute for a shared store (Upstash/Redis) if this ever needs a real
// guarantee.
//
// It is still worth having: the realistic threat here is an unthrottled
// script firing thousands of password guesses or form submissions at one
// endpoint, and a per-instance counter stops exactly that at near-zero cost
// and zero new infrastructure. Chosen over adding a Redis dependency for a
// single-location restaurant site where the real risk is bot noise, not a
// targeted adversary — documented here so the tradeoff is visible rather
// than assumed.

interface WindowState {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowState>();

// Bounds memory if a lot of distinct keys (IPs) come through: expired
// entries are swept opportunistically on write rather than via a timer,
// since a serverless instance can be frozen/killed at any point and a
// setInterval would be unreliable there anyway.
function sweepExpired(now: number): void {
  for (const [key, state] of windows) {
    if (state.resetAt <= now) windows.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window limiter. `key` should identify the caller *and* the action
 * (e.g. `login:1.2.3.4`) so limits on different endpoints don't share a
 * budget.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number, now: number = Date.now()): RateLimitResult {
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    if (windows.size > 0) sweepExpired(now);
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/** Test-only: drops all window state so cases don't leak into each other. */
export function resetRateLimitState(): void {
  windows.clear();
}

/**
 * Best-effort client IP. Vercel sets x-forwarded-for; the left-most entry is
 * the original client. Falls back to a constant so a missing header degrades
 * into "everyone shares one bucket" (fails closed-ish, still throttling)
 * rather than "every request gets a fresh unlimited bucket".
 */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
