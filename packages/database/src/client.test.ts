import { describe, expect, it } from "vitest";
import { requireDatabaseUrl } from "./client.js";

describe("requireDatabaseUrl", () => {
  it("accepts a configured URL", () => {
    expect(requireDatabaseUrl({ DATABASE_URL: "postgresql://localhost/test" })).toBe("postgresql://localhost/test");
  });

  it("rejects a missing URL", () => {
    expect(() => requireDatabaseUrl({})).toThrow("DATABASE_URL is required");
  });

  it("rejects a blank URL", () => {
    expect(() => requireDatabaseUrl({ DATABASE_URL: "   " })).toThrow("DATABASE_URL is required");
  });
});
