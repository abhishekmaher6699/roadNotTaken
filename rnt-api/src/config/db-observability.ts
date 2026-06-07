import { AsyncLocalStorage } from "async_hooks";
import type { Pool } from "pg";
import { observabilityConfig } from "./observability";
import { logger } from "../utils/logger";

const queryNameStorage = new AsyncLocalStorage<string>();

export function withDbQueryName<T>(name: string, run: () => T): T {
  return queryNameStorage.run(name, run);
}

function getCurrentQueryName() {
  return queryNameStorage.getStore();
}

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
  if (!observabilityConfig.dbQueryLoggingEnabled) {
    return;
  }

  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

  if (durationMs >= thresholdMs) {
    const name = getCurrentQueryName();

    logger.warn("Slow database query", {
      ...(name ? { name } : {}),
      duration_ms: Math.round(durationMs),
      threshold_ms: thresholdMs,
      sql: summarizeSql(sql),
    });
  }
}

function logQueryError(startedAt: bigint, sql: unknown, error: unknown) {
  if (!observabilityConfig.dbQueryLoggingEnabled) {
    return;
  }

  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
  const name = getCurrentQueryName();

  logger.error("Database query failed", {
    ...(name ? { name } : {}),
    duration_ms: Math.round(durationMs),
    sql: summarizeSql(sql),
    error,
  });
}

function observeQuery(
  originalQuery: (...args: any[]) => unknown,
  slowQueryThresholdMs: number,
) {
  return (...args: any[]) => {
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
}

const observedClients = new WeakSet<object>();

function attachClientObservability(client: { query: (...args: any[]) => unknown }, slowQueryThresholdMs: number) {
  if (observedClients.has(client)) {
    return;
  }

  observedClients.add(client);
  client.query = observeQuery(client.query.bind(client), slowQueryThresholdMs);
}

export function attachDbObservability(pool: Pool) {
  const originalQuery = pool.query.bind(pool) as (...args: any[]) => unknown;
  const originalConnect = pool.connect.bind(pool) as (...args: any[]) => unknown;

  pool.query = observeQuery(originalQuery, observabilityConfig.dbSlowQueryMs) as unknown as Pool["query"];
  pool.connect = ((...args: any[]) => {
    const callback = args[0];

    if (typeof callback === "function") {
      return originalConnect((error: unknown, client: any, done: unknown) => {
        if (client) {
          attachClientObservability(client, observabilityConfig.dbSlowQueryMs);
        }

        callback(error, client, done);
      });
    }

    const result = originalConnect(...args);

    if (result && typeof (result as Promise<unknown>).then === "function") {
      return (result as Promise<any>).then((client) => {
        attachClientObservability(client, observabilityConfig.dbSlowQueryMs);
        return client;
      });
    }

    return result;
  }) as unknown as Pool["connect"];
}
