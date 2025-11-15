import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginResponseDto } from '../../presentation/dto/login-response.dto';
import { Account } from '../../domain/entities/account.entity';
import { JwtServicePort } from '../../application/ports/jwt.service.port';
import { RoleRepositoryPort } from '../../application/ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../application/tokens';

@Injectable()
export class JwtServiceImpl implements JwtServicePort {
  constructor(
    private jwtService: JwtService,
    @Inject(ROLE_REPOSITORY)
    private roleRepository: RoleRepositoryPort,
  ) {}

  async generateAccessToken(account: Account): Promise<string> {
    const permissions =
      await this.roleRepository.getPermissionsByRoleCode(account.role || '');
    // ✅ ONLY 5 FIELDS: sub, email, employee_id, role, permissions
    const payload = {
      sub: account.id,
      email: account.email,
      employee_id: account.employee_id,
      role: account.role || '',
      permissions: permissions,
    };
    return this.jwtService.sign(payload, { expiresIn: '15m' }); // 15 minutes
  }

  generateRefreshToken(account: Account): string {
    // ✅ ONLY 4 FIELDS for refresh token: sub, email, employee_id, role
    const payload = {
      sub: account.id,
      email: account.email,
      employee_id: account.employee_id,
      role: account.role || '',
    };
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
  async generateTokens(account: Account): Promise<LoginResponseDto> {
    const permissions =
      await this.roleRepository.getPermissionsByRoleCode(account.role || '');
    // ✅ ONLY 5 FIELDS: sub, email, employee_id, role, permissions
    const payload = {
      sub: account.id,
      email: account.email,
      employee_id: account.employee_id,
      role: account.role || '',
      permissions: permissions,
    };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: account.id!,
        email: account.email,
        full_name: account.full_name || '',
        role: account.role || '',
      },
    };
  }
}