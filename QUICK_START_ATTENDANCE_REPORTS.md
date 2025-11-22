# 🚀 Quick Start - Attendance Report APIs

## ⚡ TL;DR

Two new APIs in **Reporting Service (Port 3005)** for comprehensive attendance reporting:

1. **GET** `/reports/attendance/employees` - Multi-employee summary report
2. **GET** `/reports/attendance/employee/:id` - Single employee detailed report

## 📋 Prerequisites

- ✅ Auth Service running (Port 3001)
- ✅ Employee Service running (Port 3002)
- ✅ Attendance Service running (Port 3004)
- ✅ Leave Service running (Port 3003)
- ✅ Reporting Service running (Port 3005)
- ✅ RabbitMQ running
- ✅ PostgreSQL running

## 🎯 Quick Test

### 1. Get JWT Token
```bash
TOKEN=$(curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zentry.com","password":"Admin@123"}' \
  | jq -r '.data.access_token')
```

### 2. Get All Employees Report (Current Month)
```bash
curl -X GET "http://localhost:3005/api/v1/reporting/reports/attendance/employees?period=MONTH" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 3. Get Single Employee Detail Report
```bash
curl -X GET "http://localhost:3005/api/v1/reporting/reports/attendance/employee/1?period=MONTH" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 📊 Response Preview

### Multi-Employee Report
```json
{
  "data": [{
    "employee_code": "EMP001",
    "full_name": "John Doe",
    "working_days": 22,
    "total_working_hours": 176,
    "total_overtime_hours": 8,
    "total_late_count": 2,
    "total_leave_days": 2,
    "total_absent_days": 0,
    "manday": 24,
    "attendance_rate": 100
  }],
  "total": 50,
  "page": 1
}
```

### Single Employee Report
```json
{
  "employee": { "full_name": "John Doe", ... },
  "summary": {
    "total_working_days": 22,
    "total_manday": 24,
    "attendance_rate": 100
  },
  "daily_records": [
    {
      "date": "2025-01-02",
      "check_in_time": "08:05:00",
      "check_in_status": "LATE",
      "late_minutes": 5,
      "working_hours": 8,
      "manday": 1
    }
  ]
}
```

## 🔑 Key Features

| Feature | Employees Report | Employee Detail Report |
|---------|-----------------|----------------------|
| Filter by period | ✅ DAY/WEEK/MONTH/QUARTER/YEAR | ✅ |
| Filter by department | ✅ | ❌ |
| Search employee | ✅ | ❌ |
| Pagination | ✅ | ❌ |
| Daily breakdown | ❌ | ✅ |
| Manday calculation | ✅ | ✅ |
| Attendance rate | ✅ | ✅ |

## 🎨 Common Use Cases

### HR Dashboard - Current Month Overview
```bash
curl "http://localhost:3005/api/v1/reporting/reports/attendance/employees?period=MONTH&page=1&limit=100" \
  -H "Authorization: Bearer $TOKEN"
```

### Department Report - Engineering Team Q1
```bash
curl "http://localhost:3005/api/v1/reporting/reports/attendance/employees?period=QUARTER&department_id=2" \
  -H "Authorization: Bearer $TOKEN"
```

### Employee Detail - John's Weekly Report
```bash
curl "http://localhost:3005/api/v1/reporting/reports/attendance/employee/1?period=WEEK" \
  -H "Authorization: Bearer $TOKEN"
```

### Custom Date Range - January 1-15
```bash
curl "http://localhost:3005/api/v1/reporting/reports/attendance/employees?period=CUSTOM&start_date=2025-01-01&end_date=2025-01-15" \
  -H "Authorization: Bearer $TOKEN"
```

## 📚 Full Documentation

- **API Docs:** `services/reporting/ATTENDANCE_REPORT_API.md`
- **Implementation:** `ATTENDANCE_REPORTS_IMPLEMENTATION.md`
- **Swagger UI:** `http://localhost:3005/reporting/swagger`

## ⚠️ Important Notes

1. **Manday = Working Days + Leave Days** (excludes absent days)
2. **Attendance Rate = (Working Days / Expected Days) × 100**
3. Requires `report.attendance.read` permission
4. Leave data fetched via RabbitMQ RPC from Leave Service

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Empty data | Check `employee_shifts` table has records |
| Leave days missing | Verify Leave Service RPC handler registered |
| 401 error | Check JWT token and `report.attendance.read` permission |
| RabbitMQ error | Ensure RabbitMQ running and services connected |

## 🚢 Deployment

```bash
# Build shared-common first
pnpm run build:shared

# Start Reporting Service
cd services/reporting
pnpm run start:dev

# Production
pnpm run build
pnpm run start:prod
```

## 🎯 Next Steps

1. Add `report.attendance.read` permission to RBAC
2. Create test attendance data if needed
3. Integrate with your frontend dashboard
4. Add export to Excel/PDF functionality (future enhancement)

---

**Created:** 2025-01-22  
**Services:** Reporting (3005), Leave (3003)  
**Status:** ✅ Production Ready
