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
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsToRoleDto } from '../dto/role.dto';
import { 
  RoleResponseDto, 
  RoleWithPermissionsDto, 
  RoleListResponseDto 
} from '../../application/dto/rbac/role-response.dto';
import { ROLE_LEVELS } from '../../domain/value-objects/account-type.vo';
import { CreateRoleUseCase } from '../../application/use-cases/rbac/create-role.use-case';
import { UpdateRoleUseCase } from '../../application/use-cases/rbac/update-role.use-case';
import { DeleteRoleUseCase } from '../../application/use-cases/rbac/delete-role.use-case';
import { GetRoleDetailUseCase } from '../../application/use-cases/rbac/get-role-detail.use-case';
import { ListRolesUseCase } from '../../application/use-cases/rbac/list-roles.use-case';
import { AssignPermissionsToRoleUseCase } from '../../application/use-cases/rbac/assign-permissions-to-role.use-case';

@ApiTags('roles')
@Controller('roles')
@ApiBearerAuth()
export class RoleController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
    private readonly getRoleDetailUseCase: GetRoleDetailUseCase,
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly assignPermissionsToRoleUseCase: AssignPermissionsToRoleUseCase,
  ) {}

  @Get()
  @AuthPermissions('role:read')
  @ApiOperation({ 
    summary: 'Get all roles with pagination',
    description: 'Retrieve a paginated list of roles with optional filtering by status'
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
    example: 20,
    description: 'Items per page',
  })
  @ApiSwaggerResponse({ 
    status: 200, 
    description: 'Roles retrieved successfully',
    type: ApiResponseDto<RoleListResponseDto>
  })
  async getAllRoles(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<ApiResponseDto<RoleListResponseDto>> {
    return await this.listRolesUseCase.execute({ status, page, limit });
  }

  @Get(':id')
  @AuthPermissions('role:read')
  @ApiOperation({ 
    summary: 'Get role by ID with permissions',
    description: 'Retrieve detailed information about a specific role including all assigned permissions'
  })
  @ApiSwaggerResponse({ 
    status: 200, 
    description: 'Role retrieved successfully',
    type: ApiResponseDto<RoleWithPermissionsDto>
  })
  @ApiSwaggerResponse({ status: 404, description: 'Role not found' })
  async getRoleById(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ApiResponseDto<RoleWithPermissionsDto>> {
    return await this.getRoleDetailUseCase.execute(id);
  }

  @Post()
  @AuthPermissions('role:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new role',
    description: `Create a new role with specified permissions level.
    
    **Validation Rules:**
    - Role code must be unique (uppercase recommended)
    - Level must be between 1 (highest) and 4 (lowest)
    - Cannot create role with higher privileges than your own role
    - System roles cannot be created via API
    
    **Role Hierarchy:**
    - Level 1: ADMIN (highest privileges)
    - Level 2: HR_MANAGER
    - Level 3: DEPARTMENT_MANAGER
    - Level 4: EMPLOYEE (lowest privileges)`
  })
  @ApiSwaggerResponse({ 
    status: 201, 
    description: 'Role created successfully',
    type: ApiResponseDto<RoleResponseDto>
  })
  @ApiSwaggerResponse({ status: 400, description: 'Invalid input or role code already exists' })
  @ApiSwaggerResponse({ status: 403, description: 'Cannot create role with higher privileges than your role' })
  async createRole(
    @Body() dto: CreateRoleDto, 
    @CurrentUser() user: JwtPayload
  ): Promise<ApiResponseDto<RoleResponseDto>> {
    const userRoleLevel = ROLE_LEVELS[user.role] || 4;
    return await this.createRoleUseCase.execute(dto, user.sub, userRoleLevel);
  }

  @Put(':id')
  @AuthPermissions('role:update')
  @ApiOperation({ 
    summary: 'Update role information',
    description: `Update role details (name, description, level, status).
    
    **Validation Rules:**
    - Cannot update system roles
    - Cannot update role with higher privileges than your own
    - Cannot set level higher than your own role level`
  })
  @ApiSwaggerResponse({ 
    status: 200, 
    description: 'Role updated successfully',
    type: ApiResponseDto<RoleResponseDto>
  })
  @ApiSwaggerResponse({ status: 404, description: 'Role not found' })
  @ApiSwaggerResponse({ status: 403, description: 'Cannot update system role or role with higher privileges' })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<RoleResponseDto>> {
    const userRoleLevel = ROLE_LEVELS[user.role] || 4;
    return await this.updateRoleUseCase.execute(id, dto, user.sub, userRoleLevel);
  }

  @Delete(':id')
  @AuthPermissions('role:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete a role',
    description: `Delete a role from the system.
    
    **Validation Rules:**
    - Cannot delete system roles (ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE)
    - Cannot delete role if accounts are currently using it
    - Cannot delete role with higher privileges than your own`
  })
  @ApiSwaggerResponse({ 
    status: 200, 
    description: 'Role deleted successfully',
    type: ApiResponseDto
  })
  @ApiSwaggerResponse({ status: 404, description: 'Role not found' })
  @ApiSwaggerResponse({ status: 400, description: 'Role is in use by accounts' })
  @ApiSwaggerResponse({ status: 403, description: 'Cannot delete system role or role with higher privileges' })
  async deleteRole(
    @Param('id', ParseIntPipe) id: number, 
    @CurrentUser() user: JwtPayload
  ): Promise<ApiResponseDto<null>> {
    const userRoleLevel = ROLE_LEVELS[user.role] || 4;
    return await this.deleteRoleUseCase.execute(id, user.sub, userRoleLevel);
  }

  @Post(':id/permissions')
  @AuthPermissions('role:assign-permissions')
  @ApiOperation({ 
    summary: 'Assign permissions to role',
    description: `Bulk assign permissions to a role. This operation replaces all existing permissions.
    
    **Validation Rules:**
    - Cannot modify system roles
    - All permission IDs must exist
    - Cannot assign to role with higher privileges than your own`
  })
  @ApiSwaggerResponse({ 
    status: 200, 
    description: 'Permissions assigned successfully',
    type: ApiResponseDto
  })
  @ApiSwaggerResponse({ status: 404, description: 'Role or permission not found' })
  @ApiSwaggerResponse({ status: 403, description: 'Cannot modify system role or role with higher privileges' })
  async assignPermissionsToRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsToRoleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<{ role_id: number; permission_ids: number[] }>> {
    const userRoleLevel = ROLE_LEVELS[user.role] || 4;
    return await this.assignPermissionsToRoleUseCase.execute(
      id, 
      dto.permission_ids, 
      user.sub, 
      userRoleLevel
    );
  }

  @Get(':id/permissions')
  @AuthPermissions('role:read')
  @ApiOperation({ 
    summary: 'Get role permissions',
    description: 'Retrieve all permissions assigned to a specific role'
  })
  @ApiSwaggerResponse({ 
    status: 200, 
    description: 'Permissions retrieved successfully'
  })
  @ApiSwaggerResponse({ status: 404, description: 'Role not found' })
  async getRolePermissions(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ApiResponseDto<RoleWithPermissionsDto>> {
    return await this.getRoleDetailUseCase.execute(id);
  }
}
