# Luồng Xử Lý Mật Khẩu Tạm (Temporary Password Flow)

## 📋 Tổng Quan

Hệ thống hỗ trợ nghiệp vụ tạo account với mật khẩu tạm, yêu cầu nhân viên đổi mật khẩu khi đăng nhập lần đầu.

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 1: TẠO EMPLOYEE & ACCOUNT                                       │
└─────────────────────────────────────────────────────────────────────┘
    [Employee Service] 
    POST /employees
    ↓
    Publish event: employee_created
    ↓
    [Auth Service] Nhận event
    ↓
    CreateAccountUseCase.execute()
    • Tạo account với password_hash = bcrypt("1")
    • Set is_temporary_password = TRUE
    • Publish event: auth.user-registered
    ↓
    [Notification Service] 
    Gửi email với username + password tạm = "1"

┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 2: NHÂN VIÊN ĐĂNG NHẬP LẦN ĐẦU                                  │
└─────────────────────────────────────────────────────────────────────┘
    [Client/Flutter App]
    POST /auth/login
    Body: { email: "user@example.com", password: "1" }
    ↓
    LoginUseCase.execute()
    • ✓ Verify email exists
    • ✓ Check account not locked
    • ✓ Verify password = "1" (bcrypt compare)
    • ❌ Detect is_temporary_password = TRUE
    ↓
    Throw BusinessException
    {
      "success": false,
      "error_code": "TEMPORARY_PASSWORD_MUST_CHANGE",
      "message": "Bạn đang sử dụng mật khẩu tạm. Vui lòng đổi mật khẩu để tiếp tục.",
      "status_code": 403
    }

┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 3: CLIENT HIỂN THỊ FORM ĐỔI MẬT KHẨU                            │
└─────────────────────────────────────────────────────────────────────┘
    [Client/Flutter App]
    • Catch exception TEMPORARY_PASSWORD_MUST_CHANGE
    • Navigate to ChangePasswordScreen
    • Show form:
      - Email (from login attempt)
      - Current Password (temporary "1")
      - New Password (user input)
      - Confirm Password (user input)

┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 4: ĐỔI MẬT KHẨU TẠM                                             │
└─────────────────────────────────────────────────────────────────────┘
    [Client/Flutter App]
    POST /auth/change-temporary-password
    Body: {
      email: "user@example.com",
      current_password: "1",
      new_password: "NewPass@123",
      confirm_password: "NewPass@123"
    }
    ↓
    ChangeTemporaryPasswordUseCase.execute()
    ✅ Validate:
      • Email exists
      • Current password = "1" (verify)
      • Account has is_temporary_password = TRUE
      • new_password !== current_password
      • new_password === confirm_password
      • new_password matches requirements:
        - Min 8 characters
        - Contains uppercase letter
        - Contains lowercase letter
        - Contains number
    ✅ Update Database:
      • Hash new_password → UPDATE password_hash
      • Set is_temporary_password = FALSE
      • Reset failed_login_attempts = 0
      • Update last_login_at, last_login_ip
    ✅ Auto-Login:
      • Generate access_token
      • Generate refresh_token
      • Store refresh_token in database
      • Log audit: CHANGE_TEMPORARY_PASSWORD_SUCCESS
      • Publish event: password_changed
    ↓
    Response 200 OK
    {
      "success": true,
      "data": {
        "access_token": "eyJhbGc...",
        "refresh_token": "eyJhbGc...",
        "user": {
          "id": 1,
          "email": "user@example.com",
          "full_name": "Nguyễn Văn A",
          "role": "EMPLOYEE"
        }
      },
      "message": "Đổi mật khẩu thành công"
    }

┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 5: ĐĂNG NHẬP BẬT KỲ LÚC NÀO SAU ĐÓ                              │
└─────────────────────────────────────────────────────────────────────┘
    [Client/Flutter App]
    POST /auth/login
    Body: { email: "user@example.com", password: "NewPass@123" }
    ↓
    LoginUseCase.execute()
    • ✓ Verify email exists
    • ✓ Verify password = "NewPass@123"
    • ✓ Check is_temporary_password = FALSE
    • ✓ Login thành công
    ↓
    Response 200 OK với access_token + refresh_token
```

## 🗄️ Database Schema Changes

### Table: `accounts`

```sql
ALTER TABLE accounts 
ADD COLUMN is_temporary_password BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_accounts_is_temporary_password 
ON accounts(is_temporary_password) 
WHERE is_temporary_password = TRUE;
```

## 📁 Files Changed

### 1. Domain Layer
- ✅ `src/domain/entities/account.entity.ts` - Thêm `is_temporary_password?: boolean`

### 2. Infrastructure Layer
- ✅ `src/infrastructure/persistence/entities/account.entity.ts` - Thêm field
- ✅ `src/infrastructure/persistence/typeorm/account.schema.ts` - Thêm column definition
- ✅ `src/infrastructure/persistence/repositories/postgres-account.repository.ts` - Implement `setTemporaryPasswordFlag()`

### 3. Application Layer
- ✅ `src/application/ports/account.repository.port.ts` - Thêm `setTemporaryPasswordFlag()`
- ✅ `src/application/use-cases/create-account.use-case.ts` - Set `is_temporary_password = true` khi tạo account
- ✅ `src/application/use-cases/login.use-case.ts` - Check `is_temporary_password` và throw exception
- ✅ `src/application/use-cases/change-temporary-password.use-case.ts` - **NEW** Use case để đổi password tạm

### 4. Presentation Layer
- ✅ `src/presentation/dto/change-temporary-password.dto.ts` - **NEW** DTO với validation
- ✅ `src/presentation/controllers/account.controller.ts` - Thêm endpoint `/auth/change-temporary-password`

### 5. Module Configuration
- ✅ `src/application/account.module.ts` - Register `ChangeTemporaryPasswordUseCase`

### 6. Database Migration
- ✅ `database/migrations/add_is_temporary_password_column.sql` - **NEW** Migration script

## 🔒 Security Features

### 1. Password Validation
- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Cannot reuse temporary password

### 2. Audit Logging
- `LOGIN_FAILED` - Login với temporary password
- `CHANGE_TEMPORARY_PASSWORD_FAILED` - Đổi password thất bại
- `CHANGE_TEMPORARY_PASSWORD_SUCCESS` - Đổi password thành công

### 3. Account Lockout Protection
- Giữ nguyên cơ chế lockout (5 failed attempts)
- Reset failed attempts sau khi đổi password thành công

## 📱 API Endpoints

### 1. Login (Existing - Enhanced)
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "1"
}
```

**Response khi temporary password:**
```json
HTTP/1.1 403 Forbidden
{
  "success": false,
  "error_code": "TEMPORARY_PASSWORD_MUST_CHANGE",
  "message": "Bạn đang sử dụng mật khẩu tạm. Vui lòng đổi mật khẩu để tiếp tục.",
  "status_code": 403
}
```

### 2. Change Temporary Password (NEW)
```http
POST /auth/change-temporary-password
Content-Type: application/json

{
  "email": "user@example.com",
  "current_password": "1",
  "new_password": "NewPass@123",
  "confirm_password": "NewPass@123"
}
```

**Success Response:**
```json
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "role": "EMPLOYEE"
    }
  },
  "message": "Đổi mật khẩu thành công"
}
```

**Error Responses:**
```json
// Invalid current password
HTTP/1.1 401 Unauthorized
{
  "success": false,
  "error_code": "UNAUTHORIZED",
  "message": "Mật khẩu hiện tại không đúng"
}

// Password mismatch
HTTP/1.1 400 Bad Request
{
  "success": false,
  "error_code": "BAD_REQUEST",
  "message": "Mật khẩu xác nhận không khớp"
}

// Reusing temporary password
HTTP/1.1 400 Bad Request
{
  "success": false,
  "error_code": "BAD_REQUEST",
  "message": "Mật khẩu mới không được trùng với mật khẩu tạm"
}

// Weak password
HTTP/1.1 400 Bad Request
{
  "success": false,
  "error_code": "BAD_REQUEST",
  "message": "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số"
}
```

## 🧪 Testing Scenarios

### Scenario 1: First-time login flow
1. Tạo employee mới
2. Check email nhận được password tạm "1"
3. Login với password "1" → Expect 403
4. Call `/change-temporary-password` với password mới
5. Nhận access_token + refresh_token
6. Verify `is_temporary_password = FALSE` trong DB

### Scenario 2: Password validation
1. Login với temporary password
2. Try change password với weak password → Expect 400
3. Try change password với confirm mismatch → Expect 400
4. Try reuse temporary password "1" → Expect 400
5. Change với strong password → Expect 200

### Scenario 3: Security checks
1. Login với temporary password 3 lần → Check audit logs
2. Try change password với wrong current password → Expect 401
3. Try change password for non-temporary account → Expect 400

## 🔧 Configuration

Không cần thêm config mới. Sử dụng config hiện tại:
- `JWT_SECRET` - Để generate tokens
- `RABBITMQ_URL` - Để publish events
- Database connection config

## 📝 Migration Guide

### Bước 1: Chạy migration SQL
```bash
cd services/auth
psql -U postgres -d auth_db -f database/migrations/add_is_temporary_password_column.sql
```

### Bước 2: Restart Auth Service
```bash
cd services/auth
pnpm install
pnpm build
pnpm start:dev
```

### Bước 3: Verify
```bash
# Test login với temporary password
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"1"}'

# Expected: 403 TEMPORARY_PASSWORD_MUST_CHANGE
```

## 📊 Monitoring & Audit

### Audit Log Actions
- `LOGIN_FAILED` (reason: "Temporary password requires change")
- `CHANGE_TEMPORARY_PASSWORD_FAILED`
- `CHANGE_TEMPORARY_PASSWORD_SUCCESS`

### Events Published
- `password_changed` - Khi đổi password thành công
  ```json
  {
    "accountId": 1,
    "email": "user@example.com",
    "timestamp": "2025-11-09T10:30:00.000Z"
  }
  ```

## 🎯 Business Rules

1. ✅ Temporary password chỉ được sử dụng 1 lần (force change on first login)
2. ✅ Password mới phải khác password tạm
3. ✅ Password mới phải đủ mạnh (8+ chars, uppercase, lowercase, number)
4. ✅ Auto-login sau khi đổi password thành công
5. ✅ Reset failed login attempts sau khi đổi password
6. ✅ Audit log đầy đủ cho security tracking

## 🚀 Next Steps (Optional Enhancements)

1. **Password Expiry**: Thêm `password_expires_at` để force đổi password định kỳ
2. **Password History**: Lưu lịch sử password để prevent reuse
3. **2FA**: Bắt buộc 2FA cho accounts quan trọng
4. **Email Verification**: Yêu cầu verify email trước khi đổi password
5. **Rate Limiting**: Giới hạn số lần đổi password trong 1 khoảng thời gian
