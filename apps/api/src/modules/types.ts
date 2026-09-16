import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Database } from "@monoplate/database";
import type { Logger } from "@monoplate/logger";
import type { AuthService } from "./auth/auth-service.js";
import type { ApiEnvironment } from "#api/http/route-factory.js";

export type ApiModule = Readonly<{
  name: string;
  routes: OpenAPIHono<ApiEnvironment>;
}>;

export type ApiDependencies = Readonly<{
  logger: Logger;
  database?: Database;
  auth?: AuthService;
}>;

export type ApiModuleFactory = (dependencies: ApiDependencies) => ApiModule;
