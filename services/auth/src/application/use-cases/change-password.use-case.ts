import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
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
  AUDIT_LOGS_REPOSITORY
} from '../tokens';
import { AuditLogs } from '../../domain/entities/audit-logs.entity';

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

  async changePassword(dto: ChangePasswordDto, ipAddress?: string, userAgent?: string): Promise<void> {
    const account = await this.accountRepo.findById(dto.account_id);
    if (!account) {
      await this.logPasswordChangeFailure(dto.account_id, ipAddress, userAgent, 'Account not found');
      throw new UnauthorizedException('Account not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.hashing.compare(dto.current_password, account.password_hash);
    if (!isCurrentPasswordValid) {
      await this.logPasswordChangeFailure(dto.account_id, ipAddress, userAgent, 'Invalid current password');
      throw new UnauthorizedException('Invalid current password');
    }

    // Hash new password
    const newPasswordHash = await this.hashing.hash(dto.new_password);

    // Update account password
    await this.accountRepo.updatePassword(dto.account_id, newPasswordHash);

    // Delete any temporary passwords for this account
    await this.tempPasswordsRepo.deleteByAccountId(dto.account_id);

    // Log successful password change
    await this.logPasswordChangeSuccess(dto.account_id, ipAddress, userAgent);
  }

  async changeTemporaryPassword(dto: ChangeTemporaryPasswordDto, ipAddress?: string, userAgent?: string): Promise<void> {
    const account = await this.accountRepo.findById(dto.account_id);
    if (!account) {
      await this.logPasswordChangeFailure(dto.account_id, ipAddress, userAgent, 'Account not found');
      throw new UnauthorizedException('Account not found');
    }

    // Find active temporary password
    const tempPassword = await this.tempPasswordsRepo.findActiveByAccountId(dto.account_id);
    if (!tempPassword) {
      await this.logPasswordChangeFailure(dto.account_id, ipAddress, userAgent, 'No active temporary password');
      throw new BadRequestException('No active temporary password found');
    }

    // Verify temporary password
    const isTempPasswordValid = await this.hashing.compare(dto.temporary_password, tempPassword.temp_password_hash);
    if (!isTempPasswordValid) {
      await this.logPasswordChangeFailure(dto.account_id, ipAddress, userAgent, 'Invalid temporary password');
      throw new UnauthorizedException('Invalid temporary password');
    }

    // Check if temporary password is expired
    if (tempPassword.expires_at < new Date()) {
      await this.logPasswordChangeFailure(dto.account_id, ipAddress, userAgent, 'Temporary password expired');
      throw new BadRequestException('Temporary password has expired');
    }

    // Hash new password
    const newPasswordHash = await this.hashing.hash(dto.new_password);

    // Update account password
    await this.accountRepo.updatePassword(dto.account_id, newPasswordHash);

    // Mark temporary password as used
    await this.tempPasswordsRepo.markAsUsed(tempPassword.id!);

    // Log successful password change
    await this.logPasswordChangeSuccess(dto.account_id, ipAddress, userAgent, 'Temporary password changed');
  }

  private async logPasswordChangeSuccess(
    accountId: number,
    ipAddress?: string,
    userAgent?: string,
    message?: string
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
    errorMessage?: string
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
