import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isBasicAuthValid } from "@/lib/auth/basic-auth";

/**
 * Protects the owner-only /admin dashboard and, from Milestone 7, the
 * /api/seo/status observability endpoint, and from Phase 2 Milestones 11-12
 * the /api/seo/actions/[id] and /api/seo/settings mutation endpoints, with
 * the same HTTP Basic Auth (ARCHITECTURE.md §7: "the existing HTTP Basic
 * Auth used by /admin ... matcher extends to cover these paths once
 * they're built"). /admin/seo and /admin/seo/settings themselves need no
 * separate matcher entry — already covered by the existing
 * "/admin/:path*" entry.
 * Set ADMIN_USER (optional, defaults to "admin") and ADMIN_PASSWORD in your
 * environment. If ADMIN_PASSWORD is not set, every matched route stays locked.
 */
export function middleware(request: NextRequest) {
  const expectedUser = process.env.ADMIN_USER ?? "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const authHeader = request.headers.get("authorization");

  if (expectedPassword && isBasicAuthValid(authHeader, expectedUser, expectedPassword)) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="NaijaGrill Admin", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/seo/status", "/api/seo/actions/:path*", "/api/seo/settings"],
};
