# 🚀 Quick Setup Guide - RBAC System

## Step-by-Step Implementation

### ✅ Step 1: Seed Database (5 minutes)

#### Option A: Direct PostgreSQL Connection
```bash
# Navigate to auth service
cd services/auth

# Connect to database
psql -U postgres -h localhost -p 5432 -d auth_db

# Run seed script
\i database/seeds/rbac-seed.sql

# Verify
SELECT * FROM roles;
SELECT COUNT(*) FROM permissions;
SELECT r.code, COUNT(rp.id) as perm_count 
FROM roles r 
LEFT JOIN role_permissions rp ON r.id = rp.role_id 
GROUP BY r.code;
```

#### Option B: Via Docker
```bash
# If database is in Docker container
docker exec -i your_postgres_container psql -U postgres -d auth_db < services/auth/database/seeds/rbac-seed.sql

# Verify
docker exec -it your_postgres_container psql -U postgres -d auth_db -c "SELECT * FROM roles;"
```

#### Option C: Using pgAdmin
1. Open pgAdmin
2. Connect to `auth_db` database
3. Tools → Query Tool
4. Open file: `services/auth/database/seeds/rbac-seed.sql`
5. Execute (F5)

**Expected Output**:
```
INSERT 0 4  (4 roles inserted)
INSERT 0 100+  (100+ permissions inserted)
INSERT 0 XXX  (role_permissions inserted)
```

---

### ✅ Step 2: Create Test Accounts (3 minutes)

Use Postman or curl to create test accounts:

```bash
# 1. Create ADMIN account
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "admin@zentry.com",
  "password": "Admin@123",
  "full_name": "System Administrator",
  "suggested_role": "ADMIN"
}

# 2. Create HR_MANAGER account
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "hr@zentry.com",
  "password": "HrManager@123",
  "full_name": "HR Manager",
  "suggested_role": "HR_MANAGER"
}

# 3. Create DEPARTMENT_MANAGER account
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "manager@zentry.com",
  "password": "Manager@123",
  "full_name": "Department Manager",
  "suggested_role": "DEPARTMENT_MANAGER",
  "department_id": 1,
  "department_name": "Engineering"
}

# 4. Create EMPLOYEE account
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "employee@zentry.com",
  "password": "Employee@123",
  "full_name": "Regular Employee",
  "suggested_role": "EMPLOYEE",
  "employee_id": 1,
  "employee_code": "EMP001"
}
```

---

### ✅ Step 3: Add @Permissions to Controllers (Variable time)

#### Quick Import Template
Add this to the top of each controller:

```typescript
import { Permissions } from '@graduate-project/shared-common';
```

#### Priority 1: Auth Service Role Management (15 minutes)

**File**: `services/auth/src/presentation/controllers/role.controller.ts`

```typescript
import { Permissions } from '@graduate-project/shared-common';

export class RoleController {
  
  @Get()
  @Permissions('auth.role.read')
  async findAll() { ... }

  @Get(':id')
  @Permissions('auth.role.read')
  async findOne() { ... }

  @Post()
  @Permissions('auth.role.create')
  async create() { ... }

  @Put(':id')
  @Permissions('auth.role.update')
  async update() { ... }

  @Delete(':id')
  @Permissions('auth.role.delete')
  async remove() { ... }

  @Get(':id/permissions')
  @Permissions('auth.role.read')
  async getPermissions() { ... }

  @Post(':id/permissions')
  @Permissions('auth.role.update')
  async assignPermissions() { ... }
}
```

**File**: `services/auth/src/presentation/controllers/permission.controller.ts`

```typescript
import { Permissions } from '@graduate-project/shared-common';

export class PermissionController {
  
  @Get()
  @Permissions('auth.permission.read')
  async findAll() { ... }

  @Get(':id')
  @Permissions('auth.permission.read')
  async findOne() { ... }

  @Post()
  @Permissions('auth.permission.create')
  async create() { ... }

  @Put(':id')
  @Permissions('auth.permission.update')
  async update() { ... }

  @Delete(':id')
  @Permissions('auth.permission.delete')
  async remove() { ... }
}
```

**File**: `services/auth/src/presentation/controllers/device.controller.ts`

```typescript
import { Permissions } from '@graduate-project/shared-common';

export class DeviceController {
  
  @Get()
  @Permissions('auth.device.read')
  async findAll() { ... }

  @Get('me')
  @Permissions('auth.device.read_own')
  async findMyDevices() { ... }

  @Post()
  @Permissions('auth.device.create')
  async register() { ... }

  @Delete(':id')
  @Permissions('auth.device.delete')
  async remove() { ... }
}
```

#### Priority 2: Attendance Service - Remove @Public() (20 minutes)

**File**: `services/attendance/src/presentation/controllers/overtime-request.controller.ts`

**IMPORTANT**: Remove `@Public()` decorator at controller level!

```typescript
import { Permissions } from '@graduate-project/shared-common';

// ❌ REMOVE THIS LINE
// @Public()

@Controller('overtime-requests')
export class OvertimeRequestController {

  @Post()
  @Permissions('overtime.create')
  async createRequest() { ... }

  @Get('my-requests')
  @Permissions('overtime.read_own')
  async getMyRequests() { ... }

  @Get()
  @Permissions('overtime.read')
  async getAllRequests() { ... }

  @Get('pending')
  @Permissions('overtime.read')
  async getPendingRequests() { ... }

  @Get(':id')
  @Permissions('overtime.read_own')
  async getRequestById() { ... }

  @Put(':id')
  @Permissions('overtime.update')
  async updateRequest() { ... }

  @Post(':id/approve')
  @Permissions('overtime.approve')
  async approveRequest() { ... }

  @Post(':id/reject')
  @Permissions('overtime.reject')
  async rejectRequest() { ... }

  @Post(':id/cancel')
  @Permissions('overtime.cancel')
  async cancelRequest() { ... }
}
```

---

### ✅ Step 4: Test RBAC (10 minutes)

#### Test Script using Postman/Thunder Client

```javascript
// Collection: RBAC Tests

// 1. Login as ADMIN
POST {{baseUrl}}/auth/login
{
  "email": "admin@zentry.com",
  "password": "Admin@123"
}
// Save token as {{adminToken}}

// 2. Test ADMIN access (should succeed)
GET {{baseUrl}}/roles
Authorization: Bearer {{adminToken}}
// Expected: 200 OK

GET {{baseUrl}}/employees
Authorization: Bearer {{adminToken}}
// Expected: 200 OK

POST {{baseUrl}}/leave-types
Authorization: Bearer {{adminToken}}
{
  "code": "TEST",
  "name": "Test Leave"
}
// Expected: 201 Created

// 3. Login as EMPLOYEE
POST {{baseUrl}}/auth/login
{
  "email": "employee@zentry.com",
  "password": "Employee@123"
}
// Save token as {{employeeToken}}

// 4. Test EMPLOYEE access
GET {{baseUrl}}/employees/me
Authorization: Bearer {{employeeToken}}
// Expected: 200 OK (own data)

GET {{baseUrl}}/employees
Authorization: Bearer {{employeeToken}}
// Expected: 403 Forbidden (no permission)

GET {{baseUrl}}/roles
Authorization: Bearer {{employeeToken}}
// Expected: 403 Forbidden (no permission)

POST {{baseUrl}}/leave-types
Authorization: Bearer {{employeeToken}}
{
  "code": "TEST2",
  "name": "Test Leave 2"
}
// Expected: 403 Forbidden (no permission)

// 5. Test own resources (should succeed)
GET {{baseUrl}}/leave-records/me
Authorization: Bearer {{employeeToken}}
// Expected: 200 OK

POST {{baseUrl}}/leave-records
Authorization: Bearer {{employeeToken}}
{
  "leave_type_id": 1,
  "start_date": "2025-01-20",
  "end_date": "2025-01-22"
}
// Expected: 201 Created

// 6. Login as HR_MANAGER
POST {{baseUrl}}/auth/login
{
  "email": "hr@zentry.com",
  "password": "HrManager@123"
}
// Save token as {{hrToken}}

// 7. Test HR_MANAGER access
GET {{baseUrl}}/employees
Authorization: Bearer {{hrToken}}
// Expected: 200 OK (can view all employees)

POST {{baseUrl}}/employees
Authorization: Bearer {{hrToken}}
{
  "full_name": "New Employee",
  "email": "new@zentry.com"
}
// Expected: 201 Created (can create employees)

GET {{baseUrl}}/roles
Authorization: Bearer {{hrToken}}
// Expected: 200 OK (can view roles)

POST {{baseUrl}}/roles
Authorization: Bearer {{hrToken}}
{
  "code": "NEW_ROLE",
  "name": "New Role"
}
// Expected: 403 Forbidden (cannot create roles)
```

---

### ✅ Step 5: Verify in Database (2 minutes)

```sql
-- Check accounts and their roles
SELECT 
  a.id,
  a.email,
  a.full_name,
  r.code as role,
  r.name as role_name
FROM accounts a
JOIN roles r ON a.role_id = r.id
ORDER BY r.id;

-- Expected output:
-- admin@zentry.com    | ADMIN
-- hr@zentry.com       | HR_MANAGER
-- manager@zentry.com  | DEPARTMENT_MANAGER
-- employee@zentry.com | EMPLOYEE

-- Check a specific user's permissions
SELECT p.code, p.name
FROM accounts a
JOIN roles r ON a.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE a.email = 'employee@zentry.com'
ORDER BY p.code;

-- Should show ~25 permissions for EMPLOYEE

-- Check permission counts by role
SELECT 
  r.code,
  COUNT(rp.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.code
ORDER BY permission_count DESC;

-- Expected:
-- ADMIN               | 100+
-- HR_MANAGER          | ~85
-- DEPARTMENT_MANAGER  | ~40
-- EMPLOYEE            | ~25
```

---

## 🎯 Success Criteria

After completing all steps, verify:

- [ ] ✅ 4 roles exist in database (ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE)
- [ ] ✅ 100+ permissions exist in database
- [ ] ✅ role_permissions table has correct mappings
- [ ] ✅ Can create test accounts for all 4 roles
- [ ] ✅ ADMIN can access all endpoints (200/201 responses)
- [ ] ✅ EMPLOYEE gets 403 for admin-only endpoints
- [ ] ✅ EMPLOYEE can access own data (200 responses for /me endpoints)
- [ ] ✅ HR_MANAGER can manage employees but not roles
- [ ] ✅ @Permissions decorator added to critical controllers

---

## 🐛 Troubleshooting

### Issue 1: "Account created but no role_id"
**Solution**: Make sure roles table is populated first
```sql
SELECT * FROM roles;
-- If empty, run seed script again
```

### Issue 2: "Permission check passes but should fail"
**Solution**: Check if guard is properly configured
```typescript
// In app.module.ts
{
  provide: APP_GUARD,
  useClass: HeaderBasedPermissionGuard,
}
```

### Issue 3: "403 for all requests"
**Solution**: Check JWT token and user headers
```bash
# Verify token is being sent
# Check middleware is extracting user from headers/token
console.log('User from request:', req.user);
```

### Issue 4: "ROLE_NOT_FOUND error"
**Solution**: Run seed script to populate roles
```bash
psql -U postgres -d auth_db -f services/auth/database/seeds/rbac-seed.sql
```

---

## 📚 Next Steps

After completing quick setup:

1. **Add remaining @Permissions** - See: `docs/CONTROLLERS_PERMISSIONS_CHECKLIST.md`
2. **Update frontend** - Hide UI elements based on role
3. **Add audit logging** - Track permission checks
4. **Performance testing** - Test with 1000+ users
5. **Security review** - Ensure no permission bypass

---

## ⏱️ Time Estimates

- Database Seed: 5 minutes
- Create Test Accounts: 3 minutes
- Add @Permissions (Priority 1): 15 minutes
- Test RBAC: 10 minutes
- Verify in Database: 2 minutes
- **Total: ~35 minutes** for core functionality

---

## 📞 Support

- **RBAC Matrix**: `docs/RBAC_PERMISSIONS_MATRIX.md`
- **Full Guide**: `docs/ADD_PERMISSIONS_GUIDE.md`
- **Checklist**: `docs/CONTROLLERS_PERMISSIONS_CHECKLIST.md`
- **Summary**: `README_RBAC_SUMMARY.md`
