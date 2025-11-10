import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { RoleRepositoryPort } from '../../ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../tokens';
import { RoleListResponseDto } from '../../dto/rbac/role-response.dto';

@Injectable()
export class ListRolesUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
  ) {}

  async execute(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponseDto<RoleListResponseDto>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const { roles, total } = await this.roleRepo.findAll({
      status: filters.status,
      page,
      limit,
    });

    const responseDto: RoleListResponseDto = {
      roles,
      total,
      page,
      limit,
    };

    return ApiResponseDto.success(
      responseDto,
      'Roles retrieved successfully',
      200
    );
  }
}
