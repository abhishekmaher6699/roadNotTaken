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
  get requestLoggingEnabled() {
    return getBooleanEnv("REQUEST_LOGGING_ENABLED", true);
  },

  get requestLoggingIncludeOptions() {
    return getBooleanEnv("REQUEST_LOGGING_INCLUDE_OPTIONS", false);
  },

  get dbQueryLoggingEnabled() {
    return getBooleanEnv("DB_QUERY_LOGGING_ENABLED", true);
  },

  get dbSlowQueryMs() {
    return getNumberEnv("DB_SLOW_QUERY_MS", 300);
  },
};
