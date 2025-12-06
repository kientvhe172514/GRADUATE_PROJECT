import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { ChangeTemporaryPasswordResponseDto } from '../dto/change-temporary-password-response.dto';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { HashingServicePort } from '../ports/hashing.service.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { AuditLogsRepositoryPort } from '../ports/audit-logs.repository.port';
import { TemporaryPasswordsRepositoryPort } from '../ports/temporary-passwords.repository.port';
import {
  ACCOUNT_REPOSITORY,
  HASHING_SERVICE,
  EVENT_PUBLISHER,
  AUDIT_LOGS_REPOSITORY,
  TEMPORARY_PASSWORDS_REPOSITORY,
} from '../tokens';
import { ChangeTemporaryPasswordDto } from '../../presentation/dto/change-temporary-password.dto';
import { AuditLogs } from '../../domain/entities/audit-logs.entity';

@Injectable()
export class ChangeTemporaryPasswordUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
    @Inject(HASHING_SERVICE)
    private hashing: HashingServicePort,
    @Inject(EVENT_PUBLISHER)
    private publisher: EventPublisherPort,
    @Inject(AUDIT_LOGS_REPOSITORY)
    private auditLogsRepo: AuditLogsRepositoryPort,
    @Inject(TEMPORARY_PASSWORDS_REPOSITORY)
    private tempPasswordsRepo: TemporaryPasswordsRepositoryPort,
  ) {}

  async execute(
    accountId: number,
    dto: ChangeTemporaryPasswordDto,
  ): Promise<ApiResponseDto<ChangeTemporaryPasswordResponseDto>> {
    // 1. Find account
    const account = await this.accountRepo.findById(accountId);
    if (!account) {
      await this.logFailedAttempt(accountId, null, 'Account not found');
      throw new UnauthorizedException('Account not found');
    }

    // 2. Find active temporary password
    const activeTempPassword =
      await this.tempPasswordsRepo.findActiveByAccountId(accountId);
    if (!activeTempPassword) {
      throw new BadRequestException(
        'Không có mật khẩu tạm hoặc mật khẩu tạm đã hết hạn',
      );
    }

    // 3. Verify temporary password
    const isTempPasswordValid = await this.hashing.compare(
      dto.current_password,
      activeTempPassword.temp_password_hash,
    );
    if (!isTempPasswordValid) {
      await this.logFailedAttempt(
        accountId,
        account.email,
        'Invalid temporary password',
      );
      throw new UnauthorizedException('Mật khẩu tạm không đúng');
    }

    // 4. Validate new password
    if (dto.new_password !== dto.confirm_password) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    // Prevent reusing the same temporary password
    const isSameAsTemporary = await this.hashing.compare(
      dto.new_password,
      activeTempPassword.temp_password_hash,
    );
    if (isSameAsTemporary) {
      throw new BadRequestException(
        'Mật khẩu mới không được trùng với mật khẩu tạm',
      );
    }

    // 5. Hash new password and update
    const newPasswordHash = await this.hashing.hash(dto.new_password);
    await this.accountRepo.updatePassword(account.id!, newPasswordHash);

    // 6. Mark temporary password as used
    await this.tempPasswordsRepo.markAsUsed(activeTempPassword.id!);

    // 7. Reset failed login attempts if any
    if (account.failed_login_attempts > 0) {
      await this.accountRepo.resetFailedLoginAttempts(account.id!);
    }

    // 8. Log successful password change
    await this.logSuccessfulAttempt(accountId, account.email);

    // 9. Publish event
    this.publisher.publish('password_changed', {
      accountId: account.id!,
      email: account.email,
      timestamp: new Date().toISOString(),
    });

    const response: ChangeTemporaryPasswordResponseDto = {
      message: 'Mật khẩu đã được thay đổi thành công',
    };

    return ApiResponseDto.success(response, 'Đổi mật khẩu thành công');
  }

  private async logFailedAttempt(
    accountId: number | null,
    email: string | null,
    errorMessage?: string,
  ): Promise<void> {
    const auditLog = new AuditLogs();
    auditLog.account_id = accountId;
    auditLog.action = 'CHANGE_TEMPORARY_PASSWORD_FAILED';
    auditLog.success = false;
    auditLog.error_message = errorMessage;
    auditLog.metadata = email ? { email } : {};
    auditLog.created_at = new Date();

    await this.auditLogsRepo.create(auditLog);
  }

  private async logSuccessfulAttempt(
    accountId: number,
    email: string,
  ): Promise<void> {
    const auditLog = new AuditLogs();
    auditLog.account_id = accountId;
    auditLog.action = 'CHANGE_TEMPORARY_PASSWORD_SUCCESS';
    auditLog.success = true;
    auditLog.metadata = { email };
    auditLog.created_at = new Date();

    await this.auditLogsRepo.create(auditLog);
  }
}
