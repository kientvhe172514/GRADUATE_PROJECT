import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenRequestDto } from '../dto/auth.dto';
import { RefreshTokenResponseDto } from '../dto/auth.dto';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { Account } from '../../domain/entities/account.entity';
import { RefreshTokens } from '../../domain/entities/refresh-tokens.entity';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { RefreshTokensRepositoryPort } from '../ports/refresh-tokens.repository.port';
import { HashingServicePort } from '../ports/hashing.service.port';
import { JwtServicePort } from '../ports/jwt.service.port';
import {
  ACCOUNT_REPOSITORY,
  HASHING_SERVICE,
  REFRESH_TOKENS_REPOSITORY,
  JWT_SERVICE,
  AUDIT_LOGS_REPOSITORY,
} from '../tokens';
import { AuditLogsRepositoryPort } from '../ports/audit-logs.repository.port';
import { AuditLogs } from '../../domain/entities/audit-logs.entity';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private refreshTokensRepo: RefreshTokensRepositoryPort,
    @Inject(HASHING_SERVICE)
    private hashing: HashingServicePort,
    @Inject(JWT_SERVICE)
    private jwtService: JwtServicePort,
    @Inject(AUDIT_LOGS_REPOSITORY)
    private auditLogsRepo: AuditLogsRepositoryPort,
  ) {}

  async execute(
    refreshTokenDto: RefreshTokenRequestDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ApiResponseDto<RefreshTokenResponseDto>> {
    // Verify the refresh token
    let payload;
    try {
      payload = this.jwtService.verifyToken(refreshTokenDto.refresh_token);
    } catch (error) {
      await this.logFailedRefresh(
        null,
        ipAddress,
        userAgent,
        'Invalid token format',
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Find the account
    const account = await this.accountRepo.findById(payload.sub);
    if (!account) {
      await this.logFailedRefresh(
        payload.sub,
        ipAddress,
        userAgent,
        'Account not found',
      );
      throw new UnauthorizedException('Account not found');
    }

    // Check if account is active
    if (account.status !== 'ACTIVE') {
      await this.logFailedRefresh(
        account.id!,
        ipAddress,
        userAgent,
        'Account is not active',
      );
      throw new UnauthorizedException('Account is not active');
    }

    // Find the refresh token in database
    // IMPORTANT: Use SHA256 hash (same as login) NOT bcrypt
    const crypto = require('crypto');
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshTokenDto.refresh_token)
      .digest('hex');
    const refreshTokenRecord =
      await this.refreshTokensRepo.findByTokenHash(tokenHash);

    if (!refreshTokenRecord) {
      await this.logFailedRefresh(
        account.id!,
        ipAddress,
        userAgent,
        'Refresh token not found',
      );
      throw new UnauthorizedException('Refresh token not found');
    }

    // Check if token is expired
    if (refreshTokenRecord.expires_at < new Date()) {
      await this.refreshTokensRepo.revokeToken(refreshTokenRecord.id!);
      await this.logFailedRefresh(
        account.id!,
        ipAddress,
        userAgent,
        'Refresh token expired',
      );
      throw new UnauthorizedException('Refresh token expired');
    }

    // Check if token is revoked
    if (refreshTokenRecord.revoked_at) {
      await this.logFailedRefresh(
        account.id!,
        ipAddress,
        userAgent,
        'Refresh token has been revoked',
      );
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Update last used timestamp
    await this.refreshTokensRepo.updateLastUsed(refreshTokenRecord.id!);

    // Generate new tokens
    const newAccessToken = await this.jwtService.generateAccessToken(account);
    const newRefreshToken = this.jwtService.generateRefreshToken(account);

    // Revoke old refresh token and create new one
    await this.refreshTokensRepo.revokeToken(refreshTokenRecord.id!);

    // IMPORTANT: Use SHA256 hash (same as login) NOT bcrypt
    const newTokenHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    const newRefreshTokenEntity = new RefreshTokens();
    newRefreshTokenEntity.account_id = account.id!;
    newRefreshTokenEntity.token_hash = newTokenHash;
    newRefreshTokenEntity.expires_at = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ); // 7 days
    newRefreshTokenEntity.device_fingerprint = userAgent;

    await this.refreshTokensRepo.create(newRefreshTokenEntity);

    // Log successful refresh
    await this.logSuccessfulRefresh(account.id!, ipAddress, userAgent);

    return ApiResponseDto.success(
      {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      },
      'Token refreshed',
    );
  }

  private async logFailedRefresh(
    accountId: number | null,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string,
  ): Promise<void> {
    const auditLog = new AuditLogs();
    auditLog.account_id = accountId;
    auditLog.action = 'REFRESH_TOKEN_FAILED';
    auditLog.ip_address = ipAddress;
    auditLog.user_agent = userAgent;
    auditLog.success = false;
    auditLog.error_message = errorMessage;
    auditLog.created_at = new Date();

    await this.auditLogsRepo.create(auditLog);
  }

  private async logSuccessfulRefresh(
    accountId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const auditLog = new AuditLogs();
    auditLog.account_id = accountId;
    auditLog.action = 'REFRESH_TOKEN_SUCCESS';
    auditLog.ip_address = ipAddress;
    auditLog.user_agent = userAgent;
    auditLog.success = true;
    auditLog.created_at = new Date();

    await this.auditLogsRepo.create(auditLog);
  }
}
