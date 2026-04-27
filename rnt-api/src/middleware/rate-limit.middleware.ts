import { NextFunction, Response } from "express";

interface RateLimitOptions {
  keyPrefix: string;
  windowMs: number;
  max: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const { keyPrefix, windowMs, max } = options;

  return function rateLimitMiddleware(
    req: any,
    res: Response,
    next: NextFunction,
  ) {
    const actorKey =
      req.user?.id ??
      req.ip ??
      req.headers["x-forwarded-for"] ??
      "anonymous";
    const key = `${keyPrefix}:${String(actorKey)}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (existing.count >= max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      );
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({
        error: "Too many requests. Please slow down and try again shortly.",
      });
    }

    existing.count += 1;
    buckets.set(key, existing);
    return next();
  };
}
