import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginResponseDto } from '../../presentation/dto/login-response.dto';
import { Account } from '../../domain/entities/account.entity';

@Injectable()
export class JwtServiceImpl {
  constructor(private jwtService: JwtService) {}

  generateTokens(account: Account): LoginResponseDto {
    const payload = { sub: account.id, email: account.email, role: account.role };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: account.id!,
        email: account.email,
        full_name: account.full_name || '',  // Fix: Default empty string
        role: account.role,
      },
    };
  }
}