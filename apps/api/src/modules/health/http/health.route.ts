import { HealthResponseSchema } from "@monoplate/contracts/health";
import { getHealth, getReadiness, type ReadinessProbe } from "@monoplate/health";
import { createApiRouter, createRoute, jsonContent, standardErrorResponses } from "../../../http/route-factory.js";

const liveDefinition = createRoute({
  method: "get",
  path: "/health/live",
  tags: ["health"],
  summary: "Liveness probe",
  responses: { 200: jsonContent(HealthResponseSchema, "The process is alive"), ...standardErrorResponses },
});

const readyDefinition = createRoute({
  method: "get",
  path: "/health/ready",
  tags: ["health"],
  summary: "Readiness probe",
  responses: {
    200: jsonContent(HealthResponseSchema, "The service is ready"),
    503: jsonContent(HealthResponseSchema, "A required dependency is unavailable"),
    ...standardErrorResponses,
  },
});
const startupDefinition = createRoute({ method: "get", path: "/health/startup", tags: ["health"], summary: "Startup probe", responses: { 200: jsonContent(HealthResponseSchema, "Startup completed"), 503: jsonContent(HealthResponseSchema, "Startup dependency unavailable"), ...standardErrorResponses } });

export function createHealthRoute(readinessProbe: ReadinessProbe) {
  return createApiRouter()
    .openapi(liveDefinition, (context) => context.json(HealthResponseSchema.parse({ data: getHealth() }), 200))
    .openapi(startupDefinition, async (context) => { const response = HealthResponseSchema.parse({ data: await getReadiness(readinessProbe) }); return response.data.status === "ok" ? context.json(response, 200) : context.json(response, 503); })
    .openapi(readyDefinition, async (context) => {
      const response = HealthResponseSchema.parse({ data: await getReadiness(readinessProbe) });
      return response.data.status === "ok" ? context.json(response, 200) : context.json(response, 503);
    });
}
