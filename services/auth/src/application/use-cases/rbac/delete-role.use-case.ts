import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { ROLE_REPOSITORY, ACCOUNT_REPOSITORY } from '../../tokens';
import { AccountRepositoryPort } from '../../ports/account.repository.port';

@Injectable()
export class DeleteRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
  ) {}

  async execute(
    roleId: number, 
    deleterId: number, 
    deleterRoleLevel: number
  ): Promise<ApiResponseDto<null>> {
    // 1. Check if role exists
    const existingRole = await this.roleRepo.findById(roleId);
    
    if (!existingRole) {
      throw new BusinessException(
        ErrorCodes.ROLE_NOT_FOUND,
        `Role with ID ${roleId} not found`,
        404
      );
    }

    // 2. Validate: cannot delete system roles
    if (existingRole.is_system_role) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_DENIED,
        'Cannot delete system role. System roles are protected.',
        403
      );
    }

    // 3. Validate: deleter level must be <= target role level
    if (existingRole.level < deleterRoleLevel) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_DENIED,
        `Cannot delete role with higher privileges (level ${existingRole.level}) than your role (level ${deleterRoleLevel})`,
        403
      );
    }

    // 4. Check if any accounts are using this role
    const accountsUsingRole = await this.accountRepo.findWithPagination({
      role: existingRole.code,
      limit: 1,
      offset: 0,
      sortBy: 'id',
      sortOrder: 'ASC'
    });

    if (accountsUsingRole.total > 0) {
      throw new BusinessException(
        ErrorCodes.ROLE_IN_USE,
        `Cannot delete role. ${accountsUsingRole.total} account(s) are currently using this role. Please reassign these accounts first.`,
        400
      );
    }

    // 5. Delete role (this will also trigger cascade delete on role_permissions)
    await this.roleRepo.delete(roleId);

    return ApiResponseDto.success(
      null,
      'Role deleted successfully',
      200,
      undefined,
      'ROLE_DELETED'
    );
  }
}
