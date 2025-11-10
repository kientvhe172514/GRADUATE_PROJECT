# 📦 Shared Common Module

This module contains shared utilities, DTOs, exceptions, guards, and other common components used across all microservices in the Graduate Project.

## ✨ Features

### 🎯 Core Components

- **ApiResponseDto**: Standardized API response wrapper with success/error handling
- **BusinessException**: Custom business logic exceptions with error codes
- **ErrorCodes Enum**: Centralized error code definitions for all services
- **JwtPayload Type**: Standardized JWT token structure
- **CurrentUser Decorator**: Extract authenticated user from request
- **HttpExceptionFilter**: Global exception handling and formatting

### 🔒 Guards

- **HeaderBasedPermissionGuard**: Permission checking for microservices (reads from Ingress headers)
- **Permissions Decorator**: Declare required permissions for endpoints
- **Public Decorator**: Mark endpoints as publicly accessible

### 🛠️ Middlewares

- **ExtractUserFromHeadersMiddleware**: Extract user info from X-User-* headers set by Ingress

### 📝 Types

- **JwtPayload**: User authentication payload structure
- **RefreshTokenPayload**: Refresh token payload
- **ServiceTokenPayload**: Service-to-service authentication

## 📦 Installation

### Build the Module

```bash
cd services/shared-common
npm install
npm run build
```

### Use in Services (pnpm workspace)

In your service's `package.json`:

```json
{
  "dependencies": {
    "@graduate-project/shared-common": "workspace:*"
  }
}
```

## 🚀 Usage Examples

### 1. ApiResponseDto - Standardized Responses

```typescript
import { ApiResponseDto } from '@graduate-project/shared-common';

// Success response
return ApiResponseDto.success(
  userData,
  'User retrieved successfully',
  200,
  req.path,
  'USER_RETRIEVED'
);

// Error response
return ApiResponseDto.error(
  'User not found',
  404,
  ErrorCodes.USER_NOT_FOUND,
  'No user exists with this ID',
  req.path
);
```

**Response Format:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "User retrieved successfully",
  "data": { ... },
  "timestamp": "2025-11-10T...",
  "path": "/api/users/123"
}
```

### 2. BusinessException - Domain Errors

```typescript
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';

// Throw business exception
if (!user) {
  throw new BusinessException(
    ErrorCodes.USER_NOT_FOUND,
    'User not found',
    404
  );
}
```

### 3. Permission Guard - RBAC

```typescript
import { 
  HeaderBasedPermissionGuard, 
  Permissions 
} from '@graduate-project/shared-common';

@Controller('employees')
@UseGuards(HeaderBasedPermissionGuard)
export class EmployeeController {
  
  @Get()
  @Permissions('employee:read')  // ← Required permission
  async listEmployees() {
    // Only users with 'employee:read' permission can access
  }
  
  @Post()
  @Permissions('employee:create')
  async createEmployee() {
    // Only users with 'employee:create' permission
  }
}
```

### 4. CurrentUser Decorator

```typescript
import { CurrentUser, JwtPayload } from '@graduate-project/shared-common';

@Get('me')
async getProfile(@CurrentUser() user: JwtPayload) {
  // user.sub = account_id
  // user.email = email
  // user.role = role code
  // user.permissions = permission array
  return this.userService.getProfile(user.sub);
}
```

### 5. Public Endpoints

```typescript
import { Public } from '@graduate-project/shared-common';

@Controller('health')
export class HealthController {
  
  @Get()
  @Public()  // ← No authentication required
  health() {
    return { status: 'ok' };
  }
}
```

### 6. Error Codes Usage

```typescript
import { ErrorCodes } from '@graduate-project/shared-common';

// Use predefined error codes
ErrorCodes.UNAUTHORIZED
ErrorCodes.VALIDATION_ERROR
ErrorCodes.USER_NOT_FOUND
ErrorCodes.PERMISSION_DENIED
ErrorCodes.ROLE_IN_USE
ErrorCodes.PERMISSION_IN_USE
// ... and more
```

## 🏗️ Architecture

### Clean Architecture Compliance

```
shared-common/
├── src/
│   ├── dto/              # Data Transfer Objects
│   │   └── api-response.dto.ts
│   ├── exceptions/       # Custom exceptions
│   │   └── business.exception.ts
│   ├── enums/           # Enums and constants
│   │   └── error-codes.enum.ts
│   ├── types/           # TypeScript types
│   │   └── jwt-payload.type.ts
│   ├── guards/          # NestJS guards
│   │   └── jwt-permission.guard.ts
│   ├── decorators/      # Custom decorators
│   │   └── current-user.decorator.ts
│   ├── middlewares/     # Express middlewares
│   │   └── extract-user.middleware.ts
│   ├── filters/         # Exception filters
│   │   └── http-exception.filter.ts
│   └── index.ts         # Public exports
└── package.json
```

### Design Principles

✅ **SOLID**: Each component has single responsibility  
✅ **DRY**: No duplication across services  
✅ **Type Safety**: Full TypeScript coverage  
✅ **Reusability**: Used by all microservices  
✅ **Consistency**: Standardized patterns  

## 🔐 Security Features

### Permission-Based Access Control

The `HeaderBasedPermissionGuard` checks permissions passed from Auth Service via Ingress:

**Flow:**
1. User authenticates with Auth Service
2. Auth Service validates JWT and extracts permissions
3. Ingress forwards request with headers: `X-User-Id`, `X-User-Role`, `X-User-Permissions`
4. `ExtractUserFromHeadersMiddleware` reads headers → sets `req.user`
5. `HeaderBasedPermissionGuard` checks `req.user.permissions`

### ADMIN Bypass

ADMIN role bypasses all permission checks:

```typescript
if (user.role === 'ADMIN') {
  return true; // Full access
}
```

## 📚 Available Error Codes

### General
- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `INTERNAL_SERVER_ERROR`
- `VALIDATION_ERROR`

### Authentication
- `INVALID_CREDENTIALS`
- `ACCOUNT_LOCKED`
- `ACCOUNT_NOT_FOUND`
- `TOKEN_EXPIRED`
- `INVALID_TOKEN`

### RBAC
- `ROLE_NOT_FOUND`
- `ROLE_CODE_ALREADY_EXISTS`
- `ROLE_IN_USE`
- `PERMISSION_NOT_FOUND`
- `PERMISSION_CODE_ALREADY_EXISTS`
- `PERMISSION_IN_USE`
- `PERMISSION_DENIED`

### Employee
- `EMPLOYEE_NOT_FOUND`
- `EMPLOYEE_ALREADY_EXISTS`
- `DEPARTMENT_NOT_FOUND`
- `POSITION_NOT_FOUND`

### Leave Management
- `LEAVE_TYPE_NOT_FOUND`
- `LEAVE_BALANCE_NOT_FOUND`
- `INSUFFICIENT_LEAVE_BALANCE`
- `LEAVE_REQUEST_OVERLAPS`

_(See `src/enums/error-codes.enum.ts` for complete list)_

## 🔄 Development Workflow

### Adding New Components

1. **Create component file:**
   ```bash
   touch src/types/new-type.type.ts
   ```

2. **Add exports to index.ts:**
   ```typescript
   export * from './types/new-type.type';
   ```

3. **Rebuild:**
   ```bash
   npm run build
   ```

4. **Services auto-update** (pnpm workspace handles it)

### Adding New Error Codes

1. Open `src/enums/error-codes.enum.ts`
2. Add new code:
   ```typescript
   export enum ErrorCodes {
     // ...
     MY_NEW_ERROR = 'MY_NEW_ERROR',
   }
   ```
3. Rebuild shared-common
4. Use in services:
   ```typescript
   import { ErrorCodes } from '@graduate-project/shared-common';
   throw new BusinessException(ErrorCodes.MY_NEW_ERROR, 'Error message', 400);
   ```

## 🧪 Testing

```bash
# Run tests (if available)
npm test

# Type checking
npm run build
```

## 📝 Contributing Guidelines

When contributing to shared-common:

1. ✅ **Follow existing patterns** - consistency is key
2. ✅ **Add TypeScript types** - no `any` types
3. ✅ **Document with JSDoc** - explain complex logic
4. ✅ **Export in index.ts** - make it available
5. ✅ **Update README** - document new features
6. ✅ **Rebuild after changes** - `npm run build`
7. ✅ **Test in services** - ensure compatibility

## 🔗 Used By Services

- ✅ **Auth Service** - Authentication & Authorization
- ✅ **Employee Service** - Employee management
- ✅ **Leave Service** - Leave requests
- ✅ **Attendance Service** - Check-in/out
- ✅ **Notification Service** - Notifications
- ✅ **Reporting Service** - Reports & analytics

## 📦 Package Info

- **Name:** `@graduate-project/shared-common`
- **Version:** `1.0.0`
- **Registry:** `http://localhost:4873/` (Verdaccio)
- **Workspace:** pnpm workspace

## 🐛 Troubleshooting

### "Cannot find module '@graduate-project/shared-common'"

```bash
# Rebuild shared-common
cd services/shared-common
npm run build

# Reinstall in service
cd ../your-service
rm -rf node_modules
npm install
```

### Type errors after updating shared-common

```bash
# Rebuild shared-common
cd services/shared-common
npm run build

# Restart TypeScript server in VSCode
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Changes not reflected in services

```bash
# Rebuild and reinstall
cd services/shared-common
npm run build

# In each service using it
cd ../auth
npm install
npm run build
```

## 📞 Support

For questions or issues:
- Check service documentation
- Review TypeScript definitions in `dist/`
- Examine source code in `src/`

## 🎯 Future Enhancements

- [ ] Add validation pipes
- [ ] Add custom transformers
- [ ] Add pagination utilities
- [ ] Add date/time utilities
- [ ] Add logging utilities
- [ ] Add metrics decorators
- [ ] Add cache decorators
- [ ] Add rate limiting utilities

---

**Built with ❤️ for Graduate Project 2025**
