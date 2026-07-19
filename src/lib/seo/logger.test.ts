import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger";

let logSpy: ReturnType<typeof vi.spyOn>;
let warnSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function lastLoggedEntry(spy: ReturnType<typeof vi.spyOn>) {
  const call = spy.mock.calls.at(-1);
  return JSON.parse(call![0] as string);
}

describe("logger", () => {
  it("info() emits valid JSON to console.log with required fields", () => {
    logger.info("gsc_sync_completed", { siteId: "abc", recordsProcessed: 12 });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const entry = lastLoggedEntry(logSpy);
    expect(entry.level).toBe("info");
    expect(entry.event).toBe("gsc_sync_completed");
    expect(entry.siteId).toBe("abc");
    expect(entry.recordsProcessed).toBe(12);
    expect(() => new Date(entry.ts).toISOString()).not.toThrow();
    expect(new Date(entry.ts).toISOString()).toBe(entry.ts);
  });

  it("warn() emits to console.warn with level=warn", () => {
    logger.warn("budget_threshold_crossed", { provider: "dataforseo" });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
    const entry = lastLoggedEntry(warnSpy);
    expect(entry.level).toBe("warn");
    expect(entry.event).toBe("budget_threshold_crossed");
  });

  it("error() emits to console.error with level=error", () => {
    logger.error("sync_job_failed", { runId: 42 });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const entry = lastLoggedEntry(errorSpy);
    expect(entry.level).toBe("error");
    expect(entry.runId).toBe(42);
  });

  it("debug() emits when NODE_ENV is not production", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    logger.debug("verbose_detail", { foo: "bar" });
    expect(logSpy).toHaveBeenCalledTimes(1);
    process.env.NODE_ENV = original;
  });

  it("debug() is suppressed when NODE_ENV is production", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    logger.debug("verbose_detail", { foo: "bar" });
    expect(logSpy).not.toHaveBeenCalled();
    process.env.NODE_ENV = original;
  });

  it("redacts fields whose key looks like a credential", () => {
    logger.info("config_loaded", {
      apiKey: "super-secret-value",
      privateKey: "-----BEGIN PRIVATE KEY-----",
      password: "hunter2",
      token: "abc.def.ghi",
      siteId: "not-a-secret",
    });
    const entry = lastLoggedEntry(logSpy);
    expect(entry.apiKey).toBe("[REDACTED]");
    expect(entry.privateKey).toBe("[REDACTED]");
    expect(entry.password).toBe("[REDACTED]");
    expect(entry.token).toBe("[REDACTED]");
    expect(entry.siteId).toBe("not-a-secret");
  });

  it("emits valid, parseable JSON with no undefined context", () => {
    logger.info("no_context_event");
    expect(() => lastLoggedEntry(logSpy)).not.toThrow();
  });
});
