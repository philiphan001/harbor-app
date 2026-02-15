// Structured logger with levels, timestamps, and context
// Replaces ad-hoc console.log/error/warn across server-side code

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Configurable via LOG_LEVEL env var (defaults to "info" in prod, "debug" in dev)
function getMinLevel(): number {
  const env = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  if (env && env in LOG_LEVELS) return LOG_LEVELS[env];
  return process.env.NODE_ENV === "production" ? LOG_LEVELS.info : LOG_LEVELS.debug;
}

interface LogContext {
  [key: string]: string | number | boolean | undefined;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatContext(ctx?: LogContext): string {
  if (!ctx) return "";
  const parts = Object.entries(ctx)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`);
  return parts.length > 0 ? ` {${parts.join(", ")}}` : "";
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= getMinLevel();
}

function log(level: LogLevel, module: string, message: string, ctx?: LogContext) {
  if (!shouldLog(level)) return;

  const ts = formatTimestamp();
  const tag = `[${module}]`;
  const ctxStr = formatContext(ctx);
  const prefix = `${ts} ${level.toUpperCase().padEnd(5)} ${tag}`;

  if (level === "error") {
    console.error(`${prefix} ${message}${ctxStr}`);
  } else if (level === "warn") {
    console.warn(`${prefix} ${message}${ctxStr}`);
  } else {
    console.log(`${prefix} ${message}${ctxStr}`);
  }
}

/** Create a logger scoped to a module name */
export function createLogger(module: string) {
  return {
    debug: (message: string, ctx?: LogContext) => log("debug", module, message, ctx),
    info: (message: string, ctx?: LogContext) => log("info", module, message, ctx),
    warn: (message: string, ctx?: LogContext) => log("warn", module, message, ctx),
    error: (message: string, ctx?: LogContext) => log("error", module, message, ctx),

    /** Log an error with its stack trace */
    errorWithStack: (message: string, error: unknown, ctx?: LogContext) => {
      const errMsg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      log("error", module, `${message}: ${errMsg}`, ctx);
      if (stack && shouldLog("debug")) {
        console.error(stack);
      }
    },
  };
}
