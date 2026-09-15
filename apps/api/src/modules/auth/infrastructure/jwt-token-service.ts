import { createHash, randomBytes } from "node:crypto";
import type { TokenService, UserRole } from "@monoplate/auth";
import { jwtVerify, SignJWT } from "jose";
export type AccessIdentity = Readonly<{ id: string; email: string; role: UserRole }>;
export class JwtTokenService implements TokenService {
  readonly #secret: Uint8Array;
  constructor(secret: string, private readonly accessTtlSeconds: number) { this.#secret = new TextEncoder().encode(secret); }
  createAccessToken(user: AccessIdentity) { return new SignJWT({ email: user.email, role: user.role }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setSubject(user.id).setIssuedAt().setExpirationTime(`${this.accessTtlSeconds}s`).sign(this.#secret); }
  createRefreshToken() { return randomBytes(48).toString("base64url"); }
  hashRefreshToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
  async verifyAccessToken(token: string): Promise<AccessIdentity> { const { payload } = await jwtVerify(token, this.#secret, { algorithms: ["HS256"] }); if (!payload.sub || typeof payload.email !== "string" || (payload.role !== "admin" && payload.role !== "member")) throw new Error("Invalid access token claims"); return { id: payload.sub, email: payload.email, role: payload.role }; }
}
