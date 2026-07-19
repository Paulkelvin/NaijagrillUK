import { describe, expect, it, vi } from "vitest";
import { RetryableError, withRetry } from "./retry";

function fakeSleep() {
  const calls: number[] = [];
  const sleep = vi.fn(async (ms: number) => {
    calls.push(ms);
  });
  return { sleep, calls };
}

describe("withRetry", () => {
  it("returns the result and retryCount=0 when fn succeeds first try", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const { result, retryCount } = await withRetry(fn);
    expect(result).toBe("ok");
    expect(retryCount).toBe(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on RetryableError and succeeds, with exponential backoff 2s/4s", async () => {
    const { sleep, calls } = fakeSleep();
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts += 1;
      if (attempts < 3) throw new RetryableError("transient");
      return "ok";
    });

    const { result, retryCount } = await withRetry(fn, { sleep });

    expect(result).toBe("ok");
    expect(retryCount).toBe(2);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(calls).toEqual([2000, 4000]);
  });

  it("gives up after maxAttempts retries — 3 retries produce delays 2s, 4s, 8s (4 total calls)", async () => {
    const { sleep, calls } = fakeSleep();
    const fn = vi.fn().mockRejectedValue(new RetryableError("always fails"));

    await expect(withRetry(fn, { sleep })).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    expect(calls).toEqual([2000, 4000, 8000]);
  });

  it("does not retry a non-RetryableError — propagates immediately", async () => {
    const { sleep } = fakeSleep();
    const fn = vi.fn().mockRejectedValue(new Error("not retryable"));

    await expect(withRetry(fn, { sleep })).rejects.toThrow("not retryable");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("respects an explicit retryAfterMs, overriding the computed backoff", async () => {
    const { sleep, calls } = fakeSleep();
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts += 1;
      if (attempts === 1) throw new RetryableError("rate limited", 15000);
      return "ok";
    });

    const { retryCount } = await withRetry(fn, { sleep });
    expect(retryCount).toBe(1);
    expect(calls).toEqual([15000]);
  });

  it("respects custom maxAttempts and baseDelayMs", async () => {
    const { sleep, calls } = fakeSleep();
    const fn = vi.fn().mockRejectedValue(new RetryableError("fails"));

    await expect(withRetry(fn, { sleep, maxAttempts: 1, baseDelayMs: 100 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
    expect(calls).toEqual([100]);
  });
});
