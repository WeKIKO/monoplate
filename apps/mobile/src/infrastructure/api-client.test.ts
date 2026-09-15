import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./api-client";

afterEach(() => vi.unstubAllGlobals());
describe("apiRequest", () => {
  it("parses successful JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: "ok" }), { status: 200 })));
    await expect(apiRequest("/health/live")).resolves.toEqual({ data: "ok" });
  });
  it("raises a typed error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(apiRequest("/health/ready")).rejects.toBeInstanceOf(ApiError);
  });
});
