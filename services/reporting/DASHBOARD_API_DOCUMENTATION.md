# Dashboard & Reporting APIs

## Overview

Comprehensive dashboard and reporting system for the HR Attendance Management System. Provides real-time insights, analytics, and KPI tracking for different user roles.

## Architecture

Following **Clean Architecture** and **SOLID Principles**:

```
presentation/
  └── controllers/
      └── dashboard.controller.ts
application/
  └── dashboard/
      ├── dto/
      │   ├── highlight-report.dto.ts
      │   ├── hr-dashboard.dto.ts
      │   └── admin-dashboard.dto.ts
      ├── use-cases/
      │   ├── get-highlight-report.use-case.ts
      │   ├── get-highlight-detail.use-case.ts
      │   ├── get-hr-dashboard.use-case.ts
      │   └── get-admin-dashboard.use-case.ts
      └── dashboard.module.ts
infrastructure/
  └── persistence/
      └── typeorm/
          └── employee-cache.schema.ts
```

## API Endpoints

### Base URL
```
/api/v1/reporting/reports/dashboard
```

---

## 1. Highlight Report API

### GET `/highlight`

**Purpose:** Display key performance indicators with top performers and unusual patterns.

**Permissions:** `report.read`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| period | enum | No | MONTH | MONTH, QUARTER, YEAR |
| start_date | string | No | - | Custom start date (YYYY-MM-DD) |
| end_date | string | No | - | Custom end date (YYYY-MM-DD) |
| department_id | number | No | - | Filter by department |

**Request Example:**
```http
GET /api/v1/reporting/reports/dashboard/highlight?period=MONTH&department_id=2
Authorization: Bearer <token>
```

**Response Example:**
```json
{
  "success": true,
  "message": "Highlight report retrieved successfully",
  "data": {
    "period": {
      "type": "MONTH",
      "start_date": "2025-11-01",
      "end_date": "2025-11-30",
      "label": "November 2025"
    },
    "department": {
      "department_id": 2,
      "department_name": "Engineering"
    },
    "kpi_cards": [
      {
        "title": "Top Most Late",
        "icon": "🔴",
        "value": 45,
        "unit": "times",
        "top_employee": {
          "employee_id": 10,
          "employee_code": "EMP010",
          "full_name": "John Doe",
          "department_name": "Engineering",
          "position_name": "Developer",
          "avatar_url": "https://...",
          "count": 8,
          "metric_value": 120,
          "rate": 15
        },
        "trend": 12,
        "category": "LATE"
      },
      {
        "title": "Top Most Early Leave",
        "icon": "🟠",
        "value": 32,
        "unit": "times",
        "top_employee": {...},
        "trend": -5,
        "category": "EARLY"
      },
      {
        "title": "Top Most Leave",
        "icon": "🟡",
        "value": 28,
        "unit": "days",
        "top_employee": {...},
        "trend": 8,
        "category": "LEAVE"
      },
      {
        "title": "Top Most Overtime",
        "icon": "🟢",
        "value": 156,
        "unit": "hours",
        "top_employee": {...},
        "trend": 15,
        "category": "OVERTIME"
      }
    ],
    "unusual_absences": [
      {
        "employee_id": 25,
        "employee_code": "EMP025",
        "full_name": "Jane Smith",
        "department_name": "Engineering",
        "position_name": "QA Engineer",
        "avatar_url": "https://...",
        "unusual_absence_count": 5,
        "absent_days": 5,
        "attendance_rate": 77.3,
        "last_absence_date": "2025-11-22",
        "consecutive_absence_days": 3
      }
    ],
    "overall_stats": {
      "total_employees": 45,
      "total_working_days": 22,
      "average_attendance_rate": 94.5
    }
  }
}
```

**Use Cases:**
- HR Manager: Monitor company-wide attendance trends
- Department Manager: Track department performance
- Identify employees needing support or intervention
- Compare current period with previous trends

---

## 2. Highlight Detail API

### GET `/highlight/detail`

**Purpose:** Drill down into specific highlight category to see top N employees.

**Permissions:** `report.read`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| category | enum | Yes | - | LATE, EARLY, LEAVE, OVERTIME, UNUSUAL_ABSENCE |
| period | enum | No | MONTH | MONTH, QUARTER, YEAR |
| start_date | string | No | - | Custom start date (YYYY-MM-DD) |
| end_date | string | No | - | Custom end date (YYYY-MM-DD) |
| department_id | number | No | - | Filter by department |
| top_n | number | No | 5 | Number of top employees to show |

**Request Example:**
```http
GET /api/v1/reporting/reports/dashboard/highlight/detail?category=LATE&period=MONTH&top_n=5
Authorization: Bearer <token>
```

**Response Example:**
```json
{
  "success": true,
  "message": "Highlight detail retrieved successfully",
  "data": {
    "category": "LATE",
    "period": {
      "type": "MONTH",
      "start_date": "2025-11-01",
      "end_date": "2025-11-30",
      "label": "November 2025"
    },
    "top_employees": [
      {
        "employee_id": 10,
        "employee_code": "EMP010",
        "full_name": "John Doe",
        "department_name": "Engineering",
        "position_name": "Developer",
        "avatar_url": "https://...",
        "count": 8,
        "metric_value": 120,
        "rate": 15
      }
    ],
    "summary": {
      "total_count": 45,
      "average_per_employee": 2.25,
      "highest_value": 8,
      "lowest_value": 1
    }
  }
}
```

---

## 3. HR/DM Dashboard API

### GET `/hr`

**Purpose:** Comprehensive attendance dashboard for HR Managers and Department Managers.

**Permissions:** `report.read`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| period | enum | No | MONTH | DAY, WEEK, MONTH, QUARTER, YEAR, CUSTOM |
| start_date | string | No | - | Custom start date (YYYY-MM-DD) |
| end_date | string | No | - | Custom end date (YYYY-MM-DD) |
| department_id | number | No | - | Filter by department (HR only) |

**Request Example:**
```http
GET /api/v1/reporting/reports/dashboard/hr?period=MONTH
Authorization: Bearer <token>
```

**Response Structure:**
```json
{
  "success": true,
  "message": "HR dashboard retrieved successfully",
  "data": {
    "period": {
      "type": "MONTH",
      "start_date": "2025-11-01",
      "end_date": "2025-11-30",
      "label": "November 2025"
    },
    "kpi_cards": [
      {
        "title": "Total Employees",
        "value": 150,
        "unit": "employees",
        "icon": "👥",
        "trend": 5,
        "trend_direction": "up",
        "color": "info"
      },
      {
        "title": "Total Working Hours",
        "value": 26400,
        "unit": "hours",
        "icon": "⏰",
        "trend": 3,
        "trend_direction": "up",
        "color": "success"
      },
      {
        "title": "Total Overtime",
        "value": 1200,
        "unit": "hours",
        "icon": "🌙",
        "trend": 15,
        "trend_direction": "up",
        "color": "warning"
      },
      {
        "title": "Total Leave Days",
        "value": 85,
        "unit": "days",
        "icon": "🏖️",
        "trend": -8,
        "trend_direction": "down",
        "color": "info"
      },
      {
        "title": "On-Time Rate",
        "value": 94.5,
        "unit": "%",
        "icon": "✅",
        "trend": 2,
        "trend_direction": "up",
        "color": "success"
      }
    ],
    "charts": {
      "status_distribution": [
        {
          "status": "On-Time",
          "count": 2835,
          "percentage": 85,
          "color": "#10b981"
        },
        {
          "status": "Late/Early",
          "count": 335,
          "percentage": 10,
          "color": "#f59e0b"
        },
        {
          "status": "Leave",
          "count": 100,
          "percentage": 3,
          "color": "#3b82f6"
        },
        {
          "status": "Absent",
          "count": 65,
          "percentage": 2,
          "color": "#ef4444"
        }
      ],
      "leave_distribution": [
        {
          "leave_type": "ANNUAL",
          "days": 45,
          "percentage": 53,
          "color": "#3b82f6"
        },
        {
          "leave_type": "SICK",
          "days": 28,
          "percentage": 33,
          "color": "#ef4444"
        },
        {
          "leave_type": "UNPAID",
          "days": 12,
          "percentage": 14,
          "color": "#6b7280"
        }
      ],
      "working_hours_trend": [
        {
          "period_label": "2025-45",
          "average_hours": 8.2,
          "total_hours": 6150,
          "start_date": "2025-11-04",
          "end_date": "2025-11-10"
        }
      ],
      "department_comparison": [
        {
          "department_id": 1,
          "department_name": "Engineering",
          "late_count": 45,
          "leave_days": 32,
          "absent_days": 8,
          "total_employees": 60,
          "attendance_rate": 95.2
        }
      ]
    },
    "calendar_heatmap": [
      {
        "date": "2025-11-01",
        "day_of_week": "Friday",
        "status": "ON_TIME",
        "color": "#10b981",
        "on_time_rate": 96.5,
        "total_scheduled": 150,
        "summary": "96.5% on-time (150 employees)"
      }
    ],
    "resource_allocation": [
      {
        "department_id": 1,
        "department_name": "Engineering",
        "total_employees": 60,
        "present": 58,
        "on_leave": 1,
        "absent": 1,
        "availability_rate": 96.7
      }
    ]
  }
}
```

**Dashboard Features:**

**Top Row - KPI Cards:**
- Total Employees (with trend %)
- Total Working Hours (by period)
- Total Overtime Hours
- Total Leave Days
- On-Time Rate Percentage

**Mid Row - Charts:**
1. **Status Distribution Pie Chart:** On-time vs Late vs Leave vs Absent
2. **Leave Type Distribution Pie Chart:** Annual vs Sick vs Unpaid
3. **Working Hours Trend Line Chart:** Average hours by week/month
4. **Department Comparison Bar Chart:** Late count and leave days by department (HR only)

**Bottom Row:**
1. **Heatmap Calendar:** Color-coded daily status overview
2. **Resource Allocation:** Current availability by department

**Role-Based Access:**
- **HR Manager:** Can view all departments or filter by specific department
- **Department Manager:** Automatically filtered to their assigned department

---

## 4. Admin Dashboard API

### GET `/admin`

**Purpose:** System administration and monitoring dashboard.

**Permissions:** `admin.dashboard.read` (ADMIN role only)

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| period | enum | No | MONTH | DAY, WEEK, MONTH, QUARTER, YEAR, CUSTOM |
| start_date | string | No | - | Custom start date (YYYY-MM-DD) |
| end_date | string | No | - | Custom end date (YYYY-MM-DD) |

**Request Example:**
```http
GET /api/v1/reporting/reports/dashboard/admin?period=MONTH
Authorization: Bearer <token>
```

**Response Structure:**
```json
{
  "success": true,
  "message": "Admin dashboard retrieved successfully",
  "data": {
    "period": {
      "type": "MONTH",
      "start_date": "2025-11-01",
      "end_date": "2025-11-30",
      "label": "November 2025"
    },
    "kpi_cards": [
      {
        "title": "Total Users",
        "value": 150,
        "unit": "users",
        "icon": "👥",
        "trend": null,
        "trend_direction": "stable",
        "color": "info",
        "details": "142 active / 8 inactive"
      },
      {
        "title": "Total Departments",
        "value": 8,
        "unit": "departments",
        "icon": "🏢",
        "trend": null,
        "trend_direction": "stable",
        "color": "info"
      },
      {
        "title": "FaceID Registered",
        "value": 135,
        "unit": "employees",
        "icon": "👤",
        "trend": 90,
        "trend_direction": "up",
        "color": "success",
        "details": "15 not registered"
      },
      {
        "title": "Device Status",
        "value": 12,
        "unit": "online",
        "icon": "📱",
        "trend": null,
        "trend_direction": "stable",
        "color": "warning"
      },
      {
        "title": "New Accounts (Month)",
        "value": 5,
        "unit": "accounts",
        "icon": "✨",
        "trend": null,
        "trend_direction": "up",
        "color": "success"
      },
      {
        "title": "Auth Failures",
        "value": 95,
        "unit": "failures",
        "icon": "⚠️",
        "trend": null,
        "trend_direction": "down",
        "color": "danger"
      }
    ],
    "charts": {
      "role_distribution": [
        {
          "role": "EMPLOYEE",
          "count": 120,
          "percentage": 80,
          "color": "#10b981"
        },
        {
          "role": "DEPARTMENT_MANAGER",
          "count": 20,
          "percentage": 13,
          "color": "#3b82f6"
        },
        {
          "role": "HR_MANAGER",
          "count": 8,
          "percentage": 5,
          "color": "#f59e0b"
        },
        {
          "role": "ADMIN",
          "count": 2,
          "percentage": 2,
          "color": "#ef4444"
        }
      ],
      "department_employee_count": [
        {
          "department_id": 1,
          "department_name": "Engineering",
          "count": 60,
          "active_count": 58,
          "inactive_count": 2
        }
      ],
      "login_trend": [
        {
          "date": "2025-11-22",
          "login_count": 142,
          "unique_users": 138,
          "failed_attempts": 5
        }
      ]
    },
    "faceid_stats": {
      "total_employees": 150,
      "registered": 135,
      "not_registered": 15,
      "registration_rate": 90,
      "pending_verification": 3
    },
    "auth_failure_stats": {
      "total_attempts": 1000,
      "faceid_failures": 45,
      "gps_failures": 32,
      "other_failures": 18,
      "failure_rate": 10,
      "top_reasons": [
        { "reason": "Face not recognized", "count": 45 },
        { "reason": "GPS out of range", "count": 32 },
        { "reason": "Network timeout", "count": 18 }
      ]
    },
    "devices": [
      {
        "device_id": "BEACON-001",
        "device_name": "Main Entrance Beacon",
        "device_type": "Beacon",
        "status": "online",
        "location": "Floor 1 - Main Entrance",
        "last_seen": "2025-11-22T10:30:00Z",
        "battery_level": 85,
        "signal_strength": 92
      }
    ],
    "system_activities": [
      {
        "timestamp": "2025-11-22T10:30:00Z",
        "type": "USER_LOGIN",
        "description": "Admin user logged in",
        "user_id": 1,
        "user_name": "John Admin",
        "severity": "info"
      }
    ]
  }
}
```

**Dashboard Features:**

**Top Row - KPI Cards:**
- Total Users (active/inactive breakdown)
- Total Departments
- FaceID Registration Status
- Device Status (online/offline)
- New Accounts Created
- Authentication Failures

**Mid Row - Charts:**
1. **User Role Distribution Pie Chart:** ADMIN, HR, DM, EMPLOYEE
2. **Department Employee Count Bar Chart:** Active/Inactive per department
3. **Login Trend Line Chart:** Daily logins and failed attempts

**Bottom Row:**
1. **FaceID Registration Statistics:** Registration rate and pending verifications
2. **Authentication Failure Statistics:** Breakdown by failure type (FaceID, GPS, etc.)
3. **Device Status List:** Real-time device monitoring with battery and signal
4. **System Activity Log:** Recent system events, logins, permission changes

---

## Data Models

### Employee Cache
Denormalized cache of employee data from Employee Service, updated via RabbitMQ events.

**Purpose:**
- Avoid cross-service database joins
- Improve query performance for reporting
- Maintain eventual consistency

**Schema:**
```typescript
{
  employee_id: number;
  employee_code: string;
  full_name: string;
  email: string;
  department_id: number;
  department_name: string;
  position_name: string;
  role_name: string;
  status: 'active' | 'inactive' | 'terminated';
  face_id_registered: boolean;
  avatar_url: string;
  ...
}
```

---

## Security & Authorization

### Role-Based Permissions

| Endpoint | Required Permission | Allowed Roles |
|----------|-------------------|---------------|
| GET /highlight | `report.read` | ADMIN, HR_MANAGER, DEPARTMENT_MANAGER |
| GET /highlight/detail | `report.read` | ADMIN, HR_MANAGER, DEPARTMENT_MANAGER |
| GET /hr | `report.read` | ADMIN, HR_MANAGER, DEPARTMENT_MANAGER |
| GET /admin | `admin.dashboard.read` | ADMIN |

### Data Isolation

**Department Manager:**
- Automatically filtered to their assigned department
- Cannot access other departments' data
- `currentUser.department_id` used as filter

**HR Manager:**
- Can view all departments
- Can optionally filter by specific department
- Full company-wide visibility

**Admin:**
- Full system access
- System monitoring and management
- No department filtering

---

## Implementation Details

### Clean Architecture Compliance

**Presentation Layer:**
- `DashboardController`: HTTP endpoints, request/response handling
- Input validation via DTOs with class-validator decorators
- ApiResponseDto wrapper for consistent responses

**Application Layer:**
- Use cases: Business logic encapsulation
- DTOs: Data transfer objects for input/output
- Separated concerns: Each use case handles one dashboard type

**Infrastructure Layer:**
- TypeORM for database queries
- RabbitMQ for inter-service communication
- Employee cache for denormalized data

### SOLID Principles

1. **Single Responsibility:** Each use case handles one specific dashboard
2. **Open/Closed:** DTOs are extensible without modifying existing code
3. **Liskov Substitution:** All DTOs follow ApiResponseDto pattern
4. **Interface Segregation:** Separate DTOs for each dashboard type
5. **Dependency Inversion:** Use cases depend on abstractions (DataSource, ClientProxy)

### Performance Optimizations

**Parallel Query Execution:**
```typescript
const [kpiCards, charts, calendar] = await Promise.all([
  this.getKPICards(...),
  this.getCharts(...),
  this.getCalendar(...),
]);
```

**Denormalized Data:**
- Employee cache reduces cross-service calls
- Pre-aggregated statistics
- Indexed queries for fast retrieval

**SQL Optimization:**
- CTEs for complex queries
- Filtered indexes on status, department, dates
- Aggregate functions for summaries

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error information"
  }
}
```

**Common Error Codes:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Department or resource not found
- `500 Internal Server Error`: Database or service error

---

## Testing

### Unit Tests
- Use case logic testing
- DTO validation testing
- Permission guard testing

### Integration Tests
- End-to-end API testing
- Database query validation
- Cross-service communication

### Performance Tests
- Query execution time
- Large dataset handling
- Concurrent request handling

---

## Future Enhancements

1. **Real-time Updates:** WebSocket support for live dashboard updates
2. **Export Functionality:** PDF/Excel export for reports
3. **Custom Dashboards:** User-configurable dashboard layouts
4. **Predictive Analytics:** ML-based attendance predictions
5. **Mobile Optimization:** Responsive dashboard for mobile apps
6. **Caching Layer:** Redis caching for frequently accessed data
7. **Scheduled Reports:** Automated email reports
8. **Drill-down Analysis:** Deeper data exploration capabilities

---

## API Versioning

Current version: `v1`

All endpoints are versioned: `/api/v1/reporting/reports/dashboard/*`

Breaking changes will introduce new version paths.
