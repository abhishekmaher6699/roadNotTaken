import { Pool } from 'pg';
import type { QueryConfig, QueryConfigValues, QueryResult, QueryResultRow } from 'pg';
import { attachDbObservability, withDbQueryName } from './db-observability';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

function getNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not defined");
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: getNumberEnv("DB_POOL_MAX", 20),
      idleTimeoutMillis: getNumberEnv("DB_IDLE_TIMEOUT_MS", 30000),
      connectionTimeoutMillis: getNumberEnv("DB_CONNECTION_TIMEOUT_MS", 5000),
    });

    pool.on("error", (err) => {
      logger.error("Unexpected idle database client error", { error: err });
    });

    attachDbObservability(pool);
  }

  return pool;
}

export async function closePool() {
  if (!pool) {
    return;
  }

  const currentPool = pool;
  pool = null;
  await currentPool.end();
}

export function queryDb<R extends QueryResultRow = any, I = any[]>(
  name: string,
  queryText: string | QueryConfig<I>,
  values?: QueryConfigValues<I>,
): Promise<QueryResult<R>> {
  return withDbQueryName(name, () => getPool().query<R, I>(queryText as any, values as any));
}

export function runDbQueryWithName<T>(name: string, run: () => T): T {
  return withDbQueryName(name, run);
}
