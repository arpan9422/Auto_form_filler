import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { AuthRequest } from "./auth";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const userId = (req as AuthRequest).userId;
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;

  logger.error("errorHandler", err.message, {
    method: req.method,
    path: req.path,
    statusCode,
    stack: err.stack?.slice(0, 800),
  }, userId);

  if (isAppError) {
    res.status(statusCode).json({
      error: err.message,
      details: err.details,
    });
    return;
  }

  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};
