import { describe, expect, it } from "vitest";
import { compareVersions, resolveUpdateMode } from "./version-policy";
describe("mobile version policy", () => {
  it("compares numeric version segments", () => { expect(compareVersions("1.10.0", "1.2.9")).toBe(1); expect(compareVersions("1.0", "1.0.0")).toBe(0); });
  it("distinguishes force and soft updates", () => { expect(resolveUpdateMode("1.0.0", { minimumVersion: "1.1.0" })).toBe("force"); expect(resolveUpdateMode("1.1.0", { minimumVersion: "1.0.0", recommendedVersion: "1.2.0" })).toBe("soft"); expect(resolveUpdateMode("1.2.0", { minimumVersion: "1.0.0", recommendedVersion: "1.2.0" })).toBe("none"); });
});
