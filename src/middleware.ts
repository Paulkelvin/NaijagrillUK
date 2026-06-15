import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protects the owner-only /admin dashboard with HTTP Basic Auth.
 * Set ADMIN_USER (optional, defaults to "admin") and ADMIN_PASSWORD in your
 * environment. If ADMIN_PASSWORD is not set, the route stays locked.
 */
export function middleware(request: NextRequest) {
  const expectedUser = process.env.ADMIN_USER ?? "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const authHeader = request.headers.get("authorization");

  if (expectedPassword && authHeader?.startsWith("Basic ")) {
    try {
      const decoded = atob(authHeader.slice(6));
      const separator = decoded.indexOf(":");
      const user = decoded.slice(0, separator);
      const password = decoded.slice(separator + 1);
      if (user === expectedUser && password === expectedPassword) {
        return NextResponse.next();
      }
    } catch {
      // fall through to 401
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="NaijaGrill Admin", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
