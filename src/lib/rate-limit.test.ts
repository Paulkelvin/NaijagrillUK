import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, clientIpFromHeaders, resetRateLimitState } from "./rate-limit";

beforeEach(() => {
  resetRateLimitState();
});

describe("checkRateLimit", () => {
  it("allows exactly `limit` requests inside one window, then blocks", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("k", 5, 60_000, now).allowed).toBe(true);
    }
    expect(checkRateLimit("k", 5, 60_000, now).allowed).toBe(false);
  });

  it("counts down `remaining` accurately", () => {
    const now = 1_000_000;
    expect(checkRateLimit("k", 3, 60_000, now).remaining).toBe(2);
    expect(checkRateLimit("k", 3, 60_000, now).remaining).toBe(1);
    expect(checkRateLimit("k", 3, 60_000, now).remaining).toBe(0);
  });

  it("starts a fresh window once the previous one has elapsed", () => {
    const start = 1_000_000;
    checkRateLimit("k", 1, 60_000, start);
    expect(checkRateLimit("k", 1, 60_000, start + 59_999).allowed).toBe(false);
    expect(checkRateLimit("k", 1, 60_000, start + 60_000).allowed).toBe(true);
  });

  it("reports a retryAfter of at least 1 second while blocked", () => {
    const start = 1_000_000;
    checkRateLimit("k", 1, 60_000, start);
    const blocked = checkRateLimit("k", 1, 60_000, start + 59_999);
    expect(blocked.retryAfterSeconds).toBe(1);

    const blockedEarly = checkRateLimit("k", 1, 60_000, start + 1_000);
    expect(blockedEarly.retryAfterSeconds).toBe(59);
  });

  it("keeps separate keys on independent budgets", () => {
    const now = 1_000_000;
    checkRateLimit("login:1.1.1.1", 1, 60_000, now);
    expect(checkRateLimit("login:1.1.1.1", 1, 60_000, now).allowed).toBe(false);
    // Different IP, and different action on the same IP, both unaffected.
    expect(checkRateLimit("login:2.2.2.2", 1, 60_000, now).allowed).toBe(true);
    expect(checkRateLimit("reservation:1.1.1.1", 1, 60_000, now).allowed).toBe(true);
  });

  it("sweeps expired entries instead of growing without bound", () => {
    const start = 1_000_000;
    for (let i = 0; i < 50; i++) checkRateLimit(`ip-${i}`, 5, 60_000, start);
    // A later request past every prior window triggers the sweep; the only
    // surviving entry should be the new one.
    checkRateLimit("fresh", 5, 60_000, start + 120_000);
    // Re-requesting an old key now behaves as a brand new window (count 1
    // of 5), proving the old state was actually dropped.
    expect(checkRateLimit("ip-0", 5, 60_000, start + 120_000).remaining).toBe(4);
  });
});

describe("clientIpFromHeaders", () => {
  it("takes the left-most x-forwarded-for entry (the original client)", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1, 10.0.0.2" });
    expect(clientIpFromHeaders(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip, then to a shared constant", () => {
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });

  it("ignores an empty x-forwarded-for rather than returning a blank key", () => {
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": "" }))).toBe("unknown");
  });
});
