# Attendance Service - Complete API Documentation

**Service:** Attendance Service  
**Base URL:** `http://localhost:3004/api/v1`  
**Port:** 3004  
**Database:** `attendance_db` (PostgreSQL)  
**Last Updated:** November 22, 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [Attendance Check APIs](#1-attendance-check-apis-mobile-app)
3. [Employee Shifts APIs](#2-employee-shifts-apis)
4. [Work Schedules APIs](#3-work-schedules-apis)
5. [Overtime Requests APIs](#4-overtime-requests-apis)
6. [Violations APIs](#5-violations-apis)
7. [Reports & Analytics APIs](#6-reports--analytics-apis)
8. [Beacons APIs](#7-beacons-apis)
9. [Presence Verification APIs](#8-presence-verification-apis)
10. [Attendance Edit Logs APIs](#9-attendance-edit-logs-apis)
11. [GPS Validation APIs](#10-gps-validation-apis)
12. [Database Schemas](#database-schemas)
13. [Enums & Types](#enums--types)

---

## Authentication

All endpoints (except marked as `Public`) require JWT authentication via:
- **Header:** `Authorization: Bearer <JWT_TOKEN>`
- **OR** Custom headers: `x-user-id`, `x-employee-id`, `x-role`

**Permissions Required:**
- `attendance.checkin` - Mobile check-in/out
- `attendance.read` - View all attendance data (HR/Manager)
- `attendance.read_own` - View own attendance data
- `overtime.*` - Overtime request permissions
- `report.read` - View reports

---

## 1. Attendance Check APIs (Mobile App)

### 1.1 Validate Beacon Proximity

**Endpoint:** `POST /attendance-check/validate-beacon`  
**Permission:** `attendance.checkin`  
**Description:** Step 1 of check-in/out - Validate employee proximity to beacon device

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "beacon_uuid": "FDA50693-A4E2-4FB1-AFCF-C6EB07647825",
  "beacon_major": 1,
  "beacon_minor": 100,
  "rssi": -65
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `beacon_uuid` | string | ✅ | Beacon UUID (iBeacon format) |
| `beacon_major` | number | ✅ | Beacon major number (0-65535) |
| `beacon_minor` | number | ✅ | Beacon minor number (0-65535) |
| `rssi` | number | ✅ | Signal strength in dBm (e.g., -65) |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Beacon validated successfully",
  "data": {
    "session_token": "beacon_sess_123_5_1732252800000",
    "beacon_name": "Main Entrance Beacon",
    "location_name": "Building A - Floor 1",
    "expires_at": "2025-11-22T15:05:00Z",
    "next_step": "request_face_verification"
  }
}
```

**Error Responses:**

**401 Unauthorized - Invalid JWT:**
```json
{
  "success": false,
  "message": "Employee ID not found in JWT token"
}
```

**404 Not Found - Beacon Not Found:**
```json
{
  "success": false,
  "message": "Beacon not found or inactive",
  "data": {
    "beacon_uuid": "FDA50693-A4E2-4FB1-AFCF-C6EB07647825",
    "major": 1,
    "minor": 100
  }
}
```

**400 Bad Request - Signal Too Weak:**
```json
{
  "success": false,
  "message": "Signal strength too weak for validation",
  "data": {
    "rssi": -85,
    "threshold": -70,
    "distance_meters": 45
  }
}
```

---

### 1.2 Request Face Verification

**Endpoint:** `POST /attendance-check/request-face-verification`  
**Permission:** `attendance.checkin`  
**Description:** Step 2 of check-in/out - Request face recognition after successful beacon validation

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "session_token": "beacon_sess_123_5_1732252800000",
  "check_type": "check_in",
  "shift_date": "2025-11-22",
  "latitude": 10.762622,
  "longitude": 106.660172,
  "location_accuracy": 15,
  "device_id": "android-device-abc123",
  "ip_address": "192.168.1.100"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_token` | string | ✅ | Token from beacon validation |
| `check_type` | enum | ✅ | `check_in` or `check_out` |
| `shift_date` | date | ✅ | Shift date (YYYY-MM-DD) |
| `latitude` | number | ❌ | GPS latitude (recommended) |
| `longitude` | number | ❌ | GPS longitude (recommended) |
| `location_accuracy` | number | ❌ | GPS accuracy in meters |
| `device_id` | string | ❌ | Device identifier |
| `ip_address` | string | ❌ | Client IP (auto-detected if omitted) |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Face verification request sent successfully",
  "data": {
    "request_id": "face_req_456",
    "employee_id": 123,
    "check_type": "check_in",
    "status": "PENDING",
    "message": "Please look at the camera",
    "timeout_seconds": 30
  }
}
```

**Error Responses:**

**400 Bad Request - Invalid Session:**
```json
{
  "success": false,
  "message": "Invalid or expired session token"
}
```

**400 Bad Request - Already Checked In:**
```json
{
  "success": false,
  "message": "Already checked in for this shift",
  "data": {
    "check_in_time": "2025-11-22T08:05:00Z",
    "shift_id": 789
  }
}
```

**400 Bad Request - GPS Outside Geofence:**
```json
{
  "success": false,
  "message": "Location is outside allowed area",
  "data": {
    "distance_meters": 250,
    "threshold_meters": 100
  }
}
```

---

## 2. Employee Shifts APIs

### 2.1 Get My Shifts

**Endpoint:** `GET /employee-shifts/my`  
**Description:** Get current employee's shifts within date range

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from_date` | date | ✅ | Start date (YYYY-MM-DD) |
| `to_date` | date | ✅ | End date (YYYY-MM-DD) |
| `status` | enum | ❌ | Filter by status (see [ShiftStatus](#shiftstatus)) |
| `limit` | number | ❌ | Records per page (default: 20) |
| `offset` | number | ❌ | Pagination offset (default: 0) |

**Example Request:**
```
GET /employee-shifts/my?from_date=2025-11-01&to_date=2025-11-30&status=COMPLETED&limit=10&offset=0
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Shifts retrieved successfully",
  "data": {
    "data": [
      {
        "id": 789,
        "employee_id": 123,
        "employee_code": "EMP007",
        "department_id": 5,
        "shift_date": "2025-11-22",
        "work_schedule_id": 1,
        "scheduled_start_time": "08:00:00",
        "scheduled_end_time": "17:00:00",
        "check_in_time": "2025-11-22T08:05:00Z",
        "check_out_time": "2025-11-22T17:10:00Z",
        "work_hours": 8.0,
        "overtime_hours": 0.17,
        "break_hours": 1.0,
        "late_minutes": 5,
        "early_leave_minutes": 0,
        "status": "COMPLETED",
        "notes": null
      }
    ],
    "total": 22
  },
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 22
  }
}
```

---

### 2.2 Get All Shifts (HR/Manager)

**Endpoint:** `GET /employee-shifts`  
**Description:** Get shifts with filters (HR/Manager access)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from_date` | date | ✅ | Start date (YYYY-MM-DD) |
| `to_date` | date | ✅ | End date (YYYY-MM-DD) |
| `employee_id` | number | ❌ | Filter by employee |
| `department_id` | number | ❌ | Filter by department |
| `status` | enum | ❌ | Filter by status |
| `limit` | number | ❌ | Records per page (default: 20) |
| `offset` | number | ❌ | Pagination offset (default: 0) |

**Example Request:**
```
GET /employee-shifts?from_date=2025-11-01&to_date=2025-11-30&department_id=5&status=ABSENT&limit=50
```

**Success Response:** (Same structure as 2.1)

---

### 2.3 Get Department Shifts

**Endpoint:** `GET /employee-shifts/department/:departmentId`  
**Description:** Get shifts for a specific department

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `departmentId` | number | Department ID |

**Query Parameters:** (Same as 2.2, except `department_id` is ignored)

**Example Request:**
```
GET /employee-shifts/department/5?from_date=2025-11-01&to_date=2025-11-30
```

---

### 2.4 Get Shift By ID

**Endpoint:** `GET /employee-shifts/:id`  
**Description:** Get detailed information for a specific shift

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Shift ID |

**Example Request:**
```
GET /employee-shifts/789
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Shift retrieved successfully",
  "data": {
    "id": 789,
    "employee_id": 123,
    "employee_code": "EMP007",
    "department_id": 5,
    "shift_date": "2025-11-22",
    "work_schedule_id": 1,
    "scheduled_start_time": "08:00:00",
    "scheduled_end_time": "17:00:00",
    "check_in_time": "2025-11-22T08:05:00Z",
    "check_out_time": "2025-11-22T17:10:00Z",
    "work_hours": 8.0,
    "overtime_hours": 0.17,
    "break_hours": 1.0,
    "late_minutes": 5,
    "early_leave_minutes": 0,
    "status": "COMPLETED",
    "notes": null
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Shift not found"
}
```

---

### 2.5 Manual Edit Shift (HR/Admin)

**Endpoint:** `PATCH /employee-shifts/:id/manual-edit`  
**Description:** Manually edit a shift and create audit log (HR/Admin only)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Shift ID |

**Request Body:**
```json
{
  "check_in_time": "2025-11-22T08:00:00Z",
  "check_out_time": "2025-11-22T17:00:00Z",
  "status": "COMPLETED",
  "notes": "Corrected time based on CCTV footage",
  "edit_reason": "Employee forgot to check-in, HR corrected based on evidence"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `check_in_time` | datetime | ❌ | New check-in time (ISO 8601) |
| `check_out_time` | datetime | ❌ | New check-out time (ISO 8601) |
| `status` | enum | ❌ | New status (see [ShiftStatus](#shiftstatus)) |
| `notes` | string | ❌ | Additional notes |
| `edit_reason` | string | ✅ | Reason for manual edit (audit trail) |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Shift updated successfully",
  "data": {
    "id": 789,
    "employee_id": 123,
    "check_in_time": "2025-11-22T08:00:00Z",
    "check_out_time": "2025-11-22T17:00:00Z",
    "status": "COMPLETED",
    "edited_by": 456,
    "edited_at": "2025-11-22T14:30:00Z"
  }
}
```

---

## 3. Work Schedules APIs

### 3.1 Create Work Schedule

**Endpoint:** `POST /work-schedules`  
**Description:** Create a new work schedule template

**Request Body:**
```json
{
  "schedule_name": "Standard Office Hours",
  "schedule_type": "FIXED",
  "work_days": "1,2,3,4,5",
  "start_time": "08:00:00",
  "end_time": "17:00:00",
  "break_duration_minutes": 60,
  "late_tolerance_minutes": 15,
  "early_leave_tolerance_minutes": 15
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schedule_name` | string | ✅ | Name of schedule |
| `schedule_type` | enum | ✅ | `FIXED`, `FLEXIBLE`, `SHIFT` |
| `work_days` | string | ❌ | Comma-separated days (1=Mon, 7=Sun) |
| `start_time` | time | ❌ | Start time (HH:mm:ss) |
| `end_time` | time | ❌ | End time (HH:mm:ss) |
| `break_duration_minutes` | number | ❌ | Break duration (default: 60) |
| `late_tolerance_minutes` | number | ❌ | Late tolerance (default: 15) |
| `early_leave_tolerance_minutes` | number | ❌ | Early leave tolerance (default: 15) |

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Schedule created successfully",
  "data": {
    "id": 10,
    "schedule_name": "Standard Office Hours",
    "schedule_type": "FIXED",
    "work_days": "1,2,3,4,5",
    "start_time": "08:00:00",
    "end_time": "17:00:00",
    "break_duration_minutes": 60,
    "late_tolerance_minutes": 15,
    "early_leave_tolerance_minutes": 15,
    "status": "ACTIVE"
  }
}
```

---

### 3.2 Get All Work Schedules

**Endpoint:** `GET /work-schedules`  
**Description:** Get all work schedules with pagination and filters

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | enum | ❌ | `ACTIVE`, `INACTIVE` |
| `schedule_type` | enum | ❌ | `FIXED`, `FLEXIBLE`, `SHIFT` |
| `limit` | number | ❌ | Records per page (1-100, default: 20) |
| `offset` | number | ❌ | Pagination offset (default: 0) |

**Example Request:**
```
GET /work-schedules?status=ACTIVE&limit=10&offset=0
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Schedules retrieved successfully",
  "data": {
    "data": [
      {
        "id": 10,
        "schedule_name": "Standard Office Hours",
        "schedule_type": "FIXED",
        "work_days": "1,2,3,4,5",
        "start_time": "08:00:00",
        "end_time": "17:00:00",
        "break_duration_minutes": 60,
        "late_tolerance_minutes": 15,
        "early_leave_tolerance_minutes": 15,
        "status": "ACTIVE"
      }
    ],
    "total": 5
  }
}
```

---

### 3.3 Get Work Schedule By ID

**Endpoint:** `GET /work-schedules/:id`  

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Schedule ID |

**Example Request:**
```
GET /work-schedules/10
```

**Success Response:** (Same structure as individual schedule in 3.2)

---

### 3.4 Update Work Schedule

**Endpoint:** `PUT /work-schedules/:id`  

**Request Body:** (Same as 3.1, all fields optional)
```json
{
  "schedule_name": "Updated Office Hours",
  "start_time": "09:00:00",
  "end_time": "18:00:00",
  "status": "ACTIVE"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Schedule updated successfully",
  "data": { /* Updated schedule object */ }
}
```

---

### 3.5 Deactivate Work Schedule

**Endpoint:** `DELETE /work-schedules/:id`  
**Description:** Soft delete - sets status to INACTIVE

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Schedule deactivated successfully"
}
```

---

### 3.6 Assign Schedule to Employees

**Endpoint:** `POST /work-schedules/:id/assign`  
**Description:** Assign a work schedule to multiple employees

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Schedule ID to assign |

**Request Body:**
```json
{
  "employee_ids": [101, 102, 103],
  "effective_from": "2025-12-01",
  "effective_to": "2026-11-30"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `employee_ids` | number[] | ✅ | Array of employee IDs |
| `effective_from` | date | ✅ | Start date (YYYY-MM-DD) |
| `effective_to` | date | ❌ | End date (optional) |

**Success Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Work schedule assigned to employees successfully.",
  "errorCode": "SUCCESS",
  "timestamp": "2025-11-22T08:44:12.320Z",
  "path": ""
}
```

---

## 4. Overtime Requests APIs

### 4.1 Create Overtime Request

**Endpoint:** `POST /overtime-requests`  
**Permission:** `overtime.create`  
**Description:** Employee creates overtime request

**Request Body:**
```json
{
  "shift_id": 789,
  "overtime_date": "2025-11-25",
  "start_time": "2025-11-25T18:00:00Z",
  "end_time": "2025-11-25T21:00:00Z",
  "estimated_hours": 3.0,
  "reason": "Urgent project deadline - must complete feature by Monday"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shift_id` | number | ❌ | Related shift ID (optional) |
| `overtime_date` | date | ✅ | Overtime date (YYYY-MM-DD) |
| `start_time` | datetime | ✅ | Start time (ISO 8601) |
| `end_time` | datetime | ✅ | End time (ISO 8601) |
| `estimated_hours` | number | ✅ | Estimated overtime hours |
| `reason` | string | ✅ | Justification for overtime |

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Overtime request created successfully",
  "data": {
    "id": 50,
    "employee_id": 123,
    "overtime_date": "2025-11-25",
    "start_time": "2025-11-25T18:00:00Z",
    "end_time": "2025-11-25T21:00:00Z",
    "estimated_hours": 3.0,
    "actual_hours": null,
    "status": "PENDING",
    "reason": "Urgent project deadline - must complete feature by Monday",
    "created_at": "2025-11-22T14:30:00Z"
  }
}
```

---

### 4.2 Get My Overtime Requests

**Endpoint:** `GET /overtime-requests/my-requests`  
**Permission:** `overtime.read_own`  
**Description:** Get current employee's overtime requests

**Query Parameters:**
| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `limit` | number | ❌ | 20 |
| `offset` | number | ❌ | 0 |

**Example Request:**
```
GET /overtime-requests/my-requests?limit=10&offset=0
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Overtime requests retrieved successfully",
  "data": {
    "data": [
      {
        "id": 50,
        "employee_id": 123,
        "overtime_date": "2025-11-25",
        "start_time": "2025-11-25T18:00:00Z",
        "end_time": "2025-11-25T21:00:00Z",
        "estimated_hours": 3.0,
        "status": "PENDING",
        "reason": "Urgent project deadline"
      }
    ],
    "total": 5
  },
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 5
  }
}
```

---

### 4.3 Get All Overtime Requests (HR/Manager)

**Endpoint:** `GET /overtime-requests`  
**Permission:** `overtime.read`  

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | enum | ❌ | `PENDING`, `APPROVED`, `REJECTED` |
| `limit` | number | ❌ | Default: 50 |
| `offset` | number | ❌ | Default: 0 |

**Example Request:**
```
GET /overtime-requests?status=PENDING&limit=20
```

---

### 4.4 Get Pending Overtime Requests

**Endpoint:** `GET /overtime-requests/pending`  
**Permission:** `overtime.read`  
**Description:** Get only pending requests (shortcut for status=PENDING)

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| `limit` | number | 50 |
| `offset` | number | 0 |

---

### 4.5 Get Overtime Request By ID

**Endpoint:** `GET /overtime-requests/:id`  
**Permission:** `overtime.read_detail`  

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Request ID |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Overtime request retrieved successfully",
  "data": {
    "id": 50,
    "employee_id": 123,
    "employee_code": "EMP007",
    "overtime_date": "2025-11-25",
    "start_time": "2025-11-25T18:00:00Z",
    "end_time": "2025-11-25T21:00:00Z",
    "estimated_hours": 3.0,
    "actual_hours": null,
    "status": "PENDING",
    "reason": "Urgent project deadline",
    "approved_by": null,
    "approved_at": null,
    "rejection_reason": null,
    "created_at": "2025-11-22T14:30:00Z"
  }
}
```

---

### 4.6 Update Overtime Request

**Endpoint:** `PUT /overtime-requests/:id`  
**Permission:** `overtime.update`  
**Description:** Update request (only before approval)

**Request Body:**
```json
{
  "start_time": "2025-11-25T18:30:00Z",
  "end_time": "2025-11-25T21:30:00Z",
  "estimated_hours": 3.5,
  "reason": "Extended due to additional tasks"
}
```

**Request Fields:** (All optional)
| Field | Type | Description |
|-------|------|-------------|
| `start_time` | datetime | New start time |
| `end_time` | datetime | New end time |
| `estimated_hours` | number | Updated estimate |
| `reason` | string | Updated reason |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Overtime request updated successfully"
}
```

**Error Response (400 Bad Request - Already Approved):**
```json
{
  "success": false,
  "message": "Cannot update approved or rejected request"
}
```

---

### 4.7 Approve Overtime Request

**Endpoint:** `POST /overtime-requests/:id/approve`  
**Permission:** `overtime.approve`  
**Description:** HR/Manager approves overtime request

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Overtime request approved successfully",
  "data": {
    "id": 50,
    "status": "APPROVED",
    "approved_by": 456,
    "approved_at": "2025-11-22T15:00:00Z"
  }
}
```

---

### 4.8 Reject Overtime Request

**Endpoint:** `POST /overtime-requests/:id/reject`  
**Permission:** `overtime.reject`  

**Request Body:**
```json
{
  "rejection_reason": "Not aligned with company policy"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rejection_reason` | string | ❌ | Reason for rejection |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Overtime request rejected successfully",
  "data": {
    "id": 50,
    "status": "REJECTED",
    "approved_by": 456,
    "approved_at": "2025-11-22T15:00:00Z",
    "rejection_reason": "Not aligned with company policy"
  }
}
```

---

### 4.9 Cancel Overtime Request

**Endpoint:** `POST /overtime-requests/:id/cancel`  
**Permission:** `overtime.cancel`  
**Description:** Employee cancels their own request

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Overtime request cancelled successfully"
}
```

---

## 5. Violations APIs

### 5.1 Get My Violations

**Endpoint:** `GET /violations/my-violations`  
**Permission:** `attendance.read_own`  
**Description:** Get current employee's violations

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| `limit` | number | 20 |
| `offset` | number | 0 |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Your violations retrieved successfully",
  "data": [
    {
      "id": 100,
      "employee_id": 123,
      "shift_id": 789,
      "violation_type": "LATE",
      "severity": "LOW",
      "description": "Late arrival by 5 minutes",
      "minutes": 5,
      "detected_at": "2025-11-22T08:05:00Z",
      "resolved": false,
      "resolved_by": null,
      "resolved_at": null,
      "resolution_notes": null
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 3
  }
}
```

---

### 5.2 Get All Violations (HR/Manager)

**Endpoint:** `GET /violations`  
**Permission:** `attendance.read`  

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employee_id` | number | ❌ | Filter by employee |
| `violation_type` | enum | ❌ | See [ViolationType](#violationtype) |
| `severity` | enum | ❌ | See [ViolationSeverity](#violationseverity) |
| `resolved` | boolean | ❌ | Filter by resolution status |
| `unresolved_only` | boolean | ❌ | Show only unresolved |
| `limit` | number | ❌ | Default: 50 |
| `offset` | number | ❌ | Default: 0 |

**Example Request:**
```
GET /violations?employee_id=123&unresolved_only=true&limit=10
```

---

### 5.3 Get Violation Statistics

**Endpoint:** `GET /violations/statistics`  
**Description:** Get violation statistics (overall or per employee)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employee_id` | number | ❌ | Stats for specific employee |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Violation statistics retrieved successfully",
  "data": {
    "total_violations": 45,
    "by_type": {
      "LATE": 20,
      "EARLY_LEAVE": 10,
      "ABSENT": 5,
      "GPS_FRAUD": 2,
      "MISSING_CHECK_IN": 5,
      "MISSING_CHECK_OUT": 3
    },
    "by_severity": {
      "LOW": 25,
      "MEDIUM": 15,
      "HIGH": 4,
      "CRITICAL": 1
    },
    "resolved_count": 30,
    "unresolved_count": 15
  }
}
```

---

### 5.4 Get Top Violators

**Endpoint:** `GET /violations/top-violators`  
**Description:** Get employees with most violations

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of top violators |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Top violators retrieved successfully",
  "data": [
    {
      "employee_id": 150,
      "employee_code": "EMP025",
      "full_name": "John Doe",
      "violation_count": 12,
      "unresolved_count": 5,
      "most_common_type": "LATE"
    }
  ]
}
```

---

### 5.5 Get Employee Violations

**Endpoint:** `GET /violations/employee/:employeeId`  

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `employeeId` | number | Employee ID |

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| `limit` | number | 50 |
| `offset` | number | 0 |

---

### 5.6 Get Violation By ID

**Endpoint:** `GET /violations/:id`  

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Violation ID |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Violation retrieved successfully",
  "data": {
    "id": 100,
    "employee_id": 123,
    "employee_code": "EMP007",
    "shift_id": 789,
    "violation_type": "LATE",
    "severity": "LOW",
    "description": "Late arrival by 5 minutes",
    "minutes": 5,
    "detected_at": "2025-11-22T08:05:00Z",
    "resolved": false
  }
}
```

---

### 5.7 Resolve Violation

**Endpoint:** `POST /violations/:id/resolve`  
**Description:** HR/Manager resolves violation

**Request Body:**
```json
{
  "resolution_notes": "Approved due to medical emergency with evidence"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resolution_notes` | string | ✅ | Reason for resolution |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Violation resolved successfully",
  "data": {
    "id": 100,
    "resolved": true,
    "resolved_by": 456,
    "resolved_at": "2025-11-22T15:30:00Z",
    "resolution_notes": "Approved due to medical emergency with evidence"
  }
}
```

---

## 6. Reports & Analytics APIs

### 6.1 Get Daily Report

**Endpoint:** `GET /reports/daily`  
**Permission:** `report.read`  
**Description:** Get daily attendance summary

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | date | ❌ | Report date (default: today) |
| `department_id` | number | ❌ | Filter by department |

**Example Request:**
```
GET /reports/daily?date=2025-11-22&department_id=5
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Daily report retrieved successfully",
  "data": {
    "shift_date": "2025-11-22",
    "total_employees": 50,
    "attended": 48,
    "absent": 2,
    "on_leave": 3,
    "late_arrivals": 5,
    "early_leaves": 2,
    "total_work_hours": 384.0,
    "total_overtime_hours": 12.5,
    "avg_work_hours": 8.0
  }
}
```

---

### 6.2 Get Daily Report By Date

**Endpoint:** `GET /reports/daily/:date`  
**Permission:** `report.read`  

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | date | Report date (YYYY-MM-DD) |

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `department_id` | number | ❌ |

**Example Request:**
```
GET /reports/daily/2025-11-22?department_id=5
```

---

### 6.3 Get Monthly Report

**Endpoint:** `GET /reports/monthly/:year/:month`  

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | number | Year (e.g., 2025) |
| `month` | number | Month (1-12) |

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `department_id` | number | ❌ |

**Example Request:**
```
GET /reports/monthly/2025/11?department_id=5
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Monthly report retrieved successfully",
  "data": {
    "month": "2025-11",
    "total_employees": 50,
    "attended_days": 1050,
    "absent_days": 25,
    "leave_days": 60,
    "total_work_hours": 8400.0,
    "total_overtime_hours": 250.0,
    "total_late_minutes": 450,
    "total_early_leave_minutes": 200,
    "total_violations": 45
  }
}
```

---

### 6.4 Get Employee Monthly Report

**Endpoint:** `GET /reports/monthly/employee/:employeeId`  

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `employeeId` | number | Employee ID |

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `year` | number | ✅ |
| `month` | number | ✅ |

**Example Request:**
```
GET /reports/monthly/employee/123?year=2025&month=11
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Employee monthly report retrieved successfully",
  "data": {
    "employee_id": 123,
    "employee_code": "EMP007",
    "total_shifts": 22,
    "completed_shifts": 20,
    "absent_days": 1,
    "leave_days": 1,
    "total_work_hours": 168.0,
    "total_overtime_hours": 6.5,
    "total_late_minutes": 25,
    "total_early_leave_minutes": 10,
    "total_violations": 3,
    "unresolved_violations": 1
  }
}
```

---

### 6.5 Get Attendance Rate Analytics

**Endpoint:** `GET /reports/analytics/attendance-rate`  

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start_date` | date | ❌ | Default: first day of month |
| `end_date` | date | ❌ | Default: today |
| `department_id` | number | ❌ | Filter by department |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Attendance rate analytics retrieved successfully",
  "data": [
    {
      "date": "2025-11-01",
      "total_shifts": 50,
      "attended_shifts": 48,
      "attendance_rate": 96.00
    },
    {
      "date": "2025-11-02",
      "total_shifts": 50,
      "attended_shifts": 49,
      "attendance_rate": 98.00
    }
  ]
}
```

---

### 6.6 Get Punctuality Analytics

**Endpoint:** `GET /reports/analytics/punctuality`  

**Query Parameters:** (Same as 6.5)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Punctuality analytics retrieved successfully",
  "data": [
    {
      "date": "2025-11-22",
      "total_shifts": 50,
      "on_time_shifts": 45,
      "late_shifts": 5,
      "punctuality_rate": 90.00,
      "avg_late_minutes": 8.5
    }
  ]
}
```

---

### 6.7 Get Overtime Trends

**Endpoint:** `GET /reports/analytics/overtime-trends`  

**Query Parameters:** (Same as 6.5)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Overtime trends retrieved successfully",
  "data": [
    {
      "date": "2025-11-22",
      "employees_with_ot": 10,
      "total_ot_hours": 35.5,
      "avg_ot_hours": 3.55,
      "ot_requests_count": 12,
      "approved_ot_requests": 10
    }
  ]
}
```

---

### 6.8 Get Today Dashboard

**Endpoint:** `GET /reports/dashboard/today`  

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `department_id` | number | ❌ |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "total_employees": 50,
    "checked_in": 48,
    "checked_out": 35,
    "late_today": 5,
    "absent_today": 2,
    "on_leave_today": 3,
    "violations_today": 7,
    "pending_ot_requests": 4
  }
}
```

---

## 7. Beacons APIs

### 7.1 Register Beacon

**Endpoint:** `POST /beacons`  
**Description:** Register new BLE beacon device (HR/Admin)

**Request Body:**
```json
{
  "beacon_uuid": "FDA50693-A4E2-4FB1-AFCF-C6EB07647825",
  "beacon_major": 1,
  "beacon_minor": 100,
  "beacon_name": "Main Entrance Beacon",
  "department_id": 5,
  "location_name": "Building A - Floor 1",
  "floor": "1st Floor",
  "building": "Building A",
  "room_number": "A101",
  "latitude": 21.028511,
  "longitude": 105.804817,
  "signal_range_meters": 30,
  "rssi_threshold": -70
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `beacon_uuid` | string | ✅ | iBeacon UUID |
| `beacon_major` | number | ✅ | Major number (0-65535) |
| `beacon_minor` | number | ✅ | Minor number (0-65535) |
| `beacon_name` | string | ✅ | Beacon name |
| `department_id` | number | ✅ | Department ID |
| `location_name` | string | ✅ | Location description |
| `floor` | string | ❌ | Floor number/name |
| `building` | string | ❌ | Building name |
| `room_number` | string | ❌ | Room number |
| `latitude` | number | ❌ | GPS latitude |
| `longitude` | number | ❌ | GPS longitude |
| `signal_range_meters` | number | ❌ | Range in meters (default: 30) |
| `rssi_threshold` | number | ❌ | RSSI threshold (default: -70) |

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Beacon registered successfully",
  "data": {
    "id": 25,
    "beacon_uuid": "FDA50693-A4E2-4FB1-AFCF-C6EB07647825",
    "beacon_major": 1,
    "beacon_minor": 100,
    "beacon_name": "Main Entrance Beacon",
    "department_id": 5,
    "location_name": "Building A - Floor 1",
    "status": "ACTIVE",
    "created_at": "2025-11-22T15:00:00Z"
  }
}
```

**Error Response (400 Bad Request - Duplicate):**
```json
{
  "success": false,
  "message": "Beacon with same UUID/Major/Minor already exists"
}
```

---

### 7.2 Get All Beacons

**Endpoint:** `GET /beacons`  

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `department_id` | number | ❌ |
| `status` | string | ❌ |
| `limit` | number | ❌ |
| `offset` | number | ❌ |

---

### 7.3 Get Beacon By ID

**Endpoint:** `GET /beacons/:id`  

---

### 7.4 Update Beacon

**Endpoint:** `PUT /beacons/:id`  

**Request Body:** (All fields from 7.1 are optional)

---

### 7.5 Delete Beacon

**Endpoint:** `DELETE /beacons/:id`  

---

### 7.6 Get Beacons By Department

**Endpoint:** `GET /beacons/department/:departmentId`  

---

### 7.7 Update Beacon Heartbeat

**Endpoint:** `POST /beacons/:id/heartbeat`  
**Description:** Update beacon last seen time (system call)

**Request Body (Optional):**
```json
{
  "battery_level": 85
}
```

---

## 8. Presence Verification APIs

### 8.1 Capture Presence Verification

**Endpoint:** `POST /presence-verification/capture`  
**Description:** Capture random presence check with GPS

**Request Body:**
```json
{
  "employeeId": "123",
  "shiftId": "789",
  "roundNumber": 1,
  "imageUrl": "https://storage.example.com/presence/123_20251122_1.jpg",
  "location": {
    "latitude": 10.762622,
    "longitude": 106.660172
  }
}
```

---

### 8.2 Get Verification Schedule

**Endpoint:** `GET /presence-verification/schedule/:shiftId`  
**Description:** Get verification schedule for a shift

---

## 9. Attendance Edit Logs APIs

### 9.1 Get All Edit Logs

**Endpoint:** `GET /attendance-edit-logs`  

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `start_date` | date | ❌ |
| `end_date` | date | ❌ |
| `limit` | number | ❌ |
| `offset` | number | ❌ |

---

### 9.2 Get Shift Edit History

**Endpoint:** `GET /attendance-edit-logs/shift/:shiftId`  

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Shift edit history retrieved successfully",
  "data": [
    {
      "id": 50,
      "shift_id": 789,
      "edited_by": 456,
      "edited_at": "2025-11-22T14:30:00Z",
      "field_changed": "check_in_time",
      "old_value": "2025-11-22T08:05:00Z",
      "new_value": "2025-11-22T08:00:00Z",
      "edit_reason": "Employee forgot to check-in, HR corrected based on CCTV",
      "ip_address": "192.168.1.50"
    }
  ]
}
```

---

### 9.3 Get Employee Edit History

**Endpoint:** `GET /attendance-edit-logs/employee/:employeeId`  

---

### 9.4 Get Logs By Editor

**Endpoint:** `GET /attendance-edit-logs/editor/:editorId`  

---

### 9.5 Get Recent Edits

**Endpoint:** `GET /attendance-edit-logs/recent`  

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hours` | number | 24 | Last N hours |
| `limit` | number | 100 | Max records |

---

### 9.6 Get Edit Statistics

**Endpoint:** `GET /attendance-edit-logs/statistics`  

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `start_date` | date | ✅ |
| `end_date` | date | ✅ |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Edit statistics retrieved successfully",
  "data": {
    "total_edits": 125,
    "by_field": {
      "check_in_time": 50,
      "check_out_time": 45,
      "status": 30
    },
    "by_editor": {
      "456": 80,
      "457": 45
    }
  }
}
```

---

## 10. GPS Validation APIs

### 10.1 GPS Check

**Endpoint:** `POST /attendance/gps-check`  
**Access:** Public (no authentication)  
**Description:** Client webhook to submit GPS for geofence validation

**Request Body:**
```json
{
  "employeeId": "123",
  "shiftId": "789",
  "latitude": 10.762622,
  "longitude": 106.660172,
  "location_accuracy": 15
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "GPS validation successful",
  "data": {
    "valid": true,
    "distance_meters": 25.5,
    "threshold_meters": 100,
    "accuracy": 15
  }
}
```

**Success Response (GPS Outside Geofence):**
```json
{
  "success": true,
  "message": "GPS validation failed - outside geofence",
  "data": {
    "valid": false,
    "distance_meters": 250.8,
    "threshold_meters": 100,
    "accuracy": 15
  }
}
```

---

## Database Schemas

### employee_shifts
| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `employee_id` | integer | Employee reference |
| `employee_code` | string | Employee code |
| `department_id` | integer | Department reference |
| `shift_date` | date | Shift date |
| `work_schedule_id` | integer | Schedule reference |
| `scheduled_start_time` | time | Scheduled start |
| `scheduled_end_time` | time | Scheduled end |
| `check_in_time` | timestamp | Actual check-in |
| `check_out_time` | timestamp | Actual check-out |
| `work_hours` | decimal | Actual work hours |
| `overtime_hours` | decimal | Overtime hours |
| `break_hours` | decimal | Break duration |
| `late_minutes` | integer | Late minutes |
| `early_leave_minutes` | integer | Early leave minutes |
| `status` | enum | See [ShiftStatus](#shiftstatus) |
| `shift_type` | enum | REGULAR, OVERTIME |
| `notes` | text | Additional notes |

### work_schedules
| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `schedule_name` | string | Schedule name |
| `schedule_type` | enum | FIXED, FLEXIBLE, SHIFT |
| `work_days` | string | Comma-separated days |
| `start_time` | time | Start time |
| `end_time` | time | End time |
| `break_duration_minutes` | integer | Break duration |
| `late_tolerance_minutes` | integer | Late tolerance |
| `early_leave_tolerance_minutes` | integer | Early leave tolerance |
| `status` | enum | ACTIVE, INACTIVE |

### beacons
| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `beacon_uuid` | string | iBeacon UUID |
| `beacon_major` | integer | Major number |
| `beacon_minor` | integer | Minor number |
| `beacon_name` | string | Beacon name |
| `department_id` | integer | Department reference |
| `location_name` | string | Location description |
| `floor` | string | Floor number |
| `building` | string | Building name |
| `room_number` | string | Room number |
| `latitude` | decimal | GPS latitude |
| `longitude` | decimal | GPS longitude |
| `signal_range_meters` | integer | Signal range |
| `rssi_threshold` | integer | RSSI threshold |
| `status` | string | ACTIVE, INACTIVE |
| `battery_level` | integer | Battery % (0-100) |
| `last_heartbeat` | timestamp | Last seen time |

### violations
| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `employee_id` | integer | Employee reference |
| `shift_id` | integer | Shift reference |
| `violation_type` | enum | See [ViolationType](#violationtype) |
| `severity` | enum | See [ViolationSeverity](#violationseverity) |
| `description` | text | Violation details |
| `minutes` | integer | Minutes late/early |
| `detected_at` | timestamp | Detection time |
| `resolved` | boolean | Resolution status |
| `resolved_by` | integer | Resolver employee ID |
| `resolved_at` | timestamp | Resolution time |
| `resolution_notes` | text | Resolution reason |

### overtime_requests
| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `employee_id` | integer | Employee reference |
| `shift_id` | integer | Shift reference (optional) |
| `overtime_date` | date | Overtime date |
| `start_time` | timestamp | Start time |
| `end_time` | timestamp | End time |
| `estimated_hours` | decimal | Estimated hours |
| `actual_hours` | decimal | Actual hours |
| `status` | enum | PENDING, APPROVED, REJECTED |
| `reason` | text | Request reason |
| `approved_by` | integer | Approver employee ID |
| `approved_at` | timestamp | Approval time |
| `rejection_reason` | text | Rejection reason |

### attendance_edit_logs
| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `shift_id` | integer | Shift reference |
| `employee_id` | integer | Employee affected |
| `edited_by` | integer | Editor employee ID |
| `edited_at` | timestamp | Edit time |
| `field_changed` | string | Field name |
| `old_value` | text | Old value |
| `new_value` | text | New value |
| `edit_reason` | text | Reason for edit |
| `ip_address` | string | Editor IP |

---

## Enums & Types

### ShiftStatus
```typescript
enum ShiftStatus {
  SCHEDULED = 'SCHEDULED',      // Future shift
  IN_PROGRESS = 'IN_PROGRESS',  // Checked in, not out
  COMPLETED = 'COMPLETED',      // Both check-in/out done
  ABSENT = 'ABSENT',            // No check-in
  ON_LEAVE = 'ON_LEAVE',        // On approved leave
  CANCELLED = 'CANCELLED'       // Shift cancelled
}
```

### ScheduleType
```typescript
enum ScheduleType {
  FIXED = 'FIXED',          // Fixed hours (9-5)
  FLEXIBLE = 'FLEXIBLE',    // Flexible hours
  SHIFT = 'SHIFT'           // Shift-based
}
```

### ScheduleStatus
```typescript
enum ScheduleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}
```

### ViolationType
```typescript
enum ViolationType {
  LATE = 'LATE',                          // Late arrival
  EARLY_LEAVE = 'EARLY_LEAVE',            // Left early
  ABSENT = 'ABSENT',                      // No show
  GPS_FRAUD = 'GPS_FRAUD',                // GPS spoofing detected
  MISSING_CHECK_IN = 'MISSING_CHECK_IN',  // Forgot check-in
  MISSING_CHECK_OUT = 'MISSING_CHECK_OUT' // Forgot check-out
}
```

### ViolationSeverity
```typescript
enum ViolationSeverity {
  LOW = 'LOW',          // 1-15 minutes
  MEDIUM = 'MEDIUM',    // 16-30 minutes
  HIGH = 'HIGH',        // 31-60 minutes
  CRITICAL = 'CRITICAL' // >60 minutes or fraud
}
```

### OvertimeStatus
```typescript
enum OvertimeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
```

---

## Common Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* Response data */ },
  "pagination": {  // Optional, for list endpoints
    "limit": 20,
    "offset": 0,
    "total": 150
  }
}
```

### Error Response
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

---

## Error Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid JWT |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry |
| 500 | Internal Server Error |

---

## Notes

1. **Date Format:** All dates use `YYYY-MM-DD` format
2. **DateTime Format:** All timestamps use ISO 8601 (`2025-11-22T14:30:00Z`)
3. **Time Format:** Times use `HH:mm:ss` format (24-hour)
4. **Pagination:** Most list endpoints support `limit` and `offset` parameters
5. **Permissions:** All endpoints require appropriate RBAC permissions
6. **JWT Token:** Must be included in `Authorization: Bearer <token>` header
7. **Public Endpoints:** Marked with `Public` - no authentication required

---

**End of Documentation**
