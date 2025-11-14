import { Injectable, Inject } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { PermissionRepositoryPort } from '../../ports/permission.repository.port';
import { ROLE_REPOSITORY, PERMISSION_REPOSITORY } from '../../tokens';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { AssignPermissionsResponseDto } from '../../dto/role/assign-permissions-response.dto';

export interface AssignPermissionsToRoleInput {
  role_id: number;
  permission_ids: number[];
}

@Injectable()
export class AssignPermissionsToRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
    @Inject(PERMISSION_REPOSITORY)
    private permissionRepo: PermissionRepositoryPort,
  ) {}

  async execute(input: AssignPermissionsToRoleInput): Promise<ApiResponseDto<AssignPermissionsResponseDto>> {
    // Check if role exists
    const role = await this.roleRepo.findById(input.role_id);
    if (!role) {
      throw new BusinessException(
        ErrorCodes.ROLE_NOT_FOUND,
        `Role with ID ${input.role_id} not found`,
        404,
      );
    }

    // Validate permissions exist
    if (input.permission_ids.length === 0) {
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        'At least one permission ID is required',
      );
    }

    // Validate all permissions exist (optional check - can be removed for performance)
    // For now, we'll let the database handle foreign key constraints

    // Remove existing permissions first, then assign new ones
    // This is a replace operation, not an append operation
    const currentPermissions = await this.roleRepo.getRolePermissions(input.role_id);
    for (const permission of currentPermissions) {
      await this.roleRepo.removePermission(input.role_id, permission.id);
    }

    // Assign new permissions
    await this.roleRepo.assignPermissions(input.role_id, input.permission_ids);

    const response: AssignPermissionsResponseDto = {
      role_id: input.role_id,
      permission_ids: input.permission_ids,
      total_permissions: input.permission_ids.length,
    };

    return ApiResponseDto.success(
      response,
      'Permissions assigned successfully',
    );
  }
}

