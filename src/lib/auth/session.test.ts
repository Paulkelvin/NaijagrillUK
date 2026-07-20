import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session";

const PASSWORD = "hunter2";

describe("createSessionToken / verifySessionToken", () => {
  it("verifies a freshly created token as valid", () => {
    const token = createSessionToken(PASSWORD);
    expect(verifySessionToken(token, PASSWORD)).toBe(true);
  });

  it("rejects a token verified with the wrong password", () => {
    const token = createSessionToken(PASSWORD);
    expect(verifySessionToken(token, "wrong-password")).toBe(false);
  });

  it("rejects an expired token", () => {
    const now = 1_700_000_000_000;
    const token = createSessionToken(PASSWORD, now - 1); // expired one ms before "now"
    expect(verifySessionToken(token, PASSWORD, now)).toBe(false);
  });

  it("accepts a token exactly at its expiry boundary as expired (expiresAt <= now)", () => {
    const now = 1_700_000_000_000;
    const token = createSessionToken(PASSWORD, now);
    expect(verifySessionToken(token, PASSWORD, now)).toBe(false);
  });

  it("accepts a token one ms before its expiry", () => {
    const now = 1_700_000_000_000;
    const token = createSessionToken(PASSWORD, now + 1);
    expect(verifySessionToken(token, PASSWORD, now)).toBe(true);
  });

  it("rejects null, undefined, and empty tokens without throwing", () => {
    expect(verifySessionToken(null, PASSWORD)).toBe(false);
    expect(verifySessionToken(undefined, PASSWORD)).toBe(false);
    expect(verifySessionToken("", PASSWORD)).toBe(false);
  });

  it("rejects a malformed token with no separator", () => {
    expect(verifySessionToken("not-a-valid-token", PASSWORD)).toBe(false);
  });

  it("rejects a token with a tampered signature", () => {
    const token = createSessionToken(PASSWORD);
    const [expiresAt] = token.split(".");
    expect(verifySessionToken(`${expiresAt}.tamperedsignature00000000000000000000000000000000000000000000`, PASSWORD)).toBe(false);
  });

  it("rejects a token with a tampered (extended) expiry that doesn't match its signature", () => {
    const token = createSessionToken(PASSWORD);
    const [expiresAt, signature] = token.split(".");
    const tamperedExpiry = String(Number(expiresAt) + 1_000_000_000);
    expect(verifySessionToken(`${tamperedExpiry}.${signature}`, PASSWORD)).toBe(false);
  });

  it("rejects a token with a non-numeric expiry", () => {
    expect(verifySessionToken("not-a-number.somesignature", PASSWORD)).toBe(false);
  });

  it("changing the password invalidates every previously issued token", () => {
    const token = createSessionToken(PASSWORD);
    expect(verifySessionToken(token, PASSWORD)).toBe(true);
    expect(verifySessionToken(token, "a-new-rotated-password")).toBe(false);
  });
});
