import { Injectable, Inject } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../tokens';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { UpdateRoleResponseDto } from '../../dto/role/update-role-response.dto';

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  level?: number;
  status?: string;
  updated_by: number;
}

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
  ) {}

  async execute(roleId: number, input: UpdateRoleInput): Promise<ApiResponseDto<UpdateRoleResponseDto>> {
    // Get existing role
    const existingRole = await this.roleRepo.findById(roleId);
    if (!existingRole) {
      throw new BusinessException(
        ErrorCodes.ROLE_NOT_FOUND,
        `Role with ID ${roleId} not found`,
        404,
      );
    }

    // Validate: cannot update system roles
    if (existingRole.is_system_role) {
      throw new BusinessException(
        ErrorCodes.FORBIDDEN,
        'Cannot update system roles',
        403,
      );
    }

    // Update role
    const updateData = {
      ...input,
      updated_by: input.updated_by,
      updated_at: new Date(),
    };

    const role = await this.roleRepo.update(roleId, updateData);

    // Map entity to DTO
    const response: UpdateRoleResponseDto = {
      id: role.id!,
      code: role.code,
      name: role.name || input.name || existingRole.name,
      description: role.description || input.description,
      level: role.level || input.level || existingRole.level,
      status: (role.status as string) || input.status || existingRole.status as string,
      updated_at: role.updated_at!,
    };

    return ApiResponseDto.success(
      response,
      'Role updated successfully',
    );
  }
}
