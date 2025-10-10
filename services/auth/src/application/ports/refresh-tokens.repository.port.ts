import { RefreshTokens } from '../../domain/entities/refresh-tokens.entity';

export interface RefreshTokensRepositoryPort {
  create(refreshToken: RefreshTokens): Promise<RefreshTokens>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokens | null>;
  findByAccountId(accountId: number): Promise<RefreshTokens[]>;
  revokeToken(id: number): Promise<void>;
  revokeAllTokensForAccount(accountId: number): Promise<void>;
  deleteExpiredTokens(): Promise<void>;
  updateLastUsed(id: number): Promise<void>;
}
