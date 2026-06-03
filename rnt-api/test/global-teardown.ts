import { getPool } from '../src/config/db';

export default async function globalTeardown() {
  try {
    await getPool().end();
  } catch {
    // The pool may never be initialized in narrow test runs.
  }
}
