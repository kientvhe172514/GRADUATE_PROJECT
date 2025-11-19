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
  CreatePermissionDto,
  UpdatePermissionDto,
} from '../dto/permission.dto';
import { PermissionRepositoryPort } from '../../application/ports/permission.repository.port';
import { PERMISSION_REPOSITORY } from '../../application/tokens';

@ApiTags('permissions')
@Controller('permissions')
@ApiBearerAuth()
export class PermissionController {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private permissionRepository: PermissionRepositoryPort,
  ) {}

  @Get()
  @AuthPermissions('auth.permission.read')
  @ApiOperation({ summary: 'Get all permissions with filters' })
  @ApiQuery({
    name: 'resource',
    required: false,
    example: 'employee',
    description: 'Filter by resource',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: 'active',
    description: 'Filter by status',
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
  async getAllPermissions(
    @Query('resource') resource?: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const { permissions, total } =
      await this.permissionRepository.findAll({
        resource,
        status,
        page,
        limit,
      });
    return {
      message: 'Get all permissions',
      data: permissions,
      pagination: { page, limit, total },
    };
  }

  @Get('by-resource/:resource')
  @AuthPermissions('auth.permission.read')
  async getPermissionsByResource(@Param('resource') resource: string) {
    const permissions = await this.permissionRepository.findByResource(resource);
    return {
      message: 'Get permissions by resource',
      data: permissions,
    };
  }

  @Get(':id')
  @AuthPermissions('auth.permission.read')
  async getPermissionById(@Param('id') id: number) {
    const permission = await this.permissionRepository.findById(id);
    return {
      message: 'Get permission by ID',
      data: permission,
    };
  }

  @Post()
  @AuthPermissions('auth.permission.create')
  @HttpCode(HttpStatus.CREATED)
  async createPermission(
    @Body() dto: CreatePermissionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // TODO: Implement create permission
    // Validate: code must be unique
    // Validate: code format must be "resource.action" or "resource.action.scope"
    return {
      message: 'Permission created successfully',
      data: { id: 1, ...dto, created_by: user.sub },
    };
  }

  @Put(':id')
  @AuthPermissions('auth.permission.update')
  async updatePermission(
    @Param('id') id: number,
    @Body() dto: UpdatePermissionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // TODO: Implement update permission
    // Validate: cannot update system permissions (is_system_permission = true)
    // Only allow update description and status
    return {
      message: 'Permission updated successfully',
      data: { id, ...dto, updated_by: user.sub },
    };
  }

  @Delete(':id')
  @AuthPermissions('auth.permission.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePermission(@Param('id') id: number) {
    // TODO: Implement delete permission
    // Validate: cannot delete system permissions
    // Validate: remove from role_permissions and account_permissions first
    return { message: 'Permission deleted successfully' };
  }
}
