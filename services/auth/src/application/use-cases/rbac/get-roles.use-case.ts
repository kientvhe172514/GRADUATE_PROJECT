import { Injectable, Inject } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../tokens';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { GetRolesResponseDto } from '../../dto/role/get-roles-response.dto';
import { GetRoleResponseDto } from '../../dto/role/get-role-response.dto';
import { ListRolesDto } from '../../dto/role/list-roles.dto';

@Injectable()
export class GetRolesUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
  ) {}

  async execute(filters?: ListRolesDto): Promise<ApiResponseDto<GetRolesResponseDto>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const { roles, total } = await this.roleRepo.findAll({
      status: filters?.status,
      page,
      limit,
    });

    // Map entities to DTOs
    const roleDtos: GetRoleResponseDto[] = roles.map((role) => ({
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
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    const response: GetRolesResponseDto = {
      roles: roleDtos,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };

    return ApiResponseDto.success(
      response,
      'Roles retrieved successfully',
    );
  }
}

