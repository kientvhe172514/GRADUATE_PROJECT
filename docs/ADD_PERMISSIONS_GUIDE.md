# Add @Permissions Decorator - Implementation Guide

## 📋 Overview
This guide shows how to add `@Permissions()` decorator to all controller endpoints across services.

## 🔧 Step 1: Import Permissions Decorator

Add to your controller imports:
```typescript
import { Permissions } from '@graduate-project/shared-common';
```

## 📝 Step 2: Add @Permissions to Each Endpoint

### General Pattern:
```typescript
@Post()
@Permissions('resource.action')  // <-- Add this line
@ApiOperation({ summary: '...' })
async create() { ... }
```

---

## 🎯 Controllers to Update

### ✅ AUTH SERVICE - `/services/auth/src/presentation/controllers/`

#### `account.controller.ts`
```typescript
// ✅ Already Public - no permission needed
@Public()
@Post('login')
async login() { ... }

// ✅ Already Public
@Public()
@Post('refresh')
async refresh() { ... }

// ✅ Add permission
@Post('logout')
@Permissions('auth.account.change_password')  // User must be logged in
async logout() { ... }

// ✅ Already Public (for manual account creation)
@Public()
@Post('register')
async register() { ... }

// ✅ Add permission
@Get('me')
@Permissions('auth.account.read_own')
async me() { ... }

// ✅ Add permission
@Put('me/password')
@Permissions('auth.account.change_password')
async changeMyPassword() { ... }

// ✅ Add permission
@Put('me/change-temporary-password')
@Permissions('auth.account.change_password')
async changeTemporaryPassword() { ... }

// ✅ Already Public
@Public()
@Post('forgot-password')
async forgotPassword() { ... }

// ✅ Already Public
@Public()
@Post('reset-password')
async resetPassword() { ... }
```

#### `role.controller.ts`
```typescript
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
```

#### `permission.controller.ts`
```typescript
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
```

#### `device.controller.ts`
```typescript
@Get()
@Permissions('auth.device.read')  // Admin only
async findAll() { ... }

@Get('me')
@Permissions('auth.device.read_own')  // Own devices
async findMyDevices() { ... }

@Post()
@Permissions('auth.device.create')
async register() { ... }

@Delete(':id')
@Permissions('auth.device.delete')
async remove() { ... }
```

#### `admin.controller.ts`
```typescript
@Get('accounts')
@Permissions('auth.account.read')
async getAllAccounts() { ... }

@Get('accounts/:id')
@Permissions('auth.account.read')
async getAccount() { ... }

@Put('accounts/:id')
@Permissions('auth.account.update')
async updateAccount() { ... }

@Delete('accounts/:id')
@Permissions('auth.account.delete')
async deleteAccount() { ... }

@Post('accounts/:id/reset-password')
@Permissions('auth.account.reset_password')
async adminResetPassword() { ... }

@Put('accounts/:id/role')
@Permissions('auth.account.manage_roles')
async changeRole() { ... }
```

---

### ✅ EMPLOYEE SERVICE - `/services/employee/src/presentation/controllers/`

#### `employee.controller.ts` - ✅ Already has @Permissions
```typescript
// Already implemented ✅
@Post()
@Permissions('employee.create')

@Get()
@Permissions('employee.read')

@Get(':id')
@Permissions('employee.read')

@Put(':id')
@Permissions('employee.update')

@Post(':id/terminate')
@Permissions('employee.terminate')

// etc...
```

#### `department.controller.ts` - ✅ Already has @Permissions
```typescript
// Already implemented ✅
@Get()
@Permissions('department.read')

@Post()
@Permissions('department.create')

// etc...
```

#### `position.controller.ts` - ✅ Already has @Permissions
```typescript
// Already implemented ✅
@Get()
@Permissions('position.read')

@Post()
@Permissions('position.create')

// etc...
```

---

### ⚠️ ATTENDANCE SERVICE - `/services/attendance/src/presentation/controllers/`

#### `overtime-request.controller.ts` - ⚠️ NEEDS UPDATE
**Current Status:** Has `@Public()` at controller level - needs to be removed and add individual permissions

```typescript
// ❌ REMOVE THIS
@Public()
@Controller('overtime-requests')
export class OvertimeRequestController {

// ✅ ADD THESE
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
@Permissions('overtime.read_own')  // Check ownership in use case
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
```

#### `attendance-check.controller.ts` - ⚠️ NEEDS UPDATE
```typescript
@Post('check-in')
@Permissions('attendance.checkin')
async checkIn() { ... }

@Post('check-out')
@Permissions('attendance.checkout')
async checkOut() { ... }

@Get()
@Permissions('attendance.read')
async getAllAttendance() { ... }

@Get('me')
@Permissions('attendance.read_own')
async getMyAttendance() { ... }

@Get('department/:departmentId')
@Permissions('attendance.read_department')
async getDepartmentAttendance() { ... }

@Put(':id')
@Permissions('attendance.update')
async updateAttendance() { ... }

@Post(':id/approve')
@Permissions('attendance.approve')
async approveCorrection() { ... }

@Post(':id/reject')
@Permissions('attendance.reject')
async rejectCorrection() { ... }
```

#### `report.controller.ts` - ⚠️ NEEDS UPDATE
```typescript
@Get('attendance')
@Permissions('report.attendance.generate')
async generateAttendanceReport() { ... }

@Post('export')
@Permissions('report.export')
async exportReport() { ... }
```

#### `work-schedule.controller.ts` - ⚠️ NEEDS UPDATE
```typescript
@Get()
@Permissions('attendance.read')
async getAllSchedules() { ... }

@Post()
@Permissions('attendance.update')  // Only HR/Admin can create schedules
async createSchedule() { ... }
```

#### `employee-shift.controller.ts` - ⚠️ NEEDS UPDATE
```typescript
@Get()
@Permissions('attendance.read')
async getAllShifts() { ... }

@Get('me')
@Permissions('attendance.read_own')
async getMyShifts() { ... }

@Post()
@Permissions('attendance.update')  // HR/Admin only
async assignShift() { ... }
```

---

### ⚠️ LEAVE SERVICE - `/services/leave/src/presentation/controllers/`

#### `leave-record.controller.ts` - ⚠️ NEEDS UPDATE
```typescript
@Post()
@Permissions('leave.request.create')
async createLeaveRequest() { ... }

@Get()
@Permissions('leave.request.read')
async getAll() { ... }

@Get('me')
@Permissions('leave.request.read_own')
async getMyLeaves() { ... }

@Get(':id')
@Permissions('leave.request.read_own')  // Check ownership in use case
async getById() { ... }

@Put(':id')
@Permissions('leave.request.update')
async updateLeaveRequest() { ... }

@Post(':id/approve')
@Permissions('leave.request.approve')
async approveLeave() { ... }

@Post(':id/reject')
@Permissions('leave.request.reject')
async rejectLeave() { ... }

@Post(':id/cancel')
@Permissions('leave.request.cancel')
async cancelLeave() { ... }
```

#### `leave-balance.controller.ts` - ⚠️ NEEDS UPDATE
```typescript
@Get()
@Permissions('leave.balance.read')
async getAllBalances() { ... }

@Get('me')
@Permissions('leave.balance.read_own')
async getMyBalance() { ... }

@Put(':employeeId')
@Permissions('leave.balance.update')
async updateBalance() { ... }
```

#### `leave-type.controller.ts` - ⚠️ NEEDS UPDATE
```typescript
@Get()
@Permissions('leave.type.read')
async findAll() { ... }

@Get(':id')
@Permissions('leave.type.read')
async findOne() { ... }

@Post()
@Permissions('leave.type.create')
async create() { ... }

@Put(':id')
@Permissions('leave.type.update')
async update() { ... }

@Delete(':id')
@Permissions('leave.type.delete')
async remove() { ... }
```

#### `holiday.controller.ts` - ⚠️ NEEDS UPDATE
```typescript
@Get()
@Permissions('holiday.read')
async findAll() { ... }

@Get(':id')
@Permissions('holiday.read')
async findOne() { ... }

@Post()
@Permissions('holiday.create')
async create() { ... }

@Put(':id')
@Permissions('holiday.update')
async update() { ... }

@Delete(':id')
@Permissions('holiday.delete')
async remove() { ... }
```

---

### ⚠️ NOTIFICATION SERVICE - `/services/notification/src/presentation/controllers/`

#### `notification.controller.ts` - ⚠️ NEEDS UPDATE
```typescript
@Get()
@Permissions('notification.read')
async findAll() { ... }

@Get('me')
@Permissions('notification.read_own')
async getMyNotifications() { ... }

@Post('send')
@Permissions('notification.send')
async sendNotification() { ... }

@Put(':id/read')
@Permissions('notification.read_own')  // Mark as read
async markAsRead() { ... }
```

#### `scheduled-notification.controller.ts` - ⚠️ NEEDS UPDATE
```typescript
@Get()
@Permissions('notification.read')
async findAll() { ... }

@Post()
@Permissions('notification.create_scheduled')
async create() { ... }

@Put(':id')
@Permissions('notification.update_scheduled')
async update() { ... }

@Delete(':id')
@Permissions('notification.delete_scheduled')
async remove() { ... }
```

#### `push-token.controller.ts` - ⚠️ NEEDS UPDATE
```typescript
@Post()
@Permissions('notification.push_token.register')
async registerToken() { ... }

@Get('me')
@Permissions('notification.push_token.read_own')
async getMyTokens() { ... }

@Delete(':id')
@Permissions('notification.push_token.delete_own')
async deleteToken() { ... }
```

#### `notification-preference.controller.ts` - ⚠️ NEEDS UPDATE
```typescript
@Get('me')
@Permissions('notification.preference.read_own')
async getMyPreferences() { ... }

@Put('me')
@Permissions('notification.preference.update_own')
async updateMyPreferences() { ... }
```

---

## 🚀 Quick Implementation Script

Run this to update all controllers at once:

```bash
# 1. Seed database with roles and permissions
psql -U your_user -d auth_db -f services/auth/database/seeds/rbac-seed.sql

# 2. Restart auth service to load new permissions
cd services/auth && pnpm run start:dev

# 3. Test with different roles
# Get token for each role and test endpoints
```

---

## ✅ Testing Checklist

After adding @Permissions:

- [ ] ADMIN can access all endpoints
- [ ] HR_MANAGER can access HR-related endpoints
- [ ] DEPARTMENT_MANAGER can access department-scoped endpoints
- [ ] EMPLOYEE can only access own data
- [ ] Public endpoints (login, register) still work without auth
- [ ] 403 Forbidden returned when permission denied
- [ ] 401 Unauthorized returned when not logged in

---

## 📚 References

- **RBAC Matrix**: `docs/RBAC_PERMISSIONS_MATRIX.md`
- **Seed Script**: `services/auth/database/seeds/rbac-seed.sql`
- **Permission Guard**: `services/shared-common/src/guards/jwt-permission.guard.ts`
- **Decorator**: Exported from `@graduate-project/shared-common`

---

## 🔥 Priority Order

1. ✅ **AUTH SERVICE** - Most critical (already started)
2. ✅ **EMPLOYEE SERVICE** - Already complete
3. ⚠️ **ATTENDANCE SERVICE** - High priority (remove @Public())
4. ⚠️ **LEAVE SERVICE** - High priority
5. ⚠️ **NOTIFICATION SERVICE** - Medium priority

---

## 💡 Tips

1. **Always check existing @Public() decorators** - Remove if not needed
2. **Use `read_own` for personal data endpoints** - e.g., `/me`, `/my-requests`
3. **Check ownership in use case** - Don't rely only on permission, validate employee_id
4. **Test with Postman** - Create collections for each role
5. **Document exceptions** - Some endpoints might need special logic

---

## 🐛 Common Issues

### Issue 1: "Missing required permissions"
**Solution**: Check if user's role has the permission in `role_permissions` table

### Issue 2: "User not authenticated"
**Solution**: Check if JWT token is being sent in headers and middleware is extracting user

### Issue 3: "Permission exists but still 403"
**Solution**: Verify permission code matches exactly (case-sensitive)

---

Need help? Check the RBAC matrix or test with example-permissions.controller.ts
