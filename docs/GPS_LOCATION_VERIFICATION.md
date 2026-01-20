# 📍 GPS Location Verification - Product Documentation

## Overview

**GPS Location Verification** là tính năng xác thực vị trí địa lý của nhân viên khi chấm công, đảm bảo họ thực sự có mặt tại văn phòng hoặc trong khu vực cho phép.

### ✨ Key Features

- 🎯 **Real-time Location Tracking** - Kiểm tra vị trí thời gian thực
- 📏 **Geofencing** - Xác định ranh giới khu vực cho phép (bán kính 500m mặc định)
- 🔄 **Background GPS Monitoring** - Theo dõi vị trí ngầm mỗi 30 phút trong giờ làm
- 🚨 **Out-of-Range Alerts** - Cảnh báo tự động khi nhân viên rời khỏi khu vực
- ⚡ **High Accuracy Mode** - Độ chính xác cao (GPS + WiFi + Cell Tower)

---

## How It Works

### 1️⃣ Check-in with GPS

Khi nhân viên chấm công, ứng dụng mobile tự động:

```
📱 Mobile App
   ↓ Lấy tọa độ GPS hiện tại
   ↓ (Lat, Long, Accuracy)
   ↓
🎯 Attendance Service
   ↓ Tính khoảng cách đến văn phòng
   ↓ Distance = calculateDistance(userGPS, officeGPS)
   ↓
   ├─ ✅ Distance ≤ 500m → Check-in SUCCESS
   └─ ❌ Distance > 500m  → Check-in REJECTED
```

**Example:**
- **Văn phòng:** 21.0285°N, 105.8542°E (Hà Nội)
- **Nhân viên:** 21.0290°N, 105.8545°E
- **Khoảng cách:** ~65 meters → ✅ **Approved**

### 2️⃣ Background GPS Monitoring

Trong giờ làm việc, hệ thống tự động theo dõi vị trí:

```
⏰ Cron Job (Every 30 minutes)
   ↓ Lấy danh sách nhân viên đang làm việc
   ↓
📲 Silent Push Notification
   ↓ Đánh thức app (ngay cả khi đóng)
   ↓
📍 App gửi GPS lên server
   ↓
🔍 Validation
   ├─ ✅ In range  → Log verification record
   └─ ❌ Out range → 🚨 Alert notification
```

**Timeline Example:**
- **9:00 AM** - Check-in tại văn phòng ✅
- **9:30 AM** - GPS check: Still at office ✅
- **10:00 AM** - GPS check: Still at office ✅
- **12:00 PM** - GPS check: Moved 800m away ❌ → **Alert sent!**

---

## Configuration

### Geofence Settings

Quản trị viên có thể tùy chỉnh:

| Setting | Default | Description |
|---------|---------|-------------|
| **Radius** | 500m | Bán kính cho phép từ văn phòng |
| **Check Interval** | 30 min | Tần suất kiểm tra GPS ngầm |
| **GPS Accuracy Threshold** | 50m | Độ chính xác GPS tối thiểu |
| **Working Hours** | 8AM-6PM | Khung giờ kiểm tra GPS |

### Office Location Setup

```javascript
{
  "office_name": "Head Office - Hanoi",
  "latitude": 21.0285,
  "longitude": 105.8542,
  "allowed_radius_meters": 500,
  "timezone": "Asia/Ho_Chi_Minh"
}
```

---

## User Experience

### ✅ Successful Check-in

```
📱 Màn hình hiển thị:
┌─────────────────────────────┐
│ ✓ Check-in Success!         │
│                             │
│ 📍 Location: Verified       │
│ 📏 Distance: 65m from office│
│ ⏰ Time: 08:45 AM           │
│                             │
│ [View Details]              │
└─────────────────────────────┘
```

### ❌ Out-of-Range Rejection

```
📱 Màn hình hiển thị:
┌─────────────────────────────┐
│ ✗ Check-in Failed           │
│                             │
│ 📍 Location: Out of range   │
│ 📏 Distance: 1.2km          │
│ ℹ️ You must be within 500m  │
│    of the office            │
│                             │
│ [Try Again] [Contact HR]    │
└─────────────────────────────┘
```

### 🚨 Out-of-Range Alert (Background Monitoring)

```
🔔 Push Notification:
┌─────────────────────────────┐
│ ⚠️ Location Alert           │
│                             │
│ You are currently outside   │
│ the office area (800m away) │
│                             │
│ Please return to office or  │
│ contact your manager        │
└─────────────────────────────┘
```

---

## Benefits

### For Employees
- 🎯 **Transparent** - Biết rõ vị trí được chấp nhận
- ⚡ **Fast** - Check-in nhanh chóng (< 3 giây)
- 🔒 **Privacy** - GPS chỉ được dùng trong giờ làm
- 📱 **Seamless** - Không cần thao tác thủ công

### For Employers
- ✅ **Accurate** - Đảm bảo nhân viên có mặt tại văn phòng
- 📊 **Audit Trail** - Lưu lịch sử vị trí để kiểm tra
- 🚨 **Real-time Alerts** - Phát hiện vi phạm ngay lập tức
- 📈 **Reports** - Báo cáo thống kê vị trí theo thời gian

---

## Technical Specifications

### GPS Accuracy
- **Best Case:** ±5 meters (clear sky, outdoor)
- **Good Case:** ±10-20 meters (urban area)
- **Acceptable:** ±30-50 meters (indoor with WiFi)
- **Poor:** >50 meters (rejected by system)

### Distance Calculation
Sử dụng **Haversine Formula** để tính khoảng cách giữa 2 điểm GPS:

```
distance = 2 × R × arcsin(√(sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlong/2)))

where:
  R = Earth radius (6371 km)
  Δlat = lat2 - lat1
  Δlong = long2 - long1
```

### Battery Impact
- **Check-in:** ~0.1% battery per check
- **Background monitoring:** ~1-2% battery per hour
- **Optimization:** GPS chỉ active khi cần, sử dụng WiFi/Cell Tower khi có thể

---

## Privacy & Security

### Data Protection
- 🔐 GPS data được **encrypt** khi truyền (HTTPS/TLS)
- 🗄️ Lưu trữ theo **GDPR compliance**
- ⏰ Tự động **xóa sau 90 ngày** (configurable)
- 👁️ Chỉ HR và Manager được xem lịch sử

### Permissions Required
```
📱 iOS/Android Permissions:
- ✓ Location (When In Use)
- ✓ Location (Always) - for background monitoring
- ✓ Notifications - for alerts
```

### User Consent
- Nhân viên phải **đồng ý** khi cài app
- Có thể **tắt background GPS** (nhưng cần thông báo HR)
- Xem lịch sử GPS của chính mình bất kỳ lúc nào

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "GPS not available" | Location service tắt | Bật Location trong Settings |
| "Low accuracy" | Indoor, poor signal | Di chuyển ra cửa sổ/outdoor |
| "Check-in failed" | Out of range | Đảm bảo trong bán kính 500m |
| "No GPS updates" | Background permission denied | Cấp quyền "Always Allow" |

### Debug Mode
Quản trị viên có thể bật **Debug Mode** để xem:
- Real-time GPS coordinates
- Distance calculation
- GPS accuracy level
- Verification logs

---

## Integration

### Mobile App (Flutter/React Native)

```dart
// Example: Check-in with GPS
final position = await Geolocator.getCurrentPosition(
  desiredAccuracy: LocationAccuracy.high,
);

final response = await http.post(
  '/api/v1/attendance/check-in',
  body: {
    'latitude': position.latitude,
    'longitude': position.longitude,
    'accuracy': position.accuracy,
  },
);
```

### API Endpoints

```
POST /api/v1/attendance/check-in
Body: {
  "latitude": 21.0285,
  "longitude": 105.8542,
  "accuracy": 10.5,
  "timestamp": "2025-12-12T08:45:00Z"
}

Response: {
  "success": true,
  "distance_from_office_meters": 65,
  "verified": true,
  "check_in_time": "2025-12-12T08:45:00Z"
}
```

---

## Compliance

- ✅ **GDPR** - Right to access, delete GPS data
- ✅ **Vietnamese Labor Law** - GPS tracking only during work hours
- ✅ **ISO 27001** - Security best practices
- ✅ **OWASP** - API security standards

---

## Support

For more technical details, see:
- [CLIENT_GPS_WEBHOOK_SETUP.md](./CLIENT_GPS_WEBHOOK_SETUP.md) - Integration guide
- [CLIENT_ATTENDANCE_FLOW.md](./CLIENT_ATTENDANCE_FLOW.md) - Complete attendance flow

**Questions?** Contact support@graduate-project.com

---

**Last Updated:** December 12, 2025  
**Version:** 1.0.0  
**Status:** Production Ready 🚀
