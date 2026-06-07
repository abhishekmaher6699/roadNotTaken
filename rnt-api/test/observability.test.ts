import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { queryDb } from '../src/config/db';
import { requestLogger } from '../src/middleware/request-logger.middleware';

describe('Observability toggles', () => {
  const originalEnv = {
    REQUEST_LOGGING_ENABLED: process.env.REQUEST_LOGGING_ENABLED,
    REQUEST_LOGGING_INCLUDE_OPTIONS: process.env.REQUEST_LOGGING_INCLUDE_OPTIONS,
    DB_QUERY_LOGGING_ENABLED: process.env.DB_QUERY_LOGGING_ENABLED,
    DB_SLOW_QUERY_MS: process.env.DB_SLOW_QUERY_MS,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value == null) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    vi.restoreAllMocks();
  });

  function buildTestApp() {
    const app = express();
    app.use(requestLogger);
    app.get('/ok', (_req, res) => res.json({ ok: true }));
    app.options('/ok', (_req, res) => res.sendStatus(204));
    return app;
  }

  it('should skip API request logs when request logging is disabled', async () => {
    process.env.REQUEST_LOGGING_ENABLED = 'false';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await request(buildTestApp()).get('/ok').expect(200);

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should skip OPTIONS request logs by default', async () => {
    process.env.REQUEST_LOGGING_ENABLED = 'true';
    process.env.REQUEST_LOGGING_INCLUDE_OPTIONS = 'false';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await request(buildTestApp()).options('/ok').expect(204);

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should suppress database query logs when DB logging is disabled', async () => {
    process.env.DB_QUERY_LOGGING_ENABLED = 'false';
    process.env.DB_SLOW_QUERY_MS = '1';
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      queryDb('observability.disabled_failure', 'SELECT * FROM missing_observability_table'),
    ).rejects.toThrow();

    expect(errorSpy).not.toHaveBeenCalledWith(
      'Database query failed',
      expect.anything(),
    );
  });

  it('should include query names in database failure logs when DB logging is enabled', async () => {
    process.env.DB_QUERY_LOGGING_ENABLED = 'true';
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      queryDb('observability.named_failure', 'SELECT * FROM missing_observability_table'),
    ).rejects.toThrow();

    expect(errorSpy).toHaveBeenCalledWith(
      'Database query failed',
      expect.objectContaining({
        name: 'observability.named_failure',
      }),
    );
  });
});
