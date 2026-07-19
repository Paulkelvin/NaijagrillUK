// Structured JSON logger — one line of JSON to stdout per call. Vercel
// captures stdout automatically, no logging service needed at this scale.
// See ENGINEERING_STANDARDS.md §4. This is the ephemeral, real-time layer;
// sync-log.ts's sync_log table is the durable, queryable layer.

type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

// Never log secrets, even at debug. Best-effort redaction so a caller that
// accidentally passes a credential-shaped field doesn't leak it to logs —
// this is a safety net, not a substitute for callers not doing that.
const SENSITIVE_KEY_PATTERN = /key|secret|password|token/i;

function redact(context: LogContext): LogContext {
  const result: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    result[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : value;
  }
  return result;
}

function emit(level: LogLevel, event: string, context: LogContext = {}) {
  const entry = {
    level,
    ts: new Date().toISOString(),
    event,
    ...redact(context),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  /** Local dev only — suppressed when NODE_ENV === "production". */
  debug(event: string, context?: LogContext) {
    if (process.env.NODE_ENV === "production") return;
    emit("debug", event, context);
  },
  /** Job start/complete, row counts. */
  info(event: string, context?: LogContext) {
    emit("info", event, context);
  },
  /** Budget thresholds, stale datasets, rejected rows — recoverable, needs attention. */
  warn(event: string, context?: LogContext) {
    emit("warn", event, context);
  },
  /** Job failed, auth failed. */
  error(event: string, context?: LogContext) {
    emit("error", event, context);
  },
};
