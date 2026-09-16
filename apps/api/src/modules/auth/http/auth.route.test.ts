import { describe, expect, it, vi } from "vitest";
import type { AuthRepository, Session, User, UserRole } from "@monoplate/auth";
import { AuthService } from "#api/modules/auth/auth-service.js";
import { JwtTokenService } from "#api/modules/auth/infrastructure/jwt-token-service.js";
import { createAuthRoute } from "./auth.route.js";
import { createApp } from "#api/app.js";
import { noopLogger } from "@monoplate/logger";

const user: User = { id: "878a9dc8-fd7e-4eeb-bc4d-01e196ffe043", email: "admin@example.com", passwordHash: "unused", role: "admin" };
class MemoryRepository implements AuthRepository {
  sessions = new Map<string, Session>();
  async findUserByEmail() { return user; } async findUserById() { return user; }
  async createUser(input: { email: string; passwordHash: string; role: UserRole }) { return { ...user, ...input }; }
  async createSession(input: { refreshTokenHash: string; expiresAt: Date }) { const session = { id: "1", user, expiresAt: input.expiresAt }; this.sessions.set(input.refreshTokenHash, session); return session; }
  async findSession(hash: string) { return this.sessions.get(hash); }
  async revokeSession(hash: string) { this.sessions.delete(hash); }
}
function fixture() { const service = new AuthService(new MemoryRepository(), new JwtTokenService("test-secret-that-is-at-least-32-characters", 900), 30); vi.spyOn(service.passwords, "verify").mockResolvedValue(true); return service; }
describe("auth routes", () => {
  it("logs in and resolves the bearer identity", async () => { const route = createAuthRoute(fixture()); const login = await route.request("/api/v1/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: user.email, password: "password-123" }) }); expect(login.status).toBe(200); const payload = await login.json() as { data: { accessToken: string } }; const me = await route.request("/api/v1/auth/me", { headers: { authorization: `Bearer ${payload.data.accessToken}` } }); expect(me.status).toBe(200); expect(await me.json()).toMatchObject({ data: { email: user.email, role: "admin" } }); });
  it("protects me", async () => { expect((await createApp(noopLogger, undefined, fixture()).request("/api/v1/auth/me")).status).toBe(401); });
});
