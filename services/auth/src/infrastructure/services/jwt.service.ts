import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginResponseDto } from '../../presentation/dto/login-response.dto';
import { Account } from '../../domain/entities/account.entity';
import { JwtServicePort } from '../../application/ports/jwt.service.port';

@Injectable()
export class JwtServiceImpl implements JwtServicePort {
  constructor(private jwtService: JwtService) {}

  generateAccessToken(account: Account): string {
    const payload = { sub: account.id, email: account.email, role: account.role };
    return this.jwtService.sign(payload, { expiresIn: '15m' }); // 15 minutes
  }

  generateRefreshToken(account: Account): string {
    const payload = { sub: account.id, email: account.email, role: account.role };
    return this.jwtService.sign(payload, { expiresIn: '7d' }); // 7 days
  }

  verifyToken(token: string): any {
    return this.jwtService.verify(token);
  }

  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Legacy method for backward compatibility
  generateTokens(account: Account): LoginResponseDto {
    const payload = { sub: account.id, email: account.email, role: account.role };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: account.id!,
        email: account.email,
        full_name: account.full_name || '',
        role: account.role,
      },
    };
  }
}