import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { PermissionRepositoryPort } from '../../ports/permission.repository.port';
import { PERMISSION_REPOSITORY } from '../../tokens';
import { PermissionResponseDto } from '../../dto/rbac/role-response.dto';
import { CreatePermissionDto } from '../../../presentation/dto/permission.dto';

@Injectable()
export class CreatePermissionUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private permissionRepo: PermissionRepositoryPort,
  ) {}

  async execute(dto: CreatePermissionDto, creatorId: number): Promise<ApiResponseDto<PermissionResponseDto>> {
    // 1. Validate: code must be unique
    const existing = await this.permissionRepo.findAll({ page: 1, limit: 1000 });
    const codeExists = existing.permissions.some(p => p.code === dto.code);

    if (codeExists) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_CODE_ALREADY_EXISTS,
        `Permission code '${dto.code}' already exists`,
        400
      );
    }

    // 2. Validate: code format must be "resource.action" or "resource.action.scope"
    const codeParts = dto.code.split('.');
    if (codeParts.length < 2 || codeParts.length > 3) {
      throw new BusinessException(
        ErrorCodes.VALIDATION_ERROR,
        'Permission code must follow format: "resource.action" or "resource.action.scope" (e.g., "employee.create" or "employee.read.own")',
        400
      );
    }

    // 3. Validate: code matches resource and action
    if (codeParts[0] !== dto.resource || codeParts[1] !== dto.action) {
      throw new BusinessException(
        ErrorCodes.VALIDATION_ERROR,
        'Permission code must match resource and action (e.g., code="employee.create" requires resource="employee" and action="create")',
        400
      );
    }

    // 4. Validate: if scope provided, it must be in code
    if (dto.scope && codeParts.length === 3 && codeParts[2] !== dto.scope) {
      throw new BusinessException(
        ErrorCodes.VALIDATION_ERROR,
        'Permission code scope must match scope field',
        400
      );
    }

    // 5. Create permission
    const permissionData = {
      code: dto.code.toLowerCase(),
      resource: dto.resource.toLowerCase(),
      action: dto.action.toLowerCase(),
      scope: dto.scope?.toLowerCase(),
      description: dto.description || '',
      is_system_permission: dto.is_system_permission || false,
      status: 'active',
      created_by: creatorId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const createdPermission = await this.permissionRepo.create(permissionData);

    // 6. Map to response DTO
    const responseDto: PermissionResponseDto = {
      id: createdPermission.id,
      code: createdPermission.code,
      resource: createdPermission.resource,
      action: createdPermission.action,
      scope: createdPermission.scope,
      description: createdPermission.description,
      is_system_permission: createdPermission.is_system_permission,
      status: createdPermission.status,
      created_at: createdPermission.created_at,
      updated_at: createdPermission.updated_at,
    };

    return ApiResponseDto.success(
      responseDto,
      'Permission created successfully',
      201,
      undefined,
      'PERMISSION_CREATED'
    );
  }
}
