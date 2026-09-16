import { serve } from "@hono/node-server";
import { createDatabaseConnection } from "@monoplate/database";
import { loadWorkspaceEnvironment } from "@monoplate/config/load";
import { parseServerEnv } from "@monoplate/config/server";
import { DrizzleAuthRepository } from "@monoplate/postgres-adapters/auth";
import { createApp } from "./app.js";
import { createLogger } from "./infrastructure/pino-logger.js";
import { AuthService } from "./modules/auth/auth-service.js";
import { JwtTokenService } from "./modules/auth/infrastructure/jwt-token-service.js";
import { initializeTelemetry } from "./observability/telemetry.js";

loadWorkspaceEnvironment();
const env = parseServerEnv();
const logger = createLogger();
async function start() {
  const telemetry = await initializeTelemetry(env);
  const databaseConnection = env.DATABASE_URL ? createDatabaseConnection(env.DATABASE_URL, { max: env.DB_POOL_MAX, connectTimeoutSeconds: env.DB_CONNECT_TIMEOUT_SECONDS, idleTimeoutSeconds: env.DB_IDLE_TIMEOUT_SECONDS, statementTimeoutMs: env.DB_STATEMENT_TIMEOUT_MS, applicationName: env.OTEL_SERVICE_NAME }) : undefined;
  const auth = databaseConnection && env.AUTH_JWT_SECRET ? new AuthService(new DrizzleAuthRepository(databaseConnection.db), new JwtTokenService(env.AUTH_JWT_SECRET, env.AUTH_ACCESS_TTL_SECONDS), env.AUTH_REFRESH_TTL_DAYS) : undefined;
  const server = serve({ fetch: createApp(logger, databaseConnection?.db, auth, { corsOrigins: env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean), bodyLimitBytes: env.API_BODY_LIMIT_BYTES, requestTimeoutMs: env.API_REQUEST_TIMEOUT_MS, rateLimitMax: env.API_RATE_LIMIT_MAX, rateLimitWindowMs: env.API_RATE_LIMIT_WINDOW_MS }).fetch, port: env.PORT });
  logger.info("API started", { port: env.PORT, service: env.OTEL_SERVICE_NAME });
  function shutdown(signal: string) { logger.info("Shutting down", { signal }); server.close(async (error) => { if (error) { logger.error("Shutdown failed", error); process.exitCode = 1; } await databaseConnection?.close(); await telemetry?.shutdown(); }); }
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}
void start().catch((error) => { logger.error("API startup failed", error); process.exitCode = 1; });
