import type { AuthRepository, TokenService } from "./ports.js";
import { InvalidCredentialsError, issueTokens } from "./authenticate.js";
export function createRefresh(repository: AuthRepository, tokens: TokenService, refreshTtlDays: number) {
  return async (refreshToken: string) => {
    const hash = tokens.hashRefreshToken(refreshToken);
    const session = await repository.findSession(hash);
    if (!session || session.expiresAt <= new Date()) throw new InvalidCredentialsError("Invalid refresh token");
    await repository.revokeSession(hash);
    return issueTokens(repository, tokens, session.user, refreshTtlDays);
  };
}
