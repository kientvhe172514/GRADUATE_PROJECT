# Quick Start Guide - Admin Update Account API

## 🚀 Prerequisites

Đảm bảo RBAC đã được seed vào database:

```bash
cd services/auth
npm run seed:rbac
```

Output:
```
🌱 Starting RBAC seeding...
📝 Seeding permissions...
✅ Seeded 70 permissions
👥 Seeding roles...
✅ Seeded 5 roles
🔗 Assigning permissions to roles...
✅ Created XXX role-permission assignments
👤 Creating Super Admin account...
✅ Super Admin account created (email: admin@zentry.com, password: Admin@123)
🎉 RBAC seeding completed successfully!
```

---

## 🧪 Test API

### 1. Start Auth Service
```bash
cd services/auth
npm run start:dev
```

### 2. Login as Admin
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@zentry.com",
    "password": "Admin@123"
  }'
```

**Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user": {
      "id": 1,
      "email": "admin@zentry.com",
      "role": "SUPER_ADMIN"
    }
  }
}
```

Copy `access_token` để dùng trong các request tiếp theo.

---

### 3. Create Test Account (Optional)
```bash
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@zentry.com",
    "full_name": "Test User",
    "password": "Test@123",
    "suggested_role": "EMPLOYEE"
  }'
```

---

### 4. Test Update Account with Role Assignment

#### 4.1. Assign HR_MANAGER Role
```bash
curl -X PUT http://localhost:3001/admin/accounts/2 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "HR_MANAGER",
    "full_name": "HR Manager Name"
  }'
```

**Expected Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Account updated successfully",
  "data": {
    "id": 2,
    "email": "testuser@zentry.com",
    "full_name": "HR Manager Name",
    "role": "HR_MANAGER",
    "status": "ACTIVE",
    "sync_version": 2,
    "updated_at": "2025-11-17T10:30:00.000Z"
  }
}
```

#### 4.2. Update Multiple Fields
```bash
curl -X PUT http://localhost:3001/admin/accounts/2 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "DEPARTMENT_MANAGER",
    "full_name": "Department Manager",
    "department_id": 1,
    "department_name": "Engineering",
    "position_id": 3,
    "position_name": "Engineering Manager"
  }'
```

#### 4.3. Change Status
```bash
curl -X PUT http://localhost:3001/admin/accounts/2 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "INACTIVE"
  }'
```

---

### 5. Verify Changes

#### Get Account Details
```bash
curl -X GET http://localhost:3001/admin/accounts/2 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Check Audit Logs
```bash
curl -X GET "http://localhost:3001/admin/audit-logs?action=ADMIN_UPDATE_ACCOUNT&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🎯 Test All Valid Roles

```bash
# Test SUPER_ADMIN
curl -X PUT http://localhost:3001/admin/accounts/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "SUPER_ADMIN"}'

# Test ADMIN
curl -X PUT http://localhost:3001/admin/accounts/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ADMIN"}'

# Test HR_MANAGER
curl -X PUT http://localhost:3001/admin/accounts/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "HR_MANAGER"}'

# Test DEPARTMENT_MANAGER
curl -X PUT http://localhost:3001/admin/accounts/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "DEPARTMENT_MANAGER"}'

# Test EMPLOYEE
curl -X PUT http://localhost:3001/admin/accounts/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "EMPLOYEE"}'
```

---

## ❌ Test Error Cases

### Invalid Role
```bash
curl -X PUT http://localhost:3001/admin/accounts/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "INVALID_ROLE"}'
```

**Expected:**
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Invalid role \"INVALID_ROLE\". Valid roles are: SUPER_ADMIN, ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE",
  "errorCode": "BAD_REQUEST"
}
```

### Account Not Found
```bash
curl -X PUT http://localhost:3001/admin/accounts/99999 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ADMIN"}'
```

**Expected:**
```json
{
  "status": "ERROR",
  "statusCode": 404,
  "message": "Account not found",
  "errorCode": "ACCOUNT_NOT_FOUND"
}
```

### Email Already Exists
```bash
curl -X PUT http://localhost:3001/admin/accounts/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zentry.com"}'
```

**Expected:**
```json
{
  "status": "ERROR",
  "statusCode": 409,
  "message": "Email \"admin@zentry.com\" is already in use by another account",
  "errorCode": "ACCOUNT_ALREADY_EXISTS"
}
```

---

## 📊 Check Database

### Check roles table
```sql
SELECT * FROM roles;
```

### Check account after update
```sql
SELECT a.*, r.code as role_code
FROM accounts a
LEFT JOIN roles r ON r.id = a.role_id
WHERE a.id = 2;
```

### Check audit logs
```sql
SELECT * FROM audit_logs 
WHERE action = 'ADMIN_UPDATE_ACCOUNT' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 🌐 Swagger UI

Open in browser:
```
http://localhost:3001/api-docs
```

Navigate to:
- Tag: **admin**
- Endpoint: `PUT /admin/accounts/{id}`
- Click "Try it out"
- Fill in account ID and request body
- Execute

---

## ✅ Success Indicators

1. ✅ API returns 200 with updated account data
2. ✅ `role` field shows new role code (e.g., "HR_MANAGER")
3. ✅ `sync_version` incremented by 1
4. ✅ `updated_at` is current timestamp
5. ✅ Audit log created in `audit_logs` table
6. ✅ Database shows `role_id` updated

---

## 🐛 Troubleshooting

### Error: "Role not found in database"
**Solution:** Run RBAC seeding
```bash
npm run seed:rbac
```

### Error: "Permission denied"
**Solution:** Make sure you're logged in as ADMIN or SUPER_ADMIN

### Error: "Invalid token"
**Solution:** Get a fresh access_token by logging in again

### Database connection error
**Solution:** Check `.env` file for correct `DATABASE_URL`

---

## 📝 Notes

- Role thay đổi sẽ không ảnh hưởng đến JWT tokens hiện tại
- User cần login lại để JWT có role mới
- Tất cả changes được track trong audit_logs
- Event `account_updated` được publish cho integration

---

**Ready to test! 🚀**
