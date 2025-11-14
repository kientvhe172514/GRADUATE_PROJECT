import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../tokens';

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

  async execute(
    roleId: number,
    input: UpdateRoleInput,
    currentUserLevel: number,
  ): Promise<any> {
    // Get existing role
    const existingRole = await this.roleRepo.findById(roleId);
    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Validate: cannot update system roles
    if (existingRole.is_system_role) {
      throw new ForbiddenException('Cannot update system roles');
    }

    // Validate: level must be >= current user's role level
    if (existingRole.level < currentUserLevel) {
      throw new ForbiddenException(
        `Cannot update role with level ${existingRole.level} (higher than your level ${currentUserLevel})`,
      );
    }

    // Validate new level if provided
    if (input.level !== undefined && input.level < currentUserLevel) {
      throw new ForbiddenException(
        `Cannot set role level to ${input.level} (lower than your level ${currentUserLevel})`,
      );
    }

    // Update role
    const updateData = {
      ...input,
      updated_by: input.updated_by,
      updated_at: new Date(),
    };

    return await this.roleRepo.update(roleId, updateData);
  }
}
