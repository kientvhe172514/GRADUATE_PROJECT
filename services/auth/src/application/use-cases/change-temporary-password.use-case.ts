import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { HashingServicePort } from '../ports/hashing.service.port';
import { JwtServicePort } from '../ports/jwt.service.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { AuditLogsRepositoryPort } from '../ports/audit-logs.repository.port';
import { RefreshTokensRepositoryPort } from '../ports/refresh-tokens.repository.port';
import {
  ACCOUNT_REPOSITORY,
  HASHING_SERVICE,
  JWT_SERVICE,
  EVENT_PUBLISHER,
  AUDIT_LOGS_REPOSITORY,
  REFRESH_TOKENS_REPOSITORY,
} from '../tokens';
import { ChangeTemporaryPasswordDto } from '../../presentation/dto/change-temporary-password.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { RefreshTokens } from '../../domain/entities/refresh-tokens.entity';
import { AuditLogs } from '../../domain/entities/audit-logs.entity';

@Injectable()
export class ChangeTemporaryPasswordUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
    @Inject(HASHING_SERVICE)
    private hashing: HashingServicePort,
    @Inject(JWT_SERVICE)
    private jwtService: JwtServicePort,
    @Inject(EVENT_PUBLISHER)
    private publisher: EventPublisherPort,
    @Inject(AUDIT_LOGS_REPOSITORY)
    private auditLogsRepo: AuditLogsRepositoryPort,
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private refreshTokensRepo: RefreshTokensRepositoryPort,
  ) {}

  async execute(
    dto: ChangeTemporaryPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ApiResponseDto<LoginResponseDto>> {
    // 1. Find account
    const account = await this.accountRepo.findByEmail(dto.email);
    if (!account) {
      await this.logFailedAttempt(null, dto.email, ipAddress, userAgent, 'Account not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Verify current password (temporary password)
    const isCurrentPasswordValid = await this.hashing.compare(dto.current_password, account.password_hash);
    if (!isCurrentPasswordValid) {
      await this.logFailedAttempt(account.id!, dto.email, ipAddress, userAgent, 'Invalid current password');
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    // 3. Check if account is actually using temporary password
    if (!account.is_temporary_password) {
      throw new BadRequestException('Tài khoản không sử dụng mật khẩu tạm');
    }

    // 4. Validate new password
    if (dto.new_password !== dto.confirm_password) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    // Prevent reusing the same temporary password
    const isSameAsTemporary = await this.hashing.compare(dto.new_password, account.password_hash);
    if (isSameAsTemporary) {
      throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu tạm');
    }

    // 5. Hash new password and update
    const newPasswordHash = await this.hashing.hash(dto.new_password);
    await this.accountRepo.updatePassword(account.id!, newPasswordHash);
    await this.accountRepo.setTemporaryPasswordFlag(account.id!, false);

    // 6. Reset failed login attempts if any
    if (account.failed_login_attempts > 0) {
      await this.accountRepo.resetFailedLoginAttempts(account.id!);
    }

    // 7. Update last login
    if (ipAddress) {
      await this.accountRepo.updateLastLogin(account.id!, ipAddress);
    }

    // 8. Generate tokens (auto-login after successful password change)
    const accessToken = await this.jwtService.generateAccessToken(account);
    const refreshToken = this.jwtService.generateRefreshToken(account);

    // Store refresh token
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const refreshTokenEntity = new RefreshTokens();
    refreshTokenEntity.account_id = account.id!;
    refreshTokenEntity.token_hash = tokenHash;
    refreshTokenEntity.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    refreshTokenEntity.device_fingerprint = userAgent;

    await this.refreshTokensRepo.create(refreshTokenEntity);

    // 9. Log successful password change
    await this.logSuccessfulAttempt(account.id!, dto.email, ipAddress, userAgent);

    // 10. Publish event
    this.publisher.publish('password_changed', {
      accountId: account.id!,
      email: account.email,
      timestamp: new Date().toISOString(),
    });

    return ApiResponseDto.success(
      {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: account.id!,
          email: account.email,
          full_name: account.full_name || '',
          role: account.role,
        },
      },
      'Đổi mật khẩu thành công',
    );
  }

  private async logFailedAttempt(
    accountId: number | null,
    email: string,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string,
  ): Promise<void> {
    const auditLog = new AuditLogs();
    auditLog.account_id = accountId;
    auditLog.action = 'CHANGE_TEMPORARY_PASSWORD_FAILED';
    auditLog.ip_address = ipAddress;
    auditLog.user_agent = userAgent;
    auditLog.success = false;
    auditLog.error_message = errorMessage;
    auditLog.metadata = { email };
    auditLog.created_at = new Date();

    await this.auditLogsRepo.create(auditLog);
  }

  private async logSuccessfulAttempt(
    accountId: number,
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const auditLog = new AuditLogs();
    auditLog.account_id = accountId;
    auditLog.action = 'CHANGE_TEMPORARY_PASSWORD_SUCCESS';
    auditLog.ip_address = ipAddress;
    auditLog.user_agent = userAgent;
    auditLog.success = true;
    auditLog.metadata = { email };
    auditLog.created_at = new Date();

    await this.auditLogsRepo.create(auditLog);
  }
}
