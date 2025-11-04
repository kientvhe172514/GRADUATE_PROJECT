import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@graduate-project/shared-common';
import { AuthPermissions } from '../decorators/auth-permissions.decorator';
import { Public } from '../decorators/public.decorator';

/**
 * REFERENCE CONTROLLER: Auth Service Permission Patterns
 *
 * This controller demonstrates all permission checking patterns
 * available in the Auth Service.
 *
 * Auth Service is SPECIAL:
 * - Uses AuthJwtPermissionGuard (extends AuthGuard('jwt'))
 * - Actually verifies JWT tokens (not just reads headers)
 * - Uses @AuthPermissions() decorator (NOT shared-common @Permissions())
 * - Uses @Public() to bypass authentication
 *
 * Other services (employee, leave, attendance, etc.):
 * - Use HeaderBasedPermissionGuard (NO JWT verification)
 * - Read user info from X-User-* headers (set by Traefik ForwardAuth)
 * - Use @Permissions() decorator from shared-common
 * - Use @Public() to bypass permission checks
 */
@ApiTags('examples')
@Controller('examples')
@ApiBearerAuth()
export class ExamplePermissionsController {
  /**
   * PATTERN 1: Public Endpoint
   * - Anyone can access (no JWT required)
   * - Use for: login, register, health checks
   */
  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Public endpoint - No auth required' })
  @HttpCode(HttpStatus.OK)
  async publicEndpoint() {
    return {
      message: 'This is a public endpoint',
      auth_required: false,
    };
  }

  /**
   * PATTERN 2: Authenticated Endpoint (No specific permission)
   * - Requires valid JWT token
   * - No permission check
   * - Use for: user profile, settings
   */
  @Get('authenticated')
  @ApiOperation({ summary: 'Authenticated endpoint - JWT required' })
  @HttpCode(HttpStatus.OK)
  async authenticatedEndpoint(@CurrentUser() user: JwtPayload) {
    return {
      message: 'You are authenticated',
      user_id: user.sub,
      email: user.email,
    };
  }

  /**
   * PATTERN 3: Single Permission Required
   * - Requires valid JWT token
   * - Requires specific permission
   * - Use for: most CRUD operations
   */
  @Get('single-permission')
  @AuthPermissions('example:read')
  @ApiOperation({ summary: 'Single permission required' })
  @HttpCode(HttpStatus.OK)
  async singlePermission(@CurrentUser() user: JwtPayload) {
    return {
      message: 'You have example:read permission',
      user_id: user.sub,
      required_permission: 'example:read',
    };
  }

  /**
   * PATTERN 4: Multiple Permissions Required (ANY)
   * - Requires valid JWT token
   * - User needs AT LEAST ONE of the listed permissions
   * - Use for: endpoints accessible by multiple roles
   */
  @Get('multiple-permissions-any')
  @AuthPermissions('example:read', 'example:admin', 'admin:super')
  @ApiOperation({ summary: 'Any of multiple permissions required' })
  @HttpCode(HttpStatus.OK)
  async multiplePermissionsAny(@CurrentUser() user: JwtPayload) {
    return {
      message: 'You have at least one required permission',
      user_id: user.sub,
      required_permissions: ['example:read', 'example:admin', 'admin:super'],
      note: 'User needs ANY of these permissions',
    };
  }

  /**
   * PATTERN 5: Admin-Only Endpoint
   * - Requires admin permissions
   * - Use for: system management, user management
   */
  @Post('admin-only')
  @AuthPermissions('admin:accounts:update')
  @ApiOperation({ summary: 'Admin only - account management' })
  @HttpCode(HttpStatus.CREATED)
  async adminOnly(@CurrentUser() user: JwtPayload, @Body() data: any) {
    return {
      message: 'Admin action performed',
      performed_by: user.sub,
      permission: 'admin:accounts:update',
      data,
    };
  }

  /**
   * PATTERN 6: Resource-Specific Permissions
   * - CRUD operations on specific resources
   * - Follow naming convention: resource:action
   */
  @Post('resource-create')
  @AuthPermissions('employee:create')
  @ApiOperation({ summary: 'Create resource - specific permission' })
  @HttpCode(HttpStatus.CREATED)
  async createResource(@CurrentUser() user: JwtPayload, @Body() data: any) {
    return {
      message: 'Resource created',
      created_by: user.sub,
      permission: 'employee:create',
      data,
    };
  }

  @Get('resource-read/:id')
  @AuthPermissions('employee:read')
  @ApiOperation({ summary: 'Read resource - specific permission' })
  @HttpCode(HttpStatus.OK)
  async readResource(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return {
      message: 'Resource retrieved',
      resource_id: id,
      accessed_by: user.sub,
      permission: 'employee:read',
    };
  }

  @Put('resource-update/:id')
  @AuthPermissions('employee:update')
  @ApiOperation({ summary: 'Update resource - specific permission' })
  @HttpCode(HttpStatus.OK)
  async updateResource(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() data: any,
  ) {
    return {
      message: 'Resource updated',
      resource_id: id,
      updated_by: user.sub,
      permission: 'employee:update',
      data,
    };
  }

  @Delete('resource-delete/:id')
  @AuthPermissions('employee:delete')
  @ApiOperation({ summary: 'Delete resource - specific permission' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteResource(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return {
      message: 'Resource deleted',
      resource_id: id,
      deleted_by: user.sub,
      permission: 'employee:delete',
    };
  }

  /**
   * PATTERN 7: Hierarchical Permissions
   * - More specific permissions for sub-resources
   * - Use colon notation: resource:sub-resource:action
   */
  @Get('hierarchical')
  @AuthPermissions('admin:audit-logs:read')
  @ApiOperation({ summary: 'Hierarchical permission structure' })
  @HttpCode(HttpStatus.OK)
  async hierarchicalPermission(@CurrentUser() user: JwtPayload) {
    return {
      message: 'Hierarchical permission granted',
      user_id: user.sub,
      permission: 'admin:audit-logs:read',
      note: 'Permissions can be nested: resource:sub-resource:action',
    };
  }

  /**
   * PATTERN 8: Composite Operations
   * - Operations that affect multiple resources
   * - Require multiple specific permissions
   */
  @Post('composite-operation')
  @AuthPermissions('role:assign-permissions')
  @ApiOperation({ summary: 'Composite operation requiring special permission' })
  @HttpCode(HttpStatus.OK)
  async compositeOperation(
    @CurrentUser() user: JwtPayload,
    @Body() data: any,
  ) {
    return {
      message: 'Composite operation performed',
      performed_by: user.sub,
      permission: 'role:assign-permissions',
      note: 'This operation modifies both roles and permissions',
      data,
    };
  }

  /**
   * BEST PRACTICES:
   *
   * 1. Permission Naming Convention:
   *    - Use colon separation: resource:action or resource:sub-resource:action
   *    - Examples: employee:read, admin:accounts:update, role:assign-permissions
   *
   * 2. Granularity:
   *    - More specific permissions = better security
   *    - Group related permissions by resource
   *
   * 3. Avoid These Mistakes:
   *    ❌ Don't use shared-common @Permissions() in Auth Service
   *    ❌ Don't use manual role checks (if (user.role !== 'ADMIN'))
   *    ❌ Don't use @UseGuards(AuthGuard('jwt')) manually (it's global)
   *    ✅ Use @AuthPermissions() decorator
   *    ✅ Use @Public() for public endpoints
   *    ✅ Let the global guard handle authentication
   *
   * 4. Auth Service vs Other Services:
   *    - Auth Service: Uses AuthJwtPermissionGuard + @AuthPermissions()
   *    - Other Services: Use HeaderBasedPermissionGuard + @Permissions()
   *
   * 5. Development Mode:
   *    - Set SKIP_AUTH=true to bypass authentication
   *    - Useful for local development and testing
   */
}
