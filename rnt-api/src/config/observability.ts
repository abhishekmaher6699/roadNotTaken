function getBooleanEnv(name: string, fallback: boolean) {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value);
}

function getNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const observabilityConfig = {
  requestLoggingEnabled: getBooleanEnv("REQUEST_LOGGING_ENABLED", true),
  requestLoggingIncludeOptions: getBooleanEnv("REQUEST_LOGGING_INCLUDE_OPTIONS", false),
  dbQueryLoggingEnabled: getBooleanEnv("DB_QUERY_LOGGING_ENABLED", true),
  dbSlowQueryMs: getNumberEnv("DB_SLOW_QUERY_MS", 300),
};
