import { describe, expect, it } from "vitest";
import { createHealthRoute } from "./health.route.js";

describe("readiness route", () => {
  it("returns 503 when a required dependency is unavailable", async () => {
    const response = await createHealthRoute({ check: async () => false }).request("/health/ready");
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ data: { status: "unavailable" } });
  });
});
