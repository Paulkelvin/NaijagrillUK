import { createHmac, timingSafeEqual } from "node:crypto";

// Replaces HTTP Basic Auth (ARCHITECTURE.md §7's originally documented
// mechanism) for /admin and its mutation routes. Basic Auth's session
// lifetime is entirely controlled by the browser's own credential cache,
// which behaves inconsistently — especially on mobile Safari, where it's
// commonly forgotten far sooner than a user expects "staying logged in"
// to mean. A real user (owner, checking the dashboard from their phone)
// hit exactly this. Documented as a deliberate deviation in
// docs/seo-platform/decisions/ADR-010-session-cookie-auth.md — same
// discipline as every other resolved gap in this project, not a silent
// swap.
//
// Stateless, signed-cookie session (Next.js's own recommended pattern —
// see their App Router authentication guide's "Stateless Sessions"
// section). No session store/table needed: the cookie's value is
// `${expiresAtMs}.${hmacHex}`, where the HMAC key is the admin password
// itself. Verification recomputes the HMAC and does a constant-time
// comparison. A pleasant side effect: changing ADMIN_PASSWORD
// automatically invalidates every previously-issued session, with no
// separate revocation mechanism needed.
//
// Proxy (src/proxy.ts, née middleware.ts) defaults to the Node.js runtime
// as of Next.js v16 (confirmed via the framework's own current docs, not
// assumed) — node:crypto is safe to use here.

export const SESSION_COOKIE_NAME = "admin_session";
export const SESSION_DURATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days — "don't ask me again for a long while"

function hmacHex(key: string, message: string): string {
  return createHmac("sha256", key).update(message).digest("hex");
}

export function createSessionToken(password: string, expiresAt: number = Date.now() + SESSION_DURATION_MS): string {
  return `${expiresAt}.${hmacHex(password, String(expiresAt))}`;
}

export function verifySessionToken(token: string | undefined | null, password: string, now: number = Date.now()): boolean {
  if (!token) return false;
  const separatorIndex = token.indexOf(".");
  if (separatorIndex === -1) return false;

  const expiresAtStr = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;

  const expected = Buffer.from(hmacHex(password, expiresAtStr));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}
