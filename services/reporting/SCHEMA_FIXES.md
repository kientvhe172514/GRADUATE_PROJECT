# Schema Property Fixes - Attendance Reports

## Issue
TypeScript compilation errors due to property name mismatches between SQL queries and actual database schema.

## Root Cause
The initial implementation used incorrect column names that didn't match the actual TypeORM schemas:

### ❌ Incorrect (Before)
```typescript
// SQL Query
es.work_hours as working_hours,  // Aliased incorrectly
es.status as shift_status,       // Aliased incorrectly
ws.shift_name                     // Column doesn't exist

// TypeScript access
shift.shift_status               // Property doesn't exist
shift.working_hours              // Property doesn't exist
```

### ✅ Correct (After)
```typescript
// SQL Query - matches actual schema
es.work_hours,                   // Direct column name
es.status,                       // Direct column name
ws.schedule_name as shift_name   // Correct column with alias

// TypeScript access
shift.status                     // Matches schema
shift.work_hours                 // Matches schema
shift.shift_name                 // From alias
```

## Database Schema Reference

### employee_shifts table (EmployeeShiftSchema)
```typescript
@Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
work_hours: number;  // ✅ Not "working_hours"

@Column({ type: 'varchar', length: 20, default: 'SCHEDULED' })
status: string;  // ✅ Not "shift_status"
// Values: SCHEDULED, IN_PROGRESS, COMPLETED, ON_LEAVE, ABSENT

@Column({ type: 'varchar', length: 20, default: 'REGULAR' })
shift_type: string;  // ✅ REGULAR, OVERTIME

@Column({ type: 'integer', default: 0 })
late_minutes: number;  // ✅

@Column({ type: 'integer', default: 0 })
early_leave_minutes: number;  // ✅

@Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
overtime_hours: number;  // ✅

@Column({ type: 'integer', nullable: true })
work_schedule_id?: number;  // ✅ FK to work_schedules
```

### work_schedules table (WorkScheduleSchema)
```typescript
@Column({ type: 'varchar', length: 100 })
schedule_name: string;  // ✅ Not "shift_name"

@Column({ type: 'time', nullable: true })
start_time?: string;  // ✅

@Column({ type: 'time', nullable: true })
end_time?: string;  // ✅
```

## Changes Made

### 1. get-employee-attendance-report.use-case.ts

**Added TypeScript Interface:**
```typescript
interface ShiftQueryResult {
  date: Date;
  day_of_week: string;
  shift_name: string;  // From ws.schedule_name alias
  scheduled_start_time: string;
  scheduled_end_time: string;
  check_in_time: Date | null;
  check_out_time: Date | null;
  late_minutes: number;
  early_leave_minutes: number;
  work_hours: number;  // ✅ Correct name
  overtime_hours: number;
  status: string;  // ✅ Correct name
  shift_type: string;
}
```

**Fixed SQL Query:**
```sql
SELECT 
  es.shift_date::date as date,
  TO_CHAR(es.shift_date, 'Day') as day_of_week,
  ws.schedule_name as shift_name,  -- ✅ Fixed: was ws.shift_name
  ws.start_time as scheduled_start_time,
  ws.end_time as scheduled_end_time,
  es.check_in_time,
  es.check_out_time,
  es.late_minutes,
  es.early_leave_minutes,
  es.work_hours,  -- ✅ Fixed: was aliased as working_hours
  es.overtime_hours,
  es.status,  -- ✅ Fixed: was aliased as shift_status
  es.shift_type
FROM employee_shifts es
LEFT JOIN work_schedules ws ON ws.id = es.work_schedule_id  -- ✅ Fixed: was ws.schedule_id
WHERE es.employee_id = $1
  AND es.shift_date BETWEEN $2 AND $3
ORDER BY es.shift_date
```

**Fixed Property Access:**
```typescript
// Before
if (shift.shift_status === 'COMPLETED') {
  totalWorkingHours += Number(shift.working_hours) || 0;
}

// After
if (shift.status === 'COMPLETED') {
  totalWorkingHours += Number(shift.work_hours) || 0;
}
```

**Fixed Type Safety:**
```typescript
// Before - causes type errors
late_minutes: shift?.late_minutes > 0 ? Number(shift.late_minutes) : undefined,

// After - properly handles nullable
late_minutes: shift && shift.late_minutes > 0 ? Number(shift.late_minutes) : undefined,
```

**Fixed Date Conversion:**
```typescript
// Before - Date object assigned to string property
check_in_time: shift?.check_in_time,

// After - Convert Date to ISO string
check_in_time: shift?.check_in_time 
  ? new Date(shift.check_in_time).toISOString() 
  : undefined,
```

### 2. get-employees-attendance-report.use-case.ts

**Fixed SQL Aggregation Query:**
```sql
WITH employee_attendance AS (
  SELECT 
    es.employee_id,
    es.employee_code,
    es.department_id,
    
    -- Working days count (REGULAR shifts that are COMPLETED)
    COUNT(DISTINCT CASE 
      WHEN es.shift_type = 'REGULAR' AND es.status = 'COMPLETED'  -- ✅ Fixed
      THEN es.shift_date 
    END) as working_days,
    
    -- Total working hours (REGULAR shifts)
    COALESCE(SUM(CASE 
      WHEN es.shift_type = 'REGULAR' 
      THEN es.work_hours  -- ✅ Fixed: was working_hours
      ELSE 0 
    END), 0) as total_working_hours,
    
    -- Absent days (ABSENT status)
    COUNT(CASE 
      WHEN es.status = 'ABSENT'  -- ✅ Fixed: was shift_status
      THEN 1 
    END) as total_absent_days
    
  FROM employee_shifts es
  WHERE ${whereClause}
  GROUP BY es.employee_id, es.employee_code, es.department_id
)
```

## Verification Steps

1. **Check TypeScript compilation:**
   ```bash
   cd services/reporting
   pnpm run build
   ```

2. **Verify no compile errors:**
   ```bash
   # Should return "No errors found"
   ```

3. **Test SQL queries directly:**
   ```sql
   -- Verify columns exist
   SELECT 
     work_hours, 
     status, 
     shift_type,
     late_minutes,
     early_leave_minutes,
     overtime_hours
   FROM employee_shifts 
   LIMIT 1;

   SELECT 
     schedule_name,
     start_time,
     end_time
   FROM work_schedules 
   LIMIT 1;
   ```

## Status
✅ All TypeScript compilation errors resolved  
✅ SQL queries match actual database schema  
✅ Type safety properly enforced with interface  
✅ Date/time conversions handled correctly  
✅ Nullable checks implemented properly

## Related Files
- `services/attendance/src/infrastructure/persistence/typeorm/employee-shift.schema.ts`
- `services/attendance/src/infrastructure/persistence/typeorm/work-schedule.schema.ts`
- `services/reporting/src/application/attendance-report/use-cases/get-employee-attendance-report.use-case.ts`
- `services/reporting/src/application/attendance-report/use-cases/get-employees-attendance-report.use-case.ts`

---
**Fixed:** 2025-01-22  
**Services:** Reporting (Port 3005)
