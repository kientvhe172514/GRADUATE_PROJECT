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
import { AuthGuard } from '@nestjs/passport';

export const PERMISSIONS_KEY = 'permissions';
export const REQUIRE_AUTH_KEY = 'require_auth';

export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const Public = () => SetMetadata(REQUIRE_AUTH_KEY, true);

@Injectable()
export class JwtPermissionGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
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

    try {
      // Call AuthGuard for authentication
      const can = await super.canActivate(context);

      if (!can) {
        throw new UnauthorizedException('Authentication required');
      }
    } catch (error) {
      throw new UnauthorizedException('Authentication required');
    }

    // Get user from request
    const request = context.switchToHttp().getRequest<Request>();
    const user: JwtPayload = (request as any).user || request['user'];

    // Log user permissions
    // console.log('[PERMISSION GUARD] User permissions:', user.permissions || []);

    // Check permissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // console.log('[PERMISSION GUARD] No specific permissions required. Access granted.');
      return true;
    }

    // Log required permissions
    // console.log('[PERMISSION GUARD] Required permissions:', requiredPermissions);

    const hasPermission = this.checkPermissions(
      user.permissions || [],
      requiredPermissions,
    );

    if (!hasPermission) {
      // console.log('[PERMISSION GUARD] Permission check failed. Missing required permissions.');
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