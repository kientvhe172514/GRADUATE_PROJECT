import { Injectable, Inject } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../tokens';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { GetRoleWithPermissionsResponseDto, PermissionDto } from '../../dto/role/get-role-with-permissions-response.dto';

@Injectable()
export class GetRoleByIdUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
  ) {}

  async execute(roleId: number): Promise<ApiResponseDto<GetRoleWithPermissionsResponseDto>> {
    const role = await this.roleRepo.findByIdWithPermissions(roleId);

    if (!role) {
      throw new BusinessException(
        ErrorCodes.ROLE_NOT_FOUND,
        `Role with ID ${roleId} not found`,
        404,
      );
    }

    // Map permissions to DTOs
    const permissionDtos: PermissionDto[] = (role.permissions || []).map((permission: any) => ({
      id: permission.id,
      code: permission.code,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
    }));

    // Map entity to DTO
    const response: GetRoleWithPermissionsResponseDto = {
      id: role.id!,
      code: role.code,
      name: role.name,
      description: role.description,
      level: role.level,
      is_system_role: role.is_system_role,
      status: role.status as string,
      created_at: role.created_at,
      updated_at: role.updated_at,
      created_by: role.created_by,
      updated_by: role.updated_by,
      permissions: permissionDtos,
    };

    return ApiResponseDto.success(
      response,
      'Role retrieved successfully',
    );
  }
}

