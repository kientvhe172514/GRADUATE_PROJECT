import {
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  Headers,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';

/**
 * VerifyController - Auth verification endpoint for API Gateway
 * 
 * Purpose: This controller is ONLY for Ingress/API Gateway to verify JWT tokens
 * Flow:
 *   1. Client → Ingress → /api/v1/auth/verify (this endpoint)
 *   2. Verify JWT token
 *   3. Return user info as HTTP headers (X-User-Id, X-User-Email, X-User-Permissions)
 *   4. Ingress forwards these headers to target service
 *   5. Target service reads headers directly (NO JWT verification needed!)
 */
@ApiTags('auth-verify')
@Controller('')
export class VerifyController {
  constructor(private jwtService: JwtService) {}

  /**
   * POST /api/v1/auth/verify
   * 
   * Verify JWT token and return user info in response headers
   * This endpoint is called by Traefik ForwardAuth middleware
   * 
   * Request Headers:
   *   - Authorization: Bearer <jwt-token>
   * 
   * Response Headers (on success 200):
   *   - X-User-Id: User's ID
   *   - X-User-Email: User's email
   *   - X-User-Permissions: JSON array of permissions
   *   - X-User-Roles: User's role code
   * 
   * Response (on failure):
   *   - 401 Unauthorized
   */
  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify JWT token for API Gateway',
    description:
      'This endpoint is used by Traefik ForwardAuth to verify JWT tokens and inject user headers',
  })
  @ApiResponse({
    status: 200,
    description: 'Token valid - User headers set',
    headers: {
      'X-User-Id': { description: 'User ID', schema: { type: 'string' } },
      'X-User-Email': {
        description: 'User email',
        schema: { type: 'string' },
      },
      'X-User-Permissions': {
        description: 'User permissions (JSON array)',
        schema: { type: 'string' },
      },
      'X-User-Roles': {
        description: 'User role code',
        schema: { type: 'string' },
      },
      'X-Employee-Id': {
        description: 'Employee ID (if user has employee record)',
        schema: { type: 'string' },
      },
      'X-Employee-Code': {
        description: 'Employee code (if available)',
        schema: { type: 'string' },
      },
      'X-Full-Name': {
        description: 'Employee full name (if available)',
        schema: { type: 'string' },
      },
      'X-Department-Id': {
        description: 'Department ID (if available)',
        schema: { type: 'string' },
      },
      'X-Department-Name': {
        description: 'Department name (if available)',
        schema: { type: 'string' },
      },
      'X-Position-Id': {
        description: 'Position ID (if available)',
        schema: { type: 'string' },
      },
      'X-Position-Name': {
        description: 'Position name (if available)',
        schema: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verify(
    @Headers('authorization') authorization: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ status: string }> {
    // Verify endpoint MUST have token
    // Public routes (login, register) should NOT go through auth-forward middleware
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authorization.substring(7);

    try {
      // Verify token manually
      const payload = await this.jwtService.verifyAsync(token);

      // Set user info in response headers for Traefik to forward
      res.setHeader('X-User-Id', payload.sub.toString());
      res.setHeader('X-User-Email', payload.email);
      res.setHeader('X-User-Roles', payload.role || '');

      // Serialize permissions as JSON string
      const permissions = Array.isArray(payload.permissions)
        ? payload.permissions
        : [];
      res.setHeader('X-User-Permissions', JSON.stringify(permissions));

      // ✅ NEW: Add employee context headers (if available)
      if (payload.employee_id) {
        res.setHeader('X-Employee-Id', payload.employee_id.toString());
      }
      if (payload.employee_code) {
        res.setHeader('X-Employee-Code', payload.employee_code);
      }
      if (payload.full_name) {
        res.setHeader('X-Full-Name', payload.full_name);
      }
      if (payload.department_id) {
        res.setHeader('X-Department-Id', payload.department_id.toString());
      }
      if (payload.department_name) {
        res.setHeader('X-Department-Name', payload.department_name);
      }
      if (payload.position_id) {
        res.setHeader('X-Position-Id', payload.position_id.toString());
      }
      if (payload.position_name) {
        res.setHeader('X-Position-Name', payload.position_name);
      }

      return { status: 'ok' };
    } catch (error) {
      // Invalid token → 401 (block request)
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * GET /api/v1/auth/verify
   * 
   * Alternative GET endpoint for Traefik ForwardAuth
   * Some Traefik configurations prefer GET over POST
   */
  @Public()
  @Get('verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify JWT token for API Gateway (GET)',
    description: 'Alternative GET endpoint for Traefik ForwardAuth',
  })
  @ApiResponse({
    status: 200,
    description: 'Token valid - User headers set',
    headers: {
      'X-User-Id': { description: 'User ID', schema: { type: 'string' } },
      'X-User-Email': { description: 'User email', schema: { type: 'string' } },
      'X-User-Permissions': { description: 'User permissions (JSON array)', schema: { type: 'string' } },
      'X-User-Roles': { description: 'User role code', schema: { type: 'string' } },
      'X-Employee-Id': { description: 'Employee ID (if user has employee record)', schema: { type: 'string' } },
      'X-Employee-Code': { description: 'Employee code (if available)', schema: { type: 'string' } },
      'X-Full-Name': { description: 'Employee full name (if available)', schema: { type: 'string' } },
      'X-Department-Id': { description: 'Department ID (if available)', schema: { type: 'string' } },
      'X-Department-Name': { description: 'Department name (if available)', schema: { type: 'string' } },
      'X-Position-Id': { description: 'Position ID (if available)', schema: { type: 'string' } },
      'X-Position-Name': { description: 'Position name (if available)', schema: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verifyGet(
    @Headers('authorization') authorization: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ status: string }> {
    // Verify endpoint MUST have token
    // Public routes (login, register) should NOT go through auth-forward middleware
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authorization.substring(7);

    try {
      const payload = await this.jwtService.verifyAsync(token);

      res.setHeader('X-User-Id', payload.sub.toString());
      res.setHeader('X-User-Email', payload.email);
      res.setHeader('X-User-Roles', payload.role || '');

      const permissions = Array.isArray(payload.permissions)
        ? payload.permissions
        : [];
      res.setHeader('X-User-Permissions', JSON.stringify(permissions));

      // ✅ NEW: Add employee context headers (if available)
      if (payload.employee_id) {
        res.setHeader('X-Employee-Id', payload.employee_id.toString());
      }
      if (payload.employee_code) {
        res.setHeader('X-Employee-Code', payload.employee_code);
      }
      if (payload.full_name) {
        res.setHeader('X-Full-Name', payload.full_name);
      }
      if (payload.department_id) {
        res.setHeader('X-Department-Id', payload.department_id.toString());
      }
      if (payload.department_name) {
        res.setHeader('X-Department-Name', payload.department_name);
      }
      if (payload.position_id) {
        res.setHeader('X-Position-Id', payload.position_id.toString());
      }
      if (payload.position_name) {
        res.setHeader('X-Position-Name', payload.position_name);
      }

      return { status: 'ok' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
