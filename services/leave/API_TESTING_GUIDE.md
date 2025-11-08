# Leave Service API Testing Guide

## 📋 Base URL
```
http://localhost:3003/api/v1/leave
```

## 📚 Swagger Documentation
```
http://localhost:3003/leave/swagger
```

---

# 1️⃣ LEAVE TYPES MANAGEMENT

## 1.1 Get All Leave Types
**Endpoint:** `GET /api/v1/leave/leave-types`

**Query Parameters:**
- `status` (optional): ACTIVE | INACTIVE
- `is_paid` (optional): true | false (as string in URL: `?is_paid=true` or `?is_paid=false`)

**Request Examples:**
```http
# Get all leave types
GET http://localhost:3003/api/v1/leave/leave-types

# Get only active leave types
GET http://localhost:3003/api/v1/leave/leave-types?status=ACTIVE

# Get only paid leave types
GET http://localhost:3003/api/v1/leave/leave-types?is_paid=true

# Combine filters
GET http://localhost:3003/api/v1/leave/leave-types?status=ACTIVE&is_paid=true
```

**Response Example:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Leave types retrieved successfully",
  "data": [
    {
      "id": 1,
      "leave_type_code": "ANNUAL",
      "leave_type_name": "Annual Leave",
      "description": "Standard annual vacation leave",
      "is_paid": true,
      "requires_approval": true,
      "requires_document": false,
      "deducts_from_balance": true,
      "max_days_per_year": 15.00,
      "max_consecutive_days": 10,
      "min_notice_days": 3,
      "exclude_holidays": true,
      "exclude_weekends": true,
      "allow_carry_over": true,
      "max_carry_over_days": 5.00,
      "carry_over_expiry_months": 3,
      "is_prorated": true,
      "proration_basis": "MONTHLY",
      "is_accrued": false,
      "accrual_rate": null,
      "accrual_start_month": 0,
      "color_hex": "#3B82F6",
      "icon": "calendar",
      "sort_order": 0,
      "status": "ACTIVE",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 1.2 Get Active Leave Types (For Dropdown)
**Endpoint:** `GET /api/v1/leave/leave-types/active`

**Request:**
```http
GET http://localhost:3003/api/v1/leave/leave-types/active
```

**Response:** Same as 1.1 but only active leave types

---

## 1.3 Get Leave Type by ID
**Endpoint:** `GET /api/v1/leave/leave-types/:id`

**Request:**
```http
GET http://localhost:3003/api/v1/leave/leave-types/1
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Leave type retrieved successfully",
  "data": {
    "id": 1,
    "leave_type_code": "ANNUAL",
    "leave_type_name": "Annual Leave",
    "description": "Standard annual vacation leave",
    "is_paid": true,
    "requires_approval": true,
    "requires_document": false,
    "deducts_from_balance": true,
    "max_days_per_year": 15.00,
    "max_consecutive_days": 10,
    "min_notice_days": 3,
    "exclude_holidays": true,
    "exclude_weekends": true,
    "allow_carry_over": true,
    "max_carry_over_days": 5.00,
    "carry_over_expiry_months": 3,
    "is_prorated": true,
    "proration_basis": "MONTHLY",
    "is_accrued": false,
    "accrual_rate": null,
    "accrual_start_month": 0,
    "color_hex": "#3B82F6",
    "icon": "calendar",
    "sort_order": 0,
    "status": "ACTIVE",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  },
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 1.4 Create Leave Type
**Endpoint:** `POST /api/v1/leave/leave-types`

**Request Body:**
```json
{
  "leave_type_code": "ANNUAL",
  "leave_type_name": "Annual Leave",
  "description": "Standard annual vacation leave",
  "is_paid": true,
  "requires_approval": true,
  "requires_document": false,
  "deducts_from_balance": true,
  "max_days_per_year": 15.00,
  "max_consecutive_days": 10,
  "min_notice_days": 3,
  "exclude_holidays": true,
  "exclude_weekends": true,
  "allow_carry_over": true,
  "max_carry_over_days": 5.00,
  "carry_over_expiry_months": 3,
  "is_prorated": true,
  "proration_basis": "MONTHLY",
  "is_accrued": false,
  "accrual_rate": 0,
  "accrual_start_month": 0,
  "color_hex": "#3B82F6",
  "icon": "calendar",
  "sort_order": 0
}
```

**More Examples:**

**Sick Leave:**
```json
{
  "leave_type_code": "SICK",
  "leave_type_name": "Sick Leave",
  "description": "Medical leave for illness",
  "is_paid": true,
  "requires_approval": false,
  "requires_document": true,
  "deducts_from_balance": true,
  "max_days_per_year": 12.00,
  "max_consecutive_days": 7,
  "min_notice_days": 0,
  "exclude_holidays": false,
  "exclude_weekends": false,
  "allow_carry_over": false,
  "max_carry_over_days": 0,
  "carry_over_expiry_months": 0,
  "is_prorated": false,
  "proration_basis": "YEARLY",
  "is_accrued": false,
  "accrual_rate": 0,
  "accrual_start_month": 0,
  "color_hex": "#EF4444",
  "icon": "medical",
  "sort_order": 1
}
```

**Unpaid Leave:**
```json
{
  "leave_type_code": "UNPAID",
  "leave_type_name": "Unpaid Leave",
  "description": "Leave without pay",
  "is_paid": false,
  "requires_approval": true,
  "requires_document": false,
  "deducts_from_balance": false,
  "max_days_per_year": null,
  "max_consecutive_days": null,
  "min_notice_days": 7,
  "exclude_holidays": true,
  "exclude_weekends": true,
  "allow_carry_over": false,
  "max_carry_over_days": 0,
  "carry_over_expiry_months": 0,
  "is_prorated": false,
  "proration_basis": "YEARLY",
  "is_accrued": false,
  "accrual_rate": 0,
  "accrual_start_month": 0,
  "color_hex": "#6B7280",
  "icon": "clock",
  "sort_order": 5
}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 201,
  "message": "Leave type created successfully",
  "data": {
    "id": 1,
    "leave_type_code": "ANNUAL",
    "leave_type_name": "Annual Leave",
    "...": "..."
  },
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 1.5 Update Leave Type
**Endpoint:** `PUT /api/v1/leave/leave-types/:id`

**Request Body (Partial Update):**
```json
{
  "leave_type_name": "Annual Leave - Updated",
  "max_days_per_year": 20.00,
  "status": "ACTIVE"
}
```

**Response:** Same as Create

---

## 1.6 Delete Leave Type
**Endpoint:** `DELETE /api/v1/leave/leave-types/:id`

**Request:**
```http
DELETE http://localhost:3003/api/v1/leave/leave-types/1
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Leave type deleted successfully",
  "data": null,
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

# 2️⃣ HOLIDAYS MANAGEMENT

## 2.1 Get All Holidays
**Endpoint:** `GET /api/v1/leave/holidays`

**Query Parameters:**
- `year` (optional): 2025
- `holiday_type` (optional): PUBLIC_HOLIDAY | COMPANY_HOLIDAY | REGIONAL_HOLIDAY | RELIGIOUS_HOLIDAY
- `status` (optional): ACTIVE | INACTIVE

**Request Examples:**
```http
# Get all holidays
GET http://localhost:3003/api/v1/leave/holidays

# Get holidays for 2025
GET http://localhost:3003/api/v1/leave/holidays?year=2025

# Get public holidays only
GET http://localhost:3003/api/v1/leave/holidays?holiday_type=PUBLIC_HOLIDAY

# Combine filters
GET http://localhost:3003/api/v1/leave/holidays?year=2025&holiday_type=PUBLIC_HOLIDAY&status=ACTIVE
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Holidays retrieved successfully",
  "data": [
    {
      "id": 1,
      "holiday_name": "New Year's Day",
      "holiday_date": "2025-01-01T00:00:00.000Z",
      "holiday_type": "PUBLIC_HOLIDAY",
      "applies_to": "ALL",
      "department_ids": null,
      "location_ids": null,
      "is_recurring": true,
      "recurring_month": 1,
      "recurring_day": 1,
      "recurring_rule": null,
      "is_mandatory": true,
      "is_paid": true,
      "can_work_for_ot": false,
      "description": "First day of the year",
      "year": 2025,
      "status": "ACTIVE",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 2.2 Get Holiday Calendar by Year
**Endpoint:** `GET /api/v1/leave/holidays/calendar/:year`

**Request:**
```http
GET http://localhost:3003/api/v1/leave/holidays/calendar/2025
```

**Response:** Same as 2.1 but filtered by year

---

## 2.3 Get Holiday by ID
**Endpoint:** `GET /api/v1/leave/holidays/:id`

**Request:**
```http
GET http://localhost:3003/api/v1/leave/holidays/1
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Holiday retrieved successfully",
  "data": {
    "id": 1,
    "holiday_name": "New Year's Day",
    "holiday_date": "2025-01-01T00:00:00.000Z",
    "holiday_type": "PUBLIC_HOLIDAY",
    "...": "..."
  },
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 2.4 Create Holiday
**Endpoint:** `POST /api/v1/leave/holidays`

**Request Body:**
```json
{
  "holiday_name": "Lunar New Year",
  "holiday_date": "2025-01-29",
  "holiday_type": "PUBLIC_HOLIDAY",
  "applies_to": "ALL",
  "department_ids": null,
  "location_ids": null,
  "is_recurring": false,
  "recurring_month": null,
  "recurring_day": null,
  "recurring_rule": null,
  "is_mandatory": true,
  "is_paid": true,
  "can_work_for_ot": false,
  "description": "Vietnamese New Year celebration",
  "year": 2025
}
```

**More Examples:**

**Company Anniversary:**
```json
{
  "holiday_name": "Company Anniversary",
  "holiday_date": "2025-06-15",
  "holiday_type": "COMPANY_HOLIDAY",
  "applies_to": "ALL",
  "is_recurring": true,
  "recurring_month": 6,
  "recurring_day": 15,
  "is_mandatory": false,
  "is_paid": true,
  "can_work_for_ot": false,
  "description": "Company founded on this day",
  "year": 2025
}
```

**Regional Holiday (Specific Departments):**
```json
{
  "holiday_name": "Regional Festival",
  "holiday_date": "2025-03-15",
  "holiday_type": "REGIONAL_HOLIDAY",
  "applies_to": "DEPARTMENT",
  "department_ids": "1,2,3",
  "location_ids": null,
  "is_recurring": false,
  "is_mandatory": false,
  "is_paid": true,
  "can_work_for_ot": true,
  "description": "Local festival for specific departments",
  "year": 2025
}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 201,
  "message": "Holiday created successfully",
  "data": {
    "id": 1,
    "holiday_name": "Lunar New Year",
    "...": "..."
  },
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 2.5 Bulk Create Holidays
**Endpoint:** `POST /api/v1/leave/holidays/bulk-create`

**Request Body:**
```json
{
  "holidays": [
    {
      "holiday_name": "New Year's Day",
      "holiday_date": "2025-01-01",
      "holiday_type": "PUBLIC_HOLIDAY",
      "description": "First day of the year"
    },
    {
      "holiday_name": "Lunar New Year",
      "holiday_date": "2025-01-29",
      "holiday_type": "PUBLIC_HOLIDAY",
      "description": "Vietnamese New Year"
    },
    {
      "holiday_name": "Hung Kings' Commemoration Day",
      "holiday_date": "2025-04-10",
      "holiday_type": "PUBLIC_HOLIDAY",
      "description": "Hung Kings Festival"
    },
    {
      "holiday_name": "Reunification Day",
      "holiday_date": "2025-04-30",
      "holiday_type": "PUBLIC_HOLIDAY",
      "description": "Liberation of Saigon"
    },
    {
      "holiday_name": "International Labor Day",
      "holiday_date": "2025-05-01",
      "holiday_type": "PUBLIC_HOLIDAY",
      "description": "Workers Day"
    },
    {
      "holiday_name": "National Day",
      "holiday_date": "2025-09-02",
      "holiday_type": "PUBLIC_HOLIDAY",
      "description": "Independence Day"
    }
  ],
  "year": 2025,
  "applies_to": "ALL",
  "is_paid": true,
  "is_mandatory": true
}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 201,
  "message": "Successfully created 6 holiday(s)",
  "data": [
    {
      "id": 1,
      "holiday_name": "New Year's Day",
      "...": "..."
    },
    {
      "id": 2,
      "holiday_name": "Lunar New Year",
      "...": "..."
    }
  ],
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 2.6 Update Holiday
**Endpoint:** `PUT /api/v1/leave/holidays/:id`

**Request Body:**
```json
{
  "holiday_name": "Lunar New Year - Updated",
  "description": "Updated description",
  "status": "ACTIVE"
}
```

**Response:** Same as Create

---

## 2.7 Delete Holiday
**Endpoint:** `DELETE /api/v1/leave/holidays/:id`

**Request:**
```http
DELETE http://localhost:3003/api/v1/leave/holidays/1
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Holiday deleted successfully",
  "data": null,
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

# 3️⃣ LEAVE BALANCE MANAGEMENT

## 3.1 Get Employee Leave Balances
**Endpoint:** `GET /api/v1/leave/leave-balances/employee/:employeeId`

**Query Parameters:**
- `year` (optional): 2025

**Request:**
```http
GET http://localhost:3003/api/v1/leave/leave-balances/employee/1
GET http://localhost:3003/api/v1/leave/leave-balances/employee/1?year=2025
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Employee leave balances retrieved successfully",
  "data": [
    {
      "id": 1,
      "employee_id": 1,
      "leave_type_id": 1,
      "year": 2025,
      "total_days": 15.00,
      "used_days": 3.00,
      "pending_days": 2.00,
      "remaining_days": 10.00,
      "carried_over_days": 0.00,
      "adjusted_days": 0.00,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-11-08T08:00:00.000Z"
    },
    {
      "id": 2,
      "employee_id": 1,
      "leave_type_id": 2,
      "year": 2025,
      "total_days": 12.00,
      "used_days": 1.00,
      "pending_days": 0.00,
      "remaining_days": 11.00,
      "carried_over_days": 0.00,
      "adjusted_days": 0.00,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-11-08T08:00:00.000Z"
    }
  ],
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 3.2 Get Employee Leave Balance Summary
**Endpoint:** `GET /api/v1/leave/leave-balances/employee/:employeeId/summary`

**Query Parameters:**
- `year` (optional): 2025

**Request:**
```http
GET http://localhost:3003/api/v1/leave/leave-balances/employee/1/summary
GET http://localhost:3003/api/v1/leave/leave-balances/employee/1/summary?year=2025
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Employee leave balance summary retrieved successfully",
  "data": {
    "employee_id": 1,
    "year": 2025,
    "total_entitled_days": 27.00,
    "total_used_days": 4.00,
    "total_pending_days": 2.00,
    "total_remaining_days": 21.00,
    "total_carried_over_days": 0.00,
    "total_adjusted_days": 0.00
  },
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 3.3 Initialize Employee Leave Balances
**Endpoint:** `POST /api/v1/leave/leave-balances/initialize`

**Request Body:**
```json
{
  "employee_id": 1,
  "year": 2025
}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 201,
  "message": "Leave balances initialized successfully",
  "data": [
    {
      "id": 1,
      "employee_id": 1,
      "leave_type_id": 1,
      "year": 2025,
      "total_days": 15.00,
      "used_days": 0.00,
      "pending_days": 0.00,
      "remaining_days": 15.00,
      "carried_over_days": 0.00,
      "adjusted_days": 0.00,
      "created_at": "2025-11-08T08:00:00.000Z",
      "updated_at": "2025-11-08T08:00:00.000Z"
    }
  ],
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 3.4 Adjust Leave Balance
**Endpoint:** `POST /api/v1/leave/leave-balances/adjust`

**Request Body:**
```json
{
  "employee_id": 1,
  "leave_type_id": 1,
  "year": 2025,
  "adjustment": 2.5,
  "description": "Additional leave granted for outstanding performance",
  "created_by": 123
}
```

**Negative Adjustment Example:**
```json
{
  "employee_id": 1,
  "leave_type_id": 1,
  "year": 2025,
  "adjustment": -1.0,
  "description": "Deduction for unauthorized absence",
  "created_by": 123
}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Leave balance adjusted successfully",
  "data": {
    "id": 1,
    "employee_id": 1,
    "leave_type_id": 1,
    "year": 2025,
    "total_days": 15.00,
    "used_days": 3.00,
    "pending_days": 2.00,
    "remaining_days": 12.50,
    "carried_over_days": 0.00,
    "adjusted_days": 2.50,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-11-08T08:00:00.000Z"
  },
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 3.5 Carry Over Leave Balances
**Endpoint:** `POST /api/v1/leave/leave-balances/carry-over`

**Request Body:**
```json
{
  "year": 2024
}
```

**Description:** Carries over remaining balances from 2024 to 2025 for all employees (based on leave type rules)

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Carry over processed successfully",
  "data": [
    {
      "employee_id": 1,
      "leave_type_id": 1,
      "carried_over_days": 5.00,
      "from_year": 2024,
      "to_year": 2025
    }
  ],
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 3.6 Get Expiring Carry-Over Balances
**Endpoint:** `GET /api/v1/leave/leave-balances/expiring`

**Query Parameters:**
- `year` (optional): 2025

**Request:**
```http
GET http://localhost:3003/api/v1/leave/leave-balances/expiring
GET http://localhost:3003/api/v1/leave/leave-balances/expiring?year=2025
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Expiring carry-over balances retrieved successfully",
  "data": [
    {
      "employee_id": 1,
      "employee_code": "EMP001",
      "leave_type_id": 1,
      "leave_type_name": "Annual Leave",
      "carried_over_days": 5.00,
      "expiry_date": "2025-03-31T00:00:00.000Z",
      "days_until_expiry": 15
    }
  ],
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

# 4️⃣ LEAVE RECORDS MANAGEMENT

## 4.1 Get All Leave Records
**Endpoint:** `GET /api/v1/leave/leave-records`

**Query Parameters:**
- `employee_id` (optional): 1
- `status` (optional): PENDING | APPROVED | REJECTED | CANCELLED
- `leave_type_id` (optional): 1
- `start_date` (optional): 2025-01-01
- `end_date` (optional): 2025-12-31
- `department_id` (optional): 1

**Request Examples:**
```http
# Get all leave records
GET http://localhost:3003/api/v1/leave/leave-records

# Get records for specific employee
GET http://localhost:3003/api/v1/leave/leave-records?employee_id=1

# Get pending records
GET http://localhost:3003/api/v1/leave/leave-records?status=PENDING

# Get records in date range
GET http://localhost:3003/api/v1/leave/leave-records?start_date=2025-01-01&end_date=2025-12-31

# Combine filters
GET http://localhost:3003/api/v1/leave/leave-records?employee_id=1&status=APPROVED&leave_type_id=1
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Leave records retrieved successfully",
  "data": [
    {
      "id": 1,
      "employee_id": 1,
      "employee_code": "EMP001",
      "department_id": 1,
      "leave_type_id": 1,
      "start_date": "2025-01-20T00:00:00.000Z",
      "end_date": "2025-01-22T00:00:00.000Z",
      "total_calendar_days": 3,
      "total_working_days": 3.00,
      "total_leave_days": 3.00,
      "is_half_day_start": false,
      "is_half_day_end": false,
      "reason": "Family vacation",
      "supporting_document_url": null,
      "status": "APPROVED",
      "requested_at": "2025-01-10T08:00:00.000Z",
      "approval_level": 1,
      "current_approver_id": null,
      "approved_by": 123,
      "approved_at": "2025-01-11T09:00:00.000Z",
      "rejection_reason": null,
      "cancelled_at": null,
      "cancellation_reason": null,
      "metadata": null,
      "created_at": "2025-01-10T08:00:00.000Z",
      "updated_at": "2025-01-11T09:00:00.000Z"
    }
  ],
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 4.2 Get Leave Record by ID
**Endpoint:** `GET /api/v1/leave/leave-records/:id`

**Request:**
```http
GET http://localhost:3003/api/v1/leave/leave-records/1
```

**Response:** Same structure as 4.1 but single object

---

## 4.3 Create Leave Request
**Endpoint:** `POST /api/v1/leave/leave-records`

**Request Body:**
```json
{
  "employee_id": 1,
  "employee_code": "EMP001",
  "department_id": 1,
  "leave_type_id": 1,
  "start_date": "2025-01-20",
  "end_date": "2025-01-22",
  "is_half_day_start": false,
  "is_half_day_end": false,
  "reason": "Family vacation",
  "supporting_document_url": null,
  "metadata": null
}
```

**Half-Day Leave Example:**
```json
{
  "employee_id": 1,
  "employee_code": "EMP001",
  "department_id": 1,
  "leave_type_id": 1,
  "start_date": "2025-01-20",
  "end_date": "2025-01-20",
  "is_half_day_start": true,
  "is_half_day_end": false,
  "reason": "Personal appointment",
  "supporting_document_url": null,
  "metadata": {
    "half_day_period": "morning"
  }
}
```

**Sick Leave with Document:**
```json
{
  "employee_id": 1,
  "employee_code": "EMP001",
  "department_id": 1,
  "leave_type_id": 2,
  "start_date": "2025-01-15",
  "end_date": "2025-01-17",
  "is_half_day_start": false,
  "is_half_day_end": false,
  "reason": "Medical treatment",
  "supporting_document_url": "https://example.com/medical-certificate.pdf",
  "metadata": {
    "medical_facility": "General Hospital",
    "diagnosis": "Flu"
  }
}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 201,
  "message": "Leave request created successfully",
  "data": {
    "id": 1,
    "employee_id": 1,
    "employee_code": "EMP001",
    "department_id": 1,
    "leave_type_id": 1,
    "start_date": "2025-01-20T00:00:00.000Z",
    "end_date": "2025-01-22T00:00:00.000Z",
    "total_calendar_days": 3,
    "total_working_days": 3.00,
    "total_leave_days": 3.00,
    "is_half_day_start": false,
    "is_half_day_end": false,
    "reason": "Family vacation",
    "supporting_document_url": null,
    "status": "PENDING",
    "requested_at": "2025-11-08T08:00:00.000Z",
    "approval_level": 1,
    "current_approver_id": null,
    "approved_by": null,
    "approved_at": null,
    "rejection_reason": null,
    "cancelled_at": null,
    "cancellation_reason": null,
    "metadata": null,
    "created_at": "2025-11-08T08:00:00.000Z",
    "updated_at": "2025-11-08T08:00:00.000Z"
  },
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

**Error Response (Insufficient Balance):**
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Insufficient leave balance. Required: 3.00 days, Available: 2.00 days",
  "data": null,
  "errorCode": "INSUFFICIENT_LEAVE_BALANCE",
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

**Error Response (Overlapping Leave):**
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "You already have a pending or approved leave request during this period",
  "data": null,
  "errorCode": "LEAVE_REQUEST_OVERLAPS",
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 4.4 Update Leave Request
**Endpoint:** `PUT /api/v1/leave/leave-records/:id`

**Note:** Only PENDING requests can be updated

**Request Body:**
```json
{
  "start_date": "2025-01-21",
  "end_date": "2025-01-23",
  "reason": "Updated reason - Extended vacation",
  "supporting_document_url": "https://example.com/updated-doc.pdf"
}
```

**Response:** Same as Create

**Error Response (Cannot Update):**
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Cannot update leave request with status: APPROVED. Only PENDING requests can be modified.",
  "data": null,
  "errorCode": "BAD_REQUEST",
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 4.5 Approve Leave Request
**Endpoint:** `POST /api/v1/leave/leave-records/:id/approve`

**Request Body:**
```json
{
  "approved_by": 123,
  "notes": "Approved with no issues"
}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Leave request approved successfully",
  "data": {
    "id": 1,
    "status": "APPROVED",
    "approved_by": 123,
    "approved_at": "2025-11-08T08:00:00.000Z",
    "...": "..."
  },
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 4.6 Reject Leave Request
**Endpoint:** `POST /api/v1/leave/leave-records/:id/reject`

**Request Body:**
```json
{
  "rejected_by": 123,
  "rejection_reason": "Insufficient notice period. Please submit at least 3 days in advance."
}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Leave request rejected successfully",
  "data": {
    "id": 1,
    "status": "REJECTED",
    "approved_by": 123,
    "approved_at": "2025-11-08T08:00:00.000Z",
    "rejection_reason": "Insufficient notice period. Please submit at least 3 days in advance.",
    "...": "..."
  },
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

## 4.7 Cancel Leave Request
**Endpoint:** `POST /api/v1/leave/leave-records/:id/cancel`

**Request Body:**
```json
{
  "cancellation_reason": "Plans changed - no longer need leave"
}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Leave request cancelled successfully",
  "data": {
    "id": 1,
    "status": "CANCELLED",
    "cancelled_at": "2025-11-08T08:00:00.000Z",
    "cancellation_reason": "Plans changed - no longer need leave",
    "...": "..."
  },
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

**Error Response (Cannot Cancel):**
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Cannot cancel a leave that has already started",
  "data": null,
  "errorCode": "LEAVE_CANNOT_BE_CANCELLED",
  "timestamp": "2025-11-08T08:00:00.000Z"
}
```

---

# 🔧 POSTMAN COLLECTION SETUP

## Environment Variables

Create a Postman environment with these variables:

```
base_url: http://localhost:3003/api/v1/leave
employee_id: 1
leave_type_id: 1
leave_record_id: 1
year: 2025
```

## Common Headers

```
Content-Type: application/json
Accept: application/json
```

## Authentication (if enabled)

```
Authorization: Bearer <your-jwt-token>
```

---

# 📊 TESTING WORKFLOW

## Recommended Testing Order:

### 1️⃣ Setup Phase
1. Create Leave Types (Annual, Sick, Unpaid)
2. Create Holidays for 2025
3. Initialize Employee Leave Balances

### 2️⃣ Basic Operations
4. Get All Leave Types
5. Get Active Leave Types
6. Get Employee Balance Summary
7. Get Holidays for 2025

### 3️⃣ Leave Request Workflow
8. Create Leave Request (should succeed)
9. Try Create Overlapping Leave (should fail)
10. Try Create with Insufficient Balance (should fail)
11. Approve Leave Request
12. Check Updated Balance

### 4️⃣ Advanced Operations
13. Update Pending Leave Request
14. Reject Leave Request
15. Cancel Leave Request
16. Adjust Leave Balance
17. Bulk Create Holidays

### 5️⃣ Edge Cases
18. Try to update approved leave (should fail)
19. Try to cancel started leave (should fail)
20. Try to approve already approved leave (should fail)

---

# 🚨 COMMON ERROR CODES

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| LEAVE_TYPE_NOT_FOUND | 404 | Leave type doesn't exist |
| LEAVE_TYPE_CODE_ALREADY_EXISTS | 400 | Duplicate leave type code |
| HOLIDAY_NOT_FOUND | 404 | Holiday doesn't exist |
| HOLIDAY_ALREADY_EXISTS | 400 | Holiday with same date & type exists |
| LEAVE_BALANCE_NOT_FOUND | 404 | No balance record found |
| INSUFFICIENT_LEAVE_BALANCE | 400 | Not enough days available |
| LEAVE_REQUEST_OVERLAPS | 400 | Overlapping with existing leave |
| INVALID_LEAVE_DATE_RANGE | 400 | Start date after end date |
| LEAVE_ALREADY_APPROVED | 400 | Cannot modify approved leave |
| LEAVE_ALREADY_REJECTED | 400 | Cannot modify rejected leave |
| LEAVE_CANNOT_BE_CANCELLED | 400 | Leave already started or wrong status |
| LEAVE_RECORD_NOT_FOUND | 404 | Leave record doesn't exist |

---

# 📝 NOTES

- All dates are in ISO 8601 format: `YYYY-MM-DD`
- Boolean query parameters should be passed as strings: `?is_paid=true` or `?is_paid=false`
- Weekends (Saturday, Sunday) are automatically excluded from working days calculation
- Half-day leaves count as 0.5 days
- Balance updates are automatic when approving/rejecting/cancelling leaves
- Overlapping leave detection works across all statuses (PENDING & APPROVED)

---

**Happy Testing! 🚀**

