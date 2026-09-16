import type { AuthTokens } from "#auth/domain/auth.js";
import type { AuthRepository, PasswordHasher, TokenService } from "./ports.js";

export class InvalidCredentialsError extends Error {}
export function createAuthenticate(repository: AuthRepository, passwords: PasswordHasher, tokens: TokenService, refreshTtlDays: number) {
  return async (email: string, password: string): Promise<AuthTokens> => {
    const user = await repository.findUserByEmail(email.trim().toLowerCase());
    if (!user || !await passwords.verify(password, user.passwordHash)) throw new InvalidCredentialsError("Invalid email or password");
    return issueTokens(repository, tokens, user, refreshTtlDays);
  };
}
export async function issueTokens(repository: AuthRepository, tokens: TokenService, user: Parameters<TokenService["createAccessToken"]>[0], refreshTtlDays: number): Promise<AuthTokens> {
  const refreshToken = tokens.createRefreshToken();
  await repository.createSession({ userId: user.id, refreshTokenHash: tokens.hashRefreshToken(refreshToken), expiresAt: new Date(Date.now() + refreshTtlDays * 86_400_000) });
  return { accessToken: await tokens.createAccessToken(user), refreshToken, user: { id: user.id, email: user.email, role: user.role } };
}
