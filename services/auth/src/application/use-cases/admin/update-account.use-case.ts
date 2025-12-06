import { Injectable, Inject } from '@nestjs/common';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
} from '@graduate-project/shared-common';
import { Account } from '../../../domain/entities/account.entity';
import { AccountRepositoryPort } from '../../ports/account.repository.port';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { AuditLogsRepositoryPort } from '../../ports/audit-logs.repository.port';
import { EventPublisherPort } from '../../ports/event.publisher.port';
import {
  ACCOUNT_REPOSITORY,
  ROLE_REPOSITORY,
  AUDIT_LOGS_REPOSITORY,
  EVENT_PUBLISHER,
} from '../../tokens';
import {
  AdminUpdateAccountDto,
  AdminUpdateAccountResponseDto,
} from '../../dto/admin/update-account.dto';
import { AuditLogs } from '../../../domain/entities/audit-logs.entity';
import { AccountUpdatedEventDto } from '../../dto/account-updated.event.dto';

/**
 * Use Case: Admin Update Account
 *
 * Purpose: Allow admin to update account information including role assignment
 *
 * Features:
 * - Update account email (with duplicate check)
 * - Assign role to account (converts role code to role_id)
 * - Update account status
 * - Update employee linking information
 * - Update department and position
 * - Audit logging for all changes
 * - Event publishing for integration
 *
 * Permissions required: admin.accounts.update
 */
@Injectable()
export class AdminUpdateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepositoryPort,
    @Inject(AUDIT_LOGS_REPOSITORY)
    private readonly auditLogsRepository: AuditLogsRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(
    accountId: number,
    dto: AdminUpdateAccountDto,
    updatedBy: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ApiResponseDto<AdminUpdateAccountResponseDto>> {
    // 1. Find existing account
    const existingAccount = await this.accountRepository.findById(accountId);
    if (!existingAccount) {
      throw new BusinessException(
        ErrorCodes.ACCOUNT_NOT_FOUND,
        'Account not found',
        404,
      );
    }

    // Track changes for audit logging
    const changes: Record<string, { old: any; new: any }> = {};

    // 2. Check for duplicate email if email is being updated
    if (dto.email && dto.email !== existingAccount.email) {
      const emailExists = await this.accountRepository.findByEmail(dto.email);
      if (emailExists) {
        throw new BusinessException(
          ErrorCodes.ACCOUNT_ALREADY_EXISTS,
          `Email "${dto.email}" is already in use by another account`,
          409,
        );
      }
      changes['email'] = { old: existingAccount.email, new: dto.email };
      existingAccount.email = dto.email;
    }

    // 3. Handle role assignment
    if (dto.role) {
      const roleCode = dto.role.toUpperCase();
      const validRoles = [
        'SUPER_ADMIN',
        'ADMIN',
        'HR_MANAGER',
        'DEPARTMENT_MANAGER',
        'EMPLOYEE',
      ];

      if (!validRoles.includes(roleCode)) {
        throw new BusinessException(
          ErrorCodes.BAD_REQUEST,
          `Invalid role "${roleCode}". Valid roles are: ${validRoles.join(', ')}`,
          400,
        );
      }

      // Lookup role from roles table
      const role = await this.roleRepository.findByCode(roleCode);
      if (!role) {
        throw new BusinessException(
          ErrorCodes.ROLE_NOT_FOUND,
          `Role "${roleCode}" not found in database. Please run RBAC seeding.`,
          404,
        );
      }

      // Track role change
      if (existingAccount.role !== roleCode) {
        changes['role'] = {
          old: existingAccount.role || 'None',
          new: roleCode,
        };
      }

      // Update role_id in account
      existingAccount.role_id = role.id;
      // Note: existingAccount.role will be populated from join when fetched again
    }

    // 4. Update other fields
    const fieldsToUpdate = [
      'full_name',
      'status',
      'employee_id',
      'employee_code',
      'department_id',
      'department_name',
      'position_id',
      'position_name',
      'external_ids',
      'metadata',
    ];

    for (const field of fieldsToUpdate) {
      if (dto[field] !== undefined) {
        if (existingAccount[field] !== dto[field]) {
          changes[field] = { old: existingAccount[field], new: dto[field] };
          existingAccount[field] = dto[field];
        }
      }
    }

    // 5. Update metadata
    existingAccount.updated_at = new Date();
    existingAccount.updated_by = updatedBy;
    existingAccount.sync_version = (existingAccount.sync_version || 1) + 1;

    // 6. Save to database
    const updatedAccount = await this.accountRepository.update(existingAccount);

    // 7. Audit logging
    if (Object.keys(changes).length > 0) {
      const auditLog = new AuditLogs();
      auditLog.account_id = updatedBy;
      auditLog.action = 'ADMIN_UPDATE_ACCOUNT';
      auditLog.ip_address = ipAddress;
      auditLog.user_agent = userAgent;
      auditLog.success = true;
      auditLog.metadata = {
        target_account_id: accountId,
        target_email: updatedAccount.email,
        changes: changes,
      };
      auditLog.created_at = new Date();

      await this.auditLogsRepository.create(auditLog);
    }

    // 8. Publish event for integration
    const eventDto = new AccountUpdatedEventDto(updatedAccount);
    this.eventPublisher.publish('account_updated', eventDto);

    // 9. Build response DTO
    const response: AdminUpdateAccountResponseDto = {
      id: updatedAccount.id!,
      email: updatedAccount.email,
      full_name: updatedAccount.full_name,
      role: updatedAccount.role || '',
      status: updatedAccount.status,
      employee_id: updatedAccount.employee_id,
      employee_code: updatedAccount.employee_code,
      department_id: updatedAccount.department_id,
      department_name: updatedAccount.department_name,
      position_id: updatedAccount.position_id,
      position_name: updatedAccount.position_name,
      sync_version: updatedAccount.sync_version,
      updated_at: updatedAccount.updated_at!,
    };

    return ApiResponseDto.success(
      response,
      'Account updated successfully',
      200,
    );
  }
}
