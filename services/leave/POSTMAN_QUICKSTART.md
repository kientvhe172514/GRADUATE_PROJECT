# 🚀 Postman Quick Start Guide

## 📥 Import Postman Collection

### Method 1: Import từ File

1. Mở Postman
2. Click **Import** (top left)
3. Chọn file `Leave_Service_API.postman_collection.json`
4. Click **Import**

### Method 2: Import từ Raw JSON

1. Mở Postman
2. Click **Import** → **Raw text**
3. Copy toàn bộ nội dung file `Leave_Service_API.postman_collection.json`
4. Paste vào và click **Continue** → **Import**

---

## ⚙️ Thiết Lập Environment

### Tạo Environment mới:

1. Click **Environments** (sidebar trái)
2. Click **+** để tạo environment mới
3. Đặt tên: `Leave Service - Local`
4. Thêm các variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:3003/api/v1/leave` | `http://localhost:3003/api/v1/leave` |
| `employee_id` | `1` | `1` |
| `leave_type_id` | `1` | `1` |
| `year` | `2025` | `2025` |

5. Click **Save**
6. Chọn environment này ở dropdown (top right)

---

## 🎯 Testing Workflow (Recommended Order)

### Phase 1: Setup (4 requests)
```
1. Create Annual Leave Type
2. Create Sick Leave Type
3. Bulk Create Vietnam Public Holidays 2025
4. Initialize Employee Balances (employee_id = 1)
```

### Phase 2: Verify Setup (4 requests)
```
5. Get All Leave Types
6. Get Active Leave Types
7. Get Employee Balance Summary
8. Get Holiday Calendar 2025
```

### Phase 3: Leave Request Flow (6 requests)
```
9. Create Leave Request (Full Day) → Save leave_record_id
10. Get Leave Record by ID
11. Approve Leave Request
12. Get Employee Balances (verify balance updated)
13. Create Another Leave Request
14. Cancel Leave Request
```

### Phase 4: Edge Cases (Test failures - Expected!)
```
15. Create Overlapping Leave → Should FAIL ✅
16. Create Leave with Insufficient Balance → Should FAIL ✅
17. Update Approved Leave → Should FAIL ✅
18. Cancel Started Leave → Should FAIL ✅
```

---

## 📋 Quick Reference

### Base URL
```
http://localhost:3003/api/v1/leave
```

### Common Variables (trong Collection)
- `{{base_url}}` - Base URL của service
- `{{employee_id}}` - ID của employee test
- `{{leave_type_id}}` - ID của leave type
- `{{year}}` - Năm hiện tại

### Update Variables trong Requests

Sau khi tạo resource, cập nhật variables:

**Example:** Sau khi create Leave Type, copy `id` từ response và update `leave_type_id`:
```json
Response:
{
  "data": {
    "id": 3,  ← Copy ID này
    "leave_type_code": "ANNUAL",
    ...
  }
}
```

Cập nhật trong Environment:
- `leave_type_id` = `3`

---

## 🔍 Swagger Documentation

Nếu muốn xem API docs trực quan hơn:

```
http://localhost:3003/leave/swagger
```

---

## 📊 Request Examples Nhanh

### 1. Create Leave Type
```bash
POST {{base_url}}/leave-types
Content-Type: application/json

{
  "leave_type_code": "ANNUAL",
  "leave_type_name": "Annual Leave",
  "is_paid": true,
  "requires_approval": true,
  "max_days_per_year": 15.00,
  ...
}
```

### 2. Create Holiday
```bash
POST {{base_url}}/holidays
Content-Type: application/json

{
  "holiday_name": "Lunar New Year",
  "holiday_date": "2025-01-29",
  "holiday_type": "PUBLIC_HOLIDAY",
  "year": 2025,
  ...
}
```

### 3. Initialize Balance
```bash
POST {{base_url}}/leave-balances/initialize
Content-Type: application/json

{
  "employee_id": 1,
  "year": 2025
}
```

### 4. Create Leave Request
```bash
POST {{base_url}}/leave-records
Content-Type: application/json

{
  "employee_id": 1,
  "employee_code": "EMP001",
  "department_id": 1,
  "leave_type_id": 1,
  "start_date": "2025-01-20",
  "end_date": "2025-01-22",
  "is_half_day_start": false,
  "is_half_day_end": false,
  "reason": "Family vacation"
}
```

### 5. Approve Leave
```bash
POST {{base_url}}/leave-records/1/approve
Content-Type: application/json

{
  "approved_by": 123,
  "notes": "Approved"
}
```

---

## ✅ Checklist Testing

- [ ] Service đang chạy (`npm run start:dev`)
- [ ] Database đã setup
- [ ] Postman collection đã import
- [ ] Environment variables đã cấu hình
- [ ] Tạo được Leave Types
- [ ] Tạo được Holidays
- [ ] Initialize được Balance
- [ ] Tạo được Leave Request
- [ ] Approve/Reject/Cancel hoạt động
- [ ] Validation errors hiển thị đúng

---

## 🐛 Troubleshooting

### Error: "Cannot GET /api/v1/leave/..."
**Fix:** Kiểm tra service có đang chạy không
```bash
cd services/leave
npm run start:dev
```

### Error: "ECONNREFUSED ::1:5432"
**Fix:** Database chưa chạy hoặc connection string sai
- Kiểm tra `.env` file
- Khởi động PostgreSQL

### Error: "LEAVE_TYPE_NOT_FOUND"
**Fix:** Chưa tạo Leave Types
- Chạy requests trong folder "1. Leave Types" trước

### Error: "LEAVE_BALANCE_NOT_FOUND"
**Fix:** Chưa initialize balance
- Chạy "Initialize Employee Balances" request

---

## 📖 Đọc Thêm

Chi tiết đầy đủ về tất cả APIs:
- `API_TESTING_GUIDE.md` - Complete API documentation
- `http://localhost:3003/leave/swagger` - Interactive API docs

---

**Happy Testing! 🎉**

