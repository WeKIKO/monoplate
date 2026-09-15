import { createApiRouter } from "../../http/route-factory.js";
import { PostgresReadinessProbe } from "../../infrastructure/postgres-readiness-probe.js";
import type { ApiModuleFactory } from "../types.js";
import { createHealthRoute } from "./http/health.route.js";

export const createHealthModule: ApiModuleFactory = (dependencies) => {
  const probe = dependencies.database
    ? new PostgresReadinessProbe(dependencies.database, dependencies.logger)
    : { check: async () => process.env.NODE_ENV !== "production" };
  const routes = createApiRouter();
  routes.route("/", createHealthRoute(probe));
  return { name: "health", routes };
};
