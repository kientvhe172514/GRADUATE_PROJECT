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
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@graduate-project/shared-common';
import { AuthPermissions } from '../decorators/auth-permissions.decorator';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsToRoleDto,
} from '../dto/role.dto';
import { RoleRepositoryPort } from '../../application/ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../application/tokens';
import { CreateRoleUseCase } from '../../application/use-cases/rbac/create-role.use-case';
import { UpdateRoleUseCase } from '../../application/use-cases/rbac/update-role.use-case';
import { DeleteRoleUseCase } from '../../application/use-cases/rbac/delete-role.use-case';

@ApiTags('roles')
@Controller('roles')
@ApiBearerAuth()
export class RoleController {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private roleRepository: RoleRepositoryPort,
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
  ) {}

  @Get()
  @AuthPermissions('role.read')
  @ApiOperation({ summary: 'Get all roles with pagination' })
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
  async getAllRoles(
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const { roles, total } = await this.roleRepository.findAll({ 
      status, 
      page: pageNum, 
      limit: limitNum 
    });
    return {
      message: 'Get all roles',
      data: roles,
      pagination: { page: pageNum, limit: limitNum, total },
    };
  }

  @Get(':id')
  @AuthPermissions('role.read')
  @ApiOperation({ summary: 'Get role by ID with permissions' })
  async getRoleById(@Param('id') id: number) {
    const role = await this.roleRepository.findByIdWithPermissions(id);
    return {
      message: 'Get role by ID',
      data: role,
    };
  }

  @Post()
  @AuthPermissions('role.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role' })
  async createRole(@Body() dto: CreateRoleDto, @CurrentUser() user: JwtPayload) {
    const role = await this.createRoleUseCase.execute({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      level: dto.level,
      status: 'active', // Default to active
      created_by: user.sub,
    });

    return {
      message: 'Role created successfully',
      data: role,
    };
  }

  @Put(':id')
  @AuthPermissions('role.update')
  @ApiOperation({ summary: 'Update role information' })
  async updateRole(
    @Param('id') id: number,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const role = await this.updateRoleUseCase.execute(id, {
      name: dto.name,
      description: dto.description,
      level: dto.level,
      status: dto.status,
      updated_by: user.sub,
    });

    return {
      message: 'Role updated successfully',
      data: role,
    };
  }

  @Delete(':id')
  @AuthPermissions('role.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param('id') id: number) {
    await this.deleteRoleUseCase.execute(id);
    return { message: 'Role deleted successfully' };
  }

  @Post(':id/permissions')
  @AuthPermissions('role.assign_permissions')
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
  @AuthPermissions('role.assign_permissions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePermissionFromRole(
    @Param('id') id: number,
    @Param('permissionId') permissionId: number,
  ) {
    // TODO: Implement remove permission from role
    return { message: 'Permission removed successfully' };
  }

  @Get(':id/permissions')
  @AuthPermissions('role.read')
  async getRolePermissions(@Param('id') id: number) {
    const permissions = await this.roleRepository.getRolePermissions(id);
    return {
      message: 'Get role permissions',
      data: { role_id: id, permissions },
    };
  }
}
