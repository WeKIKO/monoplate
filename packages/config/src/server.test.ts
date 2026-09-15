import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./server.js";
describe("server environment", () => {
  it("requires production secrets", () => { expect(() => parseServerEnv({ NODE_ENV: "production" })).toThrow(); });
  it("accepts development defaults", () => { expect(parseServerEnv({}).PORT).toBe(3000); });
  it("requires bootstrap credentials as a pair", () => { expect(() => parseServerEnv({ AUTH_BOOTSTRAP_EMAIL: "admin@example.com" })).toThrow(); });
});
