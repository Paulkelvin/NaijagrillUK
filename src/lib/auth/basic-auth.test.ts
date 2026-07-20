import { describe, expect, it } from "vitest";
import { isBasicAuthValid } from "./basic-auth";

function basicHeader(user: string, password: string): string {
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

describe("isBasicAuthValid", () => {
  it("accepts a correctly-encoded matching user/password", () => {
    expect(isBasicAuthValid(basicHeader("admin", "hunter2"), "admin", "hunter2")).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(isBasicAuthValid(basicHeader("admin", "wrong"), "admin", "hunter2")).toBe(false);
  });

  it("rejects a wrong user", () => {
    expect(isBasicAuthValid(basicHeader("someone-else", "hunter2"), "admin", "hunter2")).toBe(false);
  });

  it("rejects a missing Authorization header", () => {
    expect(isBasicAuthValid(null, "admin", "hunter2")).toBe(false);
  });

  it("rejects a non-Basic scheme", () => {
    expect(isBasicAuthValid("Bearer sometoken", "admin", "hunter2")).toBe(false);
  });

  it("rejects malformed base64 without throwing", () => {
    expect(isBasicAuthValid("Basic not-valid-base64!!!", "admin", "hunter2")).toBe(false);
  });

  it("rejects a decoded value with no ':' separator", () => {
    const header = `Basic ${Buffer.from("no-colon-here").toString("base64")}`;
    expect(isBasicAuthValid(header, "admin", "hunter2")).toBe(false);
  });

  it("supports a password that itself contains a ':'", () => {
    expect(isBasicAuthValid(basicHeader("admin", "pass:word"), "admin", "pass:word")).toBe(true);
  });
});
