import { describe, expect, it } from "vitest";
import { createAuthenticate, InvalidCredentialsError } from "./authenticate.js";
import type { AuthRepository, PasswordHasher, TokenService } from "./ports.js";
const user = { id: "1", email: "admin@example.com", passwordHash: "hash", role: "admin" as const };
const repository: AuthRepository = { findUserByEmail: async () => user, findUserById: async () => user, createUser: async () => user, createSession: async (input) => ({ id: "s", user, expiresAt: input.expiresAt }), findSession: async () => undefined, revokeSession: async () => undefined };
const passwords: PasswordHasher = { hash: async () => "hash", verify: async (password) => password === "correct" };
const tokens: TokenService = { createAccessToken: async () => "access", createRefreshToken: () => "refresh", hashRefreshToken: () => "digest" };
describe("authenticate", () => {
  it("issues tokens for valid credentials", async () => { await expect(createAuthenticate(repository, passwords, tokens, 30)(user.email, "correct")).resolves.toMatchObject({ accessToken: "access", refreshToken: "refresh" }); });
  it("rejects invalid credentials", async () => { await expect(createAuthenticate(repository, passwords, tokens, 30)(user.email, "wrong")).rejects.toBeInstanceOf(InvalidCredentialsError); });
});
