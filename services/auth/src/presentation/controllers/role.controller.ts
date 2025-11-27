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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, ApiResponseDto } from '@graduate-project/shared-common';
import { AuthPermissions } from '../decorators/auth-permissions.decorator';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsToRoleDto,
} from '../dto/role.dto';
import { ListRolesDto } from '../../application/dto/role/list-roles.dto';
import { CreateRoleUseCase } from '../../application/use-cases/rbac/create-role.use-case';
import { UpdateRoleUseCase } from '../../application/use-cases/rbac/update-role.use-case';
import { DeleteRoleUseCase } from '../../application/use-cases/rbac/delete-role.use-case';
import { GetRolesUseCase } from '../../application/use-cases/rbac/get-roles.use-case';
import { GetRoleByIdUseCase } from '../../application/use-cases/rbac/get-role-by-id.use-case';
import { GetRolePermissionsUseCase } from '../../application/use-cases/rbac/get-role-permissions.use-case';
import { AssignPermissionsToRoleUseCase } from '../../application/use-cases/rbac/assign-permissions-to-role.use-case';
import { RemovePermissionFromRoleUseCase } from '../../application/use-cases/rbac/remove-permission-from-role.use-case';
import { GetRolesResponseDto } from '../../application/dto/role/get-roles-response.dto';
import { GetRoleWithPermissionsResponseDto } from '../../application/dto/role/get-role-with-permissions-response.dto';
import { CreateRoleResponseDto } from '../../application/dto/role/create-role-response.dto';
import { UpdateRoleResponseDto } from '../../application/dto/role/update-role-response.dto';
import { AssignPermissionsResponseDto } from '../../application/dto/role/assign-permissions-response.dto';
import { GetRolePermissionsResponseDto } from '../../application/dto/role/get-role-permissions-response.dto';

@ApiTags('roles')
@Controller('roles')
@ApiBearerAuth()
export class RoleController {
  constructor(
    private readonly getRolesUseCase: GetRolesUseCase,
    private readonly getRoleByIdUseCase: GetRoleByIdUseCase,
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
    private readonly getRolePermissionsUseCase: GetRolePermissionsUseCase,
    private readonly assignPermissionsToRoleUseCase: AssignPermissionsToRoleUseCase,
    private readonly removePermissionFromRoleUseCase: RemovePermissionFromRoleUseCase,
  ) {}

  @Get()
  @AuthPermissions('auth.role.read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all roles with pagination' })
  @ApiResponse({ status: 200, type: GetRolesResponseDto, description: 'Roles retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  async getAllRoles(
    @Query() filters?: ListRolesDto,
  ): Promise<ApiResponseDto<GetRolesResponseDto>> {
    return await this.getRolesUseCase.execute(filters);
  }

  @Get(':id')
  @AuthPermissions('auth.role.read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get role by ID with permissions' })
  @ApiParam({ name: 'id', type: 'number', description: 'Role ID' })
  @ApiResponse({ status: 200, type: GetRoleWithPermissionsResponseDto, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  async getRoleById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<GetRoleWithPermissionsResponseDto>> {
    return await this.getRoleByIdUseCase.execute(id);
  }

  @Post()
  @AuthPermissions('auth.role.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, type: CreateRoleResponseDto, description: 'Role created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or role code already exists' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  async createRole(
    @Body() dto: CreateRoleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<CreateRoleResponseDto>> {
    return await this.createRoleUseCase.execute({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      level: dto.level,
      status: 'active', // Default to active
      created_by: user.sub,
    });
  }

  @Put(':id')
  @AuthPermissions('auth.role.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update role information' })
  @ApiParam({ name: 'id', type: 'number', description: 'Role ID' })
  @ApiResponse({ status: 200, type: UpdateRoleResponseDto, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Permission denied or cannot update system role' })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<UpdateRoleResponseDto>> {
    return await this.updateRoleUseCase.execute(id, {
      name: dto.name,
      description: dto.description,
      level: dto.level,
      status: dto.status,
      updated_by: user.sub,
    });
  }

  @Delete(':id')
  @AuthPermissions('auth.role.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', type: 'number', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Permission denied or cannot delete system role' })
  async deleteRole(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<null>> {
    return await this.deleteRoleUseCase.execute(id);
  }

  @Post(':id/permissions')
  @AuthPermissions('auth.role.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign permissions to role' })
  @ApiParam({ name: 'id', type: 'number', description: 'Role ID' })
  @ApiResponse({ status: 200, type: AssignPermissionsResponseDto, description: 'Permissions assigned successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  async assignPermissionsToRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsToRoleDto,
  ): Promise<ApiResponseDto<AssignPermissionsResponseDto>> {
    return await this.assignPermissionsToRoleUseCase.execute({
      role_id: id,
      permission_ids: dto.permission_ids,
    });
  }

  @Delete(':id/permissions/:permissionId')
  @AuthPermissions('auth.role.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove permission from role' })
  @ApiParam({ name: 'id', type: 'number', description: 'Role ID' })
  @ApiParam({ name: 'permissionId', type: 'number', description: 'Permission ID' })
  @ApiResponse({ status: 200, description: 'Permission removed successfully' })
  @ApiResponse({ status: 404, description: 'Role or permission not found' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  async removePermissionFromRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ): Promise<ApiResponseDto<null>> {
    return await this.removePermissionFromRoleUseCase.execute(id, permissionId);
  }

  @Get(':id/permissions')
  @AuthPermissions('auth.role.read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get role permissions' })
  @ApiParam({ name: 'id', type: 'number', description: 'Role ID' })
  @ApiResponse({ status: 200, type: GetRolePermissionsResponseDto, description: 'Role permissions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  async getRolePermissions(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<GetRolePermissionsResponseDto>> {
    return await this.getRolePermissionsUseCase.execute(id);
  }
}
