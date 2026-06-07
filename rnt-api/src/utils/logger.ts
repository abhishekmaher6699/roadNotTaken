type LogMeta = Record<string, unknown>;

function write(level: "info" | "warn" | "error", message: string, meta?: LogMeta) {
  const payload = meta && Object.keys(meta).length > 0 ? meta : undefined;

  if (level === "error") {
    console.error(message, payload ?? "");
    return;
  }

  if (level === "warn") {
    console.warn(message, payload ?? "");
    return;
  }

  console.log(message, payload ?? "");
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    write("info", message, meta);
  },

  warn(message: string, meta?: LogMeta) {
    write("warn", message, meta);
  },

  error(message: string, meta?: LogMeta) {
    write("error", message, meta);
  },
};
