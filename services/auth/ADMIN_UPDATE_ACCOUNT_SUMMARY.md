# Admin Update Account - Implementation Summary

## 🎯 Mục đích
Thêm endpoint cho Admin để update thông tin account bao gồm **assign role**.

---

## ✅ Đã hoàn thành

### 1. DTOs
**File:** `services/auth/src/application/dto/admin/update-account.dto.ts`

```typescript
// Input DTO với validation đầy đủ
export class AdminUpdateAccountDto {
  email?: string;
  full_name?: string;
  role?: string;  // Role code: SUPER_ADMIN, ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE
  status?: string; // ACTIVE, INACTIVE, LOCKED, SUSPENDED
  employee_id?: number;
  employee_code?: string;
  department_id?: number;
  department_name?: string;
  position_id?: number;
  position_name?: string;
  external_ids?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Output DTO
export class AdminUpdateAccountResponseDto {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  status: string;
  // ... other fields
  sync_version: number;
  updated_at: Date;
}
```

### 2. Use Case
**File:** `services/auth/src/application/use-cases/admin/update-account.use-case.ts`

**Features:**
- ✅ Email duplicate check
- ✅ Role code → role_id conversion
- ✅ Change tracking
- ✅ Audit logging
- ✅ Event publishing
- ✅ Business validation

**Flow:**
1. Find account by ID
2. Validate email (duplicate check)
3. Validate and convert role code to role_id
4. Update fields
5. Save to database
6. Create audit log
7. Publish event
8. Return response

### 3. Controller Endpoint
**File:** `services/auth/src/presentation/controllers/admin.controller.ts`

```typescript
@Put('admin/accounts/:id')
@AuthPermissions('admin.accounts.update')
async updateAccount(
  @Param('id') id: string,
  @Body() body: AdminUpdateAccountDto,
  @CurrentUser() user: any,
  @Req() req: any,
): Promise<ApiResponseDto<AdminUpdateAccountResponseDto>>
```

### 4. Module Registration
**File:** `services/auth/src/application/account.module.ts`
- ✅ Import `AdminUpdateAccountUseCase`
- ✅ Add to providers array
- ✅ Inject vào `AdminController`

---

## 🔑 API Endpoint

```
PUT /admin/accounts/:id
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```

### Request Example
```json
{
  "role": "HR_MANAGER",
  "full_name": "Nguyễn Văn A",
  "status": "ACTIVE"
}
```

### Response Example
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Account updated successfully",
  "data": {
    "id": 1,
    "email": "user@zentry.com",
    "full_name": "Nguyễn Văn A",
    "role": "HR_MANAGER",
    "status": "ACTIVE",
    "sync_version": 2,
    "updated_at": "2025-11-17T10:30:00.000Z"
  }
}
```

---

## 📋 Tuân thủ 6 quy tắc

### 1. ✅ Clean Architecture & SOLID
- Domain Layer: `Account` entity
- Application Layer: `AdminUpdateAccountUseCase`, DTOs
- Infrastructure Layer: `PostgresAccountRepository`
- Presentation Layer: `AdminController`
- Dependency Injection với Ports/Adapters

### 2. ✅ DTO Cho Mọi Input/Output
- Input: `AdminUpdateAccountDto` với class-validator
- Output: `AdminUpdateAccountResponseDto`
- No raw types

### 3. ✅ Chuẩn Response API
```typescript
return ApiResponseDto.success(response, 'Account updated successfully', 200);
```

### 4. ✅ RBAC (Phân quyền)
```typescript
@AuthPermissions('admin.accounts.update')
```
- SUPER_ADMIN: ✅ Full access
- ADMIN: ✅ Has permission
- Others: ❌ No access

### 5. ✅ Tận dụng shared-common
- `ApiResponseDto`
- `BusinessException`
- `ErrorCodes`
- `@CurrentUser()` decorator
- `@AuthPermissions()` decorator

### 6. ✅ Tính nhất quán
- Pattern giống với `UpdateAccountStatusUseCase`
- Swagger documentation đầy đủ
- Error handling consistent
- Audit logging như các use cases khác
- Event publishing theo pattern chung

---

## 🔍 Key Features

1. **Role Assignment**
   - Nhận role code (string): `HR_MANAGER`
   - Convert sang role_id (number) từ bảng `roles`
   - Validate role code trước khi update
   - Support all 5 roles: SUPER_ADMIN, ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE

2. **Email Update với Duplicate Check**
   - Check email đã tồn tại chưa
   - Throw error 409 nếu duplicate

3. **Change Tracking**
   - Track old/new values cho tất cả fields
   - Lưu vào audit_logs.metadata

4. **Audit Logging**
   - Action: `ADMIN_UPDATE_ACCOUNT`
   - Metadata: target account + changes
   - IP address + user agent

5. **Event Publishing**
   - Event: `account_updated`
   - Data: `AccountUpdatedEventDto`
   - For integration with other services

6. **Sync Version**
   - Auto increment `sync_version`
   - For data synchronization

---

## 🧪 Testing

Chi tiết testing trong file: `TEST_ADMIN_UPDATE_ACCOUNT.md`

### Quick Test
```bash
# 1. Login as Admin
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zentry.com", "password": "Admin@123"}'

# 2. Update account with role
curl -X PUT http://localhost:3001/admin/accounts/1 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role": "HR_MANAGER", "full_name": "Updated Name"}'

# 3. Verify
curl -X GET http://localhost:3001/admin/accounts/1 \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 📦 Files Created/Modified

### Created:
1. `services/auth/src/application/dto/admin/update-account.dto.ts`
2. `services/auth/src/application/use-cases/admin/update-account.use-case.ts`
3. `services/auth/TEST_ADMIN_UPDATE_ACCOUNT.md` (Test guide)
4. `services/auth/ADMIN_UPDATE_ACCOUNT_SUMMARY.md` (This file)

### Modified:
1. `services/auth/src/presentation/controllers/admin.controller.ts`
   - Added `updateAccount()` endpoint
   - Imported new DTOs and use case
   - Added comprehensive Swagger documentation

2. `services/auth/src/application/account.module.ts`
   - Imported `AdminUpdateAccountUseCase`
   - Added to providers array

---

## 🎉 Status: COMPLETE

All implementation follows the 6 rules strictly and maintains consistency with existing codebase patterns.

**Ready to use!**
