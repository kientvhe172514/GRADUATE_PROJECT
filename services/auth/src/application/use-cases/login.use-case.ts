import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { LoginRequestDto } from '../../presentation/dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { UserInfoDto } from '../dto/user-info.dto';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { Account } from '../../domain/entities/account.entity';
import { RefreshTokens } from '../../domain/entities/refresh-tokens.entity';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { RefreshTokensRepositoryPort } from '../ports/refresh-tokens.repository.port';
import { TemporaryPasswordsRepositoryPort } from '../ports/temporary-passwords.repository.port';
import { HashingServicePort } from '../ports/hashing.service.port';
import { JwtServicePort } from '../ports/jwt.service.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import {
  ACCOUNT_REPOSITORY,
  HASHING_SERVICE,
  EVENT_PUBLISHER,
  REFRESH_TOKENS_REPOSITORY,
  JWT_SERVICE,
  AUDIT_LOGS_REPOSITORY,
  TEMPORARY_PASSWORDS_REPOSITORY,
} from '../tokens';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';
import { AuditLogs } from '../../domain/entities/audit-logs.entity';
import { AuditLogsRepositoryPort } from '../ports/audit-logs.repository.port';
import { CreateDeviceSessionUseCase } from './device/create-device-session.use-case';
import { LogDeviceActivityUseCase } from './device/log-device-activity.use-case';
import {
  DevicePlatform,
  DeviceLocation,
} from '../../domain/entities/device-session.entity';
import {
  ActivityType,
  ActivityStatus,
} from '../../domain/entities/device-activity-log.entity';
import { AccountStatus } from '../../domain/value-objects/account-status.vo';

@Injectable()
export class LoginUseCase {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 30;

  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private refreshTokensRepo: RefreshTokensRepositoryPort,
    @Inject(TEMPORARY_PASSWORDS_REPOSITORY)
    private tempPasswordsRepo: TemporaryPasswordsRepositoryPort,
    @Inject(HASHING_SERVICE)
    private hashing: HashingServicePort,
    @Inject(JWT_SERVICE)
    private jwtService: JwtServicePort,
    @Inject(EVENT_PUBLISHER)
    private publisher: EventPublisherPort,
    @Inject(AUDIT_LOGS_REPOSITORY)
    private auditLogsRepo: AuditLogsRepositoryPort,
    private createDeviceSessionUseCase: CreateDeviceSessionUseCase,
    private logDeviceActivityUseCase: LogDeviceActivityUseCase,
  ) {}

  async execute(loginDto: LoginRequestDto, ipAddress?: string, userAgent?: string): Promise<ApiResponseDto<LoginResponseDto>> {
    const account = await this.accountRepo.findByEmail(loginDto.email);
    
    if (!account) {
      await this.logFailedAttempt(null, loginDto.email, ipAddress, userAgent, 'Account not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    // 🔥 CHECK ACCOUNT STATUS - Only ACTIVE accounts can login
    if (account.status !== AccountStatus.ACTIVE) {
      const statusMessages = {
        [AccountStatus.INACTIVE]:
          'Account is inactive. Please contact administrator.',
        [AccountStatus.LOCKED]:
          'Account has been locked. Please contact administrator.',
        [AccountStatus.SUSPENDED]:
          'Account has been suspended. Please contact administrator.',
      };
      const message =
        statusMessages[account.status] ||
        'Account is not active. Please contact administrator.';
      await this.logFailedAttempt(
        account.id!,
        loginDto.email,
        ipAddress,
        userAgent,
        `Account status: ${account.status}`,
      );
      throw new UnauthorizedException(message);
    }

    // Check if account is locked (temporary lock due to failed login attempts)
    if (account.locked_until && account.locked_until > new Date()) {
      await this.logFailedAttempt(account.id!, loginDto.email, ipAddress, userAgent, 'Account locked');
      throw new UnauthorizedException('Account is temporarily locked due to too many failed login attempts');
    }

    // Check if account has active temporary password
    const activeTempPassword = await this.tempPasswordsRepo.findActiveByAccountId(account.id!);

    let isUsingTemporaryPassword = false;
    let mustChangePassword = false;

    if (activeTempPassword) {
      // Try to verify with temporary password
      const isTempPasswordValid = await this.hashing.compare(
        loginDto.password,
        activeTempPassword.temp_password_hash,
      );

      if (isTempPasswordValid) {
        // Login với temporary password - CHO PHÉP LOGIN nhưng đánh dấu phải đổi password
        isUsingTemporaryPassword = true;
        mustChangePassword = activeTempPassword.must_change_password;
      }
    }

    // If not using temporary password, verify with regular password
    if (!isUsingTemporaryPassword) {
      const isPasswordValid = await this.hashing.compare(loginDto.password, account.password_hash);

      if (!isPasswordValid) {
        await this.handleFailedLogin(account);
        await this.logFailedAttempt(account.id!, loginDto.email, ipAddress, userAgent, 'Invalid password');
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    // Reset failed attempts and unlock account if needed
    if (account.failed_login_attempts > 0) {
      await this.accountRepo.resetFailedLoginAttempts(account.id!);
    }

    // Update last login
    if (ipAddress) {
      await this.accountRepo.updateLastLogin(account.id!, ipAddress);
    }

    // Create or update device session
    let deviceSession;
    try {
      console.log('🔍 [DEBUG] Account data before creating device session:', {
        account_id: account.id,
        employee_id: account.employee_id,
        employee_id_type: typeof account.employee_id,
        has_fcm_token: !!loginDto.fcm_token,
      });
      
      deviceSession = await this.createDeviceSessionUseCase.execute({
        account_id: account.id!,
        employee_id: account.employee_id ?? undefined,
        device_id: loginDto.device_id || `web_${Date.now()}`,
        device_name: loginDto.device_name,
        device_os: loginDto.device_os,
        device_model: loginDto.device_model,
        device_fingerprint: userAgent,
        platform: (loginDto.platform as DevicePlatform) || DevicePlatform.WEB,
        app_version: loginDto.app_version,
        ip_address: ipAddress,
        location: loginDto.location as DeviceLocation,
        user_agent: userAgent,
        fcm_token: loginDto.fcm_token,
      });

      // Log device activity
      await this.logDeviceActivityUseCase.execute({
        device_session_id: deviceSession.id,
        account_id: account.id!,
        activity_type: ActivityType.LOGIN,
        status: ActivityStatus.SUCCESS,
        ip_address: ipAddress,
        location: loginDto.location as any,
        user_agent: userAgent,
        metadata: {
          email: loginDto.email,
          using_temporary_password: isUsingTemporaryPassword,
        },
      });
    } catch (error) {
      console.error('Device tracking error:', error);
      // Continue login even if device tracking fails
    }

    // Generate tokens
    const accessToken = await this.jwtService.generateAccessToken(account);
    const refreshToken = this.jwtService.generateRefreshToken(account);

    // Create refresh token record
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    const refreshTokenEntity = new RefreshTokens();
    refreshTokenEntity.account_id = account.id!;
    refreshTokenEntity.token_hash = tokenHash;
    refreshTokenEntity.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    refreshTokenEntity.device_session_id = deviceSession?.id;
    refreshTokenEntity.device_fingerprint = userAgent;
    refreshTokenEntity.ip_address = ipAddress;
    refreshTokenEntity.location = loginDto.location;
    refreshTokenEntity.user_agent = userAgent;
    
    await this.refreshTokensRepo.create(refreshTokenEntity);

    // Log successful login to audit logs
    await this.logSuccessfulAttempt(account.id!, loginDto.email, ipAddress, userAgent);

    // Publish event
    this.publisher.publish('user_logged_in', new UserLoggedInEvent(account));

    // Log successful login
    if (isUsingTemporaryPassword) {
      // Log with temporary password info in metadata
      const auditLog = new AuditLogs();
      auditLog.account_id = account.id!;
      auditLog.action = 'LOGIN_SUCCESS_TEMP_PASSWORD';
      auditLog.ip_address = ipAddress;
      auditLog.user_agent = userAgent;
      auditLog.success = true;
      auditLog.metadata = { email: loginDto.email, using_temporary_password: true };
      auditLog.created_at = new Date();
      await this.auditLogsRepo.create(auditLog);
    } else {
      await this.logSuccessfulAttempt(account.id!, loginDto.email, ipAddress, userAgent);
    }

    // Build UserInfoDto
    const userInfo: UserInfoDto = {
      id: account.id!,
      email: account.email,
      full_name: account.full_name || '',
      role: account.role || '',
      employee_id: account.employee_id ?? undefined,
    };

    // Build LoginResponseDto
    const response: LoginResponseDto = {
      access_token: accessToken,
      refresh_token: refreshToken,
      must_change_password: mustChangePassword,
      user: userInfo,
    };

    return ApiResponseDto.success(
      response,
      mustChangePassword
        ? 'Login successful. Please change your temporary password.'
        : 'Login successful',
    );
  }

  private async handleFailedLogin(account: Account): Promise<void> {
    const newFailedAttempts = account.failed_login_attempts + 1;
    
    if (newFailedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      const lockoutUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000);
      await this.accountRepo.lockAccount(account.id!, lockoutUntil);
    } else {
      await this.accountRepo.incrementFailedLoginAttempts(account.id!);
    }
  }

  private async logFailedAttempt(
    accountId: number | null, 
    email: string, 
    ipAddress?: string, 
    userAgent?: string, 
    errorMessage?: string
  ): Promise<void> {
    const auditLog = new AuditLogs();
    auditLog.account_id = accountId;
    auditLog.action = 'LOGIN_FAILED';
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
    userAgent?: string
  ): Promise<void> {
    const auditLog = new AuditLogs();
    auditLog.account_id = accountId;
    auditLog.action = 'LOGIN_SUCCESS';
    auditLog.ip_address = ipAddress;
    auditLog.user_agent = userAgent;
    auditLog.success = true;
    auditLog.metadata = { email };
    auditLog.created_at = new Date();
    
    await this.auditLogsRepo.create(auditLog);
  }
}
