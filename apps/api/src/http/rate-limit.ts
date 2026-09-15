import { AppError } from "@monoplate/errors";
import { createMiddleware } from "hono/factory";
import type { ApiEnvironment } from "./route-factory.js";

export function rateLimit(options: Readonly<{ windowMs: number; max: number }>) {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return createMiddleware<ApiEnvironment>(async (context, next) => {
    const now = Date.now();
    const key = context.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 1, resetAt: now + options.windowMs } : { ...current, count: current.count + 1 };
    buckets.set(key, bucket);
    context.header("RateLimit-Limit", String(options.max));
    context.header("RateLimit-Remaining", String(Math.max(0, options.max - bucket.count)));
    context.header("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > options.max) throw new AppError("RATE_LIMITED", "Too many requests");
    if (buckets.size > 10_000) for (const [id, value] of buckets) if (value.resetAt <= now) buckets.delete(id);
    await next();
  });
}
