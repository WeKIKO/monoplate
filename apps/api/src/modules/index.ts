import type { OpenAPIHono } from "@hono/zod-openapi";
import { createAuthModule } from "./auth/module.js";
import { createHealthModule } from "./health/module.js";
import type { ApiDependencies, ApiModuleFactory } from "./types.js";
import type { ApiEnvironment } from "#api/http/route-factory.js";

export const apiModuleFactories: readonly ApiModuleFactory[] = [createAuthModule, createHealthModule];

export function registerApiModules(app: OpenAPIHono<ApiEnvironment>, dependencies: ApiDependencies) {
  for (const factory of apiModuleFactories) app.route("/", factory(dependencies).routes);
}
