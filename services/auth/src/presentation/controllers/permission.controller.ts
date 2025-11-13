import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse as ApiSwaggerResponse } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, ApiResponseDto } from '@graduate-project/shared-common';
import { AuthPermissions } from '../decorators/auth-permissions.decorator';
import { CreatePermissionDto, UpdatePermissionDto } from '../dto/permission.dto';
import { 
  PermissionResponseDto, 
  PermissionListResponseDto 
} from '../../application/dto/rbac/role-response.dto';
import { CreatePermissionUseCase } from '../../application/use-cases/rbac/create-permission.use-case';
import { UpdatePermissionUseCase } from '../../application/use-cases/rbac/update-permission.use-case';
import { DeletePermissionUseCase } from '../../application/use-cases/rbac/delete-permission.use-case';
import { ListPermissionsUseCase } from '../../application/use-cases/rbac/list-permissions.use-case';
import { PermissionRepositoryPort } from '../../application/ports/permission.repository.port';
import { PERMISSION_REPOSITORY } from '../../application/tokens';
import { Inject } from '@nestjs/common';

@ApiTags('permissions')
@Controller('permissions')
@ApiBearerAuth()
export class PermissionController {
  constructor(
    private readonly createPermissionUseCase: CreatePermissionUseCase,
    private readonly updatePermissionUseCase: UpdatePermissionUseCase,
    private readonly deletePermissionUseCase: DeletePermissionUseCase,
    private readonly listPermissionsUseCase: ListPermissionsUseCase,
    @Inject(PERMISSION_REPOSITORY)
    private permissionRepository: PermissionRepositoryPort,
  ) {}

  @Get()
  @AuthPermissions('permission:read')
  @ApiOperation({ 
    summary: 'Get all permissions with filters',
    description: 'Retrieve a paginated list of permissions with optional filtering by resource and status'
  })
  @ApiQuery({
    name: 'resource',
    required: false,
    example: 'employee',
    description: 'Filter by resource (e.g., employee, leave, attendance)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: 'active',
    description: 'Filter by status: active, inactive',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 50,
    description: 'Items per page',
  })
  @ApiSwaggerResponse({ 
    status: 200, 
    description: 'Permissions retrieved successfully',
    type: ApiResponseDto<PermissionListResponseDto>
  })
  async getAllPermissions(
    @Query('resource') resource?: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ): Promise<ApiResponseDto<PermissionListResponseDto>> {
    return await this.listPermissionsUseCase.execute({ resource, status, page, limit });
  }

  @Get('by-resource/:resource')
  @AuthPermissions('permission:read')
  @ApiOperation({ 
    summary: 'Get permissions by resource',
    description: 'Retrieve all active permissions for a specific resource (e.g., all employee permissions)'
  })
  @ApiSwaggerResponse({ 
    status: 200, 
    description: 'Permissions retrieved successfully'
  })
  async getPermissionsByResource(
    @Param('resource') resource: string
  ): Promise<ApiResponseDto<PermissionResponseDto[]>> {
    const permissions = await this.permissionRepository.findByResource(resource);
    return ApiResponseDto.success(
      permissions,
      `Permissions for resource '${resource}' retrieved successfully`,
      200
    );
  }

  @Get(':id')
  @AuthPermissions('permission:read')
  @ApiOperation({ 
    summary: 'Get permission by ID',
    description: 'Retrieve detailed information about a specific permission'
  })
  @ApiSwaggerResponse({ 
    status: 200, 
    description: 'Permission retrieved successfully',
    type: ApiResponseDto<PermissionResponseDto>
  })
  @ApiSwaggerResponse({ status: 404, description: 'Permission not found' })
  async getPermissionById(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ApiResponseDto<PermissionResponseDto | null>> {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      return ApiResponseDto.error('Permission not found', 404, 'PERMISSION_NOT_FOUND') as any;
    }
    return ApiResponseDto.success(permission, 'Permission retrieved successfully', 200);
  }

  @Post()
  @AuthPermissions('permission:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new permission',
    description: `Create a new permission with specified code, resource, and action.
    
    **Validation Rules:**
    - Permission code must be unique
    - Code format must be "resource.action" or "resource.action.scope"
      - Examples: "employee.create", "employee.read.own", "leave.approve.department"
    - Code must match resource and action fields
    - If scope is provided, it must be in the code
    
    **Common Resources:**
    - employee, department, position
    - leave, attendance
    - role, permission
    
    **Common Actions:**
    - create, read, update, delete
    - approve, reject, cancel
    - assign, revoke
    
    **Common Scopes:**
    - own (only own records)
    - department (department-level access)
    - all (full access)`
  })
  @ApiSwaggerResponse({ 
    status: 201, 
    description: 'Permission created successfully',
    type: ApiResponseDto<PermissionResponseDto>
  })
  @ApiSwaggerResponse({ status: 400, description: 'Invalid input or permission code already exists' })
  async createPermission(
    @Body() dto: CreatePermissionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<PermissionResponseDto>> {
    return await this.createPermissionUseCase.execute(dto, user.sub);
  }

  @Put(':id')
  @AuthPermissions('permission:update')
  @ApiOperation({ 
    summary: 'Update permission',
    description: `Update permission details (description and status only).
    
    **Validation Rules:**
    - Cannot update system permissions (only description and status)
    - Cannot modify code, resource, action, or scope of existing permissions`
  })
  @ApiSwaggerResponse({ 
    status: 200, 
    description: 'Permission updated successfully',
    type: ApiResponseDto<PermissionResponseDto>
  })
  @ApiSwaggerResponse({ status: 404, description: 'Permission not found' })
  @ApiSwaggerResponse({ status: 403, description: 'Cannot update system permission' })
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<PermissionResponseDto>> {
    return await this.updatePermissionUseCase.execute(id, dto, user.sub);
  }

  @Delete(':id')
  @AuthPermissions('permission:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete a permission',
    description: `Delete a permission from the system.
    
    **Validation Rules:**
    - Cannot delete system permissions
    - Cannot delete permission if it's assigned to any roles
    - Must remove permission from all roles and accounts before deletion`
  })
  @ApiSwaggerResponse({ 
    status: 200, 
    description: 'Permission deleted successfully',
    type: ApiResponseDto
  })
  @ApiSwaggerResponse({ status: 404, description: 'Permission not found' })
  @ApiSwaggerResponse({ status: 400, description: 'Permission is in use by roles' })
  @ApiSwaggerResponse({ status: 403, description: 'Cannot delete system permission' })
  async deletePermission(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ApiResponseDto<null>> {
    return await this.deletePermissionUseCase.execute(id);
  }
}
