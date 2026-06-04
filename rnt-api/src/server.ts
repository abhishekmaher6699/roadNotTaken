import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import { closePool } from './config/db';

const PORT = process.env.PORT || 5000;
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 30000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.setTimeout(REQUEST_TIMEOUT_MS);

async function shutdown(signal: NodeJS.Signals) {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async (err) => {
    if (err) {
      console.error("Error while closing HTTP server:", err);
      process.exit(1);
    }

    try {
      await closePool();
      process.exit(0);
    } catch (poolError) {
      console.error("Error while closing database pool:", poolError);
      process.exit(1);
    }
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
