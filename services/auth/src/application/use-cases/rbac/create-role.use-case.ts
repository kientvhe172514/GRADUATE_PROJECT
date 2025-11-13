import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../tokens';
import { RoleResponseDto } from '../../dto/rbac/role-response.dto';
import { CreateRoleDto } from '../../../presentation/dto/role.dto';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
  ) {}

  async execute(dto: CreateRoleDto, creatorId: number, creatorRoleLevel: number): Promise<ApiResponseDto<RoleResponseDto>> {
    // 1. Validate: code must be unique
    const existing = await this.roleRepo.findAll({ page: 1, limit: 1 });
    const codeExists = existing.roles.some(r => r.code === dto.code.toUpperCase());
    
    if (codeExists) {
      throw new BusinessException(
        ErrorCodes.ROLE_CODE_ALREADY_EXISTS,
        `Role code '${dto.code}' already exists`,
        400
      );
    }

    // 2. Validate: level must be >= creator's level (can't create higher-level role)
    if (dto.level < creatorRoleLevel) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_DENIED,
        `Cannot create role with higher privileges (level ${dto.level}) than your role (level ${creatorRoleLevel})`,
        403
      );
    }

    // 3. Validate: level must be between 1-4
    if (dto.level < 1 || dto.level > 4) {
      throw new BusinessException(
        ErrorCodes.VALIDATION_ERROR,
        'Role level must be between 1 (highest) and 4 (lowest)',
        400
      );
    }

    // 4. Create role
    const roleData = {
      code: dto.code.toUpperCase(),
      name: dto.name,
      description: dto.description || '',
      level: dto.level,
      is_system_role: dto.is_system_role || false,
      status: 'active',
      created_by: creatorId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const createdRole = await this.roleRepo.create(roleData);

    // 5. Map to response DTO
    const responseDto: RoleResponseDto = {
      id: createdRole.id,
      code: createdRole.code,
      name: createdRole.name,
      description: createdRole.description,
      level: createdRole.level,
      is_system_role: createdRole.is_system_role,
      status: createdRole.status,
      created_at: createdRole.created_at,
      updated_at: createdRole.updated_at,
      created_by: createdRole.created_by,
    };

    return ApiResponseDto.success(
      responseDto,
      'Role created successfully',
      201,
      undefined,
      'ROLE_CREATED'
    );
  }
}
