import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../types/jwt-payload.type';

/**
 * ExtractUserFromHeadersMiddleware
 * 
 * Purpose: Extract user information from HTTP headers set by API Gateway/Ingress
 * 
 * Flow:
 *   1. API Gateway verifies JWT with Auth Service
 *   2. Auth Service returns user info as headers (X-User-Id, X-User-Email, etc.)
 *   3. API Gateway forwards these headers to target service
 *   4. This middleware reads headers and populates req.user
 *   5. Service uses req.user without JWT verification!
 * 
 * Headers Expected:
 *   - X-User-Id: User's account ID
 *   - X-User-Email: User's email
 *   - X-User-Roles: User's role code
 *   - X-User-Permissions: JSON array of permissions
 *   - X-Employee-Id: Employee ID (if user is an employee)
 *   - X-Employee-Code: Employee code
 *   - X-Full-Name: User's full name
 *   - X-Department-Id: Department ID
 *   - X-Department-Name: Department name
 *   - X-Position-Id: Position ID
 *   - X-Position-Name: Position name
 * 
 * Usage:
 *   app.use(new ExtractUserFromHeadersMiddleware().use);
 */
@Injectable()
export class ExtractUserFromHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Read user headers from Ingress/API Gateway
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    const userRole = req.headers['x-user-roles'] as string;
    const userPermissionsHeader = req.headers['x-user-permissions'] as string;
    // ✅ NEW: Extract employee context from headers
    const employeeId = req.headers['x-employee-id'] as string;
    const employeeCode = req.headers['x-employee-code'] as string;
    const fullName = req.headers['x-full-name'] as string;
    const departmentId = req.headers['x-department-id'] as string;
    const departmentName = req.headers['x-department-name'] as string;
    const positionId = req.headers['x-position-id'] as string;
    const positionName = req.headers['x-position-name'] as string;

    // If no user headers, skip (public endpoints or dev mode)
    if (!userId && !userEmail) {
      return next();
    }

    // Parse permissions from JSON string
    let permissions: string[] = [];
    if (userPermissionsHeader) {
      try {
        permissions = JSON.parse(userPermissionsHeader);
      } catch (error) {
        console.warn(
          '[ExtractUserMiddleware] Failed to parse permissions:',
          error,
        );
        permissions = [];
      }
    }

    // Populate req.user with header data
    const user: JwtPayload = {
      sub: parseInt(userId, 10),
      email: userEmail,
      role: userRole,
      permissions: permissions,
      // ✅ NEW: Add employee context
      employee_id: employeeId ? parseInt(employeeId, 10) : undefined,
      employee_code: employeeCode || undefined,
      full_name: fullName || undefined,
      department_id: departmentId ? parseInt(departmentId, 10) : undefined,
      department_name: departmentName || undefined,
      position_id: positionId ? parseInt(positionId, 10) : undefined,
      position_name: positionName || undefined,
    };

    // Attach user to request
    (req as any).user = user;

    next();
  }
}

/**
 * extractUserFromHeaders - Functional middleware
 * 
 * Functional version for use in routes directly
 * 
 * Usage:
 *   @Get('/employees')
 *   @UseGuards(extractUserFromHeaders)
 *   async getEmployees(@CurrentUser() user: JwtPayload) { ... }
 */
export function extractUserFromHeaders(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = req.headers['x-user-id'] as string;
  const userEmail = req.headers['x-user-email'] as string;
  const userRole = req.headers['x-user-roles'] as string;
  const userPermissionsHeader = req.headers['x-user-permissions'] as string;

  // ✅ NEW: Extract employee context from headers
  const employeeId = req.headers['x-employee-id'] as string;
  const employeeCode = req.headers['x-employee-code'] as string;
  const fullName = req.headers['x-full-name'] as string;
  const departmentId = req.headers['x-department-id'] as string;
  const departmentName = req.headers['x-department-name'] as string;
  const positionId = req.headers['x-position-id'] as string;
  const positionName = req.headers['x-position-name'] as string;

  if (!userId && !userEmail) {
    return next();
  }

  let permissions: string[] = [];
  if (userPermissionsHeader) {
    try {
      permissions = JSON.parse(userPermissionsHeader);
    } catch (error) {
      permissions = [];
    }
  }

  const user: JwtPayload = {
    sub: parseInt(userId, 10),
    email: userEmail,
    role: userRole,
    permissions: permissions,
    // ✅ NEW: Add employee context
    employee_id: employeeId ? parseInt(employeeId, 10) : undefined,
    employee_code: employeeCode || undefined,
    full_name: fullName || undefined,
    department_id: departmentId ? parseInt(departmentId, 10) : undefined,
    department_name: departmentName || undefined,
    position_id: positionId ? parseInt(positionId, 10) : undefined,
    position_name: positionName || undefined,
  };

  (req as any).user = user;
  next();
}
