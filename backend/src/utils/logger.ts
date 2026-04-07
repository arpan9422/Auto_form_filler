import prisma from "../config/database";
import { LogLevel, Prisma } from "../generated/prisma";

type LogMeta = Record<string, unknown> | null | undefined;

// ── In-memory queue — logs are batched and flushed every 2s ───────────
type QueuedAppLog = Prisma.AppLogCreateManyInput;
type QueuedRequestLog = Prisma.RequestLogCreateManyInput;

const appLogQueue: QueuedAppLog[] = [];
const requestLogQueue: QueuedRequestLog[] = [];

async function flushQueues() {
  if (appLogQueue.length > 0) {
    const batch = appLogQueue.splice(0, appLogQueue.length);
    prisma.appLog.createMany({ data: batch }).catch(() => { /* never throw */ });
  }
  if (requestLogQueue.length > 0) {
    const batch = requestLogQueue.splice(0, requestLogQueue.length);
    prisma.requestLog.createMany({ data: batch }).catch(() => { /* never throw */ });
  }
}

// Drain every 2 seconds — completely decoupled from request lifecycle
setInterval(flushQueues, 2000).unref(); // .unref() so it doesn't keep the process alive

// Flush on graceful shutdown
process.on("beforeExit", () => { void flushQueues(); });
process.on("SIGTERM", () => { void flushQueues(); });

// ── Console output ─────────────────────────────────────────────────────
const PREFIX: Record<LogLevel, string> = {
  INFO:  "ℹ️  [INFO]",
  WARN:  "⚠️  [WARN]",
  ERROR: "🔴 [ERROR]",
  DEBUG: "🐛 [DEBUG]",
};

function consoleLog(level: LogLevel, context: string, message: string, meta?: LogMeta) {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : "";
  const line = `${ts} ${PREFIX[level]} [${context}] ${message}${metaStr}`;
  if (level === "ERROR") console.error(line);
  else if (level === "WARN") console.warn(line);
  else console.log(line);
}

// ── Public API — synchronous from caller's perspective ─────────────────
export const logger = {
  info(context: string, message: string, meta?: LogMeta, userId?: string) {
    consoleLog("INFO", context, message, meta);
    appLogQueue.push({ level: "INFO", context, message, meta: (meta ?? undefined) as object | undefined, userId: userId ?? null, createdAt: new Date() });
  },
  warn(context: string, message: string, meta?: LogMeta, userId?: string) {
    consoleLog("WARN", context, message, meta);
    appLogQueue.push({ level: "WARN", context, message, meta: (meta ?? undefined) as object | undefined, userId: userId ?? null, createdAt: new Date() });
  },
  error(context: string, message: string, meta?: LogMeta, userId?: string) {
    consoleLog("ERROR", context, message, meta);
    appLogQueue.push({ level: "ERROR", context, message, meta: (meta ?? undefined) as object | undefined, userId: userId ?? null, createdAt: new Date() });
  },
  debug(context: string, message: string, meta?: LogMeta, userId?: string) {
    if (process.env.NODE_ENV === "production") return; // skip debug in prod
    consoleLog("DEBUG", context, message, meta);
    appLogQueue.push({ level: "DEBUG", context, message, meta: (meta ?? undefined) as object | undefined, userId: userId ?? null, createdAt: new Date() });
  },
};

// ── Request log enqueue (called from requestLogger middleware) ─────────
export function enqueueRequestLog(entry: QueuedRequestLog) {
  requestLogQueue.push(entry);
}
