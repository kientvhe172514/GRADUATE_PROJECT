import { Injectable, Inject, ConflictException, ForbiddenException } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../tokens';

export interface CreateRoleInput {
  code: string;
  name: string;
  description?: string;
  level: number;
  status?: string;
  created_by: number;
}

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
  ) {}

  async execute(input: CreateRoleInput, currentUserLevel: number): Promise<any> {
    // Validate: code must be unique
    const existingRole = await this.roleRepo.findByCode(input.code);
    if (existingRole) {
      throw new ConflictException(`Role with code '${input.code}' already exists`);
    }

    // Validate: level must be >= current user's role level (can't create higher role)
    if (input.level < currentUserLevel) {
      throw new ForbiddenException(
        `Cannot create role with level ${input.level} (lower than your level ${currentUserLevel})`,
      );
    }

    // Create role
    const roleData = {
      code: input.code,
      name: input.name,
      description: input.description || '',
      level: input.level,
      status: input.status || 'active',
      is_system_role: false,
      created_by: input.created_by,
      created_at: new Date(),
      updated_at: new Date(),
    };

    return await this.roleRepo.create(roleData);
  }
}
