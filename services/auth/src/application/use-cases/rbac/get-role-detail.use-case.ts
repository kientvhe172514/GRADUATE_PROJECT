import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../tokens';
import { RoleWithPermissionsDto } from '../../dto/rbac/role-response.dto';

@Injectable()
export class GetRoleDetailUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
  ) {}

  async execute(roleId: number): Promise<ApiResponseDto<RoleWithPermissionsDto>> {
    const role = await this.roleRepo.findByIdWithPermissions(roleId);

    if (!role) {
      throw new BusinessException(
        ErrorCodes.ROLE_NOT_FOUND,
        `Role with ID ${roleId} not found`,
        404
      );
    }

    // Map to response DTO
    const responseDto: RoleWithPermissionsDto = {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      level: role.level,
      is_system_role: role.is_system_role,
      status: role.status,
      created_at: role.created_at,
      updated_at: role.updated_at,
      created_by: role.created_by,
      updated_by: role.updated_by,
      permissions: role.permissions || [],
    };

    return ApiResponseDto.success(
      responseDto,
      'Role retrieved successfully',
      200
    );
  }
}
