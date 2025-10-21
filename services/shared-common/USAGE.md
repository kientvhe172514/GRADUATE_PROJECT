# Shared Common Module - Usage Guide

## Quick Setup

1. **Build the module:**
   ```bash
   cd services/shared-common
   npm install
   npm run build
   ```

2. **Install in other services:**
   ```bash
   # From auth service
   cd ../auth
   npm install ../shared-common
   
   # From notification service  
   cd ../notification
   npm install ../shared-common
   ```

## Usage Examples

### In Controllers:
```typescript
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';

@Controller('example')
export class ExampleController {
  @Get()
  async getData(): Promise<ApiResponseDto<any>> {
    try {
      const data = await this.service.getData();
      return ApiResponseDto.success(data, 'Data retrieved successfully');
    } catch (error) {
      throw new BusinessException(ErrorCodes.NOT_FOUND, 'Data not found');
    }
  }
}
```

### In Use Cases:
```typescript
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';

export class ExampleUseCase {
  async execute(id: number): Promise<any> {
    if (!id) {
      throw new BusinessException(ErrorCodes.BAD_REQUEST, 'ID is required');
    }
    // ... business logic
  }
}
```

### Global Exception Filter:
```typescript
import { HttpExceptionFilter } from '@graduate-project/shared-common';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

## Available Exports

- `ApiResponseDto` - Standardized API response format
- `BusinessException` - Custom business exceptions
- `ErrorCodes` - Centralized error codes
- `JwtAuthGuard` - JWT authentication guard
- `CurrentUser` - Extract current user decorator
- `HttpExceptionFilter` - Global exception handling

## Error Codes Available

- General: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, etc.
- Auth: `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `TOKEN_EXPIRED`, etc.
- Notification: `NOTIFICATION_NOT_FOUND`, `INVALID_NOTIFICATION_TYPE`, etc.
