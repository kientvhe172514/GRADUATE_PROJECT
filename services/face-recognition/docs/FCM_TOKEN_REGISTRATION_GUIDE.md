# FCM Token Registration API Guide

## 📋 Tổng quan

API này cho phép mobile app đăng ký FCM token với server để nhận push notifications. API sẽ tự động tạo device mới hoặc cập nhật device existing dựa trên Android ID.

## 🚀 API Endpoints

### 1. Đăng ký FCM Token

**POST** `/api/device-tokens/register-fcm`

#### Request Body:

```json
{
  "userId": "00000000-0000-0000-0000-000000000000",
  "androidId": "device_android_id_123",
  "fcmToken": "fcm_token_from_firebase_456",
  "platform": "android",
  "deviceName": "Samsung Galaxy S23",
  "model": "SM-S918B",
  "manufacturer": "Samsung",
  "osVersion": "Android 14",
  "appVersion": "1.0.0"
}
```

#### Response:

```json
{
  "success": true,
  "data": {
    "deviceId": "11111111-1111-1111-1111-111111111111",
    "userId": "00000000-0000-0000-0000-000000000000",
    "androidId": "device_android_id_123",
    "fcmToken": "fcm_token_from_firebase_456",
    "platform": "android",
    "status": "Created",
    "registeredAt": "2024-01-15T10:30:00Z",
    "message": "New device created and FCM token registered successfully"
  }
}
```

### 2. Kiểm tra FCM Token Status

**GET** `/api/device-tokens/fcm-status?userId={userId}&androidId={androidId}`

#### Response:

```json
{
  "success": true,
  "data": {
    "userId": "00000000-0000-0000-0000-000000000000",
    "androidId": "device_android_id_123",
    "hasFcmToken": true,
    "lastUpdated": "2024-01-15T10:30:00Z",
    "status": "Active"
  }
}
```

## 🔧 Logic hoạt động

### Khi đăng ký FCM token:

1. **Tìm device existing**: Server tìm device theo Android ID
2. **Nếu tìm thấy**: Cập nhật FCM token và thông tin device
3. **Nếu không tìm thấy**: Tạo device mới với FCM token

### Các trường bắt buộc:

- `userId`: ID của user
- `androidId`: Android ID của device (để định danh device)
- `fcmToken`: FCM token từ Firebase
- `platform`: Platform của device (android/ios)

### Các trường tùy chọn:

- `deviceName`: Tên device
- `model`: Model của device
- `manufacturer`: Nhà sản xuất
- `osVersion`: Phiên bản OS
- `appVersion`: Phiên bản app

## 📱 Mobile App Integration

### 1. Lấy FCM Token từ Firebase:

```typescript
import messaging from "@react-native-firebase/messaging";

const getFcmToken = async () => {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error("Failed to get FCM token:", error);
    return null;
  }
};
```

### 2. Đăng ký FCM Token với Server:

```typescript
const registerFcmToken = async (fcmToken: string) => {
  try {
    const response = await fetch("/api/device-tokens/register-fcm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: currentUserId,
        androidId: deviceAndroidId,
        fcmToken: fcmToken,
        platform: "android",
        deviceName: deviceInfo.deviceName,
        model: deviceInfo.model,
        manufacturer: deviceInfo.manufacturer,
        osVersion: deviceInfo.osVersion,
        appVersion: appVersion,
      }),
    });

    const result = await response.json();
    if (result.success) {
      console.log("FCM token registered successfully");
    }
  } catch (error) {
    console.error("Failed to register FCM token:", error);
  }
};
```

### 3. Xử lý FCM Token Refresh:

```typescript
// Lắng nghe khi FCM token được refresh
messaging().onTokenRefresh((token) => {
  // Đăng ký token mới với server
  registerFcmToken(token);
});
```

## 🧪 Testing

### Sử dụng PowerShell script:

```powershell
# Test với tham số mặc định
.\scripts\test-fcm-token-registration.ps1

# Test với tham số tùy chỉnh
.\scripts\test-fcm-token-registration.ps1 -ApiUrl "https://your-api.com" -UserId "your-user-id"
```

### Sử dụng Postman/Insomnia:

1. Import collection từ `docs/postman-collection.json`
2. Cập nhật base URL
3. Chạy test cases

## ⚠️ Lưu ý quan trọng

1. **Android ID**: Phải là duy nhất cho mỗi device
2. **FCM Token**: Có thể thay đổi khi app reinstall hoặc device reset
3. **User ID**: Phải là user đã đăng nhập hợp lệ
4. **Rate Limiting**: API có giới hạn request để tránh spam

## 🔒 Security

- API yêu cầu authentication (JWT token)
- Android ID được validate để tránh duplicate
- FCM token được lưu trữ an toàn trong database

## 📚 Tài liệu liên quan

- [Firebase Cloud Messaging Setup](https://firebase.google.com/docs/cloud-messaging)
- [SignalR Notification Hub](./SIGNALR_NOTIFICATION_HUB.md)
- [Device Management API](../DeviceManagement/README.md)

## 🆘 Troubleshooting

### Lỗi thường gặp:

1. **400 Bad Request**: Kiểm tra các trường bắt buộc
2. **401 Unauthorized**: Kiểm tra JWT token
3. **500 Internal Server Error**: Liên hệ admin để kiểm tra logs

### Debug:

- Kiểm tra server logs
- Sử dụng test script để verify API
- Kiểm tra Firebase configuration
