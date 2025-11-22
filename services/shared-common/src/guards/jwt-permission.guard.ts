import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../types/jwt-payload.type';
import { Request } from 'express';

export const PERMISSIONS_KEY = 'permissions';
export const REQUIRE_AUTH_KEY = 'require_auth';

export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const Public = () => SetMetadata(REQUIRE_AUTH_KEY, true);

/**
 * HeaderBasedPermissionGuard
 * 
 * Purpose: Check permissions based on user info from headers (set by Ingress)
 * 
 * NOTE: This guard does NOT verify JWT tokens!
 * JWT verification is done by Auth Service at Ingress level.
 * This guard only checks if user has required permissions.
 * 
 * Flow:
 *   1. ExtractUserFromHeadersMiddleware reads headers and sets req.user
 *   2. This guard checks req.user.permissions
 *   3. If permission check fails → 403 Forbidden
 * 
 * Usage:
 *   @Permissions('leave.create')
 *   @Post()
 *   async createLeave() { ... }
 */
@Injectable()
export class HeaderBasedPermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const controllerClass = context.getClass();

    // Check if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_AUTH_KEY,
      [handler, controllerClass],
    );

    if (isPublic === true) {
      return true;
    }

    // Get request
    const request = context.switchToHttp().getRequest<Request>();
    
    // Get user from request (set by ExtractUserFromHeadersMiddleware)
    const user: JwtPayload = (request as any).user || request['user'];

    // If no user in request, authentication is required
    if (!user) {
      throw new UnauthorizedException('Authentication required - No user headers found');
    }

    // ✅ ADMIN bypass: Full access to all endpoints
    if (user.role === 'ADMIN') {
      console.log('✅ [PERMISSION GUARD] ADMIN detected - bypassing permission check');
      return true;
    }

    // Check permissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // No specific permissions required
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

    // console.log('[PERMISSION GUARD] Permission check succeeded. Access granted.');
    return true;
  }

  private checkPermissions(
    userPermissions: string[],
    requiredPermissions: string[],
  ): boolean {
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}