import { Injectable, Inject, Logger } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { PermissionRepositoryPort } from '../../ports/permission.repository.port';
import { ROLE_REPOSITORY, PERMISSION_REPOSITORY } from '../../tokens';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
} from '@graduate-project/shared-common';
import { AssignPermissionsResponseDto } from '../../dto/role/assign-permissions-response.dto';

export interface AssignPermissionsToRoleInput {
  role_id: number;
  permission_ids: number[];
}

@Injectable()
export class AssignPermissionsToRoleUseCase {
  private readonly logger = new Logger(AssignPermissionsToRoleUseCase.name);

  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
    @Inject(PERMISSION_REPOSITORY)
    private permissionRepo: PermissionRepositoryPort,
  ) {}

  async execute(
    input: AssignPermissionsToRoleInput,
  ): Promise<ApiResponseDto<AssignPermissionsResponseDto>> {
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

    // Get current permissions
    const currentPermissions = await this.roleRepo.getRolePermissions(
      input.role_id,
    );
    const currentPermissionIds = currentPermissions.map((p) => p.id);

    // Filter out permissions that already exist
    const newPermissionIds = input.permission_ids.filter(
      (permId) => !currentPermissionIds.includes(permId),
    );

    this.logger.log(
      `Current permissions: ${currentPermissionIds.length}, New permissions to add: ${newPermissionIds.length}`,
    );

    // Only assign new permissions (append operation, not replace)
    if (newPermissionIds.length > 0) {
      await this.roleRepo.assignPermissions(input.role_id, newPermissionIds);
    }

    // Get updated list of all permissions after assignment
    const updatedPermissions = await this.roleRepo.getRolePermissions(
      input.role_id,
    );

    const response: AssignPermissionsResponseDto = {
      role_id: input.role_id,
      permission_ids: updatedPermissions.map((p) => p.id),
      total_permissions: updatedPermissions.length,
    };

    const message =
      newPermissionIds.length > 0
        ? `Successfully added ${newPermissionIds.length} new permission(s). Total: ${updatedPermissions.length}`
        : `All ${input.permission_ids.length} permission(s) already assigned. Total: ${updatedPermissions.length}`;

    return ApiResponseDto.success(response, message);
  }
}
