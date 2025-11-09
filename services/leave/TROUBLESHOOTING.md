# 🔧 Troubleshooting Guide - Leave Service

## Common Issues and Solutions

---

## ✅ FIXED: "is_paid must be a boolean value" Error

### Problem
When calling `GET /leave-types?is_paid=true`, you get this error:
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": ["is_paid must be a boolean value"],
  "data": null
}
```

### Root Cause
Query parameters from URL are always **strings**. When you send `?is_paid=true`, the value is the string `"true"`, not boolean `true`.

### Solution
The DTO now uses `@Transform()` decorator to automatically convert string values to boolean:

```typescript
export class ListLeaveTypesQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_paid?: boolean;
}
```

### How to Use
Simply use the query parameter as before:
```http
GET /api/v1/leave/leave-types?is_paid=true
GET /api/v1/leave/leave-types?is_paid=false
GET /api/v1/leave/leave-types?status=ACTIVE&is_paid=true
```

The service will automatically convert `"true"` string to `true` boolean.

---

## 🐛 RabbitMQ Connection Errors

### Problem
Service shows continuous connection errors:
```
[ERROR] Connection to transport failed. Trying to reconnect...
AggregateError [ECONNREFUSED]: connect ECONNREFUSED 127.0.0.1:5672
```

### Solution
See `RABBITMQ_SETUP.md` for detailed instructions.

**Quick Fix:**
1. Comment out RabbitMQ env variables in `.env`
2. Restart service - it will run in HTTP-only mode

---

## 🗄️ Database Connection Issues

### Problem
```
ERROR: Connection terminated unexpectedly
ERROR: database "leave_db" does not exist
```

### Solution
1. Ensure PostgreSQL is running
2. Create the database:
```sql
CREATE DATABASE leave_db;
```
3. Check `.env` file has correct `DATABASE_URL`

---

## 📝 Empty Response When Getting Data

### Problem
When calling `GET /leave-types`, you get:
```json
{
  "status": "SUCCESS",
  "data": [],
  "message": "Leave types retrieved successfully"
}
```

### Solution
**This is normal if database is empty!**

You need to create data first:
1. Create Leave Types: `POST /leave-types`
2. Create Holidays: `POST /holidays` or `POST /holidays/bulk-create`
3. Initialize Balances: `POST /leave-balances/initialize`

Follow the testing workflow in `POSTMAN_QUICKSTART.md`.

---

## 🔐 Authentication Errors

### Problem
```json
{
  "status": "ERROR",
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Solution
If you're in development mode:

1. Set `SKIP_AUTH=true` in `.env`
2. Restart service

For production, you need a valid JWT token:
```http
Authorization: Bearer <your-jwt-token>
```

---

## 🚫 Validation Errors

### Common Validation Issues:

#### 1. Date Format Error
```json
{
  "message": ["start_date must be a valid ISO 8601 date string"]
}
```
**Fix:** Use format `YYYY-MM-DD`:
```json
{
  "start_date": "2025-01-20",
  "end_date": "2025-01-22"
}
```

#### 2. Boolean in Request Body
```json
{
  "message": ["is_paid must be a boolean value"]
}
```
**Fix:** Use actual boolean (not string) in request body:
```json
{
  "is_paid": true,  ✅ Correct
  "is_paid": "true"  ❌ Wrong
}
```

#### 3. Missing Required Fields
```json
{
  "message": [
    "leave_type_code should not be empty",
    "leave_type_name should not be empty"
  ]
}
```
**Fix:** Check the DTO definition and provide all required fields.

---

## 🔄 Business Logic Errors

### 1. Insufficient Leave Balance
```json
{
  "statusCode": 400,
  "errorCode": "INSUFFICIENT_LEAVE_BALANCE",
  "message": "Insufficient leave balance. Required: 3.00 days, Available: 2.00 days"
}
```
**Fix:** 
- Adjust balance: `POST /leave-balances/adjust`
- Or reduce leave days in request

### 2. Overlapping Leave Request
```json
{
  "statusCode": 400,
  "errorCode": "LEAVE_REQUEST_OVERLAPS",
  "message": "You already have a pending or approved leave request during this period"
}
```
**Fix:** 
- Check existing leave requests: `GET /leave-records?employee_id=1`
- Choose different dates
- Or cancel conflicting request first

### 3. Cannot Update Approved Leave
```json
{
  "statusCode": 400,
  "errorCode": "BAD_REQUEST",
  "message": "Cannot update leave request with status: APPROVED"
}
```
**Fix:** Only PENDING requests can be updated. This is by design.

### 4. Cannot Cancel Started Leave
```json
{
  "statusCode": 400,
  "errorCode": "LEAVE_CANNOT_BE_CANCELLED",
  "message": "Cannot cancel a leave that has already started"
}
```
**Fix:** This is a business rule. Leaves can only be cancelled before they start.

---

## 🔍 Debugging Tips

### 1. Check Service Logs
The service logs important information:
```bash
cd services/leave
npm run start:dev

# Look for:
✅ Leave Service running on http://localhost:3003
✅ Swagger at http://localhost:3003/leave/swagger
⚠️  RabbitMQ not configured. Running in HTTP-only mode.
```

### 2. Use Swagger UI
Access `http://localhost:3003/leave/swagger` for:
- Interactive API testing
- Request/Response examples
- DTO definitions
- Error responses

### 3. Check Database
Connect to PostgreSQL and verify data:
```sql
-- Check if leave types exist
SELECT * FROM leave_types;

-- Check employee balances
SELECT * FROM employee_leave_balances WHERE employee_id = 1;

-- Check leave records
SELECT * FROM leave_records WHERE employee_id = 1;
```

### 4. Enable Detailed Logging
In `.env`:
```bash
NODE_ENV=development
```

This enables SQL query logging in console.

---

## 📞 Still Having Issues?

1. ✅ Check all environment variables in `.env`
2. ✅ Ensure database is running and accessible
3. ✅ Verify service is running: `http://localhost:3003/api/v1/leave`
4. ✅ Review Swagger docs: `http://localhost:3003/leave/swagger`
5. ✅ Check the testing guide: `API_TESTING_GUIDE.md`
6. ✅ Follow the workflow: `POSTMAN_QUICKSTART.md`

---

## 🔗 Related Documentation

- `API_TESTING_GUIDE.md` - Complete API documentation
- `POSTMAN_QUICKSTART.md` - Quick start guide
- `RABBITMQ_SETUP.md` - RabbitMQ configuration
- `http://localhost:3003/leave/swagger` - Interactive API docs

---

**Happy Debugging! 🐛→✅**

