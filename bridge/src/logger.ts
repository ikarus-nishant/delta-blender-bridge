import fs from "node:fs";
import path from "node:path";

export interface Logger {
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

function writeLine(filePath: string, level: string, message: string, meta?: unknown) {
  const line = {
    time: new Date().toISOString(),
    level,
    message,
    meta,
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(line)}\n`, "utf8");
}

export function createLogger(logFilePath?: string): Logger {
  const sink = (level: string, message: string, meta?: unknown) => {
    if (logFilePath) {
      writeLine(logFilePath, level, message, meta);
    }
    const method = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    method(`[bridge:${level}] ${message}`, meta ?? "");
  };

  return {
    info: (message, meta) => sink("info", message, meta),
    warn: (message, meta) => sink("warn", message, meta),
    error: (message, meta) => sink("error", message, meta),
  };
}
