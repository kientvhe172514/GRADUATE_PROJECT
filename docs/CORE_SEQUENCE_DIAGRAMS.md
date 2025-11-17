# Core Sequence Diagrams - Graduate Project

Tài liệu mô tả 3 luồng nghiệp vụ chính của hệ thống quản lý nhân sự.

---

## 1. Authentication Flow (Luồng Đăng Nhập và Xác Thực)

### Mô tả
Luồng xác thực người dùng, tạo JWT token và quản lý phiên đăng nhập.

### Actors
- **User**: Người dùng cuối (nhân viên/quản lý)
- **Client App**: Ứng dụng web/mobile
- **Auth Service**: Dịch vụ xác thực

### Flow Details

```
User -> Client App: 1. Nhập username và password vào form đăng nhập
Client App -> Client App: 2. Validate input format (không để trống, email format)
Client App -> Auth Service: 3. POST /api/auth/login 
                              Body: { username, password, deviceInfo }
Auth Service -> Auth Service: 4. Tìm user trong database theo username/email
Auth Service -> Auth Service: 5. So sánh password với hash đã lưu (bcrypt)
Auth Service -> Auth Service: 6. Kiểm tra trạng thái tài khoản (active/blocked)
Auth Service -> Auth Service: 7. Tạo JWT access token (expire 15 phút)
                                  Payload: { userId, email, role, permissions }
Auth Service -> Auth Service: 8. Tạo refresh token (expire 7 ngày)
                                  Lưu vào database với deviceInfo
Auth Service -> Auth Service: 9. Ghi log đăng nhập thành công
Auth Service -> Client App: 10. Return 200 OK
                                Body: {
                                  accessToken: "eyJhbGc...",
                                  refreshToken: "eyJhbGc...",
                                  user: { id, email, name, role },
                                  expiresIn: 900
                                }
Client App -> Client App: 11. Lưu accessToken vào memory
Client App -> Client App: 12. Lưu refreshToken vào secure storage
                               (HttpOnly cookie hoặc SecureStorage)
Client App -> Client App: 13. Lưu user info vào state management
Client App -> User: 14. Redirect đến dashboard/home page
Client App -> User: 15. Hiển thị welcome message

--- Subsequent Requests ---
Client App -> Any Service: 16. Request API với Authorization header
                               Header: "Bearer {accessToken}"
Any Service -> Any Service: 17. Extract token từ header
Any Service -> Any Service: 18. Verify JWT signature và expiry
Any Service -> Auth Service: 19. [Optional] Validate token với Auth Service
                                  (nếu cần check revoke)
Auth Service -> Any Service: 20. Return user info và permissions
Any Service -> Any Service: 21. Check user permissions cho resource
Any Service -> Client App: 22. Return requested data

--- Token Refresh Flow ---
Client App -> Client App: Token sắp hết hạn (còn 1-2 phút)
Client App -> Auth Service: POST /api/auth/refresh
                             Body: { refreshToken }
Auth Service -> Auth Service: Validate refresh token
Auth Service -> Auth Service: Kiểm tra refresh token trong database
Auth Service -> Auth Service: Tạo access token mới
Auth Service -> Client App: Return new access token
Client App -> Client App: Update access token trong memory

--- Logout Flow ---
User -> Client App: Click logout button
Client App -> Auth Service: POST /api/auth/logout
                             Body: { refreshToken }
Auth Service -> Auth Service: Xóa refresh token khỏi database
Auth Service -> Auth Service: Thêm access token vào blacklist (Redis)
Auth Service -> Client App: Return 200 OK
Client App -> Client App: Xóa tokens khỏi storage
Client App -> Client App: Clear user state
Client App -> User: Redirect về login page
```

### Error Scenarios

**Invalid Credentials:**
```
Auth Service -> Client App: 401 Unauthorized
                             { message: "Invalid username or password" }
Client App -> User: Hiển thị error message "Sai tên đăng nhập hoặc mật khẩu"
```

**Account Blocked:**
```
Auth Service -> Client App: 403 Forbidden
                             { message: "Account has been blocked" }
Client App -> User: Hiển thị "Tài khoản đã bị khóa. Vui lòng liên hệ admin"
```

**Too Many Failed Attempts:**
```
Auth Service -> Auth Service: Count failed login attempts (Redis)
Auth Service -> Auth Service: Block account after 5 failed attempts
Auth Service -> Client App: 429 Too Many Requests
                             { message: "Too many failed attempts", retryAfter: 900 }
Client App -> User: "Tài khoản tạm khóa 15 phút do đăng nhập sai quá nhiều"
```

### Technical Details
- **Authentication Method**: JWT (JSON Web Token)
- **Password Hashing**: bcrypt with salt rounds = 10
- **Token Storage**: 
  - Access Token: Memory (React Context/Redux)
  - Refresh Token: HttpOnly Cookie hoặc SecureStorage
- **Token Expiry**:
  - Access Token: 15 minutes
  - Refresh Token: 7 days
- **Security**:
  - HTTPS only
  - CORS configuration
  - Rate limiting: 5 requests/minute per IP
  - Refresh token rotation (one-time use)

---

## 2. Face Recognition Attendance Flow (Luồng Chấm Công bằng Nhận Diện Khuôn Mặt)

### Mô tả
Luồng chấm công sử dụng công nghệ nhận diện khuôn mặt, xác thực vị trí và ghi nhận giờ vào/ra.

### Actors
- **Employee**: Nhân viên cần chấm công
- **Mobile App**: Ứng dụng mobile Flutter
- **Face Recognition Service**: Dịch vụ AI nhận diện khuôn mặt (.NET)
- **Attendance Service**: Dịch vụ quản lý chấm công (NestJS)
- **Notification Service**: Dịch vụ thông báo (NestJS)

### Flow Details

```
--- Preparation Phase ---
Employee -> Mobile App: 1. Mở ứng dụng và đăng nhập
Mobile App -> Mobile App: 2. Kiểm tra JWT token còn hợp lệ
Mobile App -> Employee Service: 3. GET /api/employees/me
                                  Header: Authorization Bearer {token}
Employee Service -> Mobile App: 4. Return employee info:
                                  { id, name, department, shift, faceRegistered: true }
Mobile App -> Employee: 5. Hiển thị dashboard với button "Check In"

--- Check-In Initiation ---
Employee -> Mobile App: 6. Tap vào button "Check In"
Mobile App -> Mobile App: 7. Kiểm tra permissions:
                              - Camera permission
                              - Location permission
Mobile App -> Mobile App: 8. Request GPS location
Mobile App -> Mobile App: 9. Lấy current location (latitude, longitude)
Mobile App -> Mobile App: 10. Activate camera với preview
Mobile App -> Employee: 11. Hiển thị camera preview với hướng dẫn:
                             "Hướng khuôn mặt vào camera"
                             "Đảm bảo ánh sáng đủ"

--- Face Capture ---
Employee -> Mobile App: 12. Đưa khuôn mặt vào camera
Mobile App -> Mobile App: 13. Detect face in preview frame (local ML)
Mobile App -> Mobile App: 14. Kiểm tra chất lượng ảnh:
                               - Face size đủ lớn (>200px)
                               - Lighting đủ sáng
                               - Face angle phù hợp
                               - Không bị mờ (blur detection)
Mobile App -> Employee: 15. Hiển thị feedback real-time:
                             "Face detected ✓"
                             "Move closer" / "Too bright"
Employee -> Mobile App: 16. Tap button "Capture" hoặc auto-capture
Mobile App -> Mobile App: 17. Capture high-quality image
Mobile App -> Mobile App: 18. Compress image (max 2MB, quality 85%)
Mobile App -> Mobile App: 19. Convert image to Base64 hoặc FormData

--- Face Verification ---
Mobile App -> Face Recognition Service: 20. POST /api/face-recognition/verify
                                            Headers: {
                                              Authorization: Bearer {token}
                                              Content-Type: multipart/form-data
                                            }
                                            Body: {
                                              image: File/Base64,
                                              employeeId: "EMP001",
                                              timestamp: "2025-11-16T08:30:00Z",
                                              location: {
                                                latitude: 10.762622,
                                                longitude: 106.660172
                                              }
                                            }
Face Recognition Service -> Face Recognition Service: 21. Receive và validate request
Face Recognition Service -> Face Recognition Service: 22. Decode image từ Base64
Face Recognition Service -> Face Recognition Service: 23. Preprocessing image:
                                                           - Resize to 224x224
                                                           - Normalize pixel values
                                                           - Convert to grayscale
Face Recognition Service -> Face Recognition Service: 24. Detect face using MTCNN/Haar Cascade
Face Recognition Service -> Face Recognition Service: 25. Extract facial landmarks (68 points)
Face Recognition Service -> Face Recognition Service: 26. Align face (rotate, crop)
Face Recognition Service -> Face Recognition Service: 27. Extract face embedding using FaceNet/ArcFace
                                                           Output: 128-dimension vector
Face Recognition Service -> Database: 28. Query stored face embeddings của employeeId
Database -> Face Recognition Service: 29. Return stored embeddings (có thể nhiều ảnh)
Face Recognition Service -> Face Recognition Service: 30. Calculate cosine similarity:
                                                           similarity = (A·B)/(||A||×||B||)
                                                           Với từng stored embedding
Face Recognition Service -> Face Recognition Service: 31. Get max similarity score
Face Recognition Service -> Face Recognition Service: 32. Compare với threshold (0.6):
                                                           - >= 0.6: Match
                                                           - < 0.6: Not match
Face Recognition Service -> Face Recognition Service: 33. Anti-spoofing check:
                                                           - Liveness detection
                                                           - Check không phải ảnh in
                                                           - Check không phải video replay

--- Match Success Scenario ---
Face Recognition Service -> Face Recognition Service: 34. Similarity = 0.85 (Match!)
Face Recognition Service -> Face Recognition Service: 35. Tạo verification result:
                                                           {
                                                             verified: true,
                                                             confidence: 0.85,
                                                             matchedFaceId: "face_123",
                                                             timestamp: "2025-11-16T08:30:15Z"
                                                           }
Face Recognition Service -> Attendance Service: 36. POST /api/attendance/verify-and-record
                                                     Body: {
                                                       employeeId: "EMP001",
                                                       verified: true,
                                                       confidence: 0.85,
                                                       timestamp: "2025-11-16T08:30:15Z",
                                                       location: { lat, lng },
                                                       faceImageUrl: "s3://..."
                                                     }

--- Attendance Recording ---
Attendance Service -> Attendance Service: 37. Validate location:
                                               - Check distance from office
                                               - Radius <= 100m: Valid
                                               - Radius > 100m: Needs approval
Attendance Service -> Attendance Service: 38. Get employee shift info from cache/DB
Attendance Service -> Attendance Service: 39. Determine attendance type:
                                               - 08:00-09:00: Check-in
                                               - 17:00-18:00: Check-out
                                               - Other: Invalid time
Attendance Service -> Attendance Service: 40. Kiểm tra duplicate check-in:
                                               - Query attendance today
                                               - Nếu đã check-in: Return error
Attendance Service -> Attendance Service: 41. Calculate status:
                                               - Check-in <= 08:00: On-time
                                               - Check-in 08:01-08:30: Late
                                               - Check-in > 08:30: Very late
Attendance Service -> Attendance Service: 42. Create attendance record:
                                               {
                                                 employeeId: "EMP001",
                                                 date: "2025-11-16",
                                                 checkInTime: "08:30:15",
                                                 status: "LATE",
                                                 verificationMethod: "FACE",
                                                 confidence: 0.85,
                                                 location: { lat, lng },
                                                 distance: 45, // meters
                                                 imageUrl: "s3://...",
                                                 createdAt: "2025-11-16T08:30:15Z"
                                               }
Attendance Service -> Database: 43. INSERT attendance record
Database -> Attendance Service: 44. Return inserted record với ID
Attendance Service -> Attendance Service: 45. Update statistics:
                                               - Total working days
                                               - Late count this month
                                               - On-time percentage

--- Notification ---
Attendance Service -> Notification Service: 46. Publish message to RabbitMQ:
                                                 Queue: "attendance.checked-in"
                                                 Payload: {
                                                   employeeId: "EMP001",
                                                   employeeName: "Nguyen Van A",
                                                   checkInTime: "08:30:15",
                                                   status: "LATE",
                                                   lateMinutes: 30
                                                 }
Notification Service -> Notification Service: 47. Consume message từ queue
Notification Service -> Notification Service: 48. Format notification message:
                                                   Title: "Check-in thành công"
                                                   Body: "Bạn đã check-in lúc 08:30:15"
                                                   Data: { type: "ATTENDANCE", id: "..." }
Notification Service -> FCM/APNS: 49. Send push notification
                                      FCM Token: employee's device token
FCM/APNS -> Employee Device: 50. Push notification delivered
Employee Device -> Employee: 51. Hiển thị notification trên màn hình

Notification Service -> Database: 52. Save notification to database (inbox)
Notification Service -> Notification Service: 53. [Optional] Send email summary
                                                   (nếu late > 30 phút)

--- Response to Mobile App ---
Attendance Service -> Mobile App: 54. Return 201 Created
                                      Body: {
                                        success: true,
                                        attendance: {
                                          id: "att_123",
                                          checkInTime: "08:30:15",
                                          status: "LATE",
                                          lateMinutes: 30,
                                          message: "Bạn đã đi trễ 30 phút"
                                        }
                                      }
Mobile App -> Mobile App: 55. Parse response
Mobile App -> Mobile App: 56. Show success animation (checkmark)
Mobile App -> Mobile App: 57. Play success sound
Mobile App -> Mobile App: 58. Update local state/cache
Mobile App -> Employee: 59. Hiển thị success dialog:
                             "✓ Check-in thành công!"
                             "Thời gian: 08:30:15"
                             "Trạng thái: Đi trễ 30 phút"
                             Button: "Đóng"
Mobile App -> Mobile App: 60. Disable check-in button
                               (chỉ enable lại vào giờ check-out)
```

### Error Scenarios

**Face Not Matched:**
```
Face Recognition Service -> Face Recognition Service: Similarity = 0.45 (< 0.6)
Face Recognition Service -> Mobile App: 400 Bad Request
                                        {
                                          verified: false,
                                          message: "Face not recognized",
                                          confidence: 0.45,
                                          suggestion: "Please try again with better lighting"
                                        }
Mobile App -> Employee: Hiển thị error:
                         "Không nhận diện được khuôn mặt"
                         "Vui lòng thử lại với ánh sáng tốt hơn"
                         Button: "Thử lại"
```

**Location Too Far:**
```
Attendance Service -> Attendance Service: Distance = 250m (> 100m)
Attendance Service -> Mobile App: 400 Bad Request
                                   {
                                     success: false,
                                     error: "LOCATION_TOO_FAR",
                                     distance: 250,
                                     maxDistance: 100,
                                     message: "Bạn đang ở quá xa văn phòng"
                                   }
Mobile App -> Employee: "Bạn cần ở gần văn phòng hơn để check-in"
                         "Khoảng cách hiện tại: 250m"
                         "Khoảng cách tối đa: 100m"
```

**No Face Detected:**
```
Face Recognition Service -> Face Recognition Service: Cannot detect face in image
Face Recognition Service -> Mobile App: 400 Bad Request
                                        { error: "NO_FACE_DETECTED" }
Mobile App -> Employee: "Không tìm thấy khuôn mặt trong ảnh"
                         "Vui lòng đảm bảo khuôn mặt hiện rõ"
```

**Already Checked In:**
```
Attendance Service -> Attendance Service: Found existing check-in today
Attendance Service -> Mobile App: 409 Conflict
                                   {
                                     error: "ALREADY_CHECKED_IN",
                                     existingCheckIn: {
                                       time: "08:15:00",
                                       status: "ON_TIME"
                                     }
                                   }
Mobile App -> Employee: "Bạn đã check-in hôm nay lúc 08:15:00"
```

**Anti-Spoofing Failed:**
```
Face Recognition Service -> Face Recognition Service: Detect printed photo/video replay
Face Recognition Service -> Mobile App: 400 Bad Request
                                        {
                                          error: "LIVENESS_CHECK_FAILED",
                                          message: "Please use live camera"
                                        }
Mobile App -> Employee: "Vui lòng sử dụng camera trực tiếp"
                         "Không được dùng ảnh hoặc video"
```

### Technical Details

**Face Recognition Service (.NET)**
- **Framework**: ASP.NET Core 8.0
- **ML Library**: 
  - Emgu.CV (OpenCV wrapper)
  - FaceRecognitionDotNet
  - ML.NET for anti-spoofing
- **Model**: 
  - Face Detection: MTCNN (Multi-task CNN)
  - Face Recognition: FaceNet (128-d embeddings)
  - Liveness Detection: Custom CNN model
- **Threshold**: 0.6 for face matching
- **Storage**: Face embeddings in PostgreSQL, images in S3/MinIO

**Mobile App (Flutter)**
- **Camera**: camera plugin
- **Face Detection**: google_ml_kit (on-device)
- **Location**: geolocator plugin
- **Image**: image_picker, image plugin
- **State Management**: Bloc/Riverpod

**Attendance Service (NestJS)**
- **Database**: PostgreSQL với TypeORM
- **Cache**: Redis (shift info, employee data)
- **Queue**: RabbitMQ (attendance events)
- **Distance Calculation**: Haversine formula

**Performance**
- Face verification: ~500ms - 1s
- Total flow: ~2-3s từ capture đến response
- Concurrent requests: Up to 100 req/s

**Security**
- JWT authentication required
- Image encrypted in transit (HTTPS)
- Face images auto-deleted after 90 days (GDPR)
- Rate limiting: 10 check-ins per employee per day max

---

## 3. Leave Request & Approval Flow (Luồng Tạo và Phê Duyệt Đơn Nghỉ Phép)

### Mô tả
Luồng tạo đơn xin nghỉ phép, gửi đến quản lý phê duyệt, và thông báo kết quả.

### Actors
- **Employee**: Nhân viên tạo đơn nghỉ phép
- **Manager**: Quản lý phê duyệt đơn
- **Client App**: Web/Mobile application
- **Leave Service**: Dịch vụ quản lý nghỉ phép (NestJS)
- **Employee Service**: Dịch vụ quản lý nhân viên (NestJS)
- **Notification Service**: Dịch vụ thông báo (NestJS)
- **Reporting Service**: Dịch vụ báo cáo (NestJS)

### Flow Details

```
=== PART 1: EMPLOYEE CREATES LEAVE REQUEST ===

--- Check Leave Balance ---
Employee -> Client App: 1. Vào màn hình "Leave Request"
Client App -> Leave Service: 2. GET /api/leave/balance
                              Header: Authorization Bearer {token}
Leave Service -> Leave Service: 3. Extract employeeId từ JWT token
Leave Service -> Database: 4. Query leave balance:
                            SELECT * FROM leave_balances 
                            WHERE employee_id = ? AND year = 2025
Database -> Leave Service: 5. Return leave balance:
                            {
                              employeeId: "EMP001",
                              year: 2025,
                              annualLeave: { total: 12, used: 5, remaining: 7 },
                              sickLeave: { total: 10, used: 2, remaining: 8 },
                              unpaidLeave: { total: 0, used: 0, remaining: 0 }
                            }
Leave Service -> Client App: 6. Return 200 OK với leave balance
Client App -> Employee: 7. Hiển thị leave balance:
                          "Phép năm: 7/12 ngày còn lại"
                          "Phép ốm: 8/10 ngày còn lại"

--- Create Leave Request Form ---
Employee -> Client App: 8. Tap button "Create Leave Request"
Client App -> Employee: 9. Hiển thị form:
                          - Leave Type (dropdown)
                          - Start Date (date picker)
                          - End Date (date picker)
                          - Reason (text area)
                          - Attachment (file upload - optional)

Employee -> Client App: 10. Chọn Leave Type: "Annual Leave"
Employee -> Client App: 11. Chọn Start Date: "2025-11-20"
Employee -> Client App: 12. Chọn End Date: "2025-11-22"
Client App -> Client App: 13. Calculate working days:
                              - Loại bỏ weekend (Sat, Sun)
                              - Loại bỏ public holidays
                              - Result: 3 working days
Client App -> Employee: 14. Show calculated days: "3 working days"

Employee -> Client App: 15. Nhập reason: "Family trip to Da Nang"
Employee -> Client App: 16. [Optional] Upload attachment (flight ticket)
Client App -> Client App: 17. Validate attachment:
                               - File size < 5MB
                               - File type: PDF, JPG, PNG only
Employee -> Client App: 18. Tap button "Submit"

--- Client-side Validation ---
Client App -> Client App: 19. Validate form:
                               - Start date >= today
                               - End date >= start date
                               - Reason not empty (min 10 chars)
                               - Days requested <= remaining balance
Client App -> Client App: 20. Show confirmation dialog:
                               "Bạn xin nghỉ 3 ngày từ 20/11 đến 22/11?"
                               "Số ngày phép còn lại: 7 - 3 = 4 ngày"
                               Buttons: "Confirm" | "Cancel"
Employee -> Client App: 21. Tap "Confirm"

--- Submit Leave Request ---
Client App -> Client App: 22. Show loading indicator
Client App -> Client App: 23. [If attachment] Upload file to S3:
                               POST /api/storage/upload
Client App -> Client App: 24. Get attachment URL from S3

Client App -> Leave Service: 25. POST /api/leave/requests
                                  Header: Authorization Bearer {token}
                                  Body: {
                                    leaveType: "ANNUAL",
                                    startDate: "2025-11-20",
                                    endDate: "2025-11-22",
                                    workingDays: 3,
                                    reason: "Family trip to Da Nang",
                                    attachmentUrl: "https://s3.../ticket.pdf"
                                  }

--- Leave Service Processing ---
Leave Service -> Leave Service: 26. Extract employeeId từ JWT
Leave Service -> Leave Service: 27. Validate request data:
                                    - Dates valid format (ISO 8601)
                                    - Start date not in past
                                    - Leave type valid enum
Leave Service -> Database: 28. Check overlapping requests:
                                SELECT * FROM leave_requests
                                WHERE employee_id = ?
                                AND status != 'REJECTED'
                                AND date_range && ?
Database -> Leave Service: 29. Return overlapping requests (empty)
Leave Service -> Leave Service: 30. Calculate working days (server-side):
                                    - Query public holidays from DB
                                    - Calculate excluding weekends & holidays
Leave Service -> Database: 31. Get current leave balance
Database -> Leave Service: 32. Return balance: remaining = 7
Leave Service -> Leave Service: 33. Validate balance:
                                    7 >= 3 ✓ (sufficient)

--- Get Approver Info ---
Leave Service -> Employee Service: 34. GET /api/employees/EMP001/manager
                                       (via internal RPC or REST)
Employee Service -> Database: 35. Query employee hierarchy:
                                   SELECT manager_id FROM employees
                                   WHERE id = 'EMP001'
Database -> Employee Service: 36. Return manager_id = 'MGR005'
Employee Service -> Database: 37. Query manager details:
                                   SELECT * FROM employees WHERE id = 'MGR005'
Database -> Employee Service: 38. Return manager info:
                                   {
                                     id: "MGR005",
                                     name: "Tran Thi B",
                                     email: "manager@company.com",
                                     phone: "+84901234567",
                                     fcmToken: "fcm_token_xyz"
                                   }
Employee Service -> Leave Service: 39. Return 200 OK với manager info

--- Create Leave Request Record ---
Leave Service -> Leave Service: 40. Generate request ID: "LR-2025-0123"
Leave Service -> Leave Service: 41. Create leave request object:
                                    {
                                      id: "LR-2025-0123",
                                      employeeId: "EMP001",
                                      leaveType: "ANNUAL",
                                      startDate: "2025-11-20",
                                      endDate: "2025-11-22",
                                      workingDays: 3,
                                      reason: "Family trip to Da Nang",
                                      attachmentUrl: "https://s3.../ticket.pdf",
                                      status: "PENDING",
                                      approverId: "MGR005",
                                      createdAt: "2025-11-16T10:30:00Z",
                                      updatedAt: "2025-11-16T10:30:00Z"
                                    }
Leave Service -> Database: 42. INSERT leave request
Database -> Leave Service: 43. Return inserted record with ID
Leave Service -> Leave Service: 44. Log event: "Leave request created"

--- Send Notification to Manager ---
Leave Service -> Notification Service: 45. Publish to RabbitMQ:
                                           Exchange: "leave.events"
                                           Routing Key: "leave.request.created"
                                           Payload: {
                                             requestId: "LR-2025-0123",
                                             employeeId: "EMP001",
                                             employeeName: "Nguyen Van A",
                                             managerId: "MGR005",
                                             managerEmail: "manager@company.com",
                                             managerFcmToken: "fcm_token_xyz",
                                             leaveType: "ANNUAL",
                                             startDate: "2025-11-20",
                                             endDate: "2025-11-22",
                                             workingDays: 3,
                                             reason: "Family trip to Da Nang"
                                           }

Notification Service -> Notification Service: 46. Consume message từ queue
Notification Service -> Notification Service: 47. Create push notification:
                                                   {
                                                     title: "New Leave Request",
                                                     body: "Nguyen Van A requests 3 days leave",
                                                     data: {
                                                       type: "LEAVE_REQUEST",
                                                       requestId: "LR-2025-0123",
                                                       action: "REVIEW"
                                                     }
                                                   }
Notification Service -> FCM: 48. Send push notification to manager
                                  To: fcm_token_xyz
FCM -> Manager Device: 49. Deliver push notification
Manager Device -> Manager: 50. Show notification:
                               "New Leave Request"
                               "Nguyen Van A requests 3 days leave"

Notification Service -> Notification Service: 51. Create email content:
                                                   Template: "leave-request-notification"
                                                   Variables: {
                                                     managerName: "Tran Thi B",
                                                     employeeName: "Nguyen Van A",
                                                     leaveType: "Annual Leave",
                                                     dates: "20/11 - 22/11",
                                                     days: 3,
                                                     reason: "Family trip...",
                                                     approveLink: "https://app.../approve/LR-2025-0123"
                                                   }
Notification Service -> Email Service (SMTP): 52. Send email
                                                   To: manager@company.com
                                                   Subject: "[Action Required] Leave Request from Nguyen Van A"
Email Service -> Manager Email: 53. Deliver email

Notification Service -> Database: 54. Save notification record:
                                      {
                                        userId: "MGR005",
                                        type: "LEAVE_REQUEST",
                                        title: "New Leave Request",
                                        content: "Nguyen Van A...",
                                        data: { requestId: "LR-2025-0123" },
                                        read: false,
                                        createdAt: "2025-11-16T10:30:05Z"
                                      }

--- Response to Employee ---
Leave Service -> Client App: 55. Return 201 Created
                                  Body: {
                                    success: true,
                                    data: {
                                      requestId: "LR-2025-0123",
                                      status: "PENDING",
                                      message: "Leave request submitted successfully"
                                    }
                                  }
Client App -> Client App: 56. Hide loading indicator
Client App -> Client App: 57. Show success message
Client App -> Employee: 58. Display success dialog:
                             "✓ Đơn xin nghỉ đã được gửi"
                             "Mã đơn: LR-2025-0123"
                             "Chờ phê duyệt từ quản lý"
                             Button: "OK"
Client App -> Client App: 59. Navigate back to leave request list
Client App -> Client App: 60. Refresh leave request list


=== PART 2: MANAGER REVIEWS AND APPROVES ===

--- Manager Opens Notification ---
Manager -> Manager Device: 61. Tap on push notification
Manager Device -> Client App: 62. Open app và navigate to request detail
                                   Deep link: app://leave-request/LR-2025-0123

--- Fetch Request Details ---
Client App -> Leave Service: 63. GET /api/leave/requests/LR-2025-0123
                                  Header: Authorization Bearer {manager_token}
Leave Service -> Leave Service: 64. Extract managerId từ JWT
Leave Service -> Database: 65. Query leave request:
                                SELECT * FROM leave_requests WHERE id = ?
Database -> Leave Service: 66. Return leave request record
Leave Service -> Leave Service: 67. Check permission:
                                    - Manager owns this request? (approverId matches)
                                    - Or is HR admin?
Leave Service -> Employee Service: 68. GET /api/employees/EMP001
                                       Get employee full info
Employee Service -> Leave Service: 69. Return employee info:
                                       {
                                         id: "EMP001",
                                         name: "Nguyen Van A",
                                         email: "employee@company.com",
                                         department: "Engineering",
                                         position: "Senior Developer",
                                         avatar: "https://...",
                                         phone: "+84912345678"
                                       }

Leave Service -> Database: 70. Query employee's leave history:
                                SELECT * FROM leave_requests
                                WHERE employee_id = 'EMP001'
                                AND YEAR(start_date) = 2025
                                ORDER BY created_at DESC
                                LIMIT 10
Database -> Leave Service: 71. Return leave history (past requests)

Leave Service -> Database: 72. Get current leave balance
Database -> Leave Service: 73. Return balance info

Leave Service -> Client App: 74. Return 200 OK with full details:
                                  {
                                    request: {
                                      id: "LR-2025-0123",
                                      employee: { id, name, department, ... },
                                      leaveType: "ANNUAL",
                                      startDate: "2025-11-20",
                                      endDate: "2025-11-22",
                                      workingDays: 3,
                                      reason: "Family trip to Da Nang",
                                      attachmentUrl: "https://s3.../ticket.pdf",
                                      status: "PENDING",
                                      createdAt: "2025-11-16T10:30:00Z"
                                    },
                                    employeeBalance: {
                                      annualLeave: { total: 12, used: 5, remaining: 7 }
                                    },
                                    leaveHistory: [
                                      { date: "2025-10-15", days: 2, status: "APPROVED" },
                                      { date: "2025-09-05", days: 1, status: "APPROVED" }
                                    ]
                                  }

--- Display Request Details ---
Client App -> Manager: 75. Hiển thị request detail screen:
                           === Leave Request Detail ===
                           Employee: Nguyen Van A (Engineering)
                           Type: Annual Leave
                           Duration: 20/11/2025 - 22/11/2025 (3 days)
                           Reason: Family trip to Da Nang
                           Attachment: [View ticket.pdf]
                           
                           Leave Balance: 7/12 days remaining
                           (Will be 4/12 after approval)
                           
                           Recent Leave History:
                           - 15/10/2025: 2 days (Approved)
                           - 05/09/2025: 1 day (Approved)
                           
                           Buttons: [Approve] [Reject] [Request Info]

--- Manager Reviews ---
Manager -> Client App: 76. Review request details
Manager -> Client App: 77. [Optional] Tap "View ticket.pdf"
Client App -> Client App: 78. Download attachment từ S3
Client App -> Manager: 79. Open PDF viewer với attachment

Manager -> Manager: 80. Make decision: APPROVE
Manager -> Client App: 81. Tap button "Approve"
Client App -> Manager: 82. Show confirmation dialog:
                            "Approve leave request?"
                            "Employee: Nguyen Van A"
                            "Duration: 3 days (20-22/11)"
                            [Text field: Optional comment]
                            Buttons: "Confirm" | "Cancel"
Manager -> Client App: 83. [Optional] Enter comment: "Approved. Have a good trip!"
Manager -> Client App: 84. Tap "Confirm"

--- Submit Approval ---
Client App -> Leave Service: 85. PUT /api/leave/requests/LR-2025-0123/approve
                                  Header: Authorization Bearer {manager_token}
                                  Body: {
                                    comment: "Approved. Have a good trip!"
                                  }

Leave Service -> Leave Service: 86. Extract managerId từ JWT
Leave Service -> Database: 87. Get leave request
Database -> Leave Service: 88. Return request với status = "PENDING"
Leave Service -> Leave Service: 89. Validate:
                                    - Status is PENDING? ✓
                                    - Manager authorized? ✓
                                    - Request not expired? ✓

--- Update Request Status ---
Leave Service -> Leave Service: 90. Update request object:
                                    {
                                      status: "APPROVED",
                                      approvedBy: "MGR005",
                                      approvedAt: "2025-11-16T14:30:00Z",
                                      approverComment: "Approved. Have a good trip!",
                                      updatedAt: "2025-11-16T14:30:00Z"
                                    }
Leave Service -> Database: 91. UPDATE leave_requests SET ... WHERE id = ?
Database -> Leave Service: 92. Return updated record

--- Deduct Leave Balance ---
Leave Service -> Database: 93. UPDATE leave_balances
                                SET annual_leave_used = annual_leave_used + 3,
                                    annual_leave_remaining = annual_leave_remaining - 3
                                WHERE employee_id = 'EMP001' AND year = 2025
Database -> Leave Service: 94. Return updated balance

--- Update Statistics ---
Leave Service -> Reporting Service: 95. POST /api/reporting/leave/record
                                        Body: {
                                          requestId: "LR-2025-0123",
                                          employeeId: "EMP001",
                                          department: "Engineering",
                                          leaveType: "ANNUAL",
                                          workingDays: 3,
                                          startDate: "2025-11-20",
                                          endDate: "2025-11-22",
                                          status: "APPROVED",
                                          approvedAt: "2025-11-16T14:30:00Z"
                                        }
Reporting Service -> Reporting Service: 96. Update aggregated statistics:
                                            - Department leave usage
                                            - Monthly leave trends
                                            - Employee leave patterns
Reporting Service -> Database: 97. INSERT/UPDATE statistics tables
Reporting Service -> Leave Service: 98. Return 200 OK

--- Notify Employee ---
Leave Service -> Notification Service: 99. Publish to RabbitMQ:
                                           Routing Key: "leave.request.approved"
                                           Payload: {
                                             requestId: "LR-2025-0123",
                                             employeeId: "EMP001",
                                             employeeName: "Nguyen Van A",
                                             employeeEmail: "employee@company.com",
                                             employeeFcmToken: "fcm_token_abc",
                                             managerName: "Tran Thi B",
                                             leaveType: "ANNUAL",
                                             startDate: "2025-11-20",
                                             endDate: "2025-11-22",
                                             workingDays: 3,
                                             approverComment: "Approved. Have a good trip!",
                                             approvedAt: "2025-11-16T14:30:00Z"
                                           }

Notification Service -> Notification Service: 100. Consume message
Notification Service -> Notification Service: 101. Create push notification:
                                                    {
                                                      title: "✓ Leave Request Approved",
                                                      body: "Your leave request (20-22/11) has been approved",
                                                      data: {
                                                        type: "LEAVE_APPROVED",
                                                        requestId: "LR-2025-0123"
                                                      },
                                                      priority: "high",
                                                      sound: "approved.mp3"
                                                    }
Notification Service -> FCM: 102. Send push notification
FCM -> Employee Device: 103. Deliver notification
Employee Device -> Employee: 104. Show notification:
                                  "✓ Leave Request Approved"
                                  "Your leave request (20-22/11) has been approved"

Notification Service -> Notification Service: 105. Create email:
                                                    Template: "leave-approved"
                                                    Variables: {
                                                      employeeName: "Nguyen Van A",
                                                      leaveType: "Annual Leave",
                                                      dates: "20/11 - 22/11",
                                                      days: 3,
                                                      managerName: "Tran Thi B",
                                                      comment: "Approved. Have a good trip!",
                                                      remainingBalance: 4
                                                    }
Notification Service -> Email Service: 106. Send email
                                            To: employee@company.com
                                            Subject: "✓ Your Leave Request Has Been Approved"
Email Service -> Employee Email: 107. Deliver email

Notification Service -> Database: 108. Save notification to inbox

--- [Optional] Notify HR & Team ---
Leave Service -> Notification Service: 109. [If configured] Notify HR department
Notification Service -> HR Staff: 110. Send notification về leave approval
Leave Service -> Employee Service: 111. [If configured] Get team members
Employee Service -> Leave Service: 112. Return team member list
Leave Service -> Notification Service: 113. Notify team về employee's absence
Notification Service -> Team Members: 114. Send calendar event / notification

--- Response to Manager ---
Leave Service -> Client App: 115. Return 200 OK
                                   Body: {
                                     success: true,
                                     data: {
                                       requestId: "LR-2025-0123",
                                       status: "APPROVED",
                                       message: "Leave request approved successfully"
                                     }
                                   }
Client App -> Manager: 116. Show success message:
                            "✓ Leave request approved"
Client App -> Client App: 117. Update request status in list
Client App -> Client App: 118. Navigate back to pending requests list
```

### Alternative Flow: REJECTION

```
Manager -> Client App: Tap "Reject" instead of "Approve"
Client App -> Manager: Show rejection dialog:
                        "Reject leave request?"
                        [Text field: Reason (required)]
                        Buttons: "Confirm" | "Cancel"
Manager -> Client App: Enter reason: "Team is short-staffed during this period"
Manager -> Client App: Tap "Confirm"

Client App -> Leave Service: PUT /api/leave/requests/LR-2025-0123/reject
                              Body: {
                                reason: "Team is short-staffed during this period"
                              }

Leave Service -> Database: UPDATE leave_requests 
                           SET status = 'REJECTED',
                               rejected_by = 'MGR005',
                               rejected_at = NOW(),
                               rejection_reason = ?
Leave Service -> Notification Service: Publish "leave.request.rejected" event
                                       (không trừ leave balance)
Notification Service -> Employee: Send "❌ Leave Request Rejected" notification
                                  Include rejection reason
Leave Service -> Client App: Return 200 OK
Client App -> Manager: Show "Leave request rejected"
```

### Error Scenarios

**Insufficient Leave Balance:**
```
Leave Service -> Leave Service: Check balance: remaining = 2, requested = 3
Leave Service -> Client App: 400 Bad Request
                              {
                                error: "INSUFFICIENT_BALANCE",
                                message: "Not enough leave days",
                                remaining: 2,
                                requested: 3
                              }
Client App -> Employee: "Không đủ số ngày phép"
                         "Còn lại: 2 ngày, yêu cầu: 3 ngày"
```

**Overlapping Leave Request:**
```
Leave Service -> Database: Query overlapping requests
Database -> Leave Service: Found existing request (APPROVED) for 21/11 - 23/11
Leave Service -> Client App: 409 Conflict
                              {
                                error: "OVERLAPPING_REQUEST",
                                message: "You have another leave request during this period",
                                existingRequest: {
                                  id: "LR-2025-0100",
                                  dates: "21/11 - 23/11",
                                  status: "APPROVED"
                                }
                              }
Client App -> Employee: "Bạn đã có đơn nghỉ khác trong khoảng thời gian này"
                         "Đơn LR-2025-0100: 21/11 - 23/11 (Đã duyệt)"
```

**Past Date:**
```
Client App -> Client App: Validate: startDate = "2025-11-10" < today
Client App -> Employee: "Không thể tạo đơn nghỉ cho ngày trong quá khứ"
```

**Manager Not Authorized:**
```
Leave Service -> Leave Service: Check: managerId != approverId
Leave Service -> Client App: 403 Forbidden
                              { error: "NOT_AUTHORIZED",
                                message: "You are not authorized to approve this request" }
Client App -> Manager: "Bạn không có quyền phê duyệt đơn này"
```

**Request Already Processed:**
```
Leave Service -> Database: Get request với status = "APPROVED"
Leave Service -> Client App: 409 Conflict
                              {
                                error: "ALREADY_PROCESSED",
                                message: "This request has already been approved",
                                processedAt: "2025-11-16T14:30:00Z",
                                processedBy: "MGR005"
                              }
Client App -> Manager: "Đơn này đã được xử lý"
```

### Technical Details

**Leave Service (NestJS)**
- **Database**: PostgreSQL với TypeORM
- **Queue**: RabbitMQ
  - Exchange: "leave.events" (topic)
  - Queues: 
    - "leave.notifications"
    - "leave.reporting"
- **Cache**: Redis (leave balance, employee manager mapping)
- **Validation**: class-validator, class-transformer

**Leave Types**
- ANNUAL: Phép năm (12 days/year)
- SICK: Phép ốm (10 days/year, requires medical certificate if > 2 days)
- UNPAID: Nghỉ không lương (unlimited)
- MATERNITY: Thai sản (6 months for female)
- PATERNITY: Phép chăm vợ sinh (5-7 days)
- BEREAVEMENT: Tang gia (3 days)
- MARRIAGE: Cưới hỏi (3 days)

**Working Days Calculation**
```typescript
// Exclude weekends and public holidays
function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let workingDays = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sun or Sat
    const isPublicHoliday = publicHolidays.includes(currentDate.toISOString().split('T')[0]);
    
    if (!isWeekend && !isPublicHoliday) {
      workingDays++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
}
```

**Approval Workflow**
- Single-level approval: Manager only
- Multi-level approval (for > 5 days):
  1. Direct Manager
  2. Department Head
  3. HR approval
- Auto-rejection if not processed within 3 days

**Notification Channels**
1. **Push Notification**: Real-time, high priority
2. **Email**: Detailed info with action links
3. **In-app Inbox**: Persistent record
4. **SMS**: For urgent/critical notifications (optional)

**Reporting Integration**
- Real-time updates to reporting service
- Aggregated metrics:
  - Department leave usage
  - Leave type distribution
  - Approval/rejection rates
  - Average approval time
- Used for:
  - Monthly reports
  - Workforce planning
  - Compliance audits

**Performance**
- Request creation: ~200ms
- Approval processing: ~300ms
- Notification delivery: ~500ms
- Total flow: ~3-5s from submission to employee notification

**Business Rules**
- Minimum advance notice: 3 days (except sick leave)
- Maximum consecutive days: 10 days (requires HR approval if > 10)
- Cannot cancel approved leave within 24 hours of start date
- Sick leave > 2 days requires medical certificate
- Leave balance expires end of year (no carry-over, or max 5 days)

---

## 4. Push Notification Flow (Luồng Đăng Ký và Nhận Thông Báo Đẩy)

### Mô tả
Luồng đăng ký FCM token, tự động sync với device session, và nhận push notification real-time. Hệ thống tích hợp Firebase Cloud Messaging để gửi thông báo đến mobile device.

### Actors
- **User**: Người dùng (nhân viên)
- **Mobile App**: Ứng dụng Flutter
- **Auth Service**: Dịch vụ xác thực (NestJS)
- **Notification Service**: Dịch vụ thông báo (NestJS)
- **Firebase/FCM**: Firebase Cloud Messaging
- **RabbitMQ**: Message broker

### Flow Details

```
=== PART 1: APP STARTUP & FCM TOKEN REGISTRATION ===

--- App Launch ---
User -> Mobile App: 1. Mở ứng dụng lần đầu/App restart
Mobile App -> Mobile App: 2. Initialize Firebase SDK
Mobile App -> Firebase: 3. Request FCM token
Firebase -> Firebase: 4. Generate unique FCM token cho device
Firebase -> Mobile App: 5. Return FCM token "fcm_abc123xyz..."
Mobile App -> Mobile App: 6. Store FCM token in memory/local storage
Mobile App -> Mobile App: 7. Check if user đã login (có JWT token?)

--- Case 1: User chưa login ---
Mobile App -> User: 8. Navigate to Login screen
Mobile App -> Mobile App: 9. FCM token sẽ được gửi cùng login request

--- Case 2: User đã login (có JWT) ---
Mobile App -> Mobile App: 10. Validate JWT token còn hợp lệ
Mobile App -> Notification Service: 11. POST /api/push-tokens/register
                                      Header: Authorization Bearer {JWT}
                                      Body: {
                                        deviceId: "iphone_xyz_12345",
                                        token: "fcm_abc123xyz...",
                                        platform: "IOS"
                                      }
                                      // ✅ KHÔNG gửi deviceSessionId
                                      // ✅ KHÔNG gửi employeeId (có trong JWT)


=== PART 2: LOGIN WITH FCM TOKEN (Primary Flow) ===

--- User Login with FCM Token ---
User -> Mobile App: 12. Enter email + password
Mobile App -> Mobile App: 13. Validate form
Mobile App -> Mobile App: 14. Get FCM token from storage
Mobile App -> Auth Service: 15. POST /api/auth/login
                                 Body: {
                                   email: "user@company.com",
                                   password: "********",
                                   device_id: "iphone_xyz_12345",
                                   device_name: "iPhone 15 Pro",
                                   device_os: "iOS 17.2",
                                   device_model: "iPhone15,2",
                                   platform: "IOS",
                                   fcm_token: "fcm_abc123xyz...",  // ✅ Gửi FCM token
                                   app_version: "1.0.0",
                                   location: {
                                     country: "Vietnam",
                                     city: "Ho Chi Minh",
                                     lat: 10.762622,
                                     lng: 106.660172
                                   }
                                 }

Auth Service -> Auth Service: 16. Validate credentials (email + password)
Auth Service -> Database: 17. Query account by email
Database -> Auth Service: 18. Return account with employee_id = 456
Auth Service -> Auth Service: 19. Verify password với bcrypt
Auth Service -> Auth Service: 20. Generate JWT token:
                                   Payload: {
                                     sub: account_id,
                                     email: "user@company.com",
                                     employee_id: 456,  // ✅ Include employee_id
                                     role: "EMPLOYEE",
                                     permissions: [...]
                                   }

--- Create Device Session with FCM Token ---
Auth Service -> Database: 21. Upsert device_sessions:
                              {
                                account_id: 1,
                                employee_id: 456,  // ✅ From account
                                device_id: "iphone_xyz_12345",
                                device_name: "iPhone 15 Pro",
                                device_os: "iOS 17.2",
                                platform: "IOS",
                                fcm_token: "fcm_abc123xyz...",  // ✅ Store FCM token
                                fcm_token_status: "ACTIVE",
                                fcm_token_updated_at: NOW(),
                                status: "ACTIVE",
                                first_login_at: NOW(),
                                last_login_at: NOW(),
                                last_ip_address: "203.0.113.42",
                                last_location: { country, city, lat, lng },
                                app_version: "1.0.0"
                              }
                              ON CONFLICT (account_id, device_id) DO UPDATE
Database -> Auth Service: 22. Return device_session with id = 123

--- Publish Event to Notification Service ---
Auth Service -> RabbitMQ: 23. Publish event 'device_session_created'
                              Exchange: "auth.events"
                              Routing Key: "device_session.created"
                              Payload: {
                                deviceSessionId: 123,
                                accountId: 1,
                                employeeId: 456,
                                deviceId: "iphone_xyz_12345",
                                deviceName: "iPhone 15 Pro",
                                fcmToken: "fcm_abc123xyz...",
                                platform: "IOS",
                                status: "ACTIVE",
                                createdAt: "2025-11-16T10:00:00Z"
                              }

Auth Service -> Mobile App: 24. Return 200 OK
                                 Body: {
                                   success: true,
                                   data: {
                                     accessToken: "eyJhbGc...",
                                     refreshToken: "eyJhbGc...",
                                     user: {
                                       id: 1,
                                       email: "user@company.com",
                                       employee_id: 456,
                                       full_name: "Nguyen Van A",
                                       role: "EMPLOYEE"
                                     },
                                     expiresIn: 900  // 15 minutes
                                   }
                                 }

Mobile App -> Mobile App: 25. Store JWT tokens (access + refresh)
Mobile App -> Mobile App: 26. Store user info in state
Mobile App -> User: 27. Navigate to Dashboard


=== PART 3: AUTO-REGISTER FCM TOKEN (Event Processing) ===

--- Notification Service Consumes Event ---
Notification Service -> RabbitMQ: 28. Subscribe to queue "notification.device_session"
                                      Binding: "device_session.created"
RabbitMQ -> Notification Service: 29. Deliver event 'device_session_created'
Notification Service -> Notification Service: 30. Parse event payload
Notification Service -> Notification Service: 31. Validate required fields:
                                                   - employeeId: 456 ✓
                                                   - fcmToken: "fcm_abc123xyz..." ✓
                                                   - deviceId: "iphone_xyz_12345" ✓
                                                   - platform: "IOS" ✓

Notification Service -> Notification Service: 32. Map platform enum:
                                                   "IOS" → Platform.IOS

--- Register/Update Push Token ---
Notification Service -> Database: 33. Query existing push_token:
                                      SELECT * FROM push_tokens
                                      WHERE employee_id = 456
                                      AND device_id = "iphone_xyz_12345"
Database -> Notification Service: 34. Return existing token (if any)

Notification Service -> Notification Service: 35. Compare tokens:
                                                   - Existing: "fcm_old_token"
                                                   - New: "fcm_abc123xyz..."
                                                   → Different, need update

Notification Service -> Database: 36. UPSERT push_tokens:
                                      {
                                        employee_id: 456,
                                        device_id: "iphone_xyz_12345",
                                        device_session_id: 123,  // ✅ Auto-linked
                                        token: "fcm_abc123xyz...",
                                        platform: "IOS",
                                        is_active: true,
                                        last_used_at: NOW(),
                                        created_at: NOW()
                                      }
                                      ON CONFLICT (employee_id, device_id) DO UPDATE
Database -> Notification Service: 37. Return push_token record

Notification Service -> Notification Service: 38. Log success:
                                                   "FCM token registered for employee 456, device iphone_xyz_12345"

Notification Service -> RabbitMQ: 39. Acknowledge message (ACK)


=== PART 4: FCM TOKEN REFRESH (Manual Update) ===

--- FCM Token Expired/Refreshed ---
Mobile App -> Firebase: 40. Listen for token refresh event
Firebase -> Mobile App: 41. onTokenRefresh: new token "fcm_new789..."
Mobile App -> Mobile App: 42. Update FCM token in local storage
Mobile App -> Notification Service: 43. POST /api/push-tokens/register
                                      Header: Authorization Bearer {JWT}
                                      Body: {
                                        deviceId: "iphone_xyz_12345",
                                        token: "fcm_new789...",  // New token
                                        platform: "IOS"
                                      }

Notification Service -> Notification Service: 44. Extract JWT payload:
                                                   - employee_id: 456 (from JWT)
                                                   - sub: 1 (account_id)

--- Auto-sync with Device Session (Optional) ---
Notification Service -> Auth Service (RPC): 45. Send message 'get_device_session'
                                                Payload: {
                                                  employeeId: 456,
                                                  deviceId: "iphone_xyz_12345"
                                                }
Auth Service -> Database: 46. Query device_sessions:
                              WHERE employee_id = 456
                              AND device_id = "iphone_xyz_12345"
Database -> Auth Service: 47. Return device_session with id = 123
Auth Service -> Notification Service: 48. Return RPC response:
                                          {
                                            device_session_id: 123,
                                            status: "ACTIVE",
                                            last_active_at: "2025-11-16T10:00:00Z"
                                          }

--- Update Push Token ---
Notification Service -> Database: 49. UPDATE push_tokens
                                      SET token = "fcm_new789...",
                                          device_session_id = 123,
                                          last_used_at = NOW(),
                                          updated_at = NOW()
                                      WHERE employee_id = 456
                                      AND device_id = "iphone_xyz_12345"
Database -> Notification Service: 50. Return updated record

Notification Service -> Mobile App: 51. Return 201 Created
                                         {
                                           success: true,
                                           message: "Push token registered successfully",
                                           data: {
                                             id: 789,
                                             employeeId: 456,
                                             deviceId: "iphone_xyz_12345",
                                             platform: "IOS",
                                             isActive: true
                                           }
                                         }

Mobile App -> User: 52. Silent success (no UI feedback needed)


=== PART 5: SEND PUSH NOTIFICATION ===

--- Event Triggers Notification (Example: Leave Approved) ---
Leave Service -> Leave Service: 53. Manager approves leave request
Leave Service -> RabbitMQ: 54. Publish event 'leave_request_approved'
                               Payload: {
                                 requestId: "LR-2025-0123",
                                 employeeId: 456,
                                 employeeName: "Nguyen Van A",
                                 leaveType: "ANNUAL",
                                 startDate: "2025-11-20",
                                 endDate: "2025-11-22",
                                 approvedBy: "Manager Name"
                               }

Notification Service -> RabbitMQ: 55. Consume event 'leave_request_approved'

--- Check User Preferences ---
Notification Service -> Database: 56. Query notification_preferences:
                                      WHERE employee_id = 456
Database -> Notification Service: 57. Return preferences:
                                      {
                                        pushEnabled: true,  // ✅ User enabled push
                                        emailEnabled: true,
                                        inAppEnabled: true,
                                        doNotDisturbStart: "22:00",
                                        doNotDisturbEnd: "07:00"
                                      }

Notification Service -> Notification Service: 58. Check current time: 14:30
                                                   → Not in DND period (07:00-22:00)
Notification Service -> Notification Service: 59. Filter channels:
                                                   - pushEnabled: true ✓
                                                   - Not in DND ✓
                                                   → Proceed with push notification

--- Get FCM Tokens ---
Notification Service -> Database: 60. Query push_tokens:
                                      SELECT token FROM push_tokens
                                      WHERE employee_id = 456
                                      AND is_active = true
Database -> Notification Service: 61. Return active tokens:
                                      [
                                        "fcm_new789...",  // iPhone
                                        "fcm_android_abc..."  // Android tablet
                                      ]

--- Create Notification Record ---
Notification Service -> Database: 62. INSERT INTO notifications:
                                      {
                                        employee_id: 456,
                                        type: "LEAVE_APPROVED",
                                        title: "Leave Request Approved",
                                        message: "Your leave request (20-22/11) has been approved",
                                        data: {
                                          requestId: "LR-2025-0123",
                                          action: "VIEW_DETAILS"
                                        },
                                        channels: ["PUSH", "EMAIL", "IN_APP"],
                                        status: "PENDING",
                                        created_at: NOW()
                                      }
Database -> Notification Service: 63. Return notification with id = 999

--- Send via Firebase ---
Notification Service -> Notification Service: 64. Build FCM multicast message:
                                                   {
                                                     tokens: [
                                                       "fcm_new789...",
                                                       "fcm_android_abc..."
                                                     ],
                                                     notification: {
                                                       title: "Leave Request Approved",
                                                       body: "Your leave request (20-22/11) has been approved"
                                                     },
                                                     data: {
                                                       type: "LEAVE_APPROVED",
                                                       requestId: "LR-2025-0123",
                                                       notificationId: "999",
                                                       clickAction: "FLUTTER_NOTIFICATION_CLICK"
                                                     },
                                                     android: {
                                                       priority: "high",
                                                       notification: {
                                                         sound: "default",
                                                         channelId: "leave_notifications"
                                                       }
                                                     },
                                                     apns: {
                                                       payload: {
                                                         aps: {
                                                           sound: "default",
                                                           badge: 1,
                                                           contentAvailable: true
                                                         }
                                                       }
                                                     }
                                                   }

Notification Service -> Firebase Admin SDK: 65. messaging.sendMulticast(message)
Firebase Admin SDK -> Firebase Cloud Messaging: 66. Forward message to FCM
Firebase Cloud Messaging -> Firebase Cloud Messaging: 67. Route message to device platforms:
                                                           - iOS → APNs
                                                           - Android → FCM direct

--- iOS Delivery ---
Firebase Cloud Messaging -> APNs: 68. Send notification to APNs
APNs -> iOS Device (iPhone): 69. Push notification via APNs protocol
iOS Device -> iOS Device: 70. System displays notification banner
iOS Device -> User: 71. Show notification:
                         "📱 Leave Request Approved"
                         "Your leave request (20-22/11) has been approved"

--- Android Delivery ---
Firebase Cloud Messaging -> Android Device: 72. Push notification directly
Android Device -> Android Device: 73. System displays notification
Android Device -> User: 74. Show notification in notification tray

--- Handle Response ---
Firebase Admin SDK -> Notification Service: 75. Return SendResponse:
                                                {
                                                  successCount: 2,
                                                  failureCount: 0,
                                                  responses: [
                                                    { success: true, messageId: "msg_001" },
                                                    { success: true, messageId: "msg_002" }
                                                  ]
                                                }

Notification Service -> Database: 76. UPDATE notifications
                                      SET status = "SENT",
                                          sent_at = NOW(),
                                          push_sent = true
                                      WHERE id = 999

Notification Service -> Database: 77. UPDATE push_tokens
                                      SET last_used_at = NOW()
                                      WHERE token IN (...)

Notification Service -> Notification Service: 78. Log success:
                                                   "Push notification sent to 2 devices for employee 456"


=== PART 6: USER RECEIVES & INTERACTS WITH NOTIFICATION ===

--- User Taps Notification ---
User -> iOS Device: 79. Tap on notification banner
iOS Device -> Flutter App: 80. Launch app / bring to foreground
Flutter App -> Flutter App: 81. onMessageOpenedApp callback triggered
Flutter App -> Flutter App: 82. Parse notification data:
                                 {
                                   type: "LEAVE_APPROVED",
                                   requestId: "LR-2025-0123",
                                   notificationId: "999"
                                 }

Flutter App -> Flutter App: 83. Navigate based on type:
                                 LEAVE_APPROVED → LeaveRequestDetailScreen

Flutter App -> Backend API: 84. GET /api/leave/requests/LR-2025-0123
                                Header: Authorization Bearer {JWT}
Backend API -> Flutter App: 85. Return leave request details
Flutter App -> User: 86. Display leave request detail screen:
                          "✅ Your leave request has been approved"
                          "Duration: 20/11 - 22/11 (3 days)"
                          "Approved by: Manager Name"

--- Mark Notification as Read ---
Flutter App -> Notification Service: 87. PATCH /api/notifications/999/read
                                         Header: Authorization Bearer {JWT}
Notification Service -> Database: 88. UPDATE notifications
                                      SET is_read = true,
                                          read_at = NOW()
                                      WHERE id = 999
Notification Service -> Flutter App: 89. Return 200 OK

Flutter App -> Flutter App: 90. Update notification badge count
                                 (decrease unread count by 1)


=== PART 7: USER DISABLES PUSH NOTIFICATIONS ===

--- User Opens Settings ---
User -> Flutter App: 91. Navigate to Settings → Notifications
Flutter App -> Notification Service: 92. GET /api/notification-preferences
                                          Header: Authorization Bearer {JWT}
Notification Service -> Notification Service: 93. Extract employee_id from JWT: 456
Notification Service -> Database: 94. Query notification_preferences
                                      WHERE employee_id = 456
Database -> Notification Service: 95. Return current preferences:
                                      {
                                        pushEnabled: true,
                                        emailEnabled: true,
                                        inAppEnabled: true,
                                        doNotDisturbStart: "22:00",
                                        doNotDisturbEnd: "07:00"
                                      }
Notification Service -> Flutter App: 96. Return 200 OK with preferences
Flutter App -> User: 97. Display settings screen:
                          "✅ Push Notifications: ON"
                          "✅ Email Notifications: ON"
                          "✅ In-App Notifications: ON"
                          "Do Not Disturb: 22:00 - 07:00"

--- User Disables Push ---
User -> Flutter App: 98. Toggle "Push Notifications" OFF
Flutter App -> Notification Service: 99. PUT /api/notification-preferences
                                          Header: Authorization Bearer {JWT}
                                          Body: {
                                            pushEnabled: false,  // ❌ Disable push
                                            emailEnabled: true,
                                            inAppEnabled: true
                                          }
Notification Service -> Database: 100. UPDATE notification_preferences
                                       SET push_enabled = false
                                       WHERE employee_id = 456
Notification Service -> Flutter App: 101. Return 200 OK
Flutter App -> User: 102. Show toast: "Preferences saved"

--- Next Notification (Push Disabled) ---
Leave Service -> Notification Service: 103. Another event (e.g., leave reminder)
Notification Service -> Database: 104. Query preferences → pushEnabled: false
Notification Service -> Notification Service: 105. Filter channels:
                                                    - Push: ❌ Disabled by user
                                                    - Email: ✅ Enabled
                                                    - In-App: ✅ Enabled
Notification Service -> Email Service: 106. Send email notification ✅
Notification Service -> Database: 107. Save to in-app inbox ✅
Notification Service -> 🚫 SKIP Firebase push (user disabled) ❌


=== PART 8: LOGOUT & TOKEN REVOCATION ===

--- User Logout ---
User -> Flutter App: 108. Tap "Logout" button
Flutter App -> Auth Service: 109. POST /api/auth/logout
                                   Header: Authorization Bearer {JWT}
                                   Body: {
                                     deviceId: "iphone_xyz_12345"
                                   }

Auth Service -> Auth Service: 110. Extract account_id from JWT
Auth Service -> Database: 111. UPDATE device_sessions
                               SET status = "REVOKED",
                                   fcm_token_status = "EXPIRED",
                                   revoked_at = NOW(),
                                   revoked_by = account_id
                               WHERE device_id = "iphone_xyz_12345"
                               AND account_id = (from JWT)

Auth Service -> RabbitMQ: 112. Publish event 'device_session_revoked'
                               Payload: {
                                 deviceSessionId: 123,
                                 accountId: 1,
                                 employeeId: 456,
                                 deviceId: "iphone_xyz_12345",
                                 revokedAt: NOW()
                               }

Auth Service -> Database: 113. UPDATE refresh_tokens
                               SET revoked = true,
                                   revoked_at = NOW()
                               WHERE device_session_id = 123

Auth Service -> Flutter App: 114. Return 200 OK

--- Notification Service Revokes Token ---
Notification Service -> RabbitMQ: 115. Consume 'device_session_revoked'
Notification Service -> Database: 116. UPDATE push_tokens
                                       SET is_active = false,
                                           updated_at = NOW()
                                       WHERE device_session_id = 123

Notification Service -> Notification Service: 117. Log: "Push token revoked for device session 123"

--- Client Cleanup ---
Flutter App -> Flutter App: 118. Clear JWT tokens from storage
Flutter App -> Flutter App: 119. Clear user data from state
Flutter App -> Flutter App: 120. Reset notification badge count
Flutter App -> User: 121. Navigate to Login screen
```

### Error Scenarios

**FCM Token Invalid:**
```
Notification Service -> Firebase Admin SDK: Send notification
Firebase Admin SDK -> Notification Service: Return SendResponse:
                                            {
                                              successCount: 0,
                                              failureCount: 1,
                                              responses: [{
                                                success: false,
                                                error: {
                                                  code: "messaging/invalid-registration-token",
                                                  message: "Invalid FCM token"
                                                }
                                              }]
                                            }
Notification Service -> Database: UPDATE push_tokens
                                  SET is_active = false,
                                      fcm_token_status = "INVALID"
                                  WHERE token = "fcm_invalid..."
Notification Service -> Log: "Marked invalid FCM token as inactive"
```

**User Not Found:**
```
Notification Service -> Database: Query push_tokens WHERE employee_id = 999
Database -> Notification Service: Return empty array []
Notification Service -> Notification Service: Skip push notification
Notification Service -> Log: "No active push tokens found for employee 999"
```

**Firebase Service Unavailable:**
```
Notification Service -> Firebase Admin SDK: Send notification
Firebase Admin SDK -> Notification Service: Throw Error: "Firebase unavailable"
Notification Service -> Database: UPDATE notifications
                                  SET status = "FAILED",
                                      error_message = "Firebase unavailable"
Notification Service -> Queue: Enqueue retry job (exponential backoff)
Notification Service -> Log: "Firebase error, scheduled retry in 30s"
```

**Device Offline:**
```
Firebase Cloud Messaging -> Device: Cannot deliver (device offline)
Firebase Cloud Messaging -> Firebase Cloud Messaging: Store notification (TTL: 4 weeks)
Device -> Internet: Device comes online
Firebase Cloud Messaging -> Device: Deliver pending notification
Device -> User: Show notification (even hours later)
```

### Technical Details

**Firebase Cloud Messaging**
- **SDK**: firebase-admin (Node.js)
- **Authentication**: Service Account JSON key
- **Message Priority**: 
  - High: Urgent notifications (leave approved, attendance alert)
  - Normal: Regular updates (daily reports)
- **TTL (Time To Live)**: 4 weeks default
- **Batch Size**: Up to 500 tokens per multicast
- **Rate Limit**: 600,000 messages/minute

**Push Token Management**
- **Storage**: PostgreSQL `push_tokens` table
- **Indexing**: 
  - `(employee_id, device_id)` - unique constraint
  - `device_session_id` - foreign key
  - `is_active` - filter active tokens
- **Cleanup**: Inactive tokens auto-deleted after 90 days
- **Validation**: Token format validated before storage

**Notification Channels**
- **Push**: Firebase Cloud Messaging (iOS + Android)
- **Email**: SMTP service
- **In-App**: Database inbox
- **SMS**: Twilio (optional)

**User Preferences**
- **Granular Control**: Per-channel enable/disable
- **Do Not Disturb**: Time range to block notifications
- **Preferred Channels**: Priority ordering
- **Category Filters**: Per notification type settings

**Performance**
- FCM multicast: ~200-500ms for batch
- Event processing: ~100-200ms
- Total latency: ~1-2s from event to device
- Throughput: 1000+ notifications/second

**Security**
- FCM tokens encrypted at rest
- JWT required for all API calls
- Token revocation on logout/device removal
- Rate limiting: 100 requests/minute per user

**Monitoring**
- FCM delivery rate tracking
- Invalid token detection & cleanup
- Failed notification retry logic
- Push notification analytics

---

## Summary

Đây là 4 luồng core được mô tả chi tiết với:

1. **Authentication Flow**: Xác thực với JWT, token refresh, logout
2. **Face Recognition Attendance**: Nhận diện khuôn mặt, xác thực vị trí, ghi chấm công
3. **Leave Request & Approval**: Tạo đơn nghỉ phép, phê duyệt, thông báo
4. **Push Notification Flow**: Đăng ký FCM token, gửi và nhận push notification real-time

Mỗi luồng bao gồm:
- ✅ Actors và services involved
- ✅ Step-by-step flow với numbering chi tiết
- ✅ Request/Response details
- ✅ Error scenarios
- ✅ Technical implementation details
- ✅ Business rules và security measures

Bạn có thể copy toàn bộ nội dung các sequence diagram và đưa cho AI (ChatGPT, Claude) để convert sang PlantUML code!
