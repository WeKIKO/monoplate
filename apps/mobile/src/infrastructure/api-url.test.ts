import { describe, expect, it } from "vitest";
import { resolveApiUrl } from "./api-url";
describe("API URL strategy", () => {
  it("maps Android emulator localhost to its host gateway", () => { expect(resolveApiUrl("http://localhost:3000", { platform: "android" })).toBe("http://10.0.2.2:3000"); });
  it("uses the Expo development host for physical devices", () => { expect(resolveApiUrl("http://localhost:3000", { platform: "android", devHost: "192.168.1.20:8081" })).toBe("http://192.168.1.20:3000"); });
  it("does not rewrite configured remote URLs", () => { expect(resolveApiUrl("https://api.example.com/", { platform: "android" })).toBe("https://api.example.com"); });
});
