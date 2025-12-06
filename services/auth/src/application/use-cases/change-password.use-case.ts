import { Injectable, Inject } from '@nestjs/common';
import { Account } from '../../domain/entities/account.entity';
import { TemporaryPasswords } from '../../domain/entities/temporary-passwords.entity';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { TemporaryPasswordsRepositoryPort } from '../ports/temporary-passwords.repository.port';
import { HashingServicePort } from '../ports/hashing.service.port';
import { AuditLogsRepositoryPort } from '../ports/audit-logs.repository.port';
import {
  ACCOUNT_REPOSITORY,
  HASHING_SERVICE,
  TEMPORARY_PASSWORDS_REPOSITORY,
  AUDIT_LOGS_REPOSITORY,
} from '../tokens';
import { AuditLogs } from '../../domain/entities/audit-logs.entity';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
} from '@graduate-project/shared-common';

export class ChangePasswordDto {
  account_id: number;
  current_password: string;
  new_password: string;
}

export class ChangeTemporaryPasswordDto {
  account_id: number;
  temporary_password: string;
  new_password: string;
}

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
    @Inject(TEMPORARY_PASSWORDS_REPOSITORY)
    private tempPasswordsRepo: TemporaryPasswordsRepositoryPort,
    @Inject(HASHING_SERVICE)
    private hashing: HashingServicePort,
    @Inject(AUDIT_LOGS_REPOSITORY)
    private auditLogsRepo: AuditLogsRepositoryPort,
  ) {}

  async changePassword(
    dto: ChangePasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ApiResponseDto<null>> {
    const account = await this.accountRepo.findById(dto.account_id);
    if (!account) {
      await this.logPasswordChangeFailure(
        dto.account_id,
        ipAddress,
        userAgent,
        'Account not found',
      );
      throw new BusinessException(
        ErrorCodes.ACCOUNT_NOT_FOUND,
        'Account not found',
      );
    }

    // Validate input parameters
    if (!dto.current_password || !dto.new_password) {
      await this.logPasswordChangeFailure(
        dto.account_id,
        ipAddress,
        userAgent,
        'Missing password fields',
      );
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        'Current password and new password are required',
      );
    }

    if (!account.password_hash) {
      await this.logPasswordChangeFailure(
        dto.account_id,
        ipAddress,
        userAgent,
        'Account has no password hash',
      );
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        'Account password hash not found',
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await this.hashing.compare(
      dto.current_password,
      account.password_hash,
    );
    if (!isCurrentPasswordValid) {
      await this.logPasswordChangeFailure(
        dto.account_id,
        ipAddress,
        userAgent,
        'Invalid current password',
      );
      throw new BusinessException(
        ErrorCodes.INVALID_CREDENTIALS,
        'Invalid credentials',
      );
    }

    // Hash new password
    const newPasswordHash = await this.hashing.hash(dto.new_password);

    // Validate account_id
    if (!dto.account_id || dto.account_id <= 0) {
      await this.logPasswordChangeFailure(
        dto.account_id,
        ipAddress,
        userAgent,
        'Invalid account ID',
      );
      throw new BusinessException(ErrorCodes.BAD_REQUEST, 'Invalid account ID');
    }

    // Update account password
    await this.accountRepo.updatePassword(dto.account_id, newPasswordHash);

    // Delete any temporary passwords for this account
    await this.tempPasswordsRepo.deleteByAccountId(dto.account_id);

    // Log successful password change
    await this.logPasswordChangeSuccess(dto.account_id, ipAddress, userAgent);
    return ApiResponseDto.success(null, 'Password changed');
  }

  async changeTemporaryPassword(
    dto: ChangeTemporaryPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ApiResponseDto<null>> {
    const account = await this.accountRepo.findById(dto.account_id);
    if (!account) {
      await this.logPasswordChangeFailure(
        dto.account_id,
        ipAddress,
        userAgent,
        'Account not found',
      );
      throw new BusinessException(
        ErrorCodes.ACCOUNT_NOT_FOUND,
        'Account not found',
      );
    }

    // Verify that current password is temporary password "1"
    const isTemporaryPassword = await this.hashing.compare(
      '1',
      account.password_hash,
    );
    if (!isTemporaryPassword) {
      await this.logPasswordChangeFailure(
        dto.account_id,
        ipAddress,
        userAgent,
        'Not using temporary password',
      );
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        'Account is not using temporary password',
      );
    }

    // Verify provided temporary password
    const isProvidedPasswordValid = await this.hashing.compare(
      dto.temporary_password,
      account.password_hash,
    );
    if (!isProvidedPasswordValid) {
      await this.logPasswordChangeFailure(
        dto.account_id,
        ipAddress,
        userAgent,
        'Invalid temporary password',
      );
      throw new BusinessException(
        ErrorCodes.INVALID_CREDENTIALS,
        'Invalid credentials',
      );
    }

    // Hash new password
    const newPasswordHash = await this.hashing.hash(dto.new_password);

    // Validate account_id
    if (!dto.account_id || dto.account_id <= 0) {
      await this.logPasswordChangeFailure(
        dto.account_id,
        ipAddress,
        userAgent,
        'Invalid account ID',
      );
      throw new BusinessException(ErrorCodes.BAD_REQUEST, 'Invalid account ID');
    }

    // Update account password
    await this.accountRepo.updatePassword(dto.account_id, newPasswordHash);

    // Log successful password change
    await this.logPasswordChangeSuccess(
      dto.account_id,
      ipAddress,
      userAgent,
      'Temporary password changed',
    );
    return ApiResponseDto.success(null, 'Temporary password changed');
  }

  private async logPasswordChangeSuccess(
    accountId: number,
    ipAddress?: string,
    userAgent?: string,
    message?: string,
  ): Promise<void> {
    const auditLog = new AuditLogs();
    auditLog.account_id = accountId;
    auditLog.action = 'PASSWORD_CHANGE_SUCCESS';
    auditLog.ip_address = ipAddress;
    auditLog.user_agent = userAgent;
    auditLog.success = true;
    auditLog.metadata = { message };
    auditLog.created_at = new Date();

    await this.auditLogsRepo.create(auditLog);
  }

  private async logPasswordChangeFailure(
    accountId: number,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string,
  ): Promise<void> {
    const auditLog = new AuditLogs();
    auditLog.account_id = accountId;
    auditLog.action = 'PASSWORD_CHANGE_FAILED';
    auditLog.ip_address = ipAddress;
    auditLog.user_agent = userAgent;
    auditLog.success = false;
    auditLog.error_message = errorMessage;
    auditLog.created_at = new Date();

    await this.auditLogsRepo.create(auditLog);
  }
}
