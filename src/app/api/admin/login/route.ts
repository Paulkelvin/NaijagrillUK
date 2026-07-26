import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/auth/session";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/seo/logger";

export const dynamic = "force-dynamic";

// A single password guards the whole admin dashboard, and until this was
// added nothing slowed down repeated guesses — the password comparison
// being timing-safe doesn't help at all against sheer volume. 10 attempts
// per 15 minutes per IP: comfortably above a real owner fat-fingering their
// password a few times, far below anything useful for a brute-force script.
// See src/lib/rate-limit.ts for the honest limits of an in-memory counter
// on serverless.
const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// The rest of this codebase already treats secret comparison as
// timing-safe (CRON_SECRET in every cron route, the session HMAC in
// session.ts) — this is the one place that was still doing a plain `!==`
// on the actual admin password itself, the most sensitive credential in
// the system. Found during a post-ship bug review, fixed here rather than
// left as the one exception to an otherwise-consistent rule.
function timingSafePasswordEqual(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Validates a login form submission and, on success, sets a 90-day signed
 * session cookie — see src/lib/auth/session.ts. Plain HTML form POST, no
 * client-side JS required, so this works even if something upstream (an
 * ad blocker, a flaky mobile connection) interferes with a fetch-based
 * flow.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFromHeaders(request.headers);
  const limit = checkRateLimit(`login:${ip}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);
  if (!limit.allowed) {
    logger.warn("admin_login_rate_limited", { ip, retryAfterSeconds: limit.retryAfterSeconds });
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("error", "rate_limited");
    const response = NextResponse.redirect(loginUrl, { status: 303 });
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const formData = await request.formData();
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "/admin");
  const safeNext = requestedNext.startsWith("/admin") ? requestedNext : "/admin";

  const expectedUser = process.env.ADMIN_USER ?? "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword || username !== expectedUser || !timingSafePasswordEqual(password, expectedPassword)) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("error", "1");
    if (safeNext !== "/admin") loginUrl.searchParams.set("next", safeNext);
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const token = createSessionToken(password);
  const response = NextResponse.redirect(new URL(safeNext, request.url), { status: 303 });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });
  return response;
}
