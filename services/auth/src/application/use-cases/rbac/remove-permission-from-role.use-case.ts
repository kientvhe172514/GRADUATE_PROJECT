import { Injectable, Inject } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../tokens';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';

@Injectable()
export class RemovePermissionFromRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
  ) {}

  async execute(roleId: number, permissionId: number): Promise<ApiResponseDto<null>> {
    // Check if role exists
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new BusinessException(
        ErrorCodes.ROLE_NOT_FOUND,
        `Role with ID ${roleId} not found`,
        404,
      );
    }

    // Check if permission is assigned to role
    const permissions = await this.roleRepo.getRolePermissions(roleId);
    const permissionExists = permissions.some((p: any) => p.id === permissionId);

    if (!permissionExists) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_NOT_FOUND,
        `Permission with ID ${permissionId} is not assigned to role ${roleId}`,
        404,
      );
    }

    // Remove permission from role
    await this.roleRepo.removePermission(roleId, permissionId);

    return ApiResponseDto.success(
      null,
      'Permission removed successfully',
    );
  }
}

