import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { LogoutRequestDto } from '../dto/auth.dto';
import { LogoutResponseDto } from '../dto/auth.dto';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { RefreshTokensRepositoryPort } from '../ports/refresh-tokens.repository.port';
import { HashingServicePort } from '../ports/hashing.service.port';
import { JwtServicePort } from '../ports/jwt.service.port';
import {
  HASHING_SERVICE,
  REFRESH_TOKENS_REPOSITORY,
  JWT_SERVICE,
  AUDIT_LOGS_REPOSITORY,
} from '../tokens';
import { AuditLogsRepositoryPort } from '../ports/audit-logs.repository.port';
import { AuditLogs } from '../../domain/entities/audit-logs.entity';
import { LogDeviceActivityUseCase } from './device/log-device-activity.use-case';
import {
  ActivityType,
  ActivityStatus,
} from '../../domain/entities/device-activity-log.entity';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private refreshTokensRepo: RefreshTokensRepositoryPort,
    @Inject(HASHING_SERVICE)
    private hashing: HashingServicePort,
    @Inject(JWT_SERVICE)
    private jwtService: JwtServicePort,
    @Inject(AUDIT_LOGS_REPOSITORY)
    private auditLogsRepo: AuditLogsRepositoryPort,
    private logDeviceActivityUseCase: LogDeviceActivityUseCase,
  ) {}

  async execute(
    logoutDto: LogoutRequestDto,
    accountId?: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ApiResponseDto<LogoutResponseDto>> {
    if (logoutDto.refresh_token) {
      // Revoke specific refresh token
      await this.revokeRefreshToken(
        logoutDto.refresh_token,
        accountId,
        ipAddress,
        userAgent,
      );
    } else if (accountId) {
      // Revoke all refresh tokens for the account
      await this.refreshTokensRepo.revokeAllTokensForAccount(accountId);
      await this.logSuccessfulLogout(
        accountId,
        ipAddress,
        userAgent,
        'All tokens revoked',
      );
    } else {
      await this.logFailedLogout(
        null,
        ipAddress,
        userAgent,
        'No refresh token or account ID provided',
      );
      throw new UnauthorizedException(
        'No refresh token or account ID provided',
      );
    }

    return ApiResponseDto.success(
      { message: 'Logged out successfully' },
      'Logout successful',
    );
  }

  private async revokeRefreshToken(
    refreshToken: string,
    accountId?: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      // Verify the token first
      const payload = this.jwtService.verifyToken(refreshToken);

      // Find the token in database
      const tokenHash = await this.hashing.hash(refreshToken);
      const refreshTokenRecord =
        await this.refreshTokensRepo.findByTokenHash(tokenHash);

      if (refreshTokenRecord) {
        await this.refreshTokensRepo.revokeToken(refreshTokenRecord.id!);

        // Log device activity
        if (refreshTokenRecord.device_session_id) {
          try {
            await this.logDeviceActivityUseCase.execute({
              device_session_id: refreshTokenRecord.device_session_id,
              account_id: payload.sub,
              activity_type: ActivityType.LOGOUT,
              status: ActivityStatus.SUCCESS,
              ip_address: ipAddress,
              user_agent: userAgent,
              metadata: {
                refresh_token_id: refreshTokenRecord.id,
              },
            });
          } catch (error) {
            console.error('Device activity logging error:', error);
          }
        }

        await this.logSuccessfulLogout(
          payload.sub,
          ipAddress,
          userAgent,
          'Token revoked',
        );
      } else {
        await this.logFailedLogout(
          payload.sub,
          ipAddress,
          userAgent,
          'Token not found',
        );
      }
    } catch (error) {
      // Token is invalid, but we still return success for security
      // This prevents token enumeration attacks
      await this.logFailedLogout(
        accountId || null,
        ipAddress,
        userAgent,
        'Invalid token',
      );
    }
  }

  private async logSuccessfulLogout(
    accountId: number | null,
    ipAddress?: string,
    userAgent?: string,
    message?: string,
  ): Promise<void> {
    const auditLog = new AuditLogs();
    auditLog.account_id = accountId;
    auditLog.action = 'LOGOUT_SUCCESS';
    auditLog.ip_address = ipAddress;
    auditLog.user_agent = userAgent;
    auditLog.success = true;
    auditLog.metadata = { message };
    auditLog.created_at = new Date();

    await this.auditLogsRepo.create(auditLog);
  }

  private async logFailedLogout(
    accountId: number | null,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string,
  ): Promise<void> {
    const auditLog = new AuditLogs();
    auditLog.account_id = accountId;
    auditLog.action = 'LOGOUT_FAILED';
    auditLog.ip_address = ipAddress;
    auditLog.user_agent = userAgent;
    auditLog.success = false;
    auditLog.error_message = errorMessage;
    auditLog.created_at = new Date();

    await this.auditLogsRepo.create(auditLog);
  }
}
