# API Testing Guide - Sau khi tắt Device Validation

## 🎯 Tình trạng hiện tại

✅ **DeviceValidationMiddleware**: Đã tắt trong `Program.cs`  
✅ **Device validation trong SignIn**: Đã tắt trong `SignInCommandHandler`  
✅ **DeviceToken requirement**: Đã tắt trong `SignInCommand`

## 🚀 Test API ngay bây giờ

### 1. **Test Sign In (Không cần DeviceToken)**

```bash
curl -X POST http://localhost:8080/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lecturer169.bob@zentry.edu",
    "password": "User@123"
  }'
```

**Response mong đợi:**

```json
{
  "Success": true,
  "Data": {
    "Token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "SessionKey": "session_abc123...",
    "UserInfo": {
      "Id": "user-guid-here",
      "Email": "lecturer169.bob@zentry.edu",
      "FullName": "Bob Lecturer",
      "Role": "Lecturer"
    },
    "ExpiresAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. **Test FaceId API (Không cần headers)**

```bash
# Tạo face verification request
curl -X POST http://localhost:8080/api/faceid/requests \
  -H "Content-Type: application/json" \
  -d '{
    "LecturerId": "11111111-1111-1111-1111-111111111111",
    "SessionId": "22222222-2222-2222-2222-222222222222",
    "ClassSectionId": "33333333-3333-3333-3333-333333333333"
  }'

# Lấy status
curl http://localhost:8080/api/faceid/requests/{requestId}/status
```

### 3. **Test Attendance API (Không cần headers)**

```bash
# Lấy danh sách sessions
curl http://localhost:8080/api/attendance/sessions

# Lấy attendance records
curl http://localhost:8080/api/attendance/records
```

### 4. **Test Schedule API (Không cần headers)**

```bash
# Lấy danh sách classes
curl http://localhost:8080/api/schedule/classes

# Lấy danh sách sessions
curl http://localhost:8080/api/schedule/sessions
```

## 🔧 Cách bật lại Device Validation

### 1. **Bật DeviceValidationMiddleware**

```csharp
// Trong Program.cs
app.UseDeviceValidationMiddleware(); // Bỏ comment
```

### 2. **Bật Device validation trong SignIn**

```csharp
// Trong SignInCommandHandler.cs
// Bỏ comment phần device validation
```

### 3. **Bật DeviceToken requirement**

```csharp
// Trong SignInCommand.cs
public string DeviceToken { get; set; } = string.Empty; // Bỏ comment
```

## 📱 Test với Mobile App

### 1. **Sign In (Không cần DeviceToken)**

```json
{
  "email": "lecturer169.bob@zentry.edu",
  "password": "User@123"
}
```

**Response sẽ có:**

- `Token`: JWT Access Token để sử dụng với `Authorization: Bearer` header
- `SessionKey`: Session key để sử dụng với `X-Session-Key` header

### 2. **API calls (Sử dụng JWT Token)**

- Sử dụng `Authorization: Bearer {Token}` header
- Hoặc sử dụng `X-Session-Key` header (để tương thích)
- Tất cả API sẽ hoạt động bình thường

## ⚠️ Lưu ý quan trọng

1. **Chỉ dùng cho Development/Testing**
2. **KHÔNG deploy lên Production với cấu hình này**
3. **Bật lại device validation trước khi deploy**
4. **Test kỹ các API endpoints cần thiết**

## 🎉 Kết quả mong đợi

- ✅ Sign In thành công không cần DeviceToken
- ✅ Trả về JWT Token để mobile app sử dụng
- ✅ Tất cả API endpoints hoạt động bình thường
- ✅ Không còn lỗi "Device token and session key required"
- ✅ Dễ dàng test và debug API
- ✅ Tương thích với cả JWT và Session-based authentication

## 🚨 Troubleshooting

### Nếu vẫn gặp lỗi:

1. **Restart application** sau khi thay đổi code
2. **Kiểm tra logs** để xem lỗi cụ thể
3. **Verify** tất cả device validation đã được tắt
4. **Check** middleware pipeline trong `Program.cs`

---

**Happy Testing! 🎯**
