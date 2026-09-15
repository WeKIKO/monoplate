import { trace } from "@opentelemetry/api";
import type { Logger } from "@monoplate/logger";
import { createMiddleware } from "hono/factory";
import type { ApiEnvironment } from "../http/route-factory.js";
import type { ApiMetrics } from "./metrics.js";
export function requestObservability(logger: Logger, metrics: ApiMetrics) {
  const tracer = trace.getTracer("monoplate-http");
  return createMiddleware<ApiEnvironment>(async (context, next) => tracer.startActiveSpan(`${context.req.method} ${context.req.path}`, async (span) => {
    const started = performance.now();
    try { await next(); span.setAttribute("http.response.status_code", context.res.status); }
    catch (error) { span.recordException(error instanceof Error ? error : new Error(String(error))); throw error; }
    finally { const durationMs = performance.now() - started; const traceId = span.spanContext().traceId; metrics.record(context.req.method, context.req.routePath || context.req.path, context.res.status, durationMs); context.header("X-Request-Id", context.get("requestId")); context.header("X-Trace-Id", traceId); context.header("X-Api-Version", "1"); logger.info("Request completed", { requestId: context.get("requestId"), traceId, method: context.req.method, path: context.req.path, status: context.res.status, durationMs }); span.end(); }
  }));
}
