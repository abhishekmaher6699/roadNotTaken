import type { Pool } from "pg";
import { observabilityConfig } from "./observability";
import { logger } from "../utils/logger";

function summarizeSql(sql: unknown) {
  const text =
    typeof sql === "string"
      ? sql
      : typeof sql === "object" && sql && "text" in sql
        ? String((sql as { text?: unknown }).text ?? "")
        : "";

  return text.replace(/\s+/g, " ").trim().slice(0, 220);
}

function logQueryTiming(startedAt: bigint, thresholdMs: number, sql: unknown) {
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

  if (durationMs >= thresholdMs) {
    logger.warn("Slow database query", {
      duration_ms: Math.round(durationMs),
      threshold_ms: thresholdMs,
      sql: summarizeSql(sql),
    });
  }
}

function logQueryError(startedAt: bigint, sql: unknown, error: unknown) {
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

  logger.error("Database query failed", {
    duration_ms: Math.round(durationMs),
    sql: summarizeSql(sql),
    error,
  });
}

export function attachDbObservability(pool: Pool) {
  if (!observabilityConfig.dbQueryLoggingEnabled) {
    return;
  }

  const originalQuery = pool.query.bind(pool) as (...args: any[]) => unknown;
  const slowQueryThresholdMs = observabilityConfig.dbSlowQueryMs;

  const observedQuery = (...args: any[]) => {
    const startedAt = process.hrtime.bigint();
    const callback = args[args.length - 1];

    if (typeof callback === "function") {
      const wrappedCallback = (error: unknown, result: unknown) => {
        if (error) {
          logQueryError(startedAt, args[0], error);
        } else {
          logQueryTiming(startedAt, slowQueryThresholdMs, args[0]);
        }

        callback(error, result);
      };

      return originalQuery(...args.slice(0, -1), wrappedCallback);
    }

    const result = originalQuery(...args);

    if (result && typeof (result as Promise<unknown>).then === "function") {
      return (result as Promise<unknown>)
        .then((queryResult) => {
          logQueryTiming(startedAt, slowQueryThresholdMs, args[0]);
          return queryResult;
        })
        .catch((error) => {
          logQueryError(startedAt, args[0], error);
          throw error;
        });
    }

    return result;
  };

  pool.query = observedQuery as unknown as Pool["query"];
}
