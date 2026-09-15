import { AppError } from "@monoplate/errors";
import type { IdempotencyRepository } from "@monoplate/database";
import { createMiddleware } from "hono/factory";
import type { ApiEnvironment } from "./route-factory.js";
export function idempotency(repository: IdempotencyRepository) {
  return createMiddleware<ApiEnvironment>(async (context, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(context.req.method)) return next();
    const key = context.req.header("idempotency-key");
    if (!key) return next();
    if (key.length > 200) throw new AppError("VALIDATION_ERROR", "Idempotency-Key is too long");
    const existing = await repository.get(key);
    if (existing) { if (existing.method !== context.req.method || existing.path !== context.req.path) throw new AppError("CONFLICT", "Idempotency-Key was already used for a different request"); context.header("Idempotency-Replayed", "true"); return new Response(JSON.stringify(existing.body), { status: existing.status, headers: { "content-type": "application/json", "Idempotency-Replayed": "true" } }); }
    await next();
    if (context.res.status < 500 && context.res.headers.get("content-type")?.includes("application/json")) { const body = await context.res.clone().json(); await repository.put(key, { method: context.req.method, path: context.req.path, status: context.res.status, body }, new Date(Date.now() + 86_400_000)); }
  });
}
