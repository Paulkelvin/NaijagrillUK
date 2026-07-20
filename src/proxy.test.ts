import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { proxy, config } from "./proxy";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

function request(path: string, options: { cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (options.cookie) headers.cookie = options.cookie;
  return new NextRequest(`http://localhost${path}`, { headers });
}

function sessionCookie(password: string, expiresAt?: number): string {
  return `${SESSION_COOKIE_NAME}=${createSessionToken(password, expiresAt)}`;
}

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.ADMIN_PASSWORD = "hunter2";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("proxy", () => {
  it("matcher covers /admin, /api/seo/status, /api/seo/actions/:path*, and /api/seo/settings", () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining(["/admin", "/admin/:path*", "/api/seo/status", "/api/seo/actions/:path*", "/api/seo/settings"]),
    );
  });

  it("always lets /admin/login through, even with no session cookie at all", () => {
    const res = proxy(request("/admin/login"));
    expect(res.status).toBe(200); // NextResponse.next() passthrough
  });

  for (const path of ["/admin", "/admin/seo", "/admin/seo/settings"]) {
    describe(`page route: ${path}`, () => {
      it("redirects to /admin/login with a next param when there's no session cookie", () => {
        const res = proxy(request(path));
        expect(res.status).toBe(307);
        const location = new URL(res.headers.get("location")!);
        expect(location.pathname).toBe("/admin/login");
        expect(location.searchParams.get("next")).toBe(path);
      });

      it("redirects when the session cookie is invalid", () => {
        const res = proxy(request(path, { cookie: `${SESSION_COOKIE_NAME}=garbage` }));
        expect(res.status).toBe(307);
      });

      it("redirects when the session cookie is expired", () => {
        const res = proxy(request(path, { cookie: sessionCookie("hunter2", Date.now() - 1000) }));
        expect(res.status).toBe(307);
      });

      it("redirects when the session was signed with a different (stale) password", () => {
        const res = proxy(request(path, { cookie: sessionCookie("old-password") }));
        expect(res.status).toBe(307);
      });

      it("allows the request through with a valid session cookie", () => {
        const res = proxy(request(path, { cookie: sessionCookie("hunter2") }));
        expect(res.status).toBe(200);
      });

      it("stays locked even with a well-formed-looking cookie when ADMIN_PASSWORD is unset", () => {
        const cookie = sessionCookie("hunter2");
        delete process.env.ADMIN_PASSWORD;
        const res = proxy(request(path, { cookie }));
        expect(res.status).toBe(307);
      });
    });
  }

  for (const path of ["/api/seo/status", "/api/seo/actions/abc-123", "/api/seo/settings"]) {
    describe(`API route: ${path}`, () => {
      it("returns 401 JSON (not a redirect) when there's no session cookie", async () => {
        const res = proxy(request(path));
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body).toEqual({ error: "Unauthorized" });
      });

      it("allows the request through with a valid session cookie", () => {
        const res = proxy(request(path, { cookie: sessionCookie("hunter2") }));
        expect(res.status).toBe(200);
      });
    });
  }
});
