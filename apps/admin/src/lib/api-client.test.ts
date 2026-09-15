import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./api-client";

afterEach(() => vi.unstubAllGlobals());
describe("apiRequest", () => {
  it("parses JSON on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { status: "ok" } }), { status: 200 })));
    await expect(apiRequest("/health/ready")).resolves.toEqual({ data: { status: "ok" } });
  });
  it("rejects non-success responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    await expect(apiRequest("/health/ready")).rejects.toThrow("API request failed (500)");
  });
});
