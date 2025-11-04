import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public Decorator for Auth Service
 *
 * Marks an endpoint as public (bypasses JWT authentication).
 * Use this for endpoints that don't require authentication like:
 * - Login
 * - Register
 * - Health checks
 * - Public documentation
 *
 * @example
 * ```typescript
 * @Get('login')
 * @Public()
 * async login() {
 *   return 'Public endpoint';
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
