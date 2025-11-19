# Controllers @Permissions Checklist

## ✅ Status Legend
- ✅ = Completed (already has @Permissions)
- ⚠️ = Needs @Permissions
- 🔓 = Keep @Public() (no auth required)

---

## 🔐 AUTH SERVICE

### ✅ account.controller.ts - PARTIALLY DONE
- 🔓 `POST /login` - @Public() ✅
- 🔓 `POST /refresh` - @Public() ✅
- ⚠️ `POST /logout` - @Permissions('auth.account.change_password')
- 🔓 `POST /register` - @Public() (manual account creation)
- ⚠️ `GET /me` - @Permissions('auth.account.read_own') ✅ DONE
- ⚠️ `PUT /me/password` - @Permissions('auth.account.change_password') ✅ DONE
- ⚠️ `PUT /me/change-temporary-password` - @Permissions('auth.account.change_password')
- 🔓 `POST /forgot-password` - @Public() ✅
- 🔓 `POST /reset-password` - @Public() ✅
- 🔓 `POST /update/:id` - @Public() (legacy endpoint)

### ⚠️ role.controller.ts - NEEDS UPDATE
```typescript
@Get() 
@Permissions('auth.role.read')
async findAll()

@Get(':id')
@Permissions('auth.role.read')
async findOne()

@Post()
@Permissions('auth.role.create')
async create()

@Put(':id')
@Permissions('auth.role.update')
async update()

@Delete(':id')
@Permissions('auth.role.delete')
async remove()

@Get(':id/permissions')
@Permissions('auth.role.read')
async getPermissions()

@Post(':id/permissions')
@Permissions('auth.role.update')
async assignPermissions()
```

### ⚠️ permission.controller.ts - NEEDS UPDATE
```typescript
@Get()
@Permissions('auth.permission.read')
async findAll()

@Get(':id')
@Permissions('auth.permission.read')
async findOne()

@Post()
@Permissions('auth.permission.create')
async create()

@Put(':id')
@Permissions('auth.permission.update')
async update()

@Delete(':id')
@Permissions('auth.permission.delete')
async remove()
```

### ⚠️ device.controller.ts - NEEDS UPDATE
```typescript
@Get()
@Permissions('auth.device.read')
async findAll()

@Get('me')
@Permissions('auth.device.read_own')
async findMyDevices()

@Post()
@Permissions('auth.device.create')
async register()

@Delete(':id')
@Permissions('auth.device.delete')
async remove()
```

### ⚠️ admin.controller.ts - NEEDS UPDATE (if exists)
```typescript
@Get('accounts')
@Permissions('auth.account.read')
async getAllAccounts()

@Get('accounts/:id')
@Permissions('auth.account.read')
async getAccount()

@Put('accounts/:id')
@Permissions('auth.account.update')
async updateAccount()

@Delete('accounts/:id')
@Permissions('auth.account.delete')
async deleteAccount()

@Post('accounts/:id/reset-password')
@Permissions('auth.account.reset_password')
async adminResetPassword()

@Put('accounts/:id/role')
@Permissions('auth.account.manage_roles')
async changeRole()
```

---

## ✅ EMPLOYEE SERVICE - ALL DONE

### ✅ employee.controller.ts - COMPLETE
- ✅ `POST /` - @Permissions('employee.create')
- ✅ `GET /` - @Permissions('employee.read')
- ✅ `GET /managers/list` - @Permissions('employee.read')
- ✅ `GET /:id` - @Permissions('employee.read')
- ✅ `PUT /:id` - @Permissions('employee.update')
- ✅ `POST /:id/terminate` - @Permissions('employee.terminate')
- ✅ `GET /:employeeId/onboarding-steps` - @Permissions('employee.read')
- ✅ `PUT /:employeeId/onboarding-steps/:stepName` - @Permissions('employee.onboarding.update')
- ✅ `POST /:id/assign-department` - @Permissions('employee.assign_department')
- ✅ `POST /:id/assign-position` - @Permissions('employee.assign_position')
- ✅ `POST /:id/remove-department` - @Permissions('employee.remove_department')
- ✅ `POST /:id/remove-position` - @Permissions('employee.remove_position')
- ✅ `POST /:id/transfer-department` - @Permissions('employee.transfer_department')

### ✅ department.controller.ts - COMPLETE
- ✅ `GET /` - @Permissions('department.read')
- ✅ `POST /` - @Permissions('department.create')
- ✅ `GET /:id` - @Permissions('department.read')
- ✅ `PUT /:id` - @Permissions('department.update')
- ✅ `DELETE /:id` - @Permissions('department.delete')
- ✅ `GET /:id/statistics` - @Permissions('department.read')
- ✅ `POST /validate-position` - @Permissions('department.read')

### ✅ position.controller.ts - COMPLETE
- ✅ `GET /` - @Permissions('position.read')
- ✅ `GET /:id` - @Permissions('position.read')
- ✅ `POST /` - @Permissions('position.create')
- ✅ `PUT /:id` - @Permissions('position.update')
- ✅ `DELETE /:id` - @Permissions('position.delete')

---

## ⚠️ LEAVE SERVICE - NEEDS UPDATE

### ⚠️ leave-record.controller.ts
```typescript
@Get('me')
@Permissions('leave.request.read_own')
async getMyLeaves()

@Get()
@Permissions('leave.request.read')
async getAll()

@Get(':id')
@Permissions('leave.request.read_own')  // Check ownership in use case
async getById()

@Post()
@Permissions('leave.request.create')
async create()

@Put(':id')
@Permissions('leave.request.update')
async update()

@Post(':id/approve')
@Permissions('leave.request.approve')
async approve()

@Post(':id/reject')
@Permissions('leave.request.reject')
async reject()

@Post(':id/cancel')
@Permissions('leave.request.cancel')
async cancel()
```

### ⚠️ leave-balance.controller.ts
```typescript
@Get('employee/:employeeId')
@Permissions('leave.balance.read')
async getBalances()

@Get('me')
@Permissions('leave.balance.read_own')
async getMyBalances()

@Get('employee/:employeeId/summary')
@Permissions('leave.balance.read')
async getSummary()

@Post('employee/:employeeId/initialize')
@Permissions('leave.balance.update')
async initialize()

@Post('employee/:employeeId/adjust')
@Permissions('leave.balance.update')
async adjust()

@Post('employee/:employeeId/carry-over')
@Permissions('leave.balance.update')
async carryOver()

@Get('expiring-carry-over')
@Permissions('leave.balance.read')
async listExpiring()

@Get('me/transactions')
@Permissions('leave.balance.read_own')
async getMyTransactions()

@Get('me/statistics')
@Permissions('leave.balance.read_own')
async getMyStatistics()
```

### ⚠️ leave-type.controller.ts
```typescript
@Get()
@Permissions('leave.type.read')
async getLeaveTypes()

@Get('active')
@Permissions('leave.type.read')
async getActive()

@Get(':id')
@Permissions('leave.type.read')
async getById()

@Post()
@Permissions('leave.type.create')
async create()

@Put(':id')
@Permissions('leave.type.update')
async update()

@Delete(':id')
@Permissions('leave.type.delete')
async delete()
```

### ⚠️ holiday.controller.ts
```typescript
@Get()
@Permissions('holiday.read')
async getAll()

@Get('calendar/:year')
@Permissions('holiday.read')
async getCalendar()

@Get(':id')
@Permissions('holiday.read')
async getById()

@Post()
@Permissions('holiday.create')
async create()

@Post('bulk-create')
@Permissions('holiday.create')
async bulkCreate()

@Put(':id')
@Permissions('holiday.update')
async update()

@Delete(':id')
@Permissions('holiday.delete')
async delete()
```

---

## ⚠️ ATTENDANCE SERVICE - NEEDS UPDATE

### ⚠️ overtime-request.controller.ts
**⚠️ IMPORTANT: Remove @Public() at controller level first!**

```typescript
// ❌ REMOVE THIS
@Public()
@Controller('overtime-requests')

// ✅ ADD THESE
@Post()
@Permissions('overtime.create')
async createRequest()

@Get('my-requests')
@Permissions('overtime.read_own')
async getMyRequests()

@Get()
@Permissions('overtime.read')
async getAllRequests()

@Get('pending')
@Permissions('overtime.read')
async getPendingRequests()

@Get(':id')
@Permissions('overtime.read_own')  // Check ownership in use case
async getRequestById()

@Put(':id')
@Permissions('overtime.update')
async updateRequest()

@Post(':id/approve')
@Permissions('overtime.approve')
async approveRequest()

@Post(':id/reject')
@Permissions('overtime.reject')
async rejectRequest()

@Post(':id/cancel')
@Permissions('overtime.cancel')
async cancelRequest()
```

### ⚠️ attendance-check.controller.ts (if exists)
```typescript
@Post('check-in')
@Permissions('attendance.checkin')
async checkIn()

@Post('check-out')
@Permissions('attendance.checkout')
async checkOut()

@Get()
@Permissions('attendance.read')
async getAll()

@Get('me')
@Permissions('attendance.read_own')
async getMy()

@Get('department/:departmentId')
@Permissions('attendance.read_department')
async getDepartment()

@Put(':id')
@Permissions('attendance.update')
async update()

@Post(':id/approve')
@Permissions('attendance.approve')
async approve()

@Post(':id/reject')
@Permissions('attendance.reject')
async reject()
```

### ⚠️ report.controller.ts
```typescript
@Get('attendance')
@Permissions('report.attendance.generate')
async generateAttendanceReport()

@Get('overtime')
@Permissions('report.overtime.generate')
async generateOvertimeReport()

@Post('export')
@Permissions('report.export')
async exportReport()
```

### ⚠️ work-schedule.controller.ts
```typescript
@Get()
@Permissions('attendance.read')
async getAllSchedules()

@Get('me')
@Permissions('attendance.read_own')
async getMySchedule()

@Post()
@Permissions('attendance.update')
async createSchedule()

@Put(':id')
@Permissions('attendance.update')
async updateSchedule()

@Delete(':id')
@Permissions('attendance.update')
async deleteSchedule()
```

### ⚠️ employee-shift.controller.ts
```typescript
@Get()
@Permissions('attendance.read')
async getAllShifts()

@Get('me')
@Permissions('attendance.read_own')
async getMyShifts()

@Post()
@Permissions('attendance.update')
async assignShift()

@Put(':id')
@Permissions('attendance.update')
async updateShift()

@Delete(':id')
@Permissions('attendance.update')
async deleteShift()
```

---

## ⚠️ NOTIFICATION SERVICE - NEEDS UPDATE

### ⚠️ notification.controller.ts
```typescript
@Get()
@Permissions('notification.read')
async findAll()

@Get('me')
@Permissions('notification.read_own')
async getMyNotifications()

@Get(':id')
@Permissions('notification.read_own')
async findOne()

@Post('send')
@Permissions('notification.send')
async sendNotification()

@Post('send-bulk')
@Permissions('notification.send')
async sendBulkNotification()

@Put(':id/read')
@Permissions('notification.read_own')
async markAsRead()

@Put('read-all')
@Permissions('notification.read_own')
async markAllAsRead()

@Delete(':id')
@Permissions('notification.read_own')
async delete()
```

### ⚠️ scheduled-notification.controller.ts
```typescript
@Get()
@Permissions('notification.read')
async findAll()

@Get(':id')
@Permissions('notification.read')
async findOne()

@Post()
@Permissions('notification.create_scheduled')
async create()

@Put(':id')
@Permissions('notification.update_scheduled')
async update()

@Delete(':id')
@Permissions('notification.delete_scheduled')
async delete()

@Post(':id/activate')
@Permissions('notification.update_scheduled')
async activate()

@Post(':id/deactivate')
@Permissions('notification.update_scheduled')
async deactivate()
```

### ⚠️ push-token.controller.ts
```typescript
@Post()
@Permissions('notification.push_token.register')
async register()

@Get('me')
@Permissions('notification.push_token.read_own')
async getMyTokens()

@Put(':id')
@Permissions('notification.push_token.register')
async update()

@Delete(':id')
@Permissions('notification.push_token.delete_own')
async delete()
```

### ⚠️ notification-preference.controller.ts
```typescript
@Get('me')
@Permissions('notification.preference.read_own')
async getMyPreferences()

@Put('me')
@Permissions('notification.preference.update_own')
async updateMyPreferences()

@Post('me/reset')
@Permissions('notification.preference.update_own')
async resetToDefault()
```

---

## 📊 Summary Statistics

### By Service
| Service | Total Endpoints | ✅ Done | ⚠️ Needs | 🔓 Public | Progress |
|---------|----------------|---------|----------|-----------|----------|
| Auth | 15 | 2 | 11 | 5 | 18% |
| Employee | 18 | 18 | 0 | 0 | 100% |
| Department | 7 | 7 | 0 | 0 | 100% |
| Position | 5 | 5 | 0 | 0 | 100% |
| Leave | 25 | 0 | 25 | 0 | 0% |
| Attendance | 30+ | 0 | 30+ | 0 | 0% |
| Notification | 18 | 0 | 18 | 0 | 0% |
| **TOTAL** | **118+** | **32** | **84+** | **5** | **27%** |

### Priority Order
1. 🔥 **AUTH SERVICE** (11 endpoints) - Critical for RBAC
2. 🔥 **LEAVE SERVICE** (25 endpoints) - High usage
3. 🔥 **ATTENDANCE SERVICE** (30+ endpoints) - High usage + Remove @Public()
4. 🟡 **NOTIFICATION SERVICE** (18 endpoints) - Medium priority

---

## 🚀 Quick Start

1. **Run helper script**:
   ```powershell
   ./add-permissions.ps1
   ```

2. **For each controller**:
   - Open the file
   - Add import: `import { Permissions } from '@graduate-project/shared-common';`
   - Add `@Permissions('permission.code')` above each method
   - Remove `@Public()` if at controller level (except auth login/register)

3. **Test**:
   - Login with different roles
   - Try accessing endpoints
   - Verify 403 for unauthorized access

---

## ✅ Completion Checklist

Use this to track your progress:

### Auth Service
- [ ] role.controller.ts (7 methods)
- [ ] permission.controller.ts (5 methods)
- [ ] device.controller.ts (4 methods)
- [ ] admin.controller.ts (6 methods)
- [ ] account.controller.ts - finish remaining methods

### Leave Service
- [ ] leave-record.controller.ts (8 methods)
- [ ] leave-balance.controller.ts (9 methods)
- [ ] leave-type.controller.ts (6 methods)
- [ ] holiday.controller.ts (7 methods)

### Attendance Service
- [ ] Remove @Public() from controller level
- [ ] overtime-request.controller.ts (9 methods)
- [ ] attendance-check.controller.ts (8 methods)
- [ ] report.controller.ts (3 methods)
- [ ] work-schedule.controller.ts (5 methods)
- [ ] employee-shift.controller.ts (5 methods)

### Notification Service
- [ ] notification.controller.ts (8 methods)
- [ ] scheduled-notification.controller.ts (6 methods)
- [ ] push-token.controller.ts (4 methods)
- [ ] notification-preference.controller.ts (3 methods)

---

**Last Updated**: 2025-01-19
**Total Work Remaining**: ~84 endpoints to add @Permissions
