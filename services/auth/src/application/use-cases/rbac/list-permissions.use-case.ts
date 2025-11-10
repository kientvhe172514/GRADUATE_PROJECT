import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { PermissionRepositoryPort } from '../../ports/permission.repository.port';
import { PERMISSION_REPOSITORY } from '../../tokens';
import { PermissionListResponseDto } from '../../dto/rbac/role-response.dto';

@Injectable()
export class ListPermissionsUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private permissionRepo: PermissionRepositoryPort,
  ) {}

  async execute(filters: {
    resource?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponseDto<PermissionListResponseDto>> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;

    const { permissions, total } = await this.permissionRepo.findAll({
      resource: filters.resource,
      status: filters.status,
      page,
      limit,
    });

    const responseDto: PermissionListResponseDto = {
      permissions,
      total,
      page,
      limit,
    };

    return ApiResponseDto.success(
      responseDto,
      'Permissions retrieved successfully',
      200
    );
  }
}
