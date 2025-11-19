# RBAC Permissions Matrix

## Overview
This document defines the complete RBAC (Role-Based Access Control) system with 4 roles and their permissions across all microservices.

## 4 Core Roles

| Role | Code | Description |
|------|------|-------------|
| **Administrator** | `ADMIN` | Full system access with all permissions |
| **HR Manager** | `HR_MANAGER` | Manages employees, departments, positions, and HR operations |
| **Department Manager** | `DEPARTMENT_MANAGER` | Manages department employees and operations |
| **Employee** | `EMPLOYEE` | Basic employee access to view own information and submit requests |

---

## Permissions Matrix by Service

### Legend
- ✅ = Full Access
- 🔵 = Limited Access (own records or department only)
- ❌ = No Access

---

## 1. AUTH SERVICE

### Account Management
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `auth.account.create` | ✅ | ❌ | ❌ | ❌ |
| `auth.account.read` | ✅ | ✅ | ❌ | ❌ |
| `auth.account.read_own` | ✅ | ✅ | ✅ | ✅ |
| `auth.account.update` | ✅ | ❌ | ❌ | ❌ |
| `auth.account.update_own` | ✅ | ✅ | ✅ | ✅ |
| `auth.account.delete` | ✅ | ❌ | ❌ | ❌ |
| `auth.account.change_password` | ✅ | ✅ | ✅ | ✅ |
| `auth.account.reset_password` | ✅ | ❌ | ❌ | ❌ |
| `auth.account.manage_roles` | ✅ | ❌ | ❌ | ❌ |

### Role Management
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `auth.role.read` | ✅ | ✅ | ❌ | ❌ |
| `auth.role.create` | ✅ | ❌ | ❌ | ❌ |
| `auth.role.update` | ✅ | ❌ | ❌ | ❌ |
| `auth.role.delete` | ✅ | ❌ | ❌ | ❌ |

### Permission Management
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `auth.permission.read` | ✅ | ✅ | ❌ | ❌ |
| `auth.permission.create` | ✅ | ❌ | ❌ | ❌ |
| `auth.permission.update` | ✅ | ❌ | ❌ | ❌ |
| `auth.permission.delete` | ✅ | ❌ | ❌ | ❌ |

### Device Management
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `auth.device.read` | ✅ | ❌ | ❌ | ❌ |
| `auth.device.read_own` | ✅ | ✅ | ✅ | ✅ |
| `auth.device.create` | ✅ | ✅ | ✅ | ✅ |
| `auth.device.delete` | ✅ | ✅ | ✅ | ✅ |

---

## 2. EMPLOYEE SERVICE

### Employee Management
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `employee.create` | ✅ | ✅ | ❌ | ❌ |
| `employee.read` | ✅ | ✅ | ✅ | ❌ |
| `employee.read_own` | ✅ | ✅ | ✅ | ✅ |
| `employee.read_department` | ✅ | ❌ | 🔵 | ❌ |
| `employee.update` | ✅ | ✅ | ❌ | ❌ |
| `employee.update_own` | ✅ | ✅ | ✅ | ✅ |
| `employee.delete` | ✅ | ❌ | ❌ | ❌ |
| `employee.terminate` | ✅ | ✅ | ❌ | ❌ |
| `employee.assign_department` | ✅ | ✅ | 🔵 | ❌ |
| `employee.assign_position` | ✅ | ✅ | 🔵 | ❌ |
| `employee.remove_department` | ✅ | ✅ | ❌ | ❌ |
| `employee.remove_position` | ✅ | ✅ | ❌ | ❌ |
| `employee.transfer_department` | ✅ | ✅ | ❌ | ❌ |

### Onboarding Management
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `employee.onboarding.read` | ✅ | ✅ | 🔵 | 🔵 |
| `employee.onboarding.update` | ✅ | ✅ | ❌ | ❌ |

---

## 3. DEPARTMENT SERVICE

| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `department.create` | ✅ | ✅ | ❌ | ❌ |
| `department.read` | ✅ | ✅ | ✅ | ✅ |
| `department.update` | ✅ | ✅ | ❌ | ❌ |
| `department.delete` | ✅ | ✅ | ❌ | ❌ |
| `department.assign_manager` | ✅ | ✅ | ❌ | ❌ |
| `department.remove_manager` | ✅ | ✅ | ❌ | ❌ |

---

## 4. POSITION SERVICE

| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `position.create` | ✅ | ✅ | ❌ | ❌ |
| `position.read` | ✅ | ✅ | ✅ | ✅ |
| `position.update` | ✅ | ✅ | ❌ | ❌ |
| `position.delete` | ✅ | ✅ | ❌ | ❌ |

---

## 5. ATTENDANCE SERVICE

### Attendance Records
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `attendance.checkin` | ✅ | ✅ | ✅ | ✅ |
| `attendance.checkout` | ✅ | ✅ | ✅ | ✅ |
| `attendance.read` | ✅ | ✅ | ❌ | ❌ |
| `attendance.read_own` | ✅ | ✅ | ✅ | ✅ |
| `attendance.read_department` | ✅ | ❌ | 🔵 | ❌ |
| `attendance.update` | ✅ | ✅ | ❌ | ❌ |
| `attendance.delete` | ✅ | ✅ | ❌ | ❌ |
| `attendance.approve` | ✅ | ✅ | 🔵 | ❌ |
| `attendance.reject` | ✅ | ✅ | 🔵 | ❌ |
| `attendance.export` | ✅ | ✅ | 🔵 | ❌ |

### Overtime Management
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `overtime.create` | ✅ | ✅ | ✅ | ✅ |
| `overtime.read` | ✅ | ✅ | ❌ | ❌ |
| `overtime.read_own` | ✅ | ✅ | ✅ | ✅ |
| `overtime.read_department` | ✅ | ❌ | 🔵 | ❌ |
| `overtime.update` | ✅ | ✅ | ✅ | ✅ |
| `overtime.cancel` | ✅ | ✅ | ✅ | ✅ |
| `overtime.approve` | ✅ | ✅ | 🔵 | ❌ |
| `overtime.reject` | ✅ | ✅ | 🔵 | ❌ |

---

## 6. LEAVE SERVICE

### Leave Requests
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `leave.request.create` | ✅ | ✅ | ✅ | ✅ |
| `leave.request.read` | ✅ | ✅ | ❌ | ❌ |
| `leave.request.read_own` | ✅ | ✅ | ✅ | ✅ |
| `leave.request.read_department` | ✅ | ❌ | 🔵 | ❌ |
| `leave.request.update` | ✅ | ✅ | ✅ | ✅ |
| `leave.request.cancel` | ✅ | ✅ | ✅ | ✅ |
| `leave.request.approve` | ✅ | ✅ | 🔵 | ❌ |
| `leave.request.reject` | ✅ | ✅ | 🔵 | ❌ |

### Leave Balance
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `leave.balance.read` | ✅ | ✅ | ❌ | ❌ |
| `leave.balance.read_own` | ✅ | ✅ | ✅ | ✅ |
| `leave.balance.update` | ✅ | ✅ | ❌ | ❌ |

### Leave Types
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `leave.type.read` | ✅ | ✅ | ✅ | ✅ |
| `leave.type.create` | ✅ | ✅ | ❌ | ❌ |
| `leave.type.update` | ✅ | ✅ | ❌ | ❌ |
| `leave.type.delete` | ✅ | ✅ | ❌ | ❌ |

### Holidays
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `holiday.read` | ✅ | ✅ | ✅ | ✅ |
| `holiday.create` | ✅ | ✅ | ❌ | ❌ |
| `holiday.update` | ✅ | ✅ | ❌ | ❌ |
| `holiday.delete` | ✅ | ✅ | ❌ | ❌ |

---

## 7. NOTIFICATION SERVICE

### Notifications
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `notification.read` | ✅ | ✅ | ❌ | ❌ |
| `notification.read_own` | ✅ | ✅ | ✅ | ✅ |
| `notification.send` | ✅ | ✅ | ❌ | ❌ |
| `notification.create_scheduled` | ✅ | ✅ | ❌ | ❌ |
| `notification.update_scheduled` | ✅ | ✅ | ❌ | ❌ |
| `notification.delete_scheduled` | ✅ | ✅ | ❌ | ❌ |

### Push Tokens
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `notification.push_token.register` | ✅ | ✅ | ✅ | ✅ |
| `notification.push_token.read_own` | ✅ | ✅ | ✅ | ✅ |
| `notification.push_token.delete_own` | ✅ | ✅ | ✅ | ✅ |

### Notification Preferences
| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `notification.preference.read_own` | ✅ | ✅ | ✅ | ✅ |
| `notification.preference.update_own` | ✅ | ✅ | ✅ | ✅ |

---

## 8. REPORTING SERVICE

| Permission | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE |
|------------|-------|------------|--------------|----------|
| `report.attendance.generate` | ✅ | ✅ | 🔵 | ❌ |
| `report.leave.generate` | ✅ | ✅ | 🔵 | ❌ |
| `report.overtime.generate` | ✅ | ✅ | 🔵 | ❌ |
| `report.employee.generate` | ✅ | ✅ | ❌ | ❌ |
| `report.department.generate` | ✅ | ✅ | ❌ | ❌ |
| `report.export` | ✅ | ✅ | 🔵 | ❌ |

---

## Permission Counts by Role

| Role | Total Permissions |
|------|-------------------|
| **ADMIN** | 🎯 ALL (~120 permissions) |
| **HR_MANAGER** | 🎯 ~85 permissions |
| **DEPARTMENT_MANAGER** | 🎯 ~40 permissions |
| **EMPLOYEE** | 🎯 ~25 permissions |

---

## How to Use

### 1. Seed Database
```bash
# Run the seed script
psql -U your_user -d auth_db -f services/auth/database/seeds/rbac-seed.sql
```

### 2. Add @Permissions Decorator to Controllers
```typescript
import { Permissions } from '@graduate-project/shared-common';

@Controller('employees')
export class EmployeeController {
  
  @Post()
  @Permissions('employee.create')
  async create() { ... }
  
  @Get(':id')
  @Permissions('employee.read')
  async findOne() { ... }
}
```

### 3. Permission Naming Convention
```
service.resource.action
```
Examples:
- `employee.create` - Create employee
- `attendance.read_own` - Read own attendance
- `leave.request.approve` - Approve leave requests

---

## Notes

1. **ADMIN Bypass**: ADMIN role has access to ALL endpoints automatically
2. **Department Scope**: Department managers can only manage their own department
3. **Self-Service**: All users can read/update their own information
4. **Public Endpoints**: Use `@Public()` decorator for endpoints that don't require authentication

---

## Related Files

- SQL Seed: `services/auth/database/seeds/rbac-seed.sql`
- Guard: `services/shared-common/src/guards/jwt-permission.guard.ts`
- Decorator: `services/shared-common/src/guards/jwt-permission.guard.ts` (exports `Permissions`)
