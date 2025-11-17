# ATTENDANCE SERVICE - IMPLEMENTATION PROGRESS & GUIDE

## ✅ ĐÃ HOÀN THÀNH

### 1. Work Schedules Management Module
- ✅ DTOs: `src/presentation/dtos/work-schedule.dto.ts`
- ✅ TypeORM Schemas: `src/infrastructure/database/schemas/work-schedule.schema.ts`
- ✅ Repositories: `src/infrastructure/repositories/work-schedule.repository.ts`
- ✅ Use Cases: `src/application/use-cases/work-schedule/create-work-schedule.use-case.ts`
- ✅ Controller: `src/presentation/controllers/work-schedule.controller.ts`

**APIs Created:**
```
POST   /work-schedules              - Create work schedule (HR/Admin)
GET    /work-schedules              - List all schedules
GET    /work-schedules/:id          - Get schedule details
PUT    /work-schedules/:id          - Update schedule
DELETE /work-schedules/:id          - Delete schedule
POST   /work-schedules/:id/assign   - Assign to employees
GET    /work-schedules/employee/:id - Get employee schedules
```

---

## 🚧 CẦN HOÀN THIỆN

### 2. Beacon Management Module
**Database Table:** `beacons`

**Files cần tạo:**
1. DTOs: `src/presentation/dtos/beacon.dto.ts`
   - CreateBeaconDto
   - UpdateBeaconDto
   - BeaconQueryDto

2. TypeORM Schema: `src/infrastructure/database/schemas/beacon.schema.ts` (có thể đã có)

3. Repository: `src/infrastructure/repositories/beacon.repository.ts`
   - findAllBeacons(departmentId?, status?)
   - findByUUID(uuid, major, minor)
   - findByDepartment(departmentId)
   - createBeacon(data, createdBy)
   - updateBeacon(id, data, updatedBy)
   - updateBeaconStatus(id, status)
   - updateLastHeartbeat(id)

4. Use Cases: `src/application/use-cases/beacon/`
   - create-beacon.use-case.ts
   - get-beacons.use-case.ts
   - update-beacon.use-case.ts
   - delete-beacon.use-case.ts

5. Controller: `src/presentation/controllers/beacon.controller.ts`

**APIs cần implement:**
```
POST   /beacons              - Register new beacon
GET    /beacons              - List beacons
GET    /beacons/:id          - Get beacon details
PUT    /beacons/:id          - Update beacon
DELETE /beacons/:id          - Delete beacon
GET    /beacons/department/:id - Get beacons by department
POST   /beacons/:id/heartbeat  - Update beacon heartbeat
```

---

### 3. Overtime Requests Module
**Database Table:** `overtime_requests`

**Files cần tạo:**
1. DTOs: `src/presentation/dtos/overtime-request.dto.ts`
   - CreateOvertimeRequestDto
   - UpdateOvertimeRequestDto
   - ApproveOvertimeDto
   - OvertimeQueryDto

2. TypeORM Schema: `src/infrastructure/database/schemas/overtime-request.schema.ts`

3. Repository: `src/infrastructure/repositories/overtime-request.repository.ts`
   - findByEmployeeId(employeeId)
   - findPendingRequests(limit, offset)
   - findByStatus(status)
   - findByDateRange(start, end)
   - createRequest(data)
   - updateRequest(id, data)
   - approveRequest(id, approvedBy)
   - rejectRequest(id, rejectedBy, reason)

4. Use Cases: `src/application/use-cases/overtime/`
   - create-overtime-request.use-case.ts
   - get-overtime-requests.use-case.ts
   - approve-overtime.use-case.ts
   - reject-overtime.use-case.ts
   - get-my-overtime-requests.use-case.ts (employee)

5. Controller: `src/presentation/controllers/overtime-request.controller.ts`

**APIs cần implement:**
```
POST   /overtime-requests                - Create OT request (Employee)
GET    /overtime-requests/my-requests    - Get my OT requests (Employee)
GET    /overtime-requests                - List all OT requests (HR/Manager)
GET    /overtime-requests/:id            - Get OT request details
PUT    /overtime-requests/:id            - Update OT request
POST   /overtime-requests/:id/approve    - Approve OT
POST   /overtime-requests/:id/reject     - Reject OT
GET    /overtime-requests/pending        - Get pending OT requests
```

---

### 4. Violations Management Module
**Database Table:** `violations`

**Files cần tạo:**
1. DTOs: `src/presentation/dtos/violation.dto.ts`
   - CreateViolationDto
   - ResolveViolationDto
   - ViolationQueryDto

2. TypeORM Schema: `src/infrastructure/database/schemas/violation.schema.ts`

3. Repository: ✅ Already exists at `src/infrastructure/repositories/violation.repository.ts`

4. Use Cases: `src/application/use-cases/violation/`
   - get-violations.use-case.ts
   - get-my-violations.use-case.ts
   - resolve-violation.use-case.ts
   - get-violation-statistics.use-case.ts
   - get-top-violators.use-case.ts

5. Controller: `src/presentation/controllers/violation.controller.ts`

**APIs cần implement:**
```
GET    /violations                     - List violations (HR/Manager)
GET    /violations/my-violations       - Get my violations (Employee)
GET    /violations/:id                 - Get violation details
POST   /violations/:id/resolve         - Resolve violation
GET    /violations/statistics          - Get violation statistics
GET    /violations/top-violators       - Get top violators
GET    /violations/employee/:id        - Get violations by employee
```

---

### 5. Attendance Edit Logs Module
**Database Table:** `attendance_edit_logs`

**Files cần tạo:**
1. DTOs: `src/presentation/dtos/edit-log.dto.ts`
   - EditLogQueryDto

2. TypeORM Schema: `src/infrastructure/database/schemas/attendance-edit-log.schema.ts`

3. Repository: `src/infrastructure/repositories/attendance-edit-log.repository.ts`
   - findByShiftId(shiftId)
   - findByEmployeeId(employeeId, limit, offset)
   - findByEditedBy(userId, limit, offset)
   - findByDateRange(start, end)
   - createLog(data) - Auto-called when editing shift

4. Use Cases: `src/application/use-cases/edit-log/`
   - get-edit-logs.use-case.ts
   - get-shift-edit-history.use-case.ts
   - get-employee-edit-history.use-case.ts

5. Controller: `src/presentation/controllers/attendance-edit-log.controller.ts`

**APIs cần implement:**
```
GET    /attendance-edit-logs                  - List all edit logs
GET    /attendance-edit-logs/shift/:id        - Get shift edit history
GET    /attendance-edit-logs/employee/:id     - Get employee edit history
GET    /attendance-edit-logs/editor/:id       - Get logs by editor
```

---

### 6. Reports & Analytics Module
**No dedicated table, queries from existing tables**

**Files cần tạo:**
1. DTOs: `src/presentation/dtos/report.dto.ts`
   - DailyReportQueryDto
   - MonthlyReportQueryDto
   - AnalyticsQueryDto

2. Repository: `src/infrastructure/repositories/report.repository.ts`
   - getDailyAttendanceReport(date, departmentId?)
   - getMonthlyAttendanceReport(year, month, employeeId?)
   - getAttendanceRateStats(startDate, endDate)
   - getPunctualityStats(startDate, endDate)
   - getOvertimeTrends(startDate, endDate)
   - getAbsencePatterns(startDate, endDate)

3. Use Cases: `src/application/use-cases/report/`
   - get-daily-report.use-case.ts
   - get-monthly-report.use-case.ts
   - get-attendance-rate.use-case.ts
   - get-punctuality-stats.use-case.ts
   - export-monthly-report.use-case.ts

4. Controller: `src/presentation/controllers/report.controller.ts`

**APIs cần implement:**
```
GET    /reports/daily                     - Daily attendance report
GET    /reports/daily/:date               - Daily report for specific date
GET    /reports/monthly/:year/:month      - Monthly report
GET    /reports/monthly/employee/:id      - Employee monthly report
GET    /reports/monthly/export            - Export to Excel/PDF
GET    /analytics/attendance-rate         - Attendance rate analytics
GET    /analytics/punctuality             - Punctuality analytics
GET    /analytics/overtime-trends         - Overtime trends
GET    /dashboard/today                   - Today's dashboard
```

---

### 7. RabbitMQ Integration

**Events to PUBLISH (Attendance → Other Services):**

Already implemented in `src/infrastructure/messaging/rabbitmq-publisher.service.ts`:
- ✅ attendance.checked
- ✅ shift.completed
- ✅ attendance.anomaly.detected
- ✅ violation.detected

**Need to ADD:**
```typescript
// In rabbitmq-publisher.service.ts
async publishShiftStarted(data: any) { ... }
async publishShiftReminder(data: any) { ... }
async publishOvertimeRequested(data: any) { ... }
async publishOvertimeApproved(data: any) { ... }
async publishVerificationMissed(data: any) { ... }
```

**Events to CONSUME (Other Services → Attendance):**

Already implemented in `src/presentation/event-listeners/`:
- ✅ leave.approved - LeaveApprovedListener
- ✅ leave.cancelled - LeaveCancelledListener
- ✅ face.verification.completed - FaceVerificationCompletedListener

**Need to ADD:**
```typescript
// src/presentation/event-listeners/employee-terminated.listener.ts
@EventPattern('employee.terminated')
async handleEmployeeTerminated(data: any) {
  // Dừng tạo shifts cho nhân viên này
}

// src/presentation/event-listeners/employee-suspended.listener.ts
@EventPattern('employee.suspended')
async handleEmployeeSuspended(data: any) {
  // Đánh dấu shifts là suspended
}
```

---

## 🔧 CẤU HÌNH MODULE

### app.module.ts - Cần thêm vào providers:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Schemas
import { WorkScheduleSchema, EmployeeWorkScheduleSchema } from './infrastructure/database/schemas/work-schedule.schema';
import { OvertimeRequestSchema } from './infrastructure/database/schemas/overtime-request.schema';
import { ViolationSchema } from './infrastructure/database/schemas/violation.schema';
import { AttendanceEditLogSchema } from './infrastructure/database/schemas/attendance-edit-log.schema';

// Repositories
import { WorkScheduleRepository, EmployeeWorkScheduleRepository } from './infrastructure/repositories/work-schedule.repository';
import { OvertimeRequestRepository } from './infrastructure/repositories/overtime-request.repository';
import { ViolationRepository } from './infrastructure/repositories/violation.repository';
import { AttendanceEditLogRepository } from './infrastructure/repositories/attendance-edit-log.repository';

// Use Cases
import { CreateWorkScheduleUseCase } from './application/use-cases/work-schedule/create-work-schedule.use-case';
// ... thêm các use cases khác

// Controllers
import { WorkScheduleController } from './presentation/controllers/work-schedule.controller';
import { OvertimeRequestController } from './presentation/controllers/overtime-request.controller';
import { ViolationController } from './presentation/controllers/violation.controller';
import { ReportController } from './presentation/controllers/report.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkScheduleSchema,
      EmployeeWorkScheduleSchema,
      OvertimeRequestSchema,
      ViolationSchema,
      AttendanceEditLogSchema,
      // ... other schemas
    ]),
  ],
  controllers: [
    WorkScheduleController,
    OvertimeRequestController,
    ViolationController,
    ReportController,
    // ... other controllers
  ],
  providers: [
    // Repositories
    WorkScheduleRepository,
    EmployeeWorkScheduleRepository,
    OvertimeRequestRepository,
    ViolationRepository,
    AttendanceEditLogRepository,
    
    // Use Cases
    CreateWorkScheduleUseCase,
    // ... other use cases
  ],
})
export class AppModule {}
```

---

## 🎯 AUTHENTICATION PATTERN

**Tất cả controllers phải follow pattern này:**

```typescript
import { CurrentUser, JwtPayload } from '@graduate-project/shared-common';

@Controller('endpoint')
export class SomeController {
  
  // API cho Employee - Lấy employee_id từ JWT
  @Get('my-data')
  async getMyData(@CurrentUser() user: JwtPayload) {
    const employeeId = user.employee_id!;
    // Use employeeId from token
  }
  
  // API cho HR/Manager - Có thể truy cập data của employees khác
  @Get('employee/:id')
  async getEmployeeData(
    @Param('id', ParseIntPipe) employeeId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    // Check permission if needed
    // Use param employeeId
  }
}
```

---

## 📝 CHECKLIST HOÀN THIỆN MODULE

Để hoàn thiện một module, cần có:
- [ ] DTOs (Request/Response validation)
- [ ] TypeORM Schema (Database entity)
- [ ] Repository (Database operations)
- [ ] Use Cases (Business logic)
- [ ] Controller (API endpoints)
- [ ] Register trong AppModule
- [ ] Add RabbitMQ events (nếu cần)
- [ ] Write tests (optional)

---

## 🚀 NEXT STEPS

1. **Complete Beacon Management Module** (Priority: HIGH)
2. **Complete Overtime Requests Module** (Priority: HIGH)
3. **Complete Violations Module** (Priority: MEDIUM)
4. **Complete Attendance Edit Logs Module** (Priority: MEDIUM)
5. **Complete Reports & Analytics Module** (Priority: LOW)
6. **Add missing RabbitMQ events** (Priority: LOW)
7. **Fix line endings** - Run: `npm run lint:fix` (Priority: LOW)
8. **Write tests** (Priority: LOW)

---

## 🛠️ UTILITIES

### Fix Line Endings (CRLF → LF)
```powershell
# In attendance service directory
npm run lint:fix
```

### Validate TypeScript
```powershell
npm run build
```

### Run Service
```powershell
npm run start:dev
```

---

**Created by:** GitHub Copilot  
**Date:** November 17, 2025  
**Status:** Work Schedule Module ✅ Complete, Others 🚧 In Progress
