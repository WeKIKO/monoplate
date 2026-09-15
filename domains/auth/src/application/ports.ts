import type { Session, User, UserRole } from "../domain/auth.js";
export interface AuthRepository {
  findUserByEmail(email: string): Promise<User | undefined>;
  findUserById(id: string): Promise<User | undefined>;
  createUser(input: Readonly<{ email: string; passwordHash: string; role: UserRole }>): Promise<User>;
  createSession(input: Readonly<{ userId: string; refreshTokenHash: string; expiresAt: Date }>): Promise<Session>;
  findSession(refreshTokenHash: string): Promise<Session | undefined>;
  revokeSession(refreshTokenHash: string): Promise<void>;
}
export interface PasswordHasher { hash(password: string): Promise<string>; verify(password: string, hash: string): Promise<boolean>; }
export interface TokenService { createAccessToken(user: Pick<User, "id" | "email" | "role">): Promise<string>; createRefreshToken(): string; hashRefreshToken(token: string): string; }
