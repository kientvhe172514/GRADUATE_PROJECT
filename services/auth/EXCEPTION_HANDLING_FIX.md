# 🔧 Exception Handling Fix - Auth Service

## ❌ **Vấn đề trước khi sửa**

Khi có lỗi (ví dụ: tạo role trùng code), API trả về **Internal Server Error 500** thay vì error response chuẩn theo format `ApiResponseDto`.

**Ví dụ lỗi cũ:**
```json
{
  "statusCode": 500,
  "message": "Internal Server Error"
}
```

**Response mong muốn:**
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

---

## ✅ **Nguyên nhân**

Auth Service **chưa đăng ký Global Exception Filter** để bắt `BusinessException` và chuyển thành format `ApiResponseDto` chuẩn.

- ✅ **shared-common đã có `HttpExceptionFilter`** xử lý đúng
- ❌ **Auth Service không import và đăng ký filter này**

---

## 🔧 **Các thay đổi đã thực hiện**

### 1. **Import `HttpExceptionFilter` từ shared-common**

**File:** `services/auth/src/app.module.ts`

```typescript
import { APP_GUARD, APP_FILTER, Reflector } from '@nestjs/core';
import { HttpExceptionFilter } from '@graduate-project/shared-common';
```

### 2. **Đăng ký Global Exception Filter**

**File:** `services/auth/src/app.module.ts`

```typescript
providers: [
  // ✅ Global Exception Filter - Convert BusinessException to ApiResponseDto format
  {
    provide: APP_FILTER,
    useClass: HttpExceptionFilter,
  },
  // Auth Service JWT Permission Guard
  {
    provide: APP_GUARD,
    useFactory: (reflector: Reflector) => {
      return new AuthJwtPermissionGuard(reflector);
    },
    inject: [Reflector],
  },
],
```

### 3. **Xóa filter cũ không dùng**

- ❌ Xóa: `services/auth/src/presentation/filters/http-exception.filter.ts`
- ✅ Dùng filter từ shared-common thay thế

### 4. **Cập nhật main.ts**

**File:** `services/auth/src/main.ts`

```typescript
// ❌ XÓA: Import và đăng ký filter cũ
// import { HttpExceptionFilter } from './presentation/filters/http-exception.filter';
// app.useGlobalFilters(new HttpExceptionFilter());

// ✅ Exception filter is registered globally in app.module.ts (APP_FILTER)
// No need to register again here
```

---

## 📋 **Danh sách API đã được sửa**

### ✅ **Tất cả API giờ đây đều trả về format chuẩn khi có lỗi:**

### 1. **Role Management APIs**
- `POST /roles` - Create role (lỗi duplicate code)
- `PUT /roles/:id` - Update role (lỗi system role)
- `DELETE /roles/:id` - Delete role (lỗi role in use, system role)
- `POST /roles/:id/permissions` - Assign permissions (lỗi permission not found)

### 2. **Permission Management APIs**
- `POST /permissions` - Create permission (lỗi duplicate code, invalid format)
- `PUT /permissions/:id` - Update permission (lỗi system permission)
- `DELETE /permissions/:id` - Delete permission (lỗi permission in use)

### 3. **Account Management APIs**
- `POST /register` - Register (lỗi email exists)
- `POST /login` - Login (lỗi invalid credentials, account locked)
- `PUT /me/password` - Change password (lỗi wrong password)
- `POST /reset-password` - Reset password (lỗi invalid token)

### 4. **Admin APIs**
- `PUT /admin/accounts/:id/status` - Update status (lỗi account not found)

---

## 🧪 **Test Cases**

### Test 1: Tạo role trùng code

**Request:**
```bash
POST http://localhost:3001/api/v1/auth/roles
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "code": "ADMIN",
  "name": "Duplicate Admin",
  "level": 1
}
```

**Response (400 Bad Request):**
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Role code 'ADMIN' already exists",
  "data": null,
  "errorCode": "ROLE_CODE_ALREADY_EXISTS",
  "timestamp": "2025-11-10T15:00:00.000Z",
  "path": "/api/v1/auth/roles"
}
```

### Test 2: Xóa system role

**Request:**
```bash
DELETE http://localhost:3001/api/v1/auth/roles/1
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Response (403 Forbidden):**
```json
{
  "status": "ERROR",
  "statusCode": 403,
  "message": "Cannot delete system role",
  "data": null,
  "errorCode": "PERMISSION_DENIED",
  "timestamp": "2025-11-10T15:05:00.000Z",
  "path": "/api/v1/auth/roles/1"
}
```

### Test 3: Tạo role với level cao hơn

**Request:**
```bash
POST http://localhost:3001/api/v1/auth/roles
Authorization: Bearer {{HR_MANAGER_TOKEN}}

{
  "code": "NEW_ADMIN",
  "name": "New Admin",
  "level": 1
}
```

**Response (403 Forbidden):**
```json
{
  "status": "ERROR",
  "statusCode": 403,
  "message": "Cannot create role with higher privileges (level 1) than your role (level 2)",
  "data": null,
  "errorCode": "PERMISSION_DENIED",
  "timestamp": "2025-11-10T15:10:00.000Z",
  "path": "/api/v1/auth/roles"
}
```

### Test 4: Login với sai password

**Request:**
```bash
POST http://localhost:3001/api/v1/auth/login

{
  "email": "admin@zentry.com",
  "password": "WrongPassword"
}
```

**Response (401 Unauthorized):**
```json
{
  "status": "ERROR",
  "statusCode": 401,
  "message": "Invalid credentials",
  "data": null,
  "errorCode": "INVALID_CREDENTIALS",
  "timestamp": "2025-11-10T15:15:00.000Z",
  "path": "/api/v1/auth/login"
}
```

---

## 📊 **So sánh trước và sau**

| Aspect | ❌ Trước | ✅ Sau |
|--------|---------|--------|
| **Format** | Raw error object | ApiResponseDto chuẩn |
| **Status Code** | 500 (mọi lỗi) | Đúng (400, 401, 403, 404) |
| **Error Code** | Không có | Có `errorCode` cụ thể |
| **Message** | "Internal Server Error" | Message rõ ràng |
| **Timestamp** | Không có | ISO 8601 timestamp |
| **Path** | Không có | Request path |
| **Consistency** | Không nhất quán | Nhất quán toàn bộ API |

---

## 🎯 **Lợi ích**

### 1. **Frontend dễ xử lý**
```typescript
// Frontend code
try {
  const response = await api.createRole(roleData);
} catch (error) {
  // ✅ Bây giờ có thể check errorCode cụ thể
  if (error.errorCode === 'ROLE_CODE_ALREADY_EXISTS') {
    showError('Role code đã tồn tại, vui lòng chọn code khác');
  } else if (error.errorCode === 'PERMISSION_DENIED') {
    showError('Bạn không có quyền tạo role này');
  }
}
```

### 2. **Debugging dễ dàng**
- Có timestamp chính xác
- Có path của request
- Có errorCode để trace
- Message rõ ràng

### 3. **Tuân thủ 6 quy tắc**
- ✅ Quy tắc 3: Chuẩn Response API (ApiResponseDto)
- ✅ Quy tắc 5: Tận dụng shared-common
- ✅ Quy tắc 6: Tính nhất quán với các service khác

---

## 🚀 **Các API đã được test và confirm hoạt động đúng**

- ✅ POST /roles (duplicate code)
- ✅ DELETE /roles/:id (system role, role in use)
- ✅ PUT /roles/:id (system role)
- ✅ POST /permissions (duplicate code, invalid format)
- ✅ DELETE /permissions/:id (permission in use)
- ✅ POST /login (invalid credentials, account locked)
- ✅ POST /register (email exists)
- ✅ PUT /me/password (wrong password)

---

## 📝 **Ghi chú**

1. **HttpExceptionFilter** từ shared-common xử lý:
   - `BusinessException` → ApiResponseDto với đúng status code
   - `HttpException` → ApiResponseDto
   - `Error` generic → 500 với ApiResponseDto format

2. **Không cần thay đổi code ở Use Cases:**
   - Vẫn throw `BusinessException` như cũ
   - Filter tự động bắt và convert sang format chuẩn

3. **Áp dụng cho tất cả endpoints:**
   - Public endpoints
   - Protected endpoints
   - Admin endpoints

---

**Last Updated:** November 10, 2025  
**Version:** 1.0.0  
**Status:** ✅ Fixed & Tested
