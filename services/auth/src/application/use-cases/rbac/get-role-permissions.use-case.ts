import { Injectable, Inject } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../tokens';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { GetRolePermissionsResponseDto, RolePermissionDto } from '../../dto/role/get-role-permissions-response.dto';

@Injectable()
export class GetRolePermissionsUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
  ) {}

  async execute(roleId: number): Promise<ApiResponseDto<GetRolePermissionsResponseDto>> {
    // Check if role exists
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new BusinessException(
        ErrorCodes.ROLE_NOT_FOUND,
        `Role with ID ${roleId} not found`,
        404,
      );
    }

    // Get permissions for role
    const permissions = await this.roleRepo.getRolePermissions(roleId);

    // Map entities to DTOs
    const permissionDtos: RolePermissionDto[] = permissions.map((permission: any) => ({
      id: permission.id,
      code: permission.code,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
      assigned_at: permission.assigned_at || permission.created_at,
    }));

    const response: GetRolePermissionsResponseDto = {
      role_id: roleId,
      permissions: permissionDtos,
      total: permissionDtos.length,
    };

    return ApiResponseDto.success(
      response,
      'Role permissions retrieved successfully',
    );
  }
}

