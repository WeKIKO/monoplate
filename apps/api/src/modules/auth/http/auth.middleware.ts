import { AppError } from "@monoplate/errors";
import { createMiddleware } from "hono/factory";
import type { AuthService } from "#api/modules/auth/auth-service.js";
import type { ApiEnvironment } from "#api/http/route-factory.js";

export function requireAuthentication(auth: AuthService) {
  return createMiddleware<ApiEnvironment>(async (context, next) => {
    const header = context.req.header("authorization");
    if (!header?.startsWith("Bearer ")) throw new AppError("UNAUTHORIZED", "Bearer token is required");
    context.set("authUser", await auth.identity(header.slice(7)));
    await next();
  });
}
export function requirePermission(auth: AuthService, permission: string) {
  return createMiddleware<ApiEnvironment>(async (context, next) => { auth.requirePermission(context.get("authUser"), permission); await next(); });
}
