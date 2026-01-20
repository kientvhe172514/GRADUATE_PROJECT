# Core Sequence Diagrams - Simplified Version

Tài liệu mô tả 3 luồng nghiệp vụ chính của hệ thống (simplified for diagram drawing).

---

## 1. Authentication Flow

### Actors
- User, Client App, Auth Service, Database, RabbitMQ, Notification Service

### Flow

```
User -> Client App: Enter email + password
Client App -> Auth Service: POST /api/auth/login
                             { email, password, device_id, fcm_token, platform }

Auth Service -> Database: Query account + Verify password
Auth Service -> Database: INSERT device_sessions { fcm_token, employee_id }
Database -> Auth Service: Return device_session_id

Auth Service -> RabbitMQ: Publish 'device_session_created'
                           { employeeId, deviceId, fcmToken, platform }

RabbitMQ -> Notification Service: Deliver to notification_queue

Notification Service -> Database: UPSERT push_tokens
                                   ON CONFLICT (employee_id, device_id) DO UPDATE

Auth Service -> Client App: Return { accessToken, refreshToken, user }
Client App -> User: Navigate to Dashboard
```

### Error Cases

**Invalid Credentials:**
```
Auth Service -> Client App: 401 Unauthorized
                             { message: "Invalid username or password" }
```

**Account Blocked:**
```
Auth Service -> Client App: 403 Forbidden
                             { message: "Account has been blocked" }
```

---

## 2. Face Recognition Attendance Flow

### Actors
- Employee, Mobile App, Face Recognition Service, Attendance Service, RabbitMQ, Notification Service, FCM

### Flow

```
Employee -> Mobile App: Tap "Check In"

Mobile App -> Mobile App: Get GPS location
Mobile App -> Mobile App: Scan nearby Bluetooth beacons

Mobile App -> Attendance Service: Check beacons
                                   { beaconIds: ["beacon-office-001"], location }

Attendance Service -> Database: Verify beacons belong to office
Database -> Attendance Service: Valid ✓ (Office beacons detected)

Mobile App -> Mobile App: Capture face image
Mobile App -> Face Recognition Service: POST /api/face-recognition/verify
                                         { employeeId, image: base64 }

Face Recognition Service -> Face Recognition Service: Detect face (MTCNN)
Face Recognition Service -> Face Recognition Service: Extract embedding (FaceNet 128-dim)
Face Recognition Service -> Database: Query stored embeddings
Face Recognition Service -> Face Recognition Service: Calculate similarity (Cosine)
Face Recognition Service -> Face Recognition Service: Compare threshold >= 0.6 ✓

Face Recognition Service -> Attendance Service: Matched { similarity: 0.85, employeeId }

Attendance Service -> Attendance Service: Validate location (< 100m) ✓
Attendance Service -> Attendance Service: Check shift & duplicate
Attendance Service -> Database: INSERT attendance_records
                                 { employee_id, check_in_time, status: "ON_TIME", similarity: 0.85 }

Attendance Service -> RabbitMQ: Publish 'attendance.checked-in'

RabbitMQ -> Notification Service: Deliver event
Notification Service -> Database: Query push_tokens
Notification Service -> FCM: Send push notification
                              { title: "Check-in thành công", body: "08:15 - Đúng giờ" }

FCM -> Mobile Device: Deliver notification
Attendance Service -> Mobile App: Return { id, checkInTime, status: "ON_TIME" }
Mobile App -> Employee: Show "✓ Check-in thành công!"
```

### Error Cases

**No Beacons Detected:**
```
Attendance Service -> Mobile App: 400 Bad Request { error: "NO_BEACONS_DETECTED" }
```

**Face Not Matched:**
```
Face Recognition Service -> Mobile App: 400 Bad Request { similarity: 0.45 < 0.6 }
```

**Location Too Far:**
```
Attendance Service -> Mobile App: 400 Bad Request { distance: 250m > 100m }
```

**Already Checked In:**
```
Attendance Service -> Mobile App: 409 Conflict { existingCheckIn: "08:15:00" }
```

---

## 3. Leave Request & Approval Flow

### Actors
- Employee, Manager, Client App, Leave Service, Employee Service, RabbitMQ, Notification Service, FCM

### Flow

```
=== EMPLOYEE CREATES REQUEST ===

Employee -> Client App: Navigate to "Leave Request"
Client App -> Leave Service: GET /api/leave/balance
Leave Service -> Database: Query leave_balances (remaining: 7 days)
Client App -> Employee: Show "Phép năm: 7/12 ngày"

Employee -> Client App: Submit form
                         { type: ANNUAL, dates: 20-22/11, workingDays: 3 }

Client App -> Leave Service: POST /api/leave/requests
                              { leaveType, startDate, endDate, reason }

Leave Service -> Database: Check overlapping requests (none) ✓
Leave Service -> Database: Validate balance (7 >= 3) ✓
Leave Service -> Employee Service: Get manager info
Leave Service -> Database: INSERT leave_requests { status: PENDING, approver_id }

Leave Service -> RabbitMQ: Publish 'leave.request.created'
                            { requestId: "LR-2025-0123", employeeId, approverId }

RabbitMQ -> Notification Service: Deliver event
Notification Service -> Database: Query manager's push_tokens
Notification Service -> FCM: Send to manager
                              { title: "New Leave Request", body: "3 days leave" }

Leave Service -> Client App: Return { id, status: PENDING }
Client App -> Employee: Show "✓ Đơn đã được gửi"


=== MANAGER APPROVES ===

Manager -> Client App: Tap notification
Client App -> Leave Service: GET /api/leave/requests/LR-2025-0123
Leave Service -> Database: Query request details
Leave Service -> Client App: Return { request, employee, leaveHistory }

Manager -> Client App: Tap "Approve" + Enter comment
Client App -> Leave Service: PUT /api/leave/requests/LR-2025-0123/approve
                              { comment: "Approved. Have a good trip!" }

Leave Service -> Database: UPDATE status = "APPROVED"
Leave Service -> Database: UPDATE leave_balances (used + 3)

Leave Service -> RabbitMQ: Publish 'leave.request.approved'

RabbitMQ -> Notification Service: Deliver event
Notification Service -> Database: Query employee's push_tokens
Notification Service -> FCM: Send to employee
                              { title: "✓ Leave Approved", body: "20-22/11 approved" }

Leave Service -> Client App: Return { status: APPROVED }
Client App -> Manager: Show "✓ Approved"
```

### Alternative Flow: Rejection

```
Manager -> Client App: Tap "Reject" + Enter reason
Client App -> Leave Service: PUT /reject { reason: "Team short-staffed" }
Leave Service -> Database: UPDATE status = "REJECTED" (NO balance deduct)
Leave Service -> RabbitMQ: Publish 'leave.request.rejected'
Notification Service -> Employee: "❌ Leave Rejected"
```

### Error Cases

**Insufficient Balance:**
```
Leave Service -> Client App: 400 { error: "INSUFFICIENT_BALANCE", remaining: 2, requested: 3 }
```

**Overlapping Request:**
```
Leave Service -> Client App: 409 { error: "OVERLAPPING_REQUEST", existing: {...} }
```

**Not Authorized:**
```
Leave Service -> Client App: 403 { error: "NOT_AUTHORIZED" }
```

---

## Technical Notes

### Authentication Flow
- **JWT Expiry**: Access 15min, Refresh 7 days
- **Password**: bcrypt salt rounds = 10
- **Device Session**: Links JWT with FCM token
- **Event**: `device_session_created` auto-registers push token

### Face Recognition Attendance
- **Model**: FaceNet (128-dim embeddings)
- **Threshold**: 0.6 for matching
- **Distance**: Haversine formula, max 100m
- **Performance**: ~1-2s total flow
- **Anti-spoofing**: Liveness detection

### Leave Request & Approval
- **Leave Types**: ANNUAL (12/year), SICK (10/year), UNPAID, MATERNITY
- **Working Days**: Exclude weekends + public holidays
- **Approval**: Single-level (manager only)
- **Balance**: Auto-deduct on approval
- **Notification**: Push + Email + In-app

### RabbitMQ Events
- `device_session_created` → notification_queue
- `attendance.checked-in` → notification_queue
- `leave.request.created` → notification_queue
- `leave.request.approved` → notification_queue
- `leave.request.rejected` → notification_queue

### Push Notification
- **Platform**: Firebase Cloud Messaging (FCM)
- **Storage**: push_tokens table
- **Auto-sync**: Via device_session_created event
- **Cleanup**: Invalid tokens marked inactive
- **Multicast**: Up to 500 tokens per batch

---

## Conclusion

3 luồng core này đủ ngắn để vẽ sequence diagram nhưng vẫn giữ đầy đủ logic nghiệp vụ:

1. **Auth**: Login → JWT → Device Session → FCM Registration
2. **Attendance**: Face Capture → Verify → Record → Notify
3. **Leave**: Request → Manager Review → Approve/Reject → Notify

Mỗi flow có error cases và technical details để reference khi cần.
