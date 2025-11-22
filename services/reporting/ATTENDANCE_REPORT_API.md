# Attendance Report APIs

## Overview
Comprehensive attendance reporting APIs for HR and management to track employee attendance, working hours, overtime, leaves, and calculate manday.

**Service:** Reporting Service (Port: 3005)  
**Base URL:** `http://localhost:3005/api/v1/reporting/reports/attendance`

---

## API Endpoints

### 1. Get Employees Attendance Report (Multiple Employees)

**Endpoint:** `GET /reports/attendance/employees`

**Permission:** `report.attendance.read`

**Description:** Get aggregated attendance summary for multiple employees with filtering and pagination.

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `period` | enum | No | Report period: DAY, WEEK, MONTH, QUARTER, YEAR, CUSTOM | MONTH |
| `start_date` | string | No | Start date (YYYY-MM-DD) - required if period=CUSTOM | 2025-01-01 |
| `end_date` | string | No | End date (YYYY-MM-DD) - required if period=CUSTOM | 2025-01-31 |
| `department_id` | number | No | Filter by department ID | 2 |
| `search` | string | No | Search by employee name or code | John |
| `page` | number | No | Page number (default: 1) | 1 |
| `limit` | number | No | Items per page (default: 20) | 20 |

#### Response Schema

```json
{
  "success": true,
  "message": "Employees attendance report retrieved successfully",
  "data": {
    "data": [
      {
        "employee_id": 1,
        "employee_code": "EMP001",
        "full_name": "John Doe",
        "department_id": 2,
        "department_name": "Engineering",
        "position_name": "Software Engineer",
        "working_days": 22,
        "total_working_hours": 176,
        "total_overtime_hours": 8,
        "total_late_count": 2,
        "total_early_leave_count": 1,
        "total_leave_days": 2,
        "total_absent_days": 0,
        "manday": 24,
        "attendance_rate": 100
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20,
    "total_pages": 3,
    "period": "MONTH",
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
  }
}
```

#### Data Fields Explanation

- **working_days**: Number of days employee actually worked (checked in and out)
- **total_working_hours**: Sum of all working hours (excludes overtime)
- **total_overtime_hours**: Sum of approved overtime hours
- **total_late_count**: Number of times employee arrived late
- **total_early_leave_count**: Number of times employee left early
- **total_leave_days**: Total approved leave days taken
- **total_absent_days**: Days marked as absent without approved leave
- **manday**: Working days + leave days (represents total productive days)
- **attendance_rate**: Percentage of days attended vs expected working days

#### Example Requests

**Get current month report:**
```bash
curl -X GET "http://localhost:3005/api/v1/reporting/reports/attendance/employees?period=MONTH" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get quarterly report for Engineering department:**
```bash
curl -X GET "http://localhost:3005/api/v1/reporting/reports/attendance/employees?period=QUARTER&department_id=2&page=1&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Custom date range with search:**
```bash
curl -X GET "http://localhost:3005/api/v1/reporting/reports/attendance/employees?period=CUSTOM&start_date=2025-01-01&end_date=2025-01-15&search=John" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Get Employee Attendance Report (Single Employee Detail)

**Endpoint:** `GET /reports/attendance/employee/:employeeId`

**Permission:** `report.attendance.read`

**Description:** Get detailed daily attendance breakdown for a specific employee with comprehensive information.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employeeId` | number | Yes | Employee ID |

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `period` | enum | No | Report period: DAY, WEEK, MONTH, QUARTER, YEAR, CUSTOM | MONTH |
| `start_date` | string | No | Start date (YYYY-MM-DD) | 2025-01-01 |
| `end_date` | string | No | End date (YYYY-MM-DD) | 2025-01-31 |

#### Response Schema

```json
{
  "success": true,
  "message": "Employee attendance report retrieved successfully",
  "data": {
    "employee": {
      "employee_id": 1,
      "employee_code": "EMP001",
      "full_name": "John Doe",
      "email": "john.doe@company.com",
      "department_id": 2,
      "department_name": "Engineering",
      "position_name": "Software Engineer",
      "join_date": "2024-01-15"
    },
    "period": {
      "type": "MONTH",
      "start_date": "2025-01-01",
      "end_date": "2025-01-31",
      "total_days": 31
    },
    "summary": {
      "total_working_days": 22,
      "total_working_hours": 176,
      "total_overtime_hours": 8,
      "total_late_count": 2,
      "total_early_leave_count": 1,
      "total_leave_days": 2,
      "total_absent_days": 0,
      "total_holidays": 2,
      "total_manday": 24,
      "attendance_rate": 100
    },
    "daily_records": [
      {
        "date": "2025-01-02",
        "day_of_week": "Monday",
        "shift_name": "Day Shift",
        "scheduled_start_time": "08:00:00",
        "scheduled_end_time": "17:00:00",
        "check_in_time": "08:05:00",
        "check_in_status": "LATE",
        "late_minutes": 5,
        "check_out_time": "17:00:00",
        "check_out_status": "ON_TIME",
        "working_hours": 8,
        "overtime_hours": 0,
        "is_holiday": false,
        "manday": 1,
        "remarks": "COMPLETED"
      },
      {
        "date": "2025-01-03",
        "day_of_week": "Tuesday",
        "shift_name": "Day Shift",
        "scheduled_start_time": "08:00:00",
        "scheduled_end_time": "17:00:00",
        "check_in_time": "08:00:00",
        "check_in_status": "ON_TIME",
        "check_out_time": "17:00:00",
        "check_out_status": "ON_TIME",
        "working_hours": 8,
        "overtime_hours": 2,
        "overtime_status": "APPROVED",
        "is_holiday": false,
        "manday": 1,
        "remarks": "COMPLETED"
      },
      {
        "date": "2025-01-06",
        "day_of_week": "Friday",
        "check_in_status": "LEAVE",
        "check_out_status": "LEAVE",
        "working_hours": 0,
        "leave_type": "Annual Leave",
        "leave_days": 1,
        "is_holiday": false,
        "manday": 1,
        "remarks": "ON_LEAVE"
      },
      {
        "date": "2025-01-01",
        "day_of_week": "Sunday",
        "check_in_status": "HOLIDAY",
        "check_out_status": "HOLIDAY",
        "working_hours": 0,
        "is_holiday": true,
        "holiday_name": "New Year's Day",
        "manday": 0,
        "remarks": null
      }
    ]
  }
}
```

#### Daily Record Status Values

**check_in_status / check_out_status:**
- `ON_TIME`: Checked in/out on time
- `LATE`: Arrived after scheduled time
- `EARLY`: Left before scheduled time
- `ABSENT`: Did not check in/out (no approved leave)
- `HOLIDAY`: Public/company holiday
- `LEAVE`: On approved leave

#### Example Requests

**Get current month report for employee:**
```bash
curl -X GET "http://localhost:3005/api/v1/reporting/reports/attendance/employee/1?period=MONTH" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get weekly report:**
```bash
curl -X GET "http://localhost:3005/api/v1/reporting/reports/attendance/employee/1?period=WEEK" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Custom date range:**
```bash
curl -X GET "http://localhost:3005/api/v1/reporting/reports/attendance/employee/1?period=CUSTOM&start_date=2025-01-01&end_date=2025-01-15" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Business Logic

### Manday Calculation

**Manday** represents the total productive capacity of an employee for salary/payment calculation:

```
Manday = Working Days + Leave Days (Approved)
```

**Examples:**
- Employee worked 22 days + 2 days annual leave = **24 manday**
- Employee worked 20 days + 3 days sick leave = **23 manday**
- Employee worked 18 days + 2 days leave + 2 days absent = **20 manday** (absent days excluded)

### Attendance Rate Calculation

```
Attendance Rate = (Working Days / Expected Working Days) × 100
Expected Working Days = Total Days - Holidays - Leave Days
```

**Example:**
- Total days in month: 31
- Holidays: 2
- Leave days: 2
- Working days: 22
- Expected: 31 - 2 - 2 = 27
- Rate: (22 / 27) × 100 = **81.48%**

---

## Data Sources

The reporting service aggregates data from multiple services:

1. **Employee Service**
   - Employee information (name, code, email, department, position)
   - Join date and employment status

2. **Attendance Service**
   - `employee_shifts` table: Working days, hours, overtime, late/early
   - `work_schedules` table: Scheduled times
   - `violations` table: Attendance violations

3. **Leave Service** (via RabbitMQ RPC)
   - `leave_records` table: Approved leaves by period
   - `leave_types` table: Leave type names

4. **Holidays**
   - `holidays` table: Public and company holidays

---

## Integration Requirements

### Leave Service RPC Handlers

The Leave Service must implement these RabbitMQ message handlers:

```typescript
// 1. Bulk leave days query
@MessagePattern({ cmd: 'get_employee_leave_days_bulk' })
async getEmployeeLeaveDaysBulk(data: {
  employee_ids: number[];
  start_date: string;
  end_date: string;
}): Promise<{ employee_id: number; total_leave_days: number }[]>

// 2. Individual employee leaves query
@MessagePattern({ cmd: 'get_employee_leaves_by_period' })
async getEmployeeLeavesByPeriod(data: {
  employee_id: number;
  start_date: string;
  end_date: string;
}): Promise<LeaveRecord[]>
```

---

## Permissions

Add these permissions to your RBAC system:

```typescript
{
  resource: 'report',
  actions: [
    'attendance.read',  // View attendance reports
  ],
  roles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER']
}
```

---

## Testing

### 1. Test Employees Report (List View)

```bash
# Get current month report
curl -X GET "http://localhost:3005/api/v1/reporting/reports/attendance/employees?period=MONTH" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq

# Filter by department
curl -X GET "http://localhost:3005/api/v1/reporting/reports/attendance/employees?period=MONTH&department_id=2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq

# Search for specific employee
curl -X GET "http://localhost:3005/api/v1/reporting/reports/attendance/employees?search=John&period=QUARTER" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq
```

### 2. Test Employee Detail Report

```bash
# Get current month detail for employee ID 1
curl -X GET "http://localhost:3005/api/v1/reporting/reports/attendance/employee/1?period=MONTH" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq

# Get weekly report
curl -X GET "http://localhost:3005/api/v1/reporting/reports/attendance/employee/1?period=WEEK" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq

# Custom date range
curl -X GET "http://localhost:3005/api/v1/reporting/reports/attendance/employee/1?period=CUSTOM&start_date=2025-01-01&end_date=2025-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq
```

---

## Frontend Integration Examples

### React/TypeScript Example

```typescript
// types.ts
export enum ReportPeriod {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM',
}

export interface EmployeeAttendanceSummary {
  employee_id: number;
  employee_code: string;
  full_name: string;
  department_name?: string;
  position_name?: string;
  working_days: number;
  total_working_hours: number;
  total_overtime_hours: number;
  total_late_count: number;
  total_early_leave_count: number;
  total_leave_days: number;
  total_absent_days: number;
  manday: number;
  attendance_rate: number;
}

// api.ts
export const getEmployeesAttendanceReport = async (params: {
  period?: ReportPeriod;
  start_date?: string;
  end_date?: string;
  department_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await fetch(
    `http://localhost:3005/api/v1/reporting/reports/attendance/employees?${new URLSearchParams(params)}`,
    {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    }
  );
  return response.json();
};

// component.tsx
const AttendanceReportTable = () => {
  const [data, setData] = useState<EmployeeAttendanceSummary[]>([]);
  const [period, setPeriod] = useState(ReportPeriod.MONTH);
  
  useEffect(() => {
    getEmployeesAttendanceReport({ period }).then(res => {
      setData(res.data.data);
    });
  }, [period]);
  
  return (
    <Table>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Working Days</th>
          <th>Working Hours</th>
          <th>OT Hours</th>
          <th>Late/Early</th>
          <th>Leave</th>
          <th>Absent</th>
          <th>Manday</th>
          <th>Attendance %</th>
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.employee_id}>
            <td>{row.full_name} ({row.employee_code})</td>
            <td>{row.working_days}</td>
            <td>{row.total_working_hours}</td>
            <td>{row.total_overtime_hours}</td>
            <td>{row.total_late_count}/{row.total_early_leave_count}</td>
            <td>{row.total_leave_days}</td>
            <td>{row.total_absent_days}</td>
            <td>{row.manday}</td>
            <td>{row.attendance_rate}%</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
```

---

## Troubleshooting

### Issue: Empty data returned

**Solution:** Ensure:
1. Attendance Service has `employee_shifts` records for the period
2. Employee Service has employee records
3. Leave Service RPC handlers are registered
4. RabbitMQ is running and services are connected

### Issue: Leave days not showing

**Solution:**
1. Check Leave Service RPC handlers are implemented
2. Verify RabbitMQ queues: `RABBITMQ_LEAVE_QUEUE` configured
3. Check leave records have `status = 'APPROVED'`

### Issue: 401 Unauthorized

**Solution:**
1. Ensure JWT token is valid
2. Check user has `report.attendance.read` permission
3. Verify Reporting Service has JwtModule configured

---

## Performance Considerations

### Recommended Limits

- **Employees list:** Max 100 items per page
- **Daily records:** Max 366 days (1 year)
- **Date range:** Recommend < 1 year for individual reports

### Database Indexes

Ensure these indexes exist for optimal performance:

```sql
-- employee_shifts table
CREATE INDEX idx_employee_shifts_employee_date ON employee_shifts(employee_id, shift_date);
CREATE INDEX idx_employee_shifts_department_date ON employee_shifts(department_id, shift_date);
CREATE INDEX idx_employee_shifts_date_range ON employee_shifts(shift_date);

-- leave_records table
CREATE INDEX idx_leave_records_employee_dates ON leave_records(employee_id, start_date, end_date);
CREATE INDEX idx_leave_records_status ON leave_records(status);
```

---

## Deployment

### Environment Variables

Add to Reporting Service `.env`:

```env
# Database (connects to Employee/Attendance/Leave databases)
DATABASE_URL=postgresql://user:password@localhost:5432/employee_db

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_LEAVE_QUEUE=leave_queue
RABBITMQ_ATTENDANCE_QUEUE=attendance_queue
RABBITMQ_REPORTING_QUEUE=reporting_queue

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=1h

# Service
APP_PORT=3005
NODE_ENV=production
```

### Build & Run

```bash
# Build shared-common first
pnpm run build:shared

# Build reporting service
cd services/reporting
pnpm run build

# Start service
pnpm run start:prod
```

---

## Future Enhancements

1. **Export to Excel/PDF**
   - Add export endpoints for report download

2. **GPS Tracking Integration**
   - Add `outside_office_time` calculation from GPS data

3. **Real-time Dashboard**
   - WebSocket updates for live attendance monitoring

4. **Advanced Analytics**
   - Trend analysis, predictions, anomaly detection

5. **Custom Report Builder**
   - Allow users to create custom report templates
