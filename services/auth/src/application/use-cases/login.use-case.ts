import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { LoginRequestDto } from '../../presentation/dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import { Account } from '../../domain/entities/account.entity';
import { RefreshTokens } from '../../domain/entities/refresh-tokens.entity';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { RefreshTokensRepositoryPort } from '../ports/refresh-tokens.repository.port';
import { HashingServicePort } from '../ports/hashing.service.port';
import { JwtServicePort } from '../ports/jwt.service.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { 
  ACCOUNT_REPOSITORY, 
  HASHING_SERVICE, 
  EVENT_PUBLISHER, 
  REFRESH_TOKENS_REPOSITORY, 
  JWT_SERVICE,
  AUDIT_LOGS_REPOSITORY
} from '../tokens';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';
import { AuditLogs } from '../../domain/entities/audit-logs.entity';
import { AuditLogsRepositoryPort } from '../ports/audit-logs.repository.port';

@Injectable()
export class LoginUseCase {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 30;

  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private refreshTokensRepo: RefreshTokensRepositoryPort,
    @Inject(HASHING_SERVICE)
    private hashing: HashingServicePort,
    @Inject(JWT_SERVICE)
    private jwtService: JwtServicePort,
    @Inject(EVENT_PUBLISHER)
    private publisher: EventPublisherPort,
    @Inject(AUDIT_LOGS_REPOSITORY)
    private auditLogsRepo: AuditLogsRepositoryPort,
  ) {}

  async execute(loginDto: LoginRequestDto, ipAddress?: string, userAgent?: string): Promise<ApiResponseDto<LoginResponseDto>> {
    const account = await this.accountRepo.findByEmail(loginDto.email);
    
    if (!account) {
      await this.logFailedAttempt(null, loginDto.email, ipAddress, userAgent, 'Account not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (account.locked_until && account.locked_until > new Date()) {
      await this.logFailedAttempt(account.id!, loginDto.email, ipAddress, userAgent, 'Account locked');
      throw new UnauthorizedException('Account is temporarily locked due to too many failed login attempts');
    }

    // Verify password
    const isPasswordValid = await this.hashing.compare(loginDto.password, account.password_hash);
    
    if (!isPasswordValid) {
      await this.handleFailedLogin(account);
      await this.logFailedAttempt(account.id!, loginDto.email, ipAddress, userAgent, 'Invalid password');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is using temporary password "1"
    const isTemporaryPassword = await this.hashing.compare('1', account.password_hash);
    if (isTemporaryPassword) {
      // User is using temporary password, require password change
      throw new BusinessException(ErrorCodes.TEMPORARY_PASSWORD_MUST_CHANGE);
    }

    // Reset failed attempts and unlock account if needed
    if (account.failed_login_attempts > 0) {
      await this.accountRepo.resetFailedLoginAttempts(account.id!);
    }

    // Update last login
    if (ipAddress) {
      await this.accountRepo.updateLastLogin(account.id!, ipAddress);
    }

    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken(account);
    const refreshToken = this.jwtService.generateRefreshToken(account);

    // Create refresh token record
    const refreshTokenEntity = new RefreshTokens();
    refreshTokenEntity.account_id = account.id!;
    refreshTokenEntity.token_hash = await this.hashing.hash(refreshToken);
    refreshTokenEntity.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    refreshTokenEntity.device_fingerprint = userAgent;
    
    await this.refreshTokensRepo.create(refreshTokenEntity);

    // Log successful login
    await this.logSuccessfulAttempt(account.id!, loginDto.email, ipAddress, userAgent);

    // Publish event
    this.publisher.publish('user_logged_in', new UserLoggedInEvent(account));

    return ApiResponseDto.success({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: account.id!,
        email: account.email,
        full_name: account.full_name || '',
        role: account.role,
      },
    }, 'Login successful');
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
