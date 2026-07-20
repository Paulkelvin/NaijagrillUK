import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { middleware, config } from "./middleware";

function basicHeader(user: string, password: string): string {
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${path}`, { headers });
}

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("middleware", () => {
  it("matcher covers /admin, /api/seo/status, and /api/seo/actions/:path* (ARCHITECTURE.md §7)", () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining(["/admin", "/admin/:path*", "/api/seo/status", "/api/seo/actions/:path*"]),
    );
  });

  for (const path of ["/admin", "/api/seo/status", "/api/seo/actions/abc-123"]) {
    describe(`path: ${path}`, () => {
      beforeEach(() => {
        process.env.ADMIN_USER = "admin";
        process.env.ADMIN_PASSWORD = "hunter2";
      });

      it("returns 401 with no Authorization header", () => {
        const res = middleware(request(path));
        expect(res.status).toBe(401);
        expect(res.headers.get("WWW-Authenticate")).toContain("Basic");
      });

      it("returns 401 with the wrong password", () => {
        const res = middleware(request(path, { authorization: basicHeader("admin", "wrong") }));
        expect(res.status).toBe(401);
      });

      it("allows the request through with correct credentials", () => {
        const res = middleware(request(path, { authorization: basicHeader("admin", "hunter2") }));
        expect(res.status).toBe(200); // NextResponse.next() is a 200 passthrough
      });

      it("defaults ADMIN_USER to 'admin' when unset", () => {
        delete process.env.ADMIN_USER;
        const res = middleware(request(path, { authorization: basicHeader("admin", "hunter2") }));
        expect(res.status).toBe(200);
      });

      it("stays locked even with a correctly-formatted header when ADMIN_PASSWORD is unset", () => {
        delete process.env.ADMIN_PASSWORD;
        const res = middleware(request(path, { authorization: basicHeader("admin", "hunter2") }));
        expect(res.status).toBe(401);
      });
    });
  }
});
