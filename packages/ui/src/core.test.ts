import { describe, expect, it } from "vitest";
import { appPath, canTrack, formatDate, isFeatureEnabled, resolveTheme, webDeepLink } from "./core.js";

describe("frontend conventions", () => {
  it("resolves system themes", () => { expect(resolveTheme("system", true)).toBe("dark"); expect(resolveTheme("light", true)).toBe("light"); });
  it("defaults unknown feature flags safely", () => { expect(isFeatureEnabled({ beta: true }, "beta")).toBe(true); expect(isFeatureEnabled({}, "beta")).toBe(false); });
  it("requires consent and respects do-not-track", () => { expect(canTrack("granted")).toBe(true); expect(canTrack("granted", "1")).toBe(false); expect(canTrack("unknown")).toBe(false); });
  it("formats in an explicit locale and timezone", () => { expect(formatDate("2025-01-02T23:00:00Z", { locale: "en-US", timeZone: "UTC" })).toBe("Jan 2, 2025"); });
  it("uses one encoded route convention", () => { expect(appPath({ route: "resource", id: "a/b" })).toBe("/resources/a%2Fb"); expect(webDeepLink("https://example.com", { route: "settings" })).toBe("https://example.com/settings"); });
});
