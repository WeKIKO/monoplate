import { describe, expect, it } from "vitest";
import { getReadiness } from "./get-readiness.js";

describe("getReadiness", () => {
  it("reports the probe result without knowing its infrastructure", async () => {
    await expect(getReadiness({ check: async () => true })).resolves.toEqual({ status: "ok" });
    await expect(getReadiness({ check: async () => false })).resolves.toEqual({ status: "unavailable" });
  });
});
