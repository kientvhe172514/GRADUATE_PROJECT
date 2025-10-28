import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Permissions, CurrentUser, JwtPayload } from '@graduate-project/shared-common';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsToRoleDto } from '../dto/role.dto';
import { RoleRepositoryPort } from '../../application/ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../application/tokens';

@ApiTags('roles')
@Controller('roles')
// @UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class RoleController {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepository: RoleRepositoryPort,
  ) {}
  
  @Get()
  @Permissions('role.read')
  @ApiOperation({ summary: 'Get all roles with pagination' })
  @ApiQuery({ name: 'status', required: false, example: 'active', description: 'Filter by status: active, inactive' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, example: 20, description: 'Items per page' })
  async getAllRoles(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const { roles, total } = await this.roleRepository.findAll({ status, page, limit });
    return {
      message: 'Get all roles',
      data: roles,
      pagination: { page, limit, total },
    };
  }

  @Get(':id')
  @Permissions('role.read')
  @ApiOperation({ summary: 'Get role by ID with permissions' })
  async getRoleById(@Param('id') id: number) {
    const role = await this.roleRepository.findByIdWithPermissions(id);
    return {
      message: 'Get role by ID',
      data: role,
    };
  }

  @Post()
  @Permissions('role.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role' })
  async createRole(@Body() dto: CreateRoleDto, @CurrentUser() user: JwtPayload) {
    // TODO: Implement create role
    // Validate: code must be unique
    // Validate: level must be >= current user's role level (can't create higher role)
    return {
      message: 'Role created successfully',
      data: { id: 1, ...dto, created_by: user.sub },
    };
  }

  @Put(':id')
  @Permissions('role.update')
  @ApiOperation({ summary: 'Update role information' })
  async updateRole(
    @Param('id') id: number,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // TODO: Implement update role
    // Validate: cannot update system roles (is_system_role = true)
    // Validate: level must be >= current user's role level
    return {
      message: 'Role updated successfully',
      data: { id, ...dto, updated_by: user.sub },
    };
  }

  @Delete(':id')
  @Permissions('role.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param('id') id: number, @CurrentUser() user: JwtPayload) {
    // TODO: Implement delete role
    // Validate: cannot delete system roles
    // Validate: cannot delete role if accounts are using it
    return { message: 'Role deleted successfully' };
  }

  @Post(':id/permissions')
  @Permissions('role.assign_permissions')
  async assignPermissionsToRole(
    @Param('id') id: number,
    @Body() dto: AssignPermissionsToRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // TODO: Implement assign permissions to role
    // Bulk insert into role_permissions table
    // Remove existing permissions first, then insert new ones
    return {
      message: 'Permissions assigned successfully',
      data: { role_id: id, permission_ids: dto.permission_ids },
    };
  }

  @Delete(':id/permissions/:permissionId')
  @Permissions('role.assign_permissions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePermissionFromRole(
    @Param('id') id: number,
    @Param('permissionId') permissionId: number,
  ) {
    // TODO: Implement remove permission from role
    return { message: 'Permission removed successfully' };
  }

  @Get(':id/permissions')
  @Permissions('role.read')
  async getRolePermissions(@Param('id') id: number) {
    const permissions = await this.roleRepository.getRolePermissions(id);
    return {
      message: 'Get role permissions',
      data: { role_id: id, permissions },
    };
  }
}
