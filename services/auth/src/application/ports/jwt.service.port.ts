import { Account } from '../../domain/entities/account.entity';
import { LoginResponseDto } from '../../presentation/dto/login-response.dto';

export interface JwtServicePort {
  generateAccessToken(account: Account): Promise<string>;
  generateRefreshToken(account: Account): string;
  verifyToken(token: string): any;
  extractTokenFromHeader(authHeader: string): string | null;
  generateTokens(account: Account): Promise<LoginResponseDto>;
}
