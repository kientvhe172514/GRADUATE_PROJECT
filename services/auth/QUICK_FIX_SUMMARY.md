# ⚡ Quick Fix Summary - Exception Handling

## ❌ Vấn đề
Tạo role trùng code → trả về **Internal Server Error 500** thay vì error chuẩn.

## ✅ Giải pháp
Đăng ký `HttpExceptionFilter` từ shared-common trong `app.module.ts`

## 🔧 Thay đổi

### 1. `app.module.ts`
```typescript
// Import
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from '@graduate-project/shared-common';

// Providers
providers: [
  {
    provide: APP_FILTER,
    useClass: HttpExceptionFilter,
  },
  // ... other providers
]
```

### 2. Xóa filter cũ
- ❌ `src/presentation/filters/http-exception.filter.ts`

### 3. `main.ts`
```typescript
// ❌ XÓA dòng này:
// app.useGlobalFilters(new HttpExceptionFilter());
```

## ✅ Kết quả

**Trước:**
```json
{
  "statusCode": 500,
  "message": "Internal Server Error"
}
```

**Sau:**
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Role code 'TEAM_LEAD' already exists",
  "data": null,
  "errorCode": "ROLE_CODE_ALREADY_EXISTS",
  "timestamp": "2025-11-10T11:25:00.000Z",
  "path": "/api/v1/auth/roles"
}
```

## 🎯 Áp dụng cho TẤT CẢ API
- ✅ Role Management
- ✅ Permission Management  
- ✅ Account Management
- ✅ Admin APIs

## 🚀 Test ngay
```bash
# Build
npm run build

# Start
npm run start:dev

# Test tạo role trùng
POST http://localhost:3001/api/v1/auth/roles
Authorization: Bearer {{ACCESS_TOKEN}}

{
  "code": "ADMIN",
  "name": "Duplicate",
  "level": 1
}
```

**Done!** ✨
