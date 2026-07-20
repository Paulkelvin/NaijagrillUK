import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

const { POST } = await import("./route");

describe("POST /api/admin/logout", () => {
  it("clears the session cookie and redirects to /admin/login", async () => {
    const res = await POST(new NextRequest("http://localhost/api/admin/logout", { method: "POST" }));
    expect(res.status).toBe(303);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login");
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    // A cleared cookie is expressed as Max-Age=0 (or an expiry in the past)
    expect(setCookie).toMatch(/Max-Age=0|Expires=/);
  });
});
