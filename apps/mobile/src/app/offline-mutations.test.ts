import { describe, expect, it } from "vitest";
import { isConflictStatus, resolveConflict } from "./offline-mutations";
describe("offline conflicts", () => {
  it("recognizes optimistic concurrency responses", () => { expect(isConflictStatus(409)).toBe(true); expect(isConflictStatus(412)).toBe(true); expect(isConflictStatus(400)).toBe(false); });
  it("applies an explicit conflict choice", async () => { expect(await resolveConflict("keep-local", "local", "server")).toBe("local"); expect(await resolveConflict("accept-server", "local", "server")).toBe("server"); });
});
