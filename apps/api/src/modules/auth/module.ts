import { createApiRouter } from "#api/http/route-factory.js";
import type { ApiModuleFactory } from "#api/modules/types.js";
import { createAuthRoute } from "./http/auth.route.js";
export const createAuthModule: ApiModuleFactory = (dependencies) => { const routes = createApiRouter(); if (dependencies.auth) routes.route("/", createAuthRoute(dependencies.auth)); return { name: "auth", routes }; };
