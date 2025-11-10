import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../tokens';
import { RoleResponseDto } from '../../dto/rbac/role-response.dto';
import { UpdateRoleDto } from '../../../presentation/dto/role.dto';

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
  ) {}

  async execute(
    roleId: number, 
    dto: UpdateRoleDto, 
    updaterId: number, 
    updaterRoleLevel: number
  ): Promise<ApiResponseDto<RoleResponseDto>> {
    // 1. Check if role exists
    const existingRole = await this.roleRepo.findById(roleId);
    
    if (!existingRole) {
      throw new BusinessException(
        ErrorCodes.ROLE_NOT_FOUND,
        `Role with ID ${roleId} not found`,
        404
      );
    }

    // 2. Validate: cannot update system roles
    if (existingRole.is_system_role) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_DENIED,
        'Cannot update system role. System roles are protected.',
        403
      );
    }

    // 3. Validate: updater level must be <= target role level
    if (existingRole.level < updaterRoleLevel) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_DENIED,
        `Cannot update role with higher privileges (level ${existingRole.level}) than your role (level ${updaterRoleLevel})`,
        403
      );
    }

    // 4. Validate: if updating level, must be >= updater's level
    if (dto.level && dto.level < updaterRoleLevel) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_DENIED,
        `Cannot set role to higher privileges (level ${dto.level}) than your role (level ${updaterRoleLevel})`,
        403
      );
    }

    // 5. Validate: level must be between 1-4
    if (dto.level && (dto.level < 1 || dto.level > 4)) {
      throw new BusinessException(
        ErrorCodes.VALIDATION_ERROR,
        'Role level must be between 1 (highest) and 4 (lowest)',
        400
      );
    }

    // 6. Update role
    const updateData = {
      ...dto,
      updated_by: updaterId,
      updated_at: new Date(),
    };

    const updatedRole = await this.roleRepo.update(roleId, updateData);

    // 7. Map to response DTO
    const responseDto: RoleResponseDto = {
      id: updatedRole.id,
      code: updatedRole.code,
      name: updatedRole.name,
      description: updatedRole.description,
      level: updatedRole.level,
      is_system_role: updatedRole.is_system_role,
      status: updatedRole.status,
      created_at: updatedRole.created_at,
      updated_at: updatedRole.updated_at,
      created_by: updatedRole.created_by,
      updated_by: updatedRole.updated_by,
    };

    return ApiResponseDto.success(
      responseDto,
      'Role updated successfully',
      200,
      undefined,
      'ROLE_UPDATED'
    );
  }
}
