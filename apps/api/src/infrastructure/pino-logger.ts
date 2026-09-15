import type { Logger, LogContext } from "@monoplate/logger";
import pino, { type Logger as PinoLogger } from "pino";

function adapt(instance: PinoLogger): Logger {
  return {
    debug: (message, context) => instance.debug(context, message),
    info: (message, context) => instance.info(context, message),
    warn: (message, context) => instance.warn(context, message),
    error: (message, error, context) => instance.error({ ...context, err: error }, message),
    child: (context: LogContext) => adapt(instance.child(context)),
  };
}

export function createLogger(): Logger {
  return adapt(pino({
    level: process.env.LOG_LEVEL ?? "info",
    redact: ["req.headers.authorization", "password", "token", "accessToken", "refreshToken"],
  }));
}
