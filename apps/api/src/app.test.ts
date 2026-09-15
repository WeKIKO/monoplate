import { describe, expect, it } from "vitest";
import { noopLogger } from "@monoplate/logger";
import { createApp } from "./app.js";

describe("health", () => {
  it("returns a healthy response", async () => {
    const response = await createApp(noopLogger).request("/health/live");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { status: "ok" } });
  });

  it("publishes the generated OpenAPI document", async () => {
    const response = await createApp(noopLogger).request("/openapi.json");
    const document = await response.json();
    expect(response.status).toBe(200);
    expect(document).toMatchObject({ openapi: "3.1.0", paths: { "/health/live": {}, "/health/ready": {} } });
  });

  it("adds correlation and API version headers", async () => {
    const response = await createApp(noopLogger).request("/health/live", { headers: { "x-request-id": "test-request" } });
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(response.headers.get("x-trace-id")).toMatch(/^[a-f0-9]{32}$/);
    expect(response.headers.get("x-api-version")).toBe("1");
  });

  it("exports Prometheus metrics", async () => {
    const app = createApp(noopLogger);
    await app.request("/health/live");
    const response = await app.request("/metrics");
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("monoplate_http_requests_total");
  });

  it("rate limits versioned endpoints", async () => {
    const app = createApp(noopLogger, undefined, undefined, { corsOrigins: [], bodyLimitBytes: 1024, requestTimeoutMs: 1000, rateLimitMax: 1, rateLimitWindowMs: 60_000 });
    expect((await app.request("/api/v1/unknown")).status).toBe(404);
    expect((await app.request("/api/v1/unknown")).status).toBe(429);
  });
});
