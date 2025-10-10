import { Account } from '../../domain/entities/account.entity';

export interface JwtServicePort {
  generateAccessToken(account: Account): string;
  generateRefreshToken(account: Account): string;
  verifyToken(token: string): any;
  extractTokenFromHeader(authHeader: string): string | null;
}
