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
import { JwtService } from '@nestjs/jwt';

export const PERMISSIONS_KEY = 'permissions';
export const REQUIRE_AUTH_KEY = 'require_auth';

export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const Public = () => SetMetadata(REQUIRE_AUTH_KEY, true);

/**
 * HeaderBasedPermissionGuard
 * 
 * Purpose: Check permissions based on user info from headers (set by Ingress) OR JWT token
 * 
 * TWO MODES:
 * 1. Header-based (Production with API Gateway):
 *    - Ingress verifies JWT and forwards user info as headers
 *    - This guard reads headers and checks permissions
 * 
 * 2. JWT-based (Local development / Direct access):
 *    - Client sends Bearer token directly
 *    - This guard verifies JWT and extracts user info
 *    - Then checks permissions
 * 
 * Flow:
 *   1. Check if req.user exists (set by ExtractUserFromHeadersMiddleware)
 *   2. If not, try to extract and verify JWT from Authorization header
 *   3. Check permissions
 *   4. Return 403 if permission check fails
 * 
 * Usage:
 *   @Permissions('leave.create')
 *   @Post()
 *   async createLeave() { ... }
 */
@Injectable()
export class HeaderBasedPermissionGuard implements CanActivate {
  private jwtService?: JwtService;

  constructor(
    private reflector: Reflector,
    jwtService?: JwtService, // Optional: For JWT verification fallback
  ) {
    this.jwtService = jwtService;
  }

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
    let user: JwtPayload = (request as any).user || request['user'];

    // If no user from headers, try to extract from JWT token (fallback for local dev)
    if (!user && this.jwtService) {
      user = await this.extractUserFromJWT(request);
    }

    // If still no user, authentication is required
    if (!user) {
      throw new UnauthorizedException('Authentication required - No user headers or valid JWT token found');
    }

    // ✅ SUPER_ADMIN bypass: Full access to all endpoints
    if (user.role === 'SUPER_ADMIN') {
      console.log('✅ [PERMISSION GUARD] SUPER_ADMIN detected - bypassing permission check');
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

  /**
   * Extract user from JWT token (fallback for local development)
   */
  private async extractUserFromJWT(request: Request): Promise<JwtPayload | null> {
    try {
      const authHeader = request.headers.authorization || request.headers.Authorization;
      if (!authHeader || typeof authHeader !== 'string') {
        return null;
      }

      const token = authHeader.replace('Bearer ', '').trim();
      if (!token) {
        return null;
      }

      // Verify and decode JWT
      const payload = await this.jwtService!.verifyAsync(token);

      // Extract user info from JWT payload
      const user: JwtPayload = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions || [],
        employee_id: payload.employee_id,
      };

      // Attach to request for downstream use
      (request as any).user = user;

      console.log('✅ [JWT Guard] User authenticated via JWT token:', {
        sub: user.sub,
        email: user.email,
        role: user.role,
        permissionsCount: user.permissions.length,
      });

      return user;
    } catch (error) {
      console.warn('[JWT Guard] Failed to verify JWT token:', error.message);
      return null;
    }
  }
}