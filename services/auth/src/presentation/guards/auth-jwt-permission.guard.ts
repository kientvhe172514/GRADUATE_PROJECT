import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * AuthJwtPermissionGuard
 *
 * Purpose: Guard specifically for Auth Service
 *
 * This guard VERIFIES JWT tokens using Passport JWT strategy
 * AND checks permissions.
 *
 * NOTE: This is different from shared-common HeaderBasedPermissionGuard
 * which only reads headers without JWT verification.
 *
 * Usage in Auth Service:
 *   - Applied globally in app.module.ts
 *   - Verifies JWT tokens
 *   - Checks permissions with @AuthPermissions()
 *   - Use @Public() to bypass
 */
@Injectable()
export class AuthJwtPermissionGuard
  extends AuthGuard('jwt')
  implements CanActivate
{
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const controllerClass = context.getClass();

    // Get request once for all checks
    const request = context.switchToHttp().getRequest<Request>();
    
    // Skip guard for Swagger and static assets
    const path = request.url;
    if (path.startsWith('/api/v1/auth-json') || 
        path.startsWith('/api/v1/auth-yaml') ||
        path.includes('swagger') ||
        path.includes('api-docs')) {
      return true;
    }

    // Check if endpoint is marked as public with @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      controllerClass,
    ]);

    if (isPublic === true) {
      return true;
    }

    // Verify JWT token using Passport strategy
    try {
      const authenticated = await super.canActivate(context);
      if (!authenticated) {
        throw new UnauthorizedException('Invalid token');
      }
    } catch (error) {
      throw new UnauthorizedException('Authentication required');
    }

    // Get user from request (set by Passport JWT strategy)
    const user = (request as any).user;

    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }

    // ✅ SUPER_ADMIN bypass: Full access to all endpoints
    if (user.role === 'SUPER_ADMIN') {
      console.log('✅ SUPER_ADMIN detected - bypassing permission check');
      return true;
    }

    // Check permissions if required (using auth_permissions key)
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'auth_permissions',
      [handler, controllerClass],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const hasPermission = this.checkPermissions(
      user.permissions || [],
      requiredPermissions,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Missing required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  private checkPermissions(
    userPermissions: string[],
    requiredPermissions: string[],
  ): boolean {
    // User needs at least ONE of the required permissions (OR logic)
    return requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );
  }
}
