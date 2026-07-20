import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

const { POST } = await import("./route");

function loginRequest(fields: Record<string, string>) {
  const body = new URLSearchParams(fields);
  return new NextRequest("http://localhost/api/admin/login", {
    method: "POST",
    body,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
}

function cookieValue(setCookieHeader: string | null, name: string): string | undefined {
  if (!setCookieHeader) return undefined;
  const match = setCookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1];
}

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.ADMIN_USER = "admin";
  process.env.ADMIN_PASSWORD = "hunter2";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("POST /api/admin/login", () => {
  it("redirects to /admin/login?error=1 with the wrong password, no cookie set", async () => {
    const res = await POST(loginRequest({ username: "admin", password: "wrong" }));
    expect(res.status).toBe(303);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/admin/login");
    expect(location.searchParams.get("error")).toBe("1");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("redirects to /admin/login?error=1 with the wrong username", async () => {
    const res = await POST(loginRequest({ username: "someone-else", password: "hunter2" }));
    expect(res.status).toBe(303);
    expect(new URL(res.headers.get("location")!).searchParams.get("error")).toBe("1");
  });

  it("stays locked even with the correct password when ADMIN_PASSWORD is unset", async () => {
    delete process.env.ADMIN_PASSWORD;
    const res = await POST(loginRequest({ username: "admin", password: "hunter2" }));
    expect(new URL(res.headers.get("location")!).searchParams.get("error")).toBe("1");
  });

  it("on success, sets a valid 90-day session cookie and redirects to /admin", async () => {
    const res = await POST(loginRequest({ username: "admin", password: "hunter2" }));
    expect(res.status).toBe(303);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin");

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie?.toLowerCase()).toContain("samesite=lax");
    const token = cookieValue(setCookie, SESSION_COOKIE_NAME);
    expect(token).toBeDefined();
    expect(verifySessionToken(decodeURIComponent(token!), "hunter2")).toBe(true);
  });

  it("redirects to a same-origin next path after a successful login", async () => {
    const res = await POST(loginRequest({ username: "admin", password: "hunter2", next: "/admin/seo" }));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/seo");
  });

  it("ignores an unsafe next value and falls back to /admin", async () => {
    const res = await POST(loginRequest({ username: "admin", password: "hunter2", next: "https://evil.example.com" }));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin");
  });
});
