import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCodes } from '../../../common/enums/error-codes.enum';
import { AccountRepositoryPort } from '../../ports/account.repository.port';
import { AuditLogsRepositoryPort } from '../../ports/audit-logs.repository.port';
import { ACCOUNT_REPOSITORY, AUDIT_LOGS_REPOSITORY } from '../../tokens';
import { 
  UpdateAccountStatusDto, 
  UpdateAccountStatusResponseDto 
} from '../../dto/admin/update-account-status.dto';
import { AuditLogs } from '../../../domain/entities/audit-logs.entity';

@Injectable()
export class UpdateAccountStatusUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
    @Inject(AUDIT_LOGS_REPOSITORY)
    private auditLogsRepo: AuditLogsRepositoryPort,
  ) {}

  async execute(
    accountId: number, 
    dto: UpdateAccountStatusDto, 
    adminId: number, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<ApiResponseDto<UpdateAccountStatusResponseDto>> {
    try {
      // Validate account ID
      if (!accountId || accountId <= 0) {
        throw new BusinessException(ErrorCodes.BAD_REQUEST, 'Invalid account ID');
      }

      // Validate status - Simplified validation (class-validator handles the rest)
      const validStatuses = ['ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED'];
      const receivedStatus = dto.status?.toString().toUpperCase();
      
      console.log('UpdateAccountStatus: Received status:', dto.status);
      console.log('UpdateAccountStatus: Normalized status:', receivedStatus);
      
      if (!dto.status || !validStatuses.includes(receivedStatus)) {
        throw new BusinessException(ErrorCodes.BAD_REQUEST, 'Invalid status. Must be one of: ACTIVE, INACTIVE, LOCKED, SUSPENDED');
      }

      // Get account
      const account = await this.accountRepo.findById(accountId);
      if (!account) {
        throw new BusinessException(ErrorCodes.ACCOUNT_NOT_FOUND);
      }

      console.log('UpdateAccountStatus: Current account status:', account.status);
      console.log('UpdateAccountStatus: Account status type:', typeof account.status);

      // Check if status is already the same
      if (account.status === receivedStatus) {
        throw new BusinessException(ErrorCodes.BAD_REQUEST, 'Account already has this status');
      }

      // Update account status
      const updatedAccount = await this.accountRepo.updateStatus(accountId, receivedStatus);

      // Log the action
      const auditLog = new AuditLogs();
      auditLog.account_id = accountId;
      auditLog.action = 'ACCOUNT_STATUS_CHANGED';
      auditLog.ip_address = ipAddress;
      auditLog.user_agent = userAgent;
      auditLog.success = true;
      auditLog.metadata = {
        admin_id: adminId,
        old_status: account.status,
        new_status: dto.status,
        reason: dto.reason,
      };
      auditLog.created_at = new Date();

      await this.auditLogsRepo.create(auditLog);

      // Map to response DTO
      const response: UpdateAccountStatusResponseDto = {
        id: updatedAccount.id!,
        status: updatedAccount.status,
        updated_at: updatedAccount.updated_at!,
      };

      return ApiResponseDto.success(response, 'Account status updated successfully', 200, undefined, 'ACCOUNT_STATUS_UPDATED');
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to update account status');
    }
  }
}
