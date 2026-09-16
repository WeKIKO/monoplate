import { AuthResponseSchema, LoginRequestSchema, LogoutResponseSchema, MeResponseSchema, RefreshRequestSchema } from "@monoplate/contracts/auth";
import { JsonContentTypeHeaderSchema } from "@monoplate/contracts/http";
import { createApiRouter, createRoute, jsonContent, standardErrorResponses } from "#api/http/route-factory.js";
import type { AuthService } from "#api/modules/auth/auth-service.js";
import { requireAuthentication } from "./auth.middleware.js";

const body = <T>(schema: T) => ({ headers: JsonContentTypeHeaderSchema, body: { required: true, content: { "application/json": { schema } } } } as const);
const login = createRoute({ method: "post", path: "/api/v1/auth/login", tags: ["auth"], request: body(LoginRequestSchema), responses: { 200: jsonContent(AuthResponseSchema, "Authenticated"), ...standardErrorResponses } });
const refresh = createRoute({ method: "post", path: "/api/v1/auth/refresh", tags: ["auth"], request: body(RefreshRequestSchema), responses: { 200: jsonContent(AuthResponseSchema, "Tokens rotated"), ...standardErrorResponses } });
const logout = createRoute({ method: "post", path: "/api/v1/auth/logout", tags: ["auth"], request: body(RefreshRequestSchema), responses: { 200: jsonContent(LogoutResponseSchema, "Session revoked"), ...standardErrorResponses } });
const me = createRoute({ method: "get", path: "/api/v1/auth/me", tags: ["auth"], responses: { 200: jsonContent(MeResponseSchema, "Current user"), ...standardErrorResponses } });
export function createAuthRoute(auth: AuthService) {
  const router = createApiRouter();
  router.use("/api/v1/auth/me", requireAuthentication(auth));
  return router
    .openapi(login, async (context) => context.json(AuthResponseSchema.parse({ data: await auth.login(context.req.valid("json").email, context.req.valid("json").password) }), 200))
    .openapi(refresh, async (context) => context.json(AuthResponseSchema.parse({ data: await auth.refresh(context.req.valid("json").refreshToken) }), 200))
    .openapi(logout, async (context) => { await auth.logout(context.req.valid("json").refreshToken); return context.json({ data: { success: true as const } }, 200); })
    .openapi(me, async (context) => context.json(MeResponseSchema.parse({ data: context.get("authUser") }), 200));
}
