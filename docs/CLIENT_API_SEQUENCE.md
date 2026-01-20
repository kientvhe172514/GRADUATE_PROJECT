# 🔄 Mobile Client API Call Sequence - Production Guide

## 🌐 Production Environment

**Base URL:** `http://3.27.15.166:32527`

**Services:**
- **Attendance Service:** `http://3.27.15.166:32527/api/v1/attendance`
- **Face Recognition Service:** `http://3.27.15.166:32527/api/face-id`
- **Employee Service:** `http://3.27.15.166:32527/api/v1/employee`

**Authentication:** Bearer Token (JWT) containing `employee_id`, `employee_code`, `department_id`

---

## 📋 Prerequisites

### 1. JWT Token Structure

Mobile app nhận JWT token sau khi login:

**Response sau khi login:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "7",
    "email": "admin@gmail.com",
    "full_name": "Nguyễn Văn A",
    "role": "ADMIN"
  }
}
```

**JWT Payload (decoded):**
```json
{
  "sub": "7",                // ✅ account_id
  "employee_id": "10",       // ✅ Employee ID (QUAN TRỌNG - duy nhất có)
  "email": "admin@gmail.com",
  "role": "ADMIN",
  "permissions": ["attendance.checkin", "..."],
  "iat": 1763795867,
  "exp": 1763796767
}
```

**⚠️ QUAN TRỌNG:** 
- JWT token **CHỈ CÓ** `employee_id` (kiểu string trong token)
- JWT token **KHÔNG CÓ** `employee_code` và `department_id`
- Backend sẽ **TỰ ĐỘNG** query từ Employee Service để lấy thêm info

### 2. (Optional) Get Full Employee Profile

Nếu client muốn hiển thị thông tin employee, có thể gọi:

```http
GET http://3.27.15.166:32527/api/v1/employee/{employee_id}
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "id": 123,
  "employee_code": "EMP001",
  "full_name": "Nguyen Van A",
  "email": "nguyenvana@company.com",
  "department_id": 10,
  "department_name": "IT Department",
  "position": "Software Engineer",
  "phone": "+84901234567",
  "avatar_url": "https://cdn.example.com/avatars/123.jpg"
}
```

**💡 Lưu ý:** Các API chấm công **KHÔNG CẦN** client gửi `employee_code` và `department_id`. Backend tự động lấy từ database.

---

## 🎯 Complete Attendance Check-in Flow

> **⚠️ QUAN TRỌNG:** 
> - Client **CHỈ GỬI JWT TOKEN**, KHÔNG gửi `employee_id`, `employee_code`, `department_id`
> - Backend tự động extract `employee_id` từ JWT token
> - Backend tự động query `employee_code` và `department_id` từ Employee Service

### Sequence Diagram

```mermaid
sequenceDiagram
    participant Mobile as 📱 Mobile App
    participant Beacon as 📡 BLE Beacon
    participant API as 🌐 Attendance API<br/>(3.27.15.166:32527)
    participant EmpAPI as 👥 Employee API
    participant Face as 🤖 Face API<br/>(3.27.15.166:32527)
    participant Backend as ⚙️ Backend Services
    participant Notif as 🔔 Push Notification

    Note over Mobile: User taps "Check In"

    %% Step 1: Scan Beacon
    rect rgb(240, 248, 255)
        Note over Mobile,Beacon: STEP 1: Beacon Scanning
        Mobile->>Beacon: Scan BLE beacons
        Beacon-->>Mobile: UUID: FDA50693-A4E2-4FB1-AFCF-C6EB07647825<br/>Major: 1, Minor: 100, RSSI: -65
    end

    %% Step 2: Validate Beacon
    rect rgb(255, 250, 240)
        Note over Mobile,EmpAPI: STEP 2: Beacon Validation
        Mobile->>API: POST /api/v1/attendance/attendance-check/validate-beacon<br/>Authorization: Bearer {JWT}<br/>{<br/>  "beacon_uuid": "FDA50693...",<br/>  "beacon_major": 1,<br/>  "beacon_minor": 100,<br/>  "rssi": -65<br/>}
        
        Note over API: Extract employee_id from JWT
        API->>EmpAPI: Query employee by ID<br/>(employee_code, department_id)
        EmpAPI-->>API: Employee info
        
        API->>Backend: Validate beacon in database
        Backend-->>API: Beacon found & valid
        
        API-->>Mobile: 200 OK<br/>{<br/>  "success": true,<br/>  "session_token": "beacon_sess_123_5_...",<br/>  "expires_at": "2025-11-22T07:05:00Z",<br/>  "location_name": "Building A - Floor 1"<br/>}
        
        Note over Mobile: ✅ Save session_token<br/>(valid for 5 minutes)
    end

    %% Step 3: Get GPS
    rect rgb(240, 255, 240)
        Note over Mobile: STEP 3: Get GPS Coordinates
        Mobile->>Mobile: Request GPS location<br/>(high accuracy)
        Note over Mobile: Latitude: 10.762622<br/>Longitude: 106.660172<br/>Accuracy: 15m
    end

    %% Step 4: Request Face Verification
    rect rgb(255, 240, 245)
        Note over Mobile,EmpAPI: STEP 4: Request Face Verification
        Mobile->>API: POST /api/v1/attendance/attendance-check/request-face-verification<br/>Authorization: Bearer {JWT}<br/>{<br/>  "session_token": "beacon_sess_123_5_...",<br/>  "check_type": "check_in",<br/>  "shift_date": "2025-11-22",<br/>  "latitude": 10.762622,<br/>  "longitude": 106.660172,<br/>  "location_accuracy": 15,<br/>  "device_id": "android-abc123"<br/>}
        
        Note over API: Extract employee_id from JWT
        API->>EmpAPI: Query employee by ID<br/>(employee_code, department_id)
        EmpAPI-->>API: Employee info
        
        API->>Backend: Create attendance_check record
        Backend->>Backend: Publish face_verification_requested event
        Backend-->>API: Record created
        
        API-->>Mobile: 200 OK<br/>{<br/>  "success": true,<br/>  "attendance_check_id": 456,<br/>  "shift_id": 789,<br/>  "message": "Check-in initiated. Beacon: ✅ | GPS: ✅"<br/>}
        
        Note over Mobile: ✅ Save attendance_check_id: 456
    end

    %% Step 5: Capture Face
    rect rgb(255, 255, 240)
        Note over Mobile: STEP 5: Capture Face Image
        Mobile->>Mobile: Open front camera
        Mobile->>Mobile: Take photo (JPEG)
        Note over Mobile: Image captured<br/>(max 5MB)
    end

    %% Step 6: Upload Face
    rect rgb(240, 255, 255)
        Note over Mobile,Face: STEP 6: Face Verification
        Mobile->>Face: POST /api/face-id/attendance/verify<br/>Content-Type: multipart/form-data<br/><br/>AttendanceCheckId: 456<br/>EmployeeId: 123<br/>EmployeeCode: EMP001<br/>CheckType: check_in<br/>FaceImage: [BINARY]
        
        Face->>Backend: Extract face embedding (AI)
        Backend->>Backend: Compare with stored embedding<br/>(threshold: 0.85)
        Backend->>Backend: Publish face_verification_completed
        Backend->>Backend: Update attendance_check
        Backend->>Backend: Update employee_shift
        Backend-->>Face: Verification complete
        
        Face-->>Mobile: 200 OK<br/>{<br/>  "success": true,<br/>  "faceVerified": true,<br/>  "faceConfidence": 0.92,<br/>  "message": "Face verified: 92% confidence"<br/>}
        
        Note over Mobile: ✅ Check-in completed!
    end

    %% Step 7: Push Notification
    rect rgb(240, 240, 255)
        Note over Backend,Notif: STEP 7: Send Notification
        Backend->>Notif: Publish attendance.checked event
        Notif->>Mobile: 🔔 Push Notification<br/>"Check-in successful at 07:01"
    end
```

---

## 📡 API Endpoints with Examples

### 1️⃣ Validate Beacon

**Endpoint:**
```
POST http://3.27.15.166:32527/api/v1/attendance/attendance-check/validate-beacon
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

> **💡 Backend tự động lấy `employee_id` từ JWT token, sau đó query `employee_code` từ Employee Service.**

**Response (Success):**
```json
{
  "success": true,
  "beacon_validated": true,
  "beacon_id": 5,
  "location_name": "Building A - Floor 1",
  "distance_meters": 3.2,
  "session_token": "beacon_sess_123_5_1732252800000",
  "expires_at": "2025-11-22T07:05:00.000Z",
  "message": "Beacon validated successfully at Building A - Floor 1. You have 5 minutes to complete face verification."
}
```

**Response (Error - Beacon Not Found):**
```json
{
  "success": false,
  "beacon_validated": false,
  "session_token": "",
  "expires_at": "2025-11-22T07:00:00.000Z",
  "message": "No matching beacon found in office database"
}
```

**cURL Example:**
```bash
curl -X POST http://3.27.15.166:32527/api/v1/attendance/attendance-check/validate-beacon \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "beacon_uuid": "FDA50693-A4E2-4FB1-AFCF-C6EB07647825",
    "beacon_major": 1,
    "beacon_minor": 100,
    "rssi": -65
  }'
```

---

### 2️⃣ Request Face Verification

**Endpoint:**
```
POST http://3.27.15.166:32527/api/v1/attendance/attendance-check/request-face-verification
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

> **💡 Backend tự động lấy `employee_id` từ JWT token, sau đó query `employee_code` và `department_id` từ Employee Service.**

**Field Descriptions:**
| Field | Type | Required | Source | Description |
|-------|------|----------|--------|-------------|
| session_token | string | ✅ | Step 1 response | Session token từ beacon validation |
| check_type | enum | ✅ | User action | `"check_in"` hoặc `"check_out"` |
| shift_date | string | ✅ | Current date | Format: `"YYYY-MM-DD"` |
| latitude | number | ⚠️ | GPS | GPS latitude (recommended) |
| longitude | number | ⚠️ | GPS | GPS longitude (recommended) |
| location_accuracy | number | ⬜ | GPS | GPS accuracy in meters |
| device_id | string | ⬜ | Device info | Device unique identifier |
| ip_address | string | ⬜ | Network | Client IP (optional) |

**Response (Success):**
```json
{
  "success": true,
  "attendance_check_id": 456,
  "shift_id": 789,
  "message": "Check-in initiated. Beacon: ✅ | GPS: ✅ | Face: ⏳ (pending verification)"
}
```

**Response (Error - Session Expired):**
```json
{
  "statusCode": 400,
  "message": "Session token expired. Please scan beacon again",
  "error": "Bad Request"
}
```

**cURL Example:**
```bash
curl -X POST http://3.27.15.166:32527/api/v1/attendance/attendance-check/request-face-verification \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "beacon_sess_123_5_1732252800000",
    "check_type": "check_in",
    "shift_date": "2025-11-22",
    "latitude": 10.762622,
    "longitude": 106.660172,
    "location_accuracy": 15,
    "device_id": "android-device-abc123"
  }'
```

---

### 3️⃣ Upload Face Image

**Endpoint:**
```
POST http://3.27.15.166:32527/api/face-id/attendance/verify
```

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
| Field | Type | Required | Example | Description |
|-------|------|----------|---------|-------------|
| AttendanceCheckId | number | ✅ | 456 | Từ step 2 response |
| EmployeeId | number | ✅ | 123 | Từ JWT token |
| EmployeeCode | string | ✅ | "EMP001" | Từ JWT token |
| CheckType | string | ✅ | "check_in" | `"check_in"` hoặc `"check_out"` |
| FaceImage | file | ✅ | [BINARY] | JPEG/PNG (max 5MB) |

**Response (Success - Face Verified):**
```json
{
  "success": true,
  "faceVerified": true,
  "faceConfidence": 0.92,
  "message": "Face verified successfully with 92.0% confidence"
}
```

**Response (Error - Low Confidence):**
```json
{
  "success": true,
  "faceVerified": false,
  "faceConfidence": 0.72,
  "message": "Face verification failed - confidence 72.0% below threshold"
}
```

**cURL Example:**
```bash
curl -X POST http://3.27.15.166:32527/api/face-id/attendance/verify \
  -F "AttendanceCheckId=456" \
  -F "EmployeeId=123" \
  -F "EmployeeCode=EMP001" \
  -F "CheckType=check_in" \
  -F "FaceImage=@/path/to/face.jpg"
```

**Flutter Example:**
```dart
import 'package:http/http.dart' as http;
import 'dart:io';

Future<void> uploadFaceImage({
  required int attendanceCheckId,
  required int employeeId,
  required String employeeCode,
  required String checkType,
  required File imageFile,
}) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('http://3.27.15.166:32527/api/face-id/attendance/verify'),
  );

  request.fields['AttendanceCheckId'] = attendanceCheckId.toString();
  request.fields['EmployeeId'] = employeeId.toString();
  request.fields['EmployeeCode'] = employeeCode;
  request.fields['CheckType'] = checkType;

  request.files.add(
    await http.MultipartFile.fromPath('FaceImage', imageFile.path),
  );

  var response = await request.send();
  if (response.statusCode == 200) {
    var responseBody = await response.stream.bytesToString();
    print('Success: $responseBody');
  } else {
    print('Error: ${response.statusCode}');
  }
}
```

---

## 🔐 How to Get Employee Info from JWT

### Option 1: Decode JWT Token (Client-side)

**JWT token chỉ chứa `employee_id`**, KHÔNG có `employee_code` và `department_id`:

```dart
import 'package:jwt_decoder/jwt_decoder.dart';

Map<String, dynamic> decodeToken(String token) {
  return JwtDecoder.decode(token);
}

void main() {
  String token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
  
  Map<String, dynamic> payload = decodeToken(token);
  
  int employeeId = payload['employee_id']; // ✅ Chỉ có employee_id
  
  print('Employee ID: $employeeId');
  // ❌ Không có employee_code và department_id trong token
}
```

**❌ Client KHÔNG CẦN gọi Employee API** vì backend tự động làm việc này khi xử lý request chấm công.

---

### Option 2: Call /api/v1/employee/me (Backend Lookup)

**Endpoint:**
```
GET http://3.27.15.166:32527/api/v1/employee/me
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Employee profile retrieved successfully",
  "data": {
    "id": 123,
    "employee_code": "EMP001",
    "full_name": "Nguyen Van A",
    "email": "nguyenvana@company.com",
    "phone": "+84901234567",
    "department_id": 10,
    "department_name": "IT Department",
    "position": "Software Engineer",
    "hire_date": "2023-01-15",
    "employment_status": "ACTIVE",
    "avatar_url": "https://cdn.example.com/avatars/123.jpg"
  },
  "timestamp": "2025-11-22T07:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X GET http://3.27.15.166:32527/api/v1/employee/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📱 Complete Flutter Implementation

```dart
import 'package:flutter/material.dart';
import 'package:flutter_beacon/flutter_beacon.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:jwt_decoder/jwt_decoder.dart';
import 'dart:convert';
import 'dart:io';

class AttendanceService {
  static const String baseUrl = 'http://3.27.15.166:32527';
  final String jwtToken;
  
  late int employeeId;
  late String employeeCode;
  late int departmentId;

  AttendanceService(this.jwtToken) {
    _decodeToken();
  }

  void _decodeToken() {
    Map<String, dynamic> payload = JwtDecoder.decode(jwtToken);
    employeeId = int.parse(payload['sub']);
    employeeCode = payload['employee_code'];
    departmentId = payload['department_id'];
  }

  // Step 1: Validate Beacon
  Future<Map<String, dynamic>> validateBeacon({
    required String beaconUuid,
    required int beaconMajor,
    required int beaconMinor,
    required int rssi,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/attendance/attendance-check/validate-beacon'),
      headers: {
        'Authorization': 'Bearer $jwtToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'employee_id': employeeId,
        'employee_code': employeeCode,
        'beacon_uuid': beaconUuid,
        'beacon_major': beaconMajor,
        'beacon_minor': beaconMinor,
        'rssi': rssi,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Beacon validation failed: ${response.body}');
    }
  }

  // Step 2: Request Face Verification
  Future<Map<String, dynamic>> requestFaceVerification({
    required String sessionToken,
    required String checkType,
    required Position position,
    String? deviceId,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/attendance/attendance-check/request-face-verification'),
      headers: {
        'Authorization': 'Bearer $jwtToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'employee_id': employeeId,
        'employee_code': employeeCode,
        'department_id': departmentId,
        'session_token': sessionToken,
        'check_type': checkType,
        'shift_date': DateTime.now().toIso8601String().split('T')[0],
        'latitude': position.latitude,
        'longitude': position.longitude,
        'location_accuracy': position.accuracy,
        'device_id': deviceId ?? 'unknown',
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Face verification request failed: ${response.body}');
    }
  }

  // Step 3: Upload Face Image
  Future<Map<String, dynamic>> uploadFaceImage({
    required int attendanceCheckId,
    required String checkType,
    required File imageFile,
  }) async {
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/api/face-id/attendance/verify'),
    );

    request.fields['AttendanceCheckId'] = attendanceCheckId.toString();
    request.fields['EmployeeId'] = employeeId.toString();
    request.fields['EmployeeCode'] = employeeCode;
    request.fields['CheckType'] = checkType;

    request.files.add(
      await http.MultipartFile.fromPath('FaceImage', imageFile.path),
    );

    var response = await request.send();
    var responseBody = await response.stream.bytesToString();

    if (response.statusCode == 200) {
      return jsonDecode(responseBody);
    } else {
      throw Exception('Face upload failed: $responseBody');
    }
  }

  // Complete Check-in Flow
  Future<void> performCheckIn() async {
    try {
      // 1. Scan beacon
      print('📡 Scanning beacon...');
      // TODO: Implement beacon scanning logic
      
      // 2. Validate beacon
      print('✅ Validating beacon...');
      final beaconResult = await validateBeacon(
        beaconUuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825',
        beaconMajor: 1,
        beaconMinor: 100,
        rssi: -65,
      );
      
      String sessionToken = beaconResult['session_token'];
      print('✅ Beacon validated! Token: $sessionToken');

      // 3. Get GPS
      print('📍 Getting GPS location...');
      Position position = await Geolocator.getCurrentPosition();
      print('✅ GPS: ${position.latitude}, ${position.longitude}');

      // 4. Request face verification
      print('🎯 Requesting face verification...');
      final verifyResult = await requestFaceVerification(
        sessionToken: sessionToken,
        checkType: 'check_in',
        position: position,
      );
      
      int attendanceCheckId = verifyResult['attendance_check_id'];
      print('✅ Attendance check ID: $attendanceCheckId');

      // 5. Capture face
      print('📸 Capturing face image...');
      final picker = ImagePicker();
      final image = await picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.front,
      );

      if (image == null) {
        throw Exception('No image captured');
      }

      // 6. Upload face
      print('⬆️ Uploading face image...');
      final uploadResult = await uploadFaceImage(
        attendanceCheckId: attendanceCheckId,
        checkType: 'check_in',
        imageFile: File(image.path),
      );

      if (uploadResult['faceVerified'] == true) {
        print('✅ Check-in successful!');
        print('Confidence: ${uploadResult['faceConfidence']}');
      } else {
        print('❌ Face verification failed');
        print('Message: ${uploadResult['message']}');
      }
    } catch (e) {
      print('❌ Error: $e');
    }
  }
}

// Usage
void main() async {
  String jwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
  
  AttendanceService service = AttendanceService(jwtToken);
  await service.performCheckIn();
}
```

---

## 🧪 Testing with Postman

### Import Environment Variables

```json
{
  "name": "Attendance API - Production",
  "values": [
    {
      "key": "base_url",
      "value": "http://3.27.15.166:32527",
      "enabled": true
    },
    {
      "key": "jwt_token",
      "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "enabled": true
    },
    {
      "key": "employee_id",
      "value": "123",
      "enabled": true
    },
    {
      "key": "employee_code",
      "value": "EMP001",
      "enabled": true
    },
    {
      "key": "department_id",
      "value": "10",
      "enabled": true
    }
  ]
}
```

---

## ⚠️ Important Notes

### 1. **Backend tự động lấy thông tin từ JWT**

Client **KHÔNG CẦN** gọi riêng API `/employee/me` để lấy thông tin. Backend sẽ:
- Parse JWT token
- Extract `employee_id`, `employee_code`, `department_id`
- Tự động SELECT từ database nếu cần thêm thông tin

### 2. **Client chỉ cần gửi:**
```json
{
  "employee_id": 123,        // Từ JWT
  "employee_code": "EMP001", // Từ JWT
  "department_id": 10,       // Từ JWT
  // ... other fields
}
```

### 3. **Session Token Expiry**

⏰ **Session token có thời hạn 5 phút**. Nếu quá thời gian:
```json
{
  "statusCode": 400,
  "message": "Session token expired. Please scan beacon again"
}
```

**Solution:** Quét lại beacon từ đầu.

---

## 🚀 Swagger Documentation

**Access:** `http://3.27.15.166:32527/api/docs`

Swagger UI hiện đã có **example templates** đầy đủ cho tất cả DTOs! 🎉

---

## 📞 Support

**Issues?**
- API Documentation: http://3.27.15.166:32527/api/docs
- Backend Team: backend@company.com

---

**Generated by:** Backend Team  
**Last Updated:** November 22, 2025
