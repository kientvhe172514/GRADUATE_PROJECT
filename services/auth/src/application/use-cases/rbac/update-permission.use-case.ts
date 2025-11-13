import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { PermissionRepositoryPort } from '../../ports/permission.repository.port';
import { PERMISSION_REPOSITORY } from '../../tokens';
import { PermissionResponseDto } from '../../dto/rbac/role-response.dto';
import { UpdatePermissionDto } from '../../../presentation/dto/permission.dto';

@Injectable()
export class UpdatePermissionUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private permissionRepo: PermissionRepositoryPort,
  ) {}

  async execute(
    permissionId: number,
    dto: UpdatePermissionDto,
    updaterId: number
  ): Promise<ApiResponseDto<PermissionResponseDto>> {
    // 1. Check if permission exists
    const existingPermission = await this.permissionRepo.findById(permissionId);

    if (!existingPermission) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_NOT_FOUND,
        `Permission with ID ${permissionId} not found`,
        404
      );
    }

    // 2. Validate: cannot update system permissions
    if (existingPermission.is_system_permission) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_DENIED,
        'Cannot update system permission. Only description and status can be modified for system permissions.',
        403
      );
    }

    // 3. Update permission (only description and status allowed for system permissions)
    const updateData = {
      description: dto.description,
      status: dto.status,
      updated_by: updaterId,
      updated_at: new Date(),
    };

    const updatedPermission = await this.permissionRepo.update(permissionId, updateData);

    // 4. Map to response DTO
    const responseDto: PermissionResponseDto = {
      id: updatedPermission.id,
      code: updatedPermission.code,
      resource: updatedPermission.resource,
      action: updatedPermission.action,
      scope: updatedPermission.scope,
      description: updatedPermission.description,
      is_system_permission: updatedPermission.is_system_permission,
      status: updatedPermission.status,
      created_at: updatedPermission.created_at,
      updated_at: updatedPermission.updated_at,
    };

    return ApiResponseDto.success(
      responseDto,
      'Permission updated successfully',
      200,
      undefined,
      'PERMISSION_UPDATED'
    );
  }
}
