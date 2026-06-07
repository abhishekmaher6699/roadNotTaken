import type { NextFunction, Request, Response } from "express";
import { observabilityConfig } from "../config/observability";
import { logger } from "../utils/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  if (!observabilityConfig.requestLoggingEnabled) {
    return next();
  }

  if (req.method === "OPTIONS" && !observabilityConfig.requestLoggingIncludeOptions) {
    return next();
  }

  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    logger[level]("API request", {
      method: req.method,
      path: req.originalUrl,
      status: statusCode,
      duration_ms: Math.round(durationMs),
    });
  });

  return next();
}
