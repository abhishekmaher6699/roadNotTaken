import { Pool } from 'pg';

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
      console.error("Unexpected idle database client error:", err);
    });
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
