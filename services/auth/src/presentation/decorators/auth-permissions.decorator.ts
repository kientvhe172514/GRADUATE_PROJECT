import { SetMetadata } from '@nestjs/common';

/**
 * Permissions decorator for Auth Service
 * 
 * NOTE: This is different from shared-common @Permissions()
 * Auth Service uses its own decorator because it has different guard logic
 */
export const AUTH_PERMISSIONS_KEY = 'auth_permissions';

export const AuthPermissions = (...permissions: string[]) =>
  SetMetadata(AUTH_PERMISSIONS_KEY, permissions);
