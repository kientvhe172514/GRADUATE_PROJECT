import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { PermissionRepositoryPort } from '../../ports/permission.repository.port';
import { ROLE_REPOSITORY, PERMISSION_REPOSITORY } from '../../tokens';

@Injectable()
export class AssignPermissionsToRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
    @Inject(PERMISSION_REPOSITORY)
    private permissionRepo: PermissionRepositoryPort,
  ) {}

  async execute(
    roleId: number,
    permissionIds: number[],
    assignerId: number,
    assignerRoleLevel: number
  ): Promise<ApiResponseDto<{ role_id: number; permission_ids: number[] }>> {
    // 1. Check if role exists
    const existingRole = await this.roleRepo.findById(roleId);

    if (!existingRole) {
      throw new BusinessException(
        ErrorCodes.ROLE_NOT_FOUND,
        `Role with ID ${roleId} not found`,
        404
      );
    }

    // 2. Validate: cannot modify system roles
    if (existingRole.is_system_role) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_DENIED,
        'Cannot assign permissions to system role. System roles are protected.',
        403
      );
    }

    // 3. Validate: assigner level must be <= target role level
    if (existingRole.level < assignerRoleLevel) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_DENIED,
        `Cannot assign permissions to role with higher privileges (level ${existingRole.level}) than your role (level ${assignerRoleLevel})`,
        403
      );
    }

    // 4. Validate: all permission IDs exist
    for (const permId of permissionIds) {
      const permission = await this.permissionRepo.findById(permId);
      if (!permission) {
        throw new BusinessException(
          ErrorCodes.PERMISSION_NOT_FOUND,
          `Permission with ID ${permId} not found`,
          404
        );
      }
    }

    // 5. Assign permissions (bulk replace)
    await this.roleRepo.assignPermissions(roleId, permissionIds);

    const responseData = {
      role_id: roleId,
      permission_ids: permissionIds,
    };

    return ApiResponseDto.success(
      responseData,
      `Successfully assigned ${permissionIds.length} permission(s) to role`,
      200,
      undefined,
      'PERMISSIONS_ASSIGNED'
    );
  }
}
