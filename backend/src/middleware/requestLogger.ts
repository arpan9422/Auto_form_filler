import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { LogLevel } from "../generated/prisma";
import { enqueueRequestLog } from "../utils/logger";

const SENSITIVE_KEYS = new Set([
  "password", "token", "accessToken", "refreshToken",
  "otp", "secret", "apiKey", "authorization", "audio",
]);

function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > 4 || obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.slice(0, 10).map(v => sanitize(v, depth + 1));
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = "[REDACTED]";
    } else if (typeof val === "string" && val.length > 500) {
      result[key] = val.slice(0, 500) + "…[truncated]";
    } else {
      result[key] = sanitize(val, depth + 1);
    }
  }
  return result;
}

function levelFromStatus(status: number): LogLevel {
  if (status >= 500) return "ERROR";
  if (status >= 400) return "WARN";
  return "INFO";
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startMs = Date.now();

  res.on("finish", () => {
    // Response is already sent — enqueue the log entry, never block
    const durationMs = Date.now() - startMs;
    const status = res.statusCode;
    const userId = (req as AuthRequest).userId ?? null;

    enqueueRequestLog({
      method: req.method,
      path: req.path,
      statusCode: status,
      durationMs,
      userId,
      ip: req.ip ?? req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"]?.slice(0, 300) ?? null,
      body: (req.method !== "GET" && req.body ? sanitize(req.body) : undefined) as object | undefined,
      query: (Object.keys(req.query).length > 0 ? sanitize(req.query) : undefined) as object | undefined,
      level: levelFromStatus(status),
      createdAt: new Date(),
    });
  });

  next();
}
