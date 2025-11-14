import { Injectable, Inject } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../tokens';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { CreateRoleResponseDto } from '../../dto/role/create-role-response.dto';

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

  async execute(input: CreateRoleInput): Promise<ApiResponseDto<CreateRoleResponseDto>> {
    // Validate: code must be unique
    const existingRole = await this.roleRepo.findByCode(input.code);
    if (existingRole) {
      throw new BusinessException(
        ErrorCodes.ROLE_CODE_ALREADY_EXISTS,
        `Role with code '${input.code}' already exists`,
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

    const role = await this.roleRepo.create(roleData);

    // Map entity to DTO
    const response: CreateRoleResponseDto = {
      id: role.id!,
      code: role.code,
      name: role.name,
      description: role.description,
      level: role.level,
      is_system_role: role.is_system_role,
      status: role.status as string,
      created_at: role.created_at!,
    };

    return ApiResponseDto.success(
      response,
      'Role created successfully',
      201,
    );
  }
}
