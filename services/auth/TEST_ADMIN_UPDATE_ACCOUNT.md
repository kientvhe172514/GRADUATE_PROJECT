# Test Admin Update Account API

## Overview
API endpoint để Admin cập nhật thông tin account bao gồm **assign role**.

## Endpoint Details

```
PUT /admin/accounts/:id
```

**Permission Required:** `admin.accounts.update`

---

## 1. Update Account với Role Assignment

### Request
```http
PUT http://localhost:3001/admin/accounts/1
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "email": "newuser@zentry.com",
  "full_name": "Nguyễn Văn B",
  "role": "HR_MANAGER",
  "status": "ACTIVE",
  "employee_id": 123,
  "employee_code": "EMP123",
  "department_id": 1,
  "department_name": "Human Resources",
  "position_id": 5,
  "position_name": "HR Manager"
}
```

### Response (Success)
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Account updated successfully",
  "data": {
    "id": 1,
    "email": "newuser@zentry.com",
    "full_name": "Nguyễn Văn B",
    "role": "HR_MANAGER",
    "status": "ACTIVE",
    "employee_id": 123,
    "employee_code": "EMP123",
    "department_id": 1,
    "department_name": "Human Resources",
    "position_id": 5,
    "position_name": "HR Manager",
    "sync_version": 2,
    "updated_at": "2025-11-17T10:30:00.000Z"
  },
  "timestamp": "2025-11-17T10:30:00.000Z"
}
```

---

## 2. Chỉ Assign Role (Minimal Update)

### Request
```http
PUT http://localhost:3001/admin/accounts/1
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "role": "ADMIN"
}
```

### Response
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Account updated successfully",
  "data": {
    "id": 1,
    "email": "existing@zentry.com",
    "full_name": "Existing User",
    "role": "ADMIN",
    "status": "ACTIVE",
    "sync_version": 2,
    "updated_at": "2025-11-17T10:30:00.000Z"
  },
  "timestamp": "2025-11-17T10:30:00.000Z"
}
```

---

## 3. Update Multiple Fields

### Request
```http
PUT http://localhost:3001/admin/accounts/2
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "full_name": "Trần Thị C",
  "role": "DEPARTMENT_MANAGER",
  "status": "ACTIVE",
  "department_id": 2,
  "department_name": "Engineering",
  "metadata": {
    "notes": "Promoted to department manager",
    "promotion_date": "2025-11-17"
  }
}
```

---

## 4. Error Cases

### 4.1. Invalid Role
```http
PUT http://localhost:3001/admin/accounts/1
Content-Type: application/json

{
  "role": "INVALID_ROLE"
}
```

**Response:**
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Invalid role \"INVALID_ROLE\". Valid roles are: SUPER_ADMIN, ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE",
  "errorCode": "BAD_REQUEST",
  "timestamp": "2025-11-17T10:30:00.000Z"
}
```

### 4.2. Email Already Exists
```http
PUT http://localhost:3001/admin/accounts/1
Content-Type: application/json

{
  "email": "existing@zentry.com"
}
```

**Response:**
```json
{
  "status": "ERROR",
  "statusCode": 409,
  "message": "Email \"existing@zentry.com\" is already in use by another account",
  "errorCode": "ACCOUNT_ALREADY_EXISTS",
  "timestamp": "2025-11-17T10:30:00.000Z"
}
```

### 4.3. Account Not Found
```http
PUT http://localhost:3001/admin/accounts/99999
Content-Type: application/json

{
  "role": "ADMIN"
}
```

**Response:**
```json
{
  "status": "ERROR",
  "statusCode": 404,
  "message": "Account not found",
  "errorCode": "ACCOUNT_NOT_FOUND",
  "timestamp": "2025-11-17T10:30:00.000Z"
}
```

### 4.4. Role Not Found in Database
```http
PUT http://localhost:3001/admin/accounts/1
Content-Type: application/json

{
  "role": "HR_MANAGER"
}
```

**Response (nếu chưa seed RBAC):**
```json
{
  "status": "ERROR",
  "statusCode": 404,
  "message": "Role \"HR_MANAGER\" not found in database. Please run RBAC seeding.",
  "errorCode": "ROLE_NOT_FOUND",
  "timestamp": "2025-11-17T10:30:00.000Z"
}
```

---

## 5. Valid Roles

| Role Code | Level | Description |
|-----------|-------|-------------|
| `SUPER_ADMIN` | 1 | Full system access |
| `ADMIN` | 2 | System administrator |
| `HR_MANAGER` | 3 | Human resources manager |
| `DEPARTMENT_MANAGER` | 4 | Department manager |
| `EMPLOYEE` | 5 | Regular employee |

---

## 6. Valid Statuses

| Status | Description |
|--------|-------------|
| `ACTIVE` | Account is active and can login |
| `INACTIVE` | Account is disabled |
| `LOCKED` | Account is temporarily locked |
| `SUSPENDED` | Account is suspended |

---

## 7. Optional Fields

All fields in the request body are **optional**. You can update only the fields you need:

- `email` - Email address
- `full_name` - Full name
- `role` - Role code (will be converted to role_id internally)
- `status` - Account status
- `employee_id` - Link to employee service
- `employee_code` - Employee code
- `department_id` - Department ID
- `department_name` - Department name
- `position_id` - Position ID
- `position_name` - Position name
- `external_ids` - External IDs mapping (JSON object)
- `metadata` - Additional metadata (JSON object)

---

## 8. Features

✅ **Email validation** - Checks for duplicate email before updating  
✅ **Role assignment** - Converts role code to role_id automatically  
✅ **Role validation** - Only accepts valid role codes  
✅ **Audit logging** - Logs all changes to audit_logs table  
✅ **Event publishing** - Publishes `account_updated` event for integration  
✅ **Change tracking** - Tracks old and new values for all fields  
✅ **Sync version** - Increments sync_version for data synchronization  

---

## 9. Differences from `/admin/accounts/:id/status`

| Feature | `/admin/accounts/:id` | `/admin/accounts/:id/status` |
|---------|----------------------|------------------------------|
| **Purpose** | Full account update | Quick status change only |
| **Role assignment** | ✅ Yes | ❌ No |
| **Email update** | ✅ Yes | ❌ No |
| **Multiple fields** | ✅ Yes | ❌ No (status + reason only) |
| **Change tracking** | ✅ Detailed | ⚠️ Basic |
| **Use case** | Complete account management | Quick lock/unlock actions |

---

## 10. Testing Steps

### Step 1: Get Admin Token
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@zentry.com",
    "password": "Admin@123"
  }'
```

### Step 2: Update Account with Role
```bash
curl -X PUT http://localhost:3001/admin/accounts/1 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "HR_MANAGER",
    "full_name": "Updated Name"
  }'
```

### Step 3: Verify Changes
```bash
curl -X GET http://localhost:3001/admin/accounts/1 \
  -H "Authorization: Bearer <TOKEN>"
```

### Step 4: Check Audit Logs
```bash
curl -X GET "http://localhost:3001/admin/audit-logs?action=ADMIN_UPDATE_ACCOUNT" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 11. Swagger Documentation

API sẽ tự động có trong Swagger UI tại:
```
http://localhost:3001/api-docs
```

Tag: **admin**  
Operation: `PUT /admin/accounts/{id}`  
Summary: Update account information including role assignment

---

## 12. Permission Requirements

**Required Permission:** `admin.accounts.update`

**Who has this permission:**
- ✅ SUPER_ADMIN (bypasses all permission checks)
- ✅ ADMIN role
- ❌ HR_MANAGER (unless explicitly granted)
- ❌ DEPARTMENT_MANAGER
- ❌ EMPLOYEE

---

## 13. Implementation Details

### Use Case: `AdminUpdateAccountUseCase`
- ✅ Clean Architecture pattern
- ✅ SOLID principles
- ✅ DTO validation
- ✅ Business logic separation
- ✅ Repository pattern
- ✅ Event-driven architecture

### Key Components:
1. **DTO:** `AdminUpdateAccountDto` - Input validation
2. **Use Case:** `AdminUpdateAccountUseCase` - Business logic
3. **Repository:** `PostgresAccountRepository` - Data persistence
4. **Controller:** `AdminController.updateAccount()` - HTTP endpoint
5. **Guard:** `AuthJwtPermissionGuard` - Permission check
6. **Event:** `account_updated` - Integration event

---

## 14. Database Changes

### accounts table
```sql
-- Role is stored as role_id (FK to roles table)
UPDATE accounts 
SET role_id = (SELECT id FROM roles WHERE code = 'HR_MANAGER'),
    email = 'new@email.com',
    full_name = 'New Name',
    updated_at = NOW(),
    updated_by = 1,
    sync_version = sync_version + 1
WHERE id = 1;
```

### audit_logs table
```sql
INSERT INTO audit_logs (
  account_id, 
  action, 
  success, 
  metadata, 
  ip_address,
  user_agent
) VALUES (
  1,
  'ADMIN_UPDATE_ACCOUNT',
  true,
  '{"target_account_id": 1, "changes": {"role": {"old": "EMPLOYEE", "new": "HR_MANAGER"}}}',
  '192.168.1.1',
  'Mozilla/5.0...'
);
```

---

## 15. Notes

⚠️ **Important:**
- Role được lưu trữ dưới dạng `role_id` (FK đến bảng `roles`)
- API nhận `role` dưới dạng **role code** (string) và tự động convert sang `role_id`
- Sau khi update, account sẽ được reload từ DB với JOIN để lấy `role_code` mới
- JWT tokens hiện tại sẽ vẫn có role cũ cho đến khi user login lại

---

## Completion Checklist

- ✅ DTO với validation đầy đủ
- ✅ Use Case với business logic
- ✅ Controller endpoint với Swagger docs
- ✅ Repository method đã có sẵn
- ✅ Permission guard integration
- ✅ Audit logging
- ✅ Event publishing
- ✅ Error handling
- ✅ Clean Architecture
- ✅ SOLID principles
- ✅ Consistent with project patterns

---

**API is ready to use! 🎉**
