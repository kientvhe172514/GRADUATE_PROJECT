import { Controller, Post, Get, HttpCode, HttpStatus, UseGuards, Headers, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Request, Response } from 'express';

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
@Controller('auth')
export class VerifyController {
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
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Verify JWT token for API Gateway',
    description: 'This endpoint is used by Traefik ForwardAuth to verify JWT tokens and inject user headers'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token valid - User headers set',
    headers: {
      'X-User-Id': { description: 'User ID', schema: { type: 'string' } },
      'X-User-Email': { description: 'User email', schema: { type: 'string' } },
      'X-User-Permissions': { description: 'User permissions (JSON array)', schema: { type: 'string' } },
      'X-User-Roles': { description: 'User role code', schema: { type: 'string' } },
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verify(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ status: string }> {
    // Set user info in response headers for Traefik to forward
    res.setHeader('X-User-Id', user.sub.toString());
    res.setHeader('X-User-Email', user.email);
    res.setHeader('X-User-Roles', user.role || '');
    
    // Serialize permissions as JSON string
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    res.setHeader('X-User-Permissions', JSON.stringify(permissions));

    return { status: 'ok' };
  }

  /**
   * GET /api/v1/auth/verify
   * 
   * Alternative GET endpoint for Traefik ForwardAuth
   * Some Traefik configurations prefer GET over POST
   */
  @Get('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Verify JWT token for API Gateway (GET)',
    description: 'Alternative GET endpoint for Traefik ForwardAuth'
  })
  @ApiResponse({ status: 200, description: 'Token valid - User headers set' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verifyGet(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ status: string }> {
    // Same logic as POST
    res.setHeader('X-User-Id', user.sub.toString());
    res.setHeader('X-User-Email', user.email);
    res.setHeader('X-User-Roles', user.role || '');
    
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    res.setHeader('X-User-Permissions', JSON.stringify(permissions));

    return { status: 'ok' };
  }
}
