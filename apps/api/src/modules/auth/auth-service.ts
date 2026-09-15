import { createAuthenticate, createRefresh, hasPermission, type AuthRepository } from "@monoplate/auth";
import { AppError } from "@monoplate/errors";
import type { JwtTokenService, AccessIdentity } from "./infrastructure/jwt-token-service.js";
import { NodePasswordHasher } from "./infrastructure/node-password-hasher.js";
export class AuthService {
  readonly #authenticate;
  readonly #refresh;
  readonly passwords = new NodePasswordHasher();
  constructor(readonly repository: AuthRepository, readonly tokens: JwtTokenService, refreshTtlDays: number) { this.#authenticate = createAuthenticate(repository, this.passwords, tokens, refreshTtlDays); this.#refresh = createRefresh(repository, tokens, refreshTtlDays); }
  async login(email: string, password: string) { try { return await this.#authenticate(email, password); } catch { throw new AppError("UNAUTHORIZED", "Invalid email or password"); } }
  async refresh(refreshToken: string) { try { return await this.#refresh(refreshToken); } catch { throw new AppError("UNAUTHORIZED", "Invalid refresh token"); } }
  async logout(refreshToken: string) { await this.repository.revokeSession(this.tokens.hashRefreshToken(refreshToken)); }
  async identity(accessToken: string): Promise<AccessIdentity> { try { return await this.tokens.verifyAccessToken(accessToken); } catch { throw new AppError("UNAUTHORIZED", "Invalid or expired access token"); } }
  requirePermission(identity: AccessIdentity, permission: string) { if (!hasPermission(identity.role, permission)) throw new AppError("FORBIDDEN", "Insufficient permission"); }
}
