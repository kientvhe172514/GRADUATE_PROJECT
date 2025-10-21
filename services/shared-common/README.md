# Shared Common Module

This module contains shared utilities, DTOs, exceptions, and other common components used across all services in the Graduate Project.

## Features

- **ApiResponseDto**: Standardized API response format
- **BusinessException**: Custom business logic exceptions
- **ErrorCodes**: Centralized error code definitions
- **JwtAuthGuard**: JWT authentication guard
- **CurrentUser Decorator**: Extract current user from request
- **HttpExceptionFilter**: Global exception handling

## Installation

```bash
# Build the shared common module
npm run build

# Install in other services
npm install ../shared-common
```

## Usage

```typescript
import { 
  ApiResponseDto, 
  BusinessException, 
  ErrorCodes,
  JwtAuthGuard,
  CurrentUser,
  HttpExceptionFilter 
} from '@graduate-project/shared-common';
```

## Architecture Compliance

This module follows the 4 core rules:

1. **Clean Architecture & SOLID**: Well-structured with clear separation of concerns
2. **Module Common**: Reusable components across all services
3. **DTO For Everything**: All data transfer objects are properly typed
4. **Standard Response**: All responses follow ApiResponseDto format

## Contributing

When adding new shared components:

1. Follow the existing structure
2. Add proper TypeScript types
3. Include JSDoc documentation
4. Update the index.ts exports
5. Add tests if applicable
