import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Validates a login form submission and, on success, sets a 90-day signed
 * session cookie — see src/lib/auth/session.ts. Plain HTML form POST, no
 * client-side JS required, so this works even if something upstream (an
 * ad blocker, a flaky mobile connection) interferes with a fetch-based
 * flow.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "/admin");
  const safeNext = requestedNext.startsWith("/admin") ? requestedNext : "/admin";

  const expectedUser = process.env.ADMIN_USER ?? "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword || username !== expectedUser || password !== expectedPassword) {
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
