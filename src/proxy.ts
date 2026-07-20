import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

/**
 * Protects the owner-only /admin dashboard and its mutation/observability
 * API routes (/api/seo/status, /api/seo/actions/[id], /api/seo/settings)
 * with a signed session cookie — see src/lib/auth/session.ts's top-of-file
 * comment for why this replaced ARCHITECTURE.md §7's originally documented
 * HTTP Basic Auth (ADR-010: Basic Auth's browser-controlled credential
 * cache behaved inconsistently, especially on mobile, failing the actual
 * "stay logged in" requirement).
 *
 * /admin/login is deliberately excluded — it's the one page that must be
 * reachable without a session, since it's how a session gets created.
 * Renamed from middleware.ts (Next.js v16 deprecated "Middleware" in favor
 * of "Proxy" — confirmed via the framework's current docs, not assumed;
 * "Proxy defaults to the Node.js runtime", which session.ts's use of
 * node:crypto depends on).
 *
 * Set ADMIN_USER (optional, defaults to "admin") and ADMIN_PASSWORD in your
 * environment. If ADMIN_PASSWORD is not set, every matched route stays
 * locked — there's no password to sign or verify a session against.
 */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/admin/login") return NextResponse.next();

  const expectedPassword = process.env.ADMIN_PASSWORD;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasValidSession = Boolean(expectedPassword) && verifySessionToken(sessionCookie, expectedPassword as string);

  if (hasValidSession) return NextResponse.next();

  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", path);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/seo/status", "/api/seo/actions/:path*", "/api/seo/settings"],
};
