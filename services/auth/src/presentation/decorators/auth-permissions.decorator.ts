import { SetMetadata } from '@nestjs/common';

/**
 * ⚠️ AUTH SERVICE SPECIFIC DECORATOR
 * 
 * @AuthPermissions() - Used ONLY in Auth Service
 * 
 * Why different from shared-common @Permissions()?
 * - Auth Service: Uses AuthJwtPermissionGuard that VERIFIES JWT tokens
 * - Other Services: Use HeaderBasedPermissionGuard that reads pre-verified headers
 * 
 * Architecture:
 * [Client] → [Ingress/Auth] → [Other Services]
 *            ↑ JWT Verification   ↑ Header-based auth
 * 
 * Usage in Auth Service:
 * ```typescript
 * @AuthPermissions('role:create', 'role:update')
 * @Post('roles')
 * async createRole() { ... }
 * ```
 * 
 * For other services, use:
 * ```typescript
 * import { Permissions } from '@graduate-project/shared-common';
 * 
 * @Permissions('leave.create')
 * @Post('leaves')
 * async createLeave() { ... }
 * ```
 */
export const AUTH_PERMISSIONS_KEY = 'auth_permissions';

export const AuthPermissions = (...permissions: string[]) =>
  SetMetadata(AUTH_PERMISSIONS_KEY, permissions);
