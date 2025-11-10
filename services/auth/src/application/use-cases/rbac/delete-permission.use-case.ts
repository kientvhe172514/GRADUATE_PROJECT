import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { PermissionRepositoryPort } from '../../ports/permission.repository.port';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { PERMISSION_REPOSITORY, ROLE_REPOSITORY } from '../../tokens';

@Injectable()
export class DeletePermissionUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private permissionRepo: PermissionRepositoryPort,
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
  ) {}

  async execute(permissionId: number): Promise<ApiResponseDto<null>> {
    // 1. Check if permission exists
    const existingPermission = await this.permissionRepo.findById(permissionId);

    if (!existingPermission) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_NOT_FOUND,
        `Permission with ID ${permissionId} not found`,
        404
      );
    }

    // 2. Validate: cannot delete system permissions
    if (existingPermission.is_system_permission) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_DENIED,
        'Cannot delete system permission. System permissions are protected.',
        403
      );
    }

    // 3. Check if permission is assigned to any roles
    const allRoles = await this.roleRepo.findAll({ page: 1, limit: 1000 });
    for (const role of allRoles.roles) {
      const rolePermissions = await this.roleRepo.getRolePermissions(role.id);
      const isUsed = rolePermissions.some(p => p.id === permissionId);
      if (isUsed) {
        throw new BusinessException(
          ErrorCodes.PERMISSION_IN_USE,
          `Cannot delete permission. It is currently assigned to role '${role.name}'. Please remove it from all roles first.`,
          400
        );
      }
    }

    // 4. Delete permission (cascade will handle role_permissions and account_permissions)
    await this.permissionRepo.delete(permissionId);

    return ApiResponseDto.success(
      null,
      'Permission deleted successfully',
      200,
      undefined,
      'PERMISSION_DELETED'
    );
  }
}
