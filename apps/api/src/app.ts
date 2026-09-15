import { ErrorResponseSchema } from "@monoplate/contracts/error";
import { AppError } from "@monoplate/errors";
import type { Logger } from "@monoplate/logger";
import { requestId } from "hono/request-id";
import { createApiRouter } from "./http/route-factory.js";
import { registerApiModules } from "./modules/index.js";
import { IdempotencyRepository, type Database } from "@monoplate/database";
import type { AuthService } from "./modules/auth/auth-service.js";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { rateLimit } from "./http/rate-limit.js";
import { ApiMetrics } from "./observability/metrics.js";
import { requestObservability } from "./observability/request-observability.js";
import { idempotency } from "./http/idempotency.js";

export type ApiRuntimeOptions = Readonly<{ corsOrigins: readonly string[]; bodyLimitBytes: number; requestTimeoutMs: number; rateLimitMax: number; rateLimitWindowMs: number }>;
const defaults: ApiRuntimeOptions = { corsOrigins: ["http://localhost:4321", "http://localhost:5173"], bodyLimitBytes: 1_048_576, requestTimeoutMs: 15_000, rateLimitMax: 120, rateLimitWindowMs: 60_000 };
export function createApp(logger: Logger, database?: Database, auth?: AuthService, options: ApiRuntimeOptions = defaults) {
  const app = createApiRouter();
  const metrics = new ApiMetrics();
  app.use("*", requestId());
  app.use("*", requestObservability(logger, metrics));
  app.use("*", secureHeaders());
  app.use("*", cors({ origin: [...options.corsOrigins], credentials: true }));
  app.use("*", bodyLimit({ maxSize: options.bodyLimitBytes, onError: (context) => context.json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Request payload is too large", requestId: context.get("requestId") } }, 413) }));
  app.use("*", timeout(options.requestTimeoutMs));
  app.use("/api/*", rateLimit({ max: options.rateLimitMax, windowMs: options.rateLimitWindowMs }));
  if (database) app.use("/api/v1/*", idempotency(new IdempotencyRepository(database)));
  app.onError((error, context) => {
    if (error instanceof AppError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : error.code === "CONFLICT" ? 409 : error.code === "RATE_LIMITED" ? 429 : 400;
      return context.json(ErrorResponseSchema.parse({ error: { code: error.code, message: error.message, requestId: context.get("requestId") } }), status);
    }
    if (error instanceof HTTPException) return context.json(ErrorResponseSchema.parse({ error: { code: error.status === 504 ? "REQUEST_TIMEOUT" : "HTTP_ERROR", message: error.message, requestId: context.get("requestId") } }), error.status);
    logger.error("Unhandled request error", error, { requestId: context.get("requestId") });
    return context.json(ErrorResponseSchema.parse({ error: { code: "INTERNAL_ERROR", message: "Internal server error", requestId: context.get("requestId") } }), 500);
  });

  registerApiModules(app, { logger, ...(database ? { database } : {}), ...(auth ? { auth } : {}) });
  app.get("/metrics", (context) => context.text(metrics.render(), 200, { "content-type": "text/plain; version=0.0.4; charset=utf-8" }));
  app.doc("/openapi.json", {
    openapi: "3.1.0",
    info: { title: "Monoplate API", version: "1.0.0", description: "Stable endpoints use the /api/v1 prefix. Breaking changes require a new major path." },
  });

  return app;
}
