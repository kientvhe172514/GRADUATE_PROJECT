# ATTENDANCE SERVICE - PHÂN TÍCH NGHIỆP VỤ TOÀN DIỆN

## 📋 MỤC LỤC
1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Các Entity Chính](#2-các-entity-chính)
3. [Luồng Nghiệp Vụ Check-In/Check-Out](#3-luồng-nghiệp-vụ-check-incheck-out)
4. [Nghiệp Vụ GPS Tracking & Presence Verification](#4-nghiệp-vụ-gps-tracking--presence-verification)
5. [Nghiệp Vụ Phát Hiện Gian Lận GPS](#5-nghiệp-vụ-phát-hiện-gian-lận-gps)
6. [Tích Hợp RabbitMQ với Services Khác](#6-tích-hợp-rabbitmq-với-services-khác)
7. [Nghiệp Vụ Overtime Management](#7-nghiệp-vụ-overtime-management)
8. [Giải Pháp Webhook/Scheduled GPS Tracking](#8-giải-pháp-webhookscheduled-gps-tracking)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1. Mục Đích
Attendance Service quản lý toàn bộ nghiệp vụ chấm công của nhân viên với các tính năng:
- ✅ Check-in/Check-out với xác thực đa lớp (Beacon + GPS + Face Recognition)
- 🎯 GPS tracking định kỳ trong ca làm việc (Presence Verification)
- 🚨 Phát hiện gian lận GPS (Anomaly Detection)
- ⏰ Quản lý ca làm việc, overtime, violations
- 📊 Tính toán work hours, late, early leave
- 🔗 Tích hợp với Face Recognition, Employee, Leave, Notification services

### 1.2. Công Nghệ Stack
- **Backend:** NestJS + TypeScript
- **Database:** PostgreSQL
- **Message Queue:** RabbitMQ
- **Communication:** Microservices Event-Driven Architecture

---

## 2. CÁC ENTITY CHÍNH

### 2.1. AttendanceCheckRecord (Bản ghi Check-In/Out)
```typescript
{
  id: number;
  employee_id: number;
  employee_code: string;
  department_id: number;
  
  // Check info
  check_type: 'CHECK_IN' | 'CHECK_OUT';
  check_timestamp: Date;
  
  // Location
  location: string;
  latitude: number;
  longitude: number;
  
  // Validations
  is_valid: boolean;
  beacon_validated: boolean;    // ✅ iBeacon proximity verified
  gps_validated: boolean;       // ✅ GPS location verified
  face_verified: boolean;       // ✅ Face Recognition verified
  face_confidence: number;      // 0.0 - 1.0
  
  // Approval
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  
  // Metadata
  device_info: string;
  ip_address: string;
  notes: string;
}
```

**Ý nghĩa:** Mỗi lần nhân viên check-in/out tạo 1 record với 3 lớp validation:
1. **Beacon** → Xác nhận nhân viên ở gần thiết bị iBeacon văn phòng
2. **GPS** → Xác nhận tọa độ trong phạm vi cho phép
3. **Face Recognition** → Xác nhận đúng người qua nhận diện khuôn mặt

---

### 2.2. EmployeeShift (Ca Làm Việc)
```typescript
{
  id: number;
  employee_id: number;
  employee_code: string;
  department_id: number;
  shift_date: Date;
  work_schedule_id: number;
  
  // Check times
  check_in_time: Date;
  check_in_record_id: number;
  check_out_time: Date;
  check_out_record_id: number;
  
  // Schedule
  scheduled_start_time: string;  // "08:00"
  scheduled_end_time: string;    // "17:00"
  
  // Calculated hours
  work_hours: number;
  overtime_hours: number;
  break_hours: number;
  
  // Violations
  late_minutes: number;
  early_leave_minutes: number;
  
  // 🎯 PRESENCE VERIFICATION (GPS Tracking)
  presence_verification_required: boolean;
  presence_verified: boolean;
  presence_verification_rounds_completed: number;
  presence_verification_rounds_required: number;  // Thường = 3
  
  // Status
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_LEAVE' | 'ABSENT';
  
  // Approval
  approved_by: number;
  approved_at: Date;
  is_manually_edited: boolean;
}
```

**Ý nghĩa:** 
- Mỗi nhân viên có 1 shift/ngày
- Khi check-in → status = IN_PROGRESS
- Khi check-out → status = COMPLETED
- Tự động tính work_hours, late_minutes, overtime_hours

---

### 2.3. PresenceVerificationRound (GPS Tracking Round)
```typescript
{
  id: number;
  shift_id: number;
  employee_id: number;
  round_number: number;  // 1, 2, 3...
  
  // GPS Data
  latitude: number;
  longitude: number;
  location_accuracy: number;  // meters
  
  // Validation
  is_valid: boolean;
  distance_from_office_meters: number;
  distance_from_check_in_meters: number;
  validation_status: 'VALID' | 'INVALID' | 'OUT_OF_RANGE' | 'SUSPICIOUS';
  validation_reason: string;
  
  // Device Info
  device_id: string;
  battery_level: number;
  captured_at: Date;
}
```

**Ý nghĩa:** 
- Mỗi ca làm việc yêu cầu 3 rounds GPS tracking (ví dụ: 10:00, 13:00, 15:00)
- App client tự động gửi GPS location mỗi 2-3 giờ
- Server verify xem nhân viên còn ở văn phòng không
- Phát hiện: check-in rồi bỏ đi, GPS fake, teleportation

---

### 2.4. GpsAnomalyDetection (Phát Hiện Gian Lận GPS)
```typescript
{
  id: number;
  employee_id: number;
  shift_id: number;
  
  // Anomaly Info
  anomaly_type: 'TELEPORTATION' | 'OUT_OF_RANGE' | 'GPS_SPOOFING' | 'IMPOSSIBLE_SPEED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence_data: {
    locations: Array<{lat, lng, timestamp}>;
    speeds: Array<number>;  // km/h
    distances: Array<number>;  // meters
  };
  description: string;
  detected_at: Date;
  
  // Investigation
  auto_flagged: boolean;
  notified: boolean;
  requires_investigation: boolean;
  investigated_by: number;
  investigated_at: Date;
  investigation_notes: string;
  investigation_result: 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'TECHNICAL_ERROR';
}
```

**Anomaly Types:**
1. **TELEPORTATION:** Di chuyển > 100km/h giữa 2 GPS points
2. **OUT_OF_RANGE:** GPS location xa văn phòng > 1km trong ca làm
3. **GPS_SPOOFING:** Phát hiện ứng dụng fake GPS, developer mode
4. **IMPOSSIBLE_SPEED:** Tốc độ di chuyển không hợp lý (> 200km/h)

---

### 2.5. Beacon (iBeacon Device)
```typescript
{
  id: number;
  beacon_uuid: string;
  beacon_major: number;
  beacon_minor: number;
  beacon_name: string;
  department_id: number;
  
  // Location
  location_name: string;
  floor: string;
  building: string;
  room_number: string;
  latitude: number;
  longitude: number;
  
  // Configuration
  signal_range_meters: number;  // 50 meters
  rssi_threshold: number;       // -70 dBm
  
  // Status
  status: 'ACTIVE' | 'INACTIVE';
  battery_level: number;
  last_heartbeat_at: Date;
}
```

**Ý nghĩa:** Mỗi văn phòng/phòng ban có 1+ iBeacon để verify proximity

---

### 2.6. OvertimeRequest (Đơn Xin Làm Thêm Giờ)
```typescript
{
  id: number;
  employee_id: number;
  shift_id: number;
  overtime_date: Date;
  start_time: Date;
  end_time: Date;
  estimated_hours: number;
  actual_hours: number;  // Từ attendance
  reason: string;
  
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by: number;
  approved_at: Date;
  rejection_reason: string;
}
```

---

## 3. LUỒNG NGHIỆP VỤ CHECK-IN/CHECK-OUT

### 3.1. Check-In Flow (3 Bước Validation)

```
┌──────────────┐
│ STEP 1:      │
│ Validate     │  Client gửi beacon UUID + RSSI
│ Beacon       │  → Server check beacon trong database
└──────┬───────┘  → Verify RSSI signal strength (-70 dBm threshold)
       │          → Return: beacon_validated = true/false
       ↓
┌──────────────┐
│ STEP 2:      │
│ Request Face │  Client gửi GPS + device info + session_token
│ Verification │  → Server tạo AttendanceCheckRecord (status: PENDING)
└──────┬───────┘  → Gửi RabbitMQ message tới Face Recognition Service
       │          → Return: session_token + check_record_id
       ↓
┌──────────────┐
│ STEP 3:      │
│ Face         │  Face Recognition Service xác thực khuôn mặt
│ Recognition  │  → Gửi RabbitMQ event: face.verification.completed
│ Callback     │  → Attendance Service nhận event
└──────┬───────┘  → Update check record: face_verified = true, face_confidence
       │          → Tính toán validation: is_valid = beacon_validated && gps_validated && face_verified
       ↓          → Tạo/Update EmployeeShift
┌──────────────┐  → status = 'IN_PROGRESS'
│ COMPLETED    │  → presence_verification_required = true
│ Check-In     │  → presence_verification_rounds_required = 3
└──────────────┘  → Gửi notification: check-in success
```

### 3.2. Check-Out Flow
- Tương tự Check-In nhưng check_type = 'CHECK_OUT'
- Update EmployeeShift:
  - `check_out_time` = now
  - `status` = 'COMPLETED'
  - Tính toán: `work_hours`, `overtime_hours`, `late_minutes`, `early_leave_minutes`
- Gửi event: `shift.completed`
- Trigger notification nếu có violations

### 3.3. RabbitMQ Events

#### 3.3.1. Attendance → Face Recognition
```typescript
// Message: face.verification.request
{
  session_token: "uuid",
  employee_id: 123,
  employee_code: "EMP001",
  check_type: "check_in",
  check_record_id: 456,
  shift_date: "2024-01-16"
}
```

#### 3.3.2. Face Recognition → Attendance
```typescript
// Event: face.verification.completed
{
  session_token: "uuid",
  check_record_id: 456,
  verified: true,
  confidence: 0.95,
  match_employee_id: 123,
  verification_timestamp: "2024-01-16T08:05:00Z"
}
```

---

## 4. NGHIỆP VỤ GPS TRACKING & PRESENCE VERIFICATION

### 4.1. Mục Đích
**Vấn đề:** Nhân viên có thể check-in rồi rời đi, hoặc cho người khác check-in giúp.

**Giải pháp:** GPS tracking định kỳ trong ca làm việc.

### 4.2. Cơ Chế Hoạt Động

```
08:00 - CHECK-IN
  ↓
  ├─ Tạo EmployeeShift
  ├─ presence_verification_required = true
  ├─ presence_verification_rounds_required = 3
  └─ Tính toán schedule: Round 1 (10:00), Round 2 (13:00), Round 3 (15:00)

10:00 - ROUND 1 GPS CAPTURE
  ↓
  ├─ App client tự động capture GPS (background service)
  ├─ Gửi POST /attendance-check/presence-verification
  ├─ Server tạo PresenceVerificationRound
  ├─ Validate: distance_from_office < 1000m
  ├─ Check anomaly: speed, teleportation
  └─ Update: presence_verification_rounds_completed = 1

13:00 - ROUND 2 GPS CAPTURE
  (Tương tự)

15:00 - ROUND 3 GPS CAPTURE
  ↓
  └─ Update: presence_verified = true

17:00 - CHECK-OUT
  ↓
  └─ Hoàn thành ca làm việc
```

### 4.3. API Endpoint

#### POST /attendance-check/capture-presence-verification
```typescript
Request:
{
  employee_id: 123,
  shift_id: 456,
  round_number: 1,
  latitude: 21.028511,
  longitude: 105.804817,
  location_accuracy: 15,  // meters
  device_id: "device-uuid",
  battery_level: 85,
  captured_at: "2024-01-16T10:00:00Z"
}

Response:
{
  success: true,
  message: "Presence verification round 1 captured",
  data: {
    is_valid: true,
    distance_from_office_meters: 45,
    validation_status: "VALID",
    rounds_completed: 1,
    rounds_required: 3
  }
}
```

### 4.4. Validation Logic
```typescript
function validatePresenceRound(data) {
  // 1. Check distance from office
  const officeLocation = getOfficeLocation(employee.department_id);
  const distance = calculateDistance(data.latitude, data.longitude, officeLocation);
  
  if (distance > 1000) {  // 1km threshold
    return {
      is_valid: false,
      validation_status: 'OUT_OF_RANGE',
      validation_reason: `Too far from office: ${distance}m`
    };
  }
  
  // 2. Check speed (detect teleportation)
  const previousRound = getLastPresenceRound(shift_id);
  if (previousRound) {
    const speed = calculateSpeed(previousRound, data);
    if (speed > 100) {  // km/h
      createGpsAnomaly({
        anomaly_type: 'TELEPORTATION',
        severity: 'HIGH',
        evidence_data: { speed, locations: [previousRound, data] }
      });
    }
  }
  
  // 3. Check GPS accuracy
  if (data.location_accuracy > 100) {  // meters
    return {
      is_valid: false,
      validation_status: 'SUSPICIOUS',
      validation_reason: 'GPS accuracy too low'
    };
  }
  
  return {
    is_valid: true,
    validation_status: 'VALID'
  };
}
```

---

## 5. NGHIỆP VỤ PHÁT HIỆN GIAN LẬN GPS

### 5.1. Các Loại Anomaly

#### 5.1.1. TELEPORTATION
```typescript
// Detect: Di chuyển quá nhanh giữa 2 GPS points
const point1 = { lat: 21.028511, lng: 105.804817, time: "10:00" };
const point2 = { lat: 21.128511, lng: 105.904817, time: "10:05" };  // 12km away

const distance = 12000;  // meters
const timeDiff = 5;      // minutes
const speed = (distance / 1000) / (timeDiff / 60);  // 144 km/h

if (speed > 100) {
  createAnomaly({
    type: 'TELEPORTATION',
    severity: 'HIGH',
    description: `Impossible speed: ${speed} km/h`,
    evidence: { point1, point2, speed }
  });
}
```

#### 5.1.2. OUT_OF_RANGE
```typescript
// Detect: GPS location xa văn phòng trong ca làm
const shift = getCurrentShift(employee_id);
if (shift.status === 'IN_PROGRESS') {
  const distance = calculateDistance(gps_location, office_location);
  
  if (distance > 1000) {  // 1km
    createAnomaly({
      type: 'OUT_OF_RANGE',
      severity: 'MEDIUM',
      description: `Employee ${distance}m away from office during shift`,
      evidence: { gps_location, office_location, distance }
    });
  }
}
```

#### 5.1.3. GPS_SPOOFING
```typescript
// Detect: Fake GPS app, developer mode
// Kiểm tra từ client device info
if (device_info.includes('mock_location_enabled') || 
    device_info.includes('developer_mode') ||
    location_accuracy === 0) {
  createAnomaly({
    type: 'GPS_SPOOFING',
    severity: 'CRITICAL',
    description: 'GPS spoofing detected',
    evidence: { device_info, location_accuracy }
  });
}
```

### 5.2. Auto-Investigation Flow
```
Anomaly Detected
  ↓
  ├─ auto_flagged = true
  ├─ severity >= HIGH → requires_investigation = true
  └─ Gửi RabbitMQ event: attendance.anomaly.detected

Notification Service nhận event
  ↓
  └─ Gửi notification tới HR/Manager
      - Title: "GPS Anomaly Detected"
      - Message: "Employee EMP001 - Teleportation detected (144 km/h)"
      - Priority: HIGH
      - Channels: [EMAIL, IN_APP]

HR/Manager Investigation
  ↓
  ├─ Xem evidence_data
  ├─ Gọi nhân viên để hỏi
  └─ Update investigation_result:
      - CONFIRMED_FRAUD → Kỷ luật
      - FALSE_POSITIVE → Kỹ thuật lỗi
      - TECHNICAL_ERROR → GPS device lỗi
```

---

## 6. TÍCH HỢP RABBITMQ VỚI SERVICES KHÁC

### 6.1. Attendance Service - Events Published

#### 6.1.1. attendance.checked
```typescript
// Khi check-in/out thành công
{
  event: "attendance.checked",
  data: {
    check_record_id: 123,
    employee_id: 456,
    employee_code: "EMP001",
    check_type: "check_in",
    check_timestamp: "2024-01-16T08:05:00Z",
    is_valid: true,
    face_verified: true,
    face_confidence: 0.95
  }
}

// Notification Service lắng nghe → Gửi notification check-in success
```

#### 6.1.2. shift.completed
```typescript
// Khi ca làm việc hoàn thành
{
  event: "shift.completed",
  data: {
    shift_id: 789,
    employee_id: 456,
    shift_date: "2024-01-16",
    work_hours: 8.5,
    overtime_hours: 0.5,
    late_minutes: 10,
    early_leave_minutes: 0,
    has_violations: true
  }
}

// Notification Service → Gửi thông báo nếu có violations
// Reporting Service → Cập nhật attendance report
```

#### 6.1.3. attendance.anomaly.detected
```typescript
{
  event: "attendance.anomaly.detected",
  data: {
    anomaly_id: 111,
    employee_id: 456,
    anomaly_type: "TELEPORTATION",
    severity: "HIGH",
    description: "Impossible speed: 144 km/h",
    detected_at: "2024-01-16T10:15:00Z",
    requires_investigation: true
  }
}

// Notification Service → Alert HR/Manager
```

#### 6.1.4. violation.detected
```typescript
{
  event: "violation.detected",
  data: {
    violation_id: 222,
    employee_id: 456,
    violation_type: "LATE_ARRIVAL",
    severity: "MEDIUM",
    late_minutes: 30,
    shift_date: "2024-01-16"
  }
}

// Notification Service → Gửi warning
```

---

### 6.2. Attendance Service - Events Consumed

#### 6.2.1. leave.approved (từ Leave Service)
```typescript
@EventPattern('leave.approved')
handleLeaveApproved(data) {
  // Update employee shifts status = 'ON_LEAVE'
  // Từ start_date đến end_date
  const { employee_id, start_date, end_date, leave_type } = data;
  
  await updateShiftsStatus(employee_id, start_date, end_date, 'ON_LEAVE');
  
  // Không yêu cầu check-in/out trong ngày nghỉ
}
```

#### 6.2.2. leave.cancelled (từ Leave Service)
```typescript
@EventPattern('leave.cancelled')
handleLeaveCancelled(data) {
  // Revert shifts back to SCHEDULED
  const { employee_id, start_date, end_date } = data;
  
  await updateShiftsStatus(employee_id, start_date, end_date, 'SCHEDULED');
}
```

#### 6.2.3. face.verification.completed (từ Face Recognition)
```typescript
@EventPattern('face.verification.completed')
handleFaceVerificationCompleted(data) {
  const { check_record_id, verified, confidence } = data;
  
  // Update attendance check record
  await updateCheckRecord(check_record_id, {
    face_verified: verified,
    face_confidence: confidence,
    status: verified ? 'APPROVED' : 'REJECTED'
  });
  
  if (verified) {
    // Tạo/Update employee shift
    // Gửi notification success
  }
}
```

#### 6.2.4. employee.created (từ Employee Service)
```typescript
@EventPattern('employee.created')
handleEmployeeCreated(data) {
  // Tạo work schedule mặc định cho nhân viên mới
  const { employee_id, department_id, start_date } = data;
  
  await createDefaultWorkSchedule(employee_id, department_id, start_date);
}
```

#### 6.2.5. employee.department.changed (từ Employee Service)
```typescript
@EventPattern('employee.department.changed')
handleDepartmentChanged(data) {
  // Update future shifts với department_id mới
  const { employee_id, old_department_id, new_department_id } = data;
  
  await updateFutureShiftsDepartment(employee_id, new_department_id);
}
```

---

### 6.3. Communication Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        RabbitMQ                             │
└─────────────────────────────────────────────────────────────┘
     ↑                    ↑                    ↑
     │ publish            │ publish            │ subscribe
     │                    │                    │
┌────┴─────┐      ┌──────┴──────┐     ┌───────┴────────┐
│Attendance│      │    Face     │     │   Leave        │
│ Service  │      │Recognition  │     │   Service      │
└────┬─────┘      └──────┬──────┘     └───────┬────────┘
     │                    │                    │
     │ subscribe          │ subscribe          │ publish
     ↓                    ↓                    ↓
┌─────────────────────────────────────────────────────────────┐
│                   Notification Service                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. NGHIỆP VỤ OVERTIME MANAGEMENT

### 7.1. Workflow

```
1. EMPLOYEE TẠO OVERTIME REQUEST
   ↓
   POST /overtime-requests
   {
     employee_id: 123,
     overtime_date: "2024-01-16",
     start_time: "18:00",
     end_time: "20:00",
     estimated_hours: 2,
     reason: "Urgent project deadline"
   }
   → status = 'PENDING'

2. MANAGER APPROVE
   ↓
   POST /overtime-requests/:id/approve
   → status = 'APPROVED'
   → Gửi notification cho employee

3. EMPLOYEE LÀM OT (CHECK-IN/OUT)
   ↓
   - Check-in lúc 18:00 (check_type: CHECK_IN)
   - Check-out lúc 20:30 (check_type: CHECK_OUT)
   → Tính actual_hours từ attendance records

4. SYSTEM TỰ ĐỘNG CẬP NHẬT
   ↓
   - Update overtime_request.actual_hours = 2.5
   - Update employee_shift.overtime_hours = 2.5
   - Gửi event: overtime.recorded
```

---

## 8. GIẢI PHÁP WEBHOOK/SCHEDULED GPS TRACKING

### 8.1. Vấn Đề
App client cần gửi GPS định kỳ mỗi 2-3 giờ trong ca làm việc. Làm thế nào để app biết khi nào phải gửi?

### 8.2. Giải Pháp: Background Job Scheduler

#### Option 1: Server-Side Scheduling với Push Notification

```typescript
// ===== ATTENDANCE SERVICE =====

// Cron job chạy mỗi phút
@Cron(CronExpression.EVERY_MINUTE)
async checkPresenceVerificationDue() {
  const now = new Date();
  
  // Tìm các shifts đang IN_PROGRESS và cần verification
  const shifts = await this.shiftRepository.find({
    status: 'IN_PROGRESS',
    presence_verification_required: true,
    presence_verification_rounds_completed: LessThan('presence_verification_rounds_required')
  });
  
  for (const shift of shifts) {
    // Tính toán thời điểm cần capture GPS
    const nextRoundTime = calculateNextRoundTime(shift);
    
    if (isTimeDue(nextRoundTime, now)) {
      // Gửi push notification cho app client
      await this.notificationService.sendPushNotification({
        employee_id: shift.employee_id,
        title: 'GPS Verification Required',
        message: 'Please capture your location for presence verification',
        data: {
          type: 'PRESENCE_VERIFICATION_REQUEST',
          shift_id: shift.id,
          round_number: shift.presence_verification_rounds_completed + 1,
          due_time: nextRoundTime
        },
        channels: ['PUSH']
      });
    }
  }
}

function calculateNextRoundTime(shift: EmployeeShift): Date {
  const checkInTime = shift.check_in_time;
  const totalRounds = shift.presence_verification_rounds_required;
  const completedRounds = shift.presence_verification_rounds_completed;
  const workHours = 8; // hours
  
  // Chia đều rounds trong ca làm việc
  const intervalHours = workHours / (totalRounds + 1);
  const nextRoundHours = (completedRounds + 1) * intervalHours;
  
  return addHours(checkInTime, nextRoundHours);
}
```

#### Option 2: Client-Side Background Service

```typescript
// ===== FLUTTER APP =====

// Background service sử dụng WorkManager (Android) / Background Fetch (iOS)
class PresenceVerificationService {
  
  // Khi check-in thành công
  async onCheckInSuccess(checkInResponse) {
    const { shift_id, verification_schedule } = checkInResponse.data;
    
    // verification_schedule từ server: [10:00, 13:00, 15:00]
    for (const scheduledTime of verification_schedule) {
      // Schedule background task
      await WorkManager.scheduleOneTimeWork({
        taskName: `presence_verification_${shift_id}_${scheduledTime}`,
        inputData: {
          shift_id,
          round_time: scheduledTime
        },
        initialDelay: calculateDelayMinutes(scheduledTime),
        constraints: {
          requiresBatteryNotLow: false,
          requiresCharging: false,
          requiresDeviceIdle: false
        }
      });
    }
  }
  
  // Background task handler
  async handleBackgroundTask(taskData) {
    try {
      // Capture GPS location
      const location = await Geolocator.getCurrentPosition();
      
      // Gửi lên server
      await apiClient.post('/attendance-check/capture-presence-verification', {
        shift_id: taskData.shift_id,
        latitude: location.latitude,
        longitude: location.longitude,
        location_accuracy: location.accuracy,
        device_id: await getDeviceId(),
        battery_level: await getBatteryLevel(),
        captured_at: new Date().toISOString()
      });
      
      // Show local notification
      await showLocalNotification({
        title: 'Presence Verified',
        body: 'Your location has been captured successfully'
      });
      
    } catch (error) {
      // Retry mechanism
      await scheduleRetry(taskData);
    }
  }
}
```

#### Option 3: Hybrid - Server Schedule + Client Execute

```typescript
// ===== ATTENDANCE SERVICE API =====

GET /attendance-check/my-verification-schedule
Response:
{
  success: true,
  data: {
    shift_id: 789,
    current_round: 1,
    total_rounds: 3,
    next_verification_at: "2024-01-16T13:00:00Z",
    schedule: [
      { round: 1, time: "10:00", status: "COMPLETED" },
      { round: 2, time: "13:00", status: "PENDING" },
      { round: 3, time: "15:00", status: "PENDING" }
    ]
  }
}
```

```dart
// ===== FLUTTER APP =====

// Periodic check (mỗi 30 phút)
Timer.periodic(Duration(minutes: 30), (_) async {
  final schedule = await fetchVerificationSchedule();
  
  if (schedule.isVerificationDue()) {
    await captureAndSendGPS(schedule.nextRound);
  }
});
```

---

### 8.3. Recommended Solution: **Option 1 (Server Push)**

**Ưu điểm:**
- ✅ Server kiểm soát hoàn toàn schedule
- ✅ Real-time notification khi đến giờ
- ✅ Tiết kiệm pin client (không cần polling)
- ✅ Đảm bảo không miss verification

**Implementation:**

```typescript
// ===== ATTENDANCE SERVICE =====

// 1. Cron job schedule checker
@Cron('*/5 * * * *')  // Mỗi 5 phút
async schedulePresenceVerifications() {
  const now = new Date();
  const fiveMinutesLater = addMinutes(now, 5);
  
  // Tìm shifts cần verification trong 5 phút tới
  const shiftsNeedingVerification = await this.findShiftsNeedingVerification(
    now,
    fiveMinutesLater
  );
  
  for (const shift of shiftsNeedingVerification) {
    // Gửi push notification
    await this.sendVerificationReminder(shift);
  }
}

// 2. Send push notification
async sendVerificationReminder(shift: EmployeeShift) {
  const roundNumber = shift.presence_verification_rounds_completed + 1;
  
  await this.eventPublisher.publish('notification.send', {
    employee_id: shift.employee_id,
    title: `GPS Verification Round ${roundNumber}`,
    message: 'Please open the app to capture your location',
    notification_type: 'PRESENCE_VERIFICATION_REMINDER',
    priority: 'HIGH',
    channels: ['PUSH', 'IN_APP'],
    data: {
      type: 'PRESENCE_VERIFICATION',
      shift_id: shift.id,
      round_number: roundNumber,
      action: 'CAPTURE_GPS'
    }
  });
}

// 3. App client handler
// Khi nhận push notification
onNotificationReceived(notification) {
  if (notification.data.type === 'PRESENCE_VERIFICATION') {
    // Auto capture GPS
    await captureGPSAndSend(notification.data);
  }
}
```

---

### 8.4. API Endpoints Cần Thêm

#### 8.4.1. POST /attendance-check/capture-presence-verification
```typescript
Request:
{
  shift_id: 789,
  round_number: 2,
  latitude: 21.028511,
  longitude: 105.804817,
  location_accuracy: 12,
  device_id: "device-uuid-123",
  battery_level: 75,
  captured_at: "2024-01-16T13:00:00Z"
}

Response:
{
  success: true,
  message: "Presence verification round 2 captured successfully",
  data: {
    verification_round_id: 456,
    is_valid: true,
    distance_from_office_meters: 45,
    validation_status: "VALID",
    rounds_completed: 2,
    rounds_required: 3,
    next_verification_at: "2024-01-16T15:00:00Z"
  }
}
```

#### 8.4.2. GET /attendance-check/my-verification-schedule
```typescript
Response:
{
  success: true,
  data: {
    has_active_shift: true,
    shift_id: 789,
    shift_date: "2024-01-16",
    check_in_time: "08:05:00",
    current_round: 1,
    total_rounds: 3,
    next_verification_at: "2024-01-16T13:00:00Z",
    schedule: [
      {
        round: 1,
        scheduled_time: "10:00",
        status: "COMPLETED",
        captured_at: "2024-01-16T10:02:00Z",
        is_valid: true
      },
      {
        round: 2,
        scheduled_time: "13:00",
        status: "PENDING",
        is_due: true
      },
      {
        round: 3,
        scheduled_time: "15:00",
        status: "PENDING"
      }
    ]
  }
}
```

---

## 9. TỔNG KẾT WORKFLOWS

### 9.1. Complete Check-In to Check-Out Flow

```
08:00 - NHÂN VIÊN MỞ APP
  ↓
  1. Scan iBeacon → Validate proximity
  ↓
  2. Request Face Verification
     - Capture GPS
     - Gửi session_token
     - RabbitMQ → Face Recognition Service
  ↓
  3. Face Recognition
     - Verify khuôn mặt
     - RabbitMQ event: face.verification.completed
  ↓
  4. Attendance Service nhận event
     - Update check record
     - Tạo EmployeeShift
     - status = IN_PROGRESS
     - Schedule 3 GPS verification rounds
  ↓
  5. Notification Service gửi thông báo
     - "Check-in successful"

10:00 - GPS VERIFICATION ROUND 1
  ↓
  - Attendance Service cron job detect due
  - Push notification → App client
  - App auto capture GPS
  - POST /capture-presence-verification
  - Validate location
  - Update rounds_completed = 1

13:00 - GPS VERIFICATION ROUND 2
  (Tương tự)

15:00 - GPS VERIFICATION ROUND 3
  ↓
  - Update presence_verified = true

17:00 - CHECK-OUT
  ↓
  1. Scan iBeacon
  2. Face Verification
  3. Update EmployeeShift
     - check_out_time = 17:05
     - status = COMPLETED
     - Calculate: work_hours = 8.5, late_minutes = 5
  4. RabbitMQ event: shift.completed
  5. Notification: "Check-out successful"
```

### 9.2. Anomaly Detection Flow

```
GPS Tracking Round
  ↓
  ├─ Calculate speed from previous point
  ├─ Calculate distance from office
  ├─ Check GPS accuracy
  ↓
  [Anomaly Detected]
  ↓
  ├─ Create GpsAnomalyDetection record
  ├─ severity = HIGH
  ├─ auto_flagged = true
  ├─ requires_investigation = true
  ↓
  RabbitMQ event: attendance.anomaly.detected
  ↓
  Notification Service
  ↓
  ├─ Send EMAIL to HR
  ├─ Send IN_APP to Manager
  └─ Title: "GPS Anomaly - TELEPORTATION"
      Message: "Employee EMP001 detected 144 km/h movement"
```

---

## 10. CẢNH BÁO & LƯU Ý

### 10.1. Security
- ✅ Encrypt GPS coordinates khi lưu database
- ✅ Rate limiting cho GPS capture API (prevent spam)
- ✅ Validate device_id để chống multiple devices
- ✅ HTTPS only cho tất cả API endpoints

### 10.2. Privacy
- ⚠️ Chỉ track GPS trong ca làm việc (không track sau giờ)
- ⚠️ Có consent từ nhân viên về GPS tracking
- ⚠️ Cho phép nhân viên xem GPS history của họ
- ⚠️ Tự động xóa GPS data sau 6 tháng (GDPR compliance)

### 10.3. Performance
- 📊 Index database cho queries thường dùng
- 📊 Cache office location coordinates
- 📊 Batch process anomaly detection (mỗi 5 phút)
- 📊 Async processing cho RabbitMQ events

### 10.4. Battery Optimization
- 🔋 GPS capture accuracy = 50m (không cần quá chính xác)
- 🔋 Timeout = 10s cho GPS capture
- 🔋 Fallback to network location nếu GPS unavailable
- 🔋 Background service với wake lock minimal

---

## 11. NEXT STEPS - IMPLEMENTATION CHECKLIST

### Phase 1: Core Attendance (✅ DONE)
- [x] AttendanceCheckRecord entity
- [x] EmployeeShift entity
- [x] Beacon validation
- [x] Face Recognition integration

### Phase 2: GPS Tracking (🚧 TODO)
- [ ] PresenceVerificationRound entity & repository
- [ ] POST /capture-presence-verification endpoint
- [ ] GET /my-verification-schedule endpoint
- [ ] Cron job: Schedule verification reminders
- [ ] Push notification integration

### Phase 3: Anomaly Detection (🚧 TODO)
- [ ] GpsAnomalyDetection entity & repository
- [ ] Speed calculation algorithm
- [ ] Distance validation algorithm
- [ ] Auto-flagging logic
- [ ] Investigation UI for HR/Manager

### Phase 4: RabbitMQ Integration (🔧 PARTIAL)
- [x] attendance.checked event
- [x] face.verification.completed listener
- [x] leave.approved/cancelled listener
- [ ] attendance.anomaly.detected event
- [ ] shift.completed event
- [ ] violation.detected event

### Phase 5: Mobile App (📱 CLIENT)
- [ ] Background service cho GPS capture
- [ ] Push notification handler
- [ ] WorkManager/Background Fetch setup
- [ ] Local notification
- [ ] Battery optimization

---

**END OF DOCUMENT**
