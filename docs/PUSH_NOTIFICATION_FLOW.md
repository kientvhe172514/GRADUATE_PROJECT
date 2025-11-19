# 📱 LUỒNG PUSH NOTIFICATION CHI TIẾT

## 📋 Mục lục
1. [Tổng quan](#tổng-quan)
2. [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
3. [Luồng đăng ký FCM Token](#luồng-đăng-ký-fcm-token)
4. [Luồng gửi Push Notification](#luồng-gửi-push-notification)
5. [Luồng nhận Notification trên App](#luồng-nhận-notification-trên-app)
6. [Data Structure](#data-structure)
7. [Sequence Diagrams](#sequence-diagrams)

---

## Tổng quan

Push Notification Flow trong hệ thống HR sử dụng **Firebase Cloud Messaging (FCM)** để gửi thông báo realtime đến mobile app.

### Các thành phần chính:
- **Backend (NestJS)**: Xử lý business logic và gửi notification qua Firebase
- **Firebase Cloud Messaging**: Service trung gian để push notification
- **Mobile App (Flutter)**: Nhận và hiển thị notification cho user

### Flow tổng quát:
```
Backend → Firebase Admin SDK → Firebase Cloud Messaging → 
APNs/FCM → Mobile Device → Flutter App
```

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (NestJS)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐      ┌──────────────────┐                │
│  │   Event Occur   │─────→│ Send Notification│                │
│  │ (Leave Approved)│      │    Use Case      │                │
│  └─────────────────┘      └────────┬─────────┘                │
│                                     │                           │
│                                     ▼                           │
│              ┌──────────────────────────────────┐              │
│              │  Filter by User Preferences      │              │
│              └──────────────┬───────────────────┘              │
│                             │                                   │
│                             ▼                                   │
│              ┌──────────────────────────────────┐              │
│              │   Save to Database (IN_APP)      │              │
│              └──────────────┬───────────────────┘              │
│                             │                                   │
│                             ▼                                   │
│              ┌──────────────────────────────────┐              │
│              │  Get User's FCM Tokens from DB   │              │
│              └──────────────┬───────────────────┘              │
│                             │                                   │
│                             ▼                                   │
│              ┌──────────────────────────────────┐              │
│              │ Firebase Admin SDK - sendMulticast│             │
│              └──────────────┬───────────────────┘              │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FIREBASE CLOUD MESSAGING                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
           ┌─────────────┐      ┌─────────────┐
           │    APNs     │      │     FCM     │
           │   (iOS)     │      │  (Android)  │
           └──────┬──────┘      └──────┬──────┘
                  │                    │
                  ▼                    ▼
           ┌─────────────┐      ┌─────────────┐
           │ iOS Device  │      │Android Device│
           └──────┬──────┘      └──────┬──────┘
                  │                    │
                  └──────────┬─────────┘
                             │
                             ▼
                  ┌──────────────────┐
                  │   Flutter App    │
                  └──────────────────┘
```

---

## Luồng đăng ký FCM Token

### Scenario 1: User đăng nhập lần đầu

```
┌─────────┐           ┌─────────┐           ┌──────────┐           ┌─────────┐
│  User   │           │   App   │           │ Backend  │           │Firebase │
└────┬────┘           └────┬────┘           └────┬─────┘           └────┬────┘
     │                     │                     │                      │
     │  1. Login           │                     │                      │
     │────────────────────→│                     │                      │
     │                     │                     │                      │
     │                     │  2. POST /auth/login│                      │
     │                     │────────────────────→│                      │
     │                     │                     │                      │
     │                     │  3. Return JWT      │                      │
     │                     │←────────────────────│                      │
     │                     │                     │                      │
     │                     │  4. Initialize Firebase                    │
     │                     │───────────────────────────────────────────→│
     │                     │                     │                      │
     │                     │  5. Request Permission                     │
     │                     │───────────────────────────────────────────→│
     │                     │                     │                      │
     │  6. Allow?          │                     │                      │
     │←────────────────────│                     │                      │
     │                     │                     │                      │
     │  7. Allow           │                     │                      │
     │────────────────────→│                     │                      │
     │                     │                     │                      │
     │                     │  8. Get FCM Token   │                      │
     │                     │───────────────────────────────────────────→│
     │                     │                     │                      │
     │                     │  9. Return Token    │                      │
     │                     │←───────────────────────────────────────────│
     │                     │                     │                      │
     │                     │ 10. POST /push-tokens/register             │
     │                     │     {                │                      │
     │                     │       token: "fcm_xxx",                    │
     │                     │       deviceType: "ANDROID",               │
     │                     │       deviceId: "device_123"               │
     │                     │     }                │                      │
     │                     │────────────────────→│                      │
     │                     │                     │                      │
     │                     │                     │ 11. Save to DB       │
     │                     │                     │      push_tokens     │
     │                     │                     │      table           │
     │                     │                     │                      │
     │                     │ 12. Success Response│                      │
     │                     │←────────────────────│                      │
     │                     │                     │                      │
```

**Chi tiết các bước:**

1. **User nhập username/password và login**

2. **App gửi request đến Backend:**
   ```http
   POST /api/v1/auth/login
   Content-Type: application/json
   
   {
     "username": "john.doe",
     "password": "password123"
   }
   ```

3. **Backend trả về JWT token:**
   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "refresh_token": "...",
     "expires_in": 3600
   }
   ```

4. **App initialize Firebase:**
   ```dart
   await Firebase.initializeApp();
   ```

5. **App request notification permission:**
   ```dart
   NotificationSettings settings = await FirebaseMessaging.instance.requestPermission(
     alert: true,
     badge: true,
     sound: true,
   );
   ```

6-7. **User cho phép notification**

8-9. **App lấy FCM Token từ Firebase:**
   ```dart
   String? token = await FirebaseMessaging.instance.getToken();
   // token = "fN3BxYz3QK2:APA91bH..."
   ```

10. **App đăng ký token với Backend:**
    ```http
    POST /api/v1/notification/push-tokens/register
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    Content-Type: application/json
    
    {
      "token": "fN3BxYz3QK2:APA91bH...",
      "deviceType": "ANDROID",
      "deviceId": "abc123xyz"
    }
    ```

11. **Backend lưu vào database:**
    ```sql
    INSERT INTO push_tokens (user_id, token, device_type, device_id, is_active)
    VALUES (123, 'fN3BxYz3QK2:APA91bH...', 'ANDROID', 'abc123xyz', true);
    ```

12. **Backend trả về success:**
    ```json
    {
      "status": "success",
      "message": "Push token registered successfully",
      "data": {
        "id": 456,
        "userId": 123,
        "deviceType": "ANDROID"
      }
    }
    ```

---

### Scenario 2: User đăng nhập lần sau (cùng device)

```
┌─────────┐           ┌─────────┐           ┌──────────┐
│   App   │           │ Backend  │           │ Database │
└────┬────┘           └────┬─────┘           └────┬─────┘
     │                     │                      │
     │  1. Login Success   │                      │
     │                     │                      │
     │  2. Get FCM Token   │                      │
     │  (from cache or new)│                      │
     │                     │                      │
     │  3. POST /push-tokens/register             │
     │     { token: "fcm_xxx" }                   │
     │────────────────────→│                      │
     │                     │                      │
     │                     │  4. Check if token exists        │
     │                     │─────────────────────→│
     │                     │                      │
     │                     │  5. Token found      │
     │                     │←─────────────────────│
     │                     │                      │
     │                     │  6. UPDATE push_tokens          │
     │                     │     SET is_active = true,       │
     │                     │         updated_at = NOW()      │
     │                     │     WHERE token = 'fcm_xxx'     │
     │                     │─────────────────────→│
     │                     │                      │
     │  7. Success         │                      │
     │←────────────────────│                      │
     │                     │                      │
```

**Logic xử lý trong Backend:**

```typescript
// push-token.repository.ts
async upsertToken(userId: number, dto: RegisterPushTokenDto) {
  // Tìm token hiện tại
  const existingToken = await this.findOne({
    where: { 
      userId, 
      token: dto.token 
    }
  });

  if (existingToken) {
    // Token đã tồn tại → Update
    existingToken.isActive = true;
    existingToken.updatedAt = new Date();
    return await this.save(existingToken);
  } else {
    // Token mới → Insert
    const newToken = this.create({
      userId,
      token: dto.token,
      deviceType: dto.deviceType,
      deviceId: dto.deviceId,
      isActive: true,
    });
    return await this.save(newToken);
  }
}
```

---

### Scenario 3: User đăng nhập từ nhiều devices

```
┌──────────────┐         ┌──────────────┐         ┌──────────┐
│  Device A    │         │  Device B    │         │ Backend  │
│  (Android)   │         │    (iOS)     │         │          │
└──────┬───────┘         └──────┬───────┘         └────┬─────┘
       │                        │                      │
       │  1. Login & Register   │                      │
       │     Token A            │                      │
       │───────────────────────────────────────────────→│
       │                        │                      │
       │                        │  2. Login & Register │
       │                        │     Token B          │
       │                        │─────────────────────→│
       │                        │                      │
       │                        │                      │  Database:
       │                        │                      │  push_tokens
       │                        │                      │  ┌──────┬────────┬──────────┐
       │                        │                      │  │user  │ token  │  device  │
       │                        │                      │  ├──────┼────────┼──────────┤
       │                        │                      │  │ 123  │token_A │ ANDROID  │
       │                        │                      │  │ 123  │token_B │   IOS    │
       │                        │                      │  └──────┴────────┴──────────┘
       │                        │                      │
```

**Kết quả:** User 123 có **2 tokens active** → Khi gửi notification sẽ push đến **CẢ 2 devices**

---

## Luồng gửi Push Notification

### Flow chi tiết từ Backend đến App

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────┐    ┌─────────┐
│   Event     │    │  Use Case    │    │  Firebase   │    │   FCM    │    │   App   │
│  (Trigger)  │    │   (Backend)  │    │  Admin SDK  │    │  Server  │    │ (Device)│
└──────┬──────┘    └──────┬───────┘    └──────┬──────┘    └────┬─────┘    └────┬────┘
       │                  │                    │                 │               │
       │  1. Leave        │                    │                 │               │
       │     Approved     │                    │                 │               │
       │─────────────────→│                    │                 │               │
       │                  │                    │                 │               │
       │                  │  2. Get User       │                 │               │
       │                  │     Preferences    │                 │               │
       │                  │                    │                 │               │
       │                  │  3. Filter Channels│                 │               │
       │                  │     [PUSH, IN_APP] │                 │               │
       │                  │                    │                 │               │
       │                  │  4. Save to DB     │                 │               │
       │                  │     (notifications │                 │               │
       │                  │      table)        │                 │               │
       │                  │                    │                 │               │
       │                  │  5. Get FCM Tokens │                 │               │
       │                  │     for user       │                 │               │
       │                  │     [token_A,      │                 │               │
       │                  │      token_B]      │                 │               │
       │                  │                    │                 │               │
       │                  │  6. sendEachForMulticast()           │               │
       │                  │───────────────────→│                 │               │
       │                  │    {               │                 │               │
       │                  │      tokens: [...],│                 │               │
       │                  │      notification: {                │               │
       │                  │        title: "...",                │               │
       │                  │        body: "..."                  │               │
       │                  │      },             │                 │               │
       │                  │      data: {...}    │                 │               │
       │                  │    }                │                 │               │
       │                  │                    │                 │               │
       │                  │                    │  7. Forward to FCM              │
       │                  │                    │────────────────→│               │
       │                  │                    │                 │               │
       │                  │                    │                 │  8. Route to  │
       │                  │                    │                 │     APNs/FCM  │
       │                  │                    │                 │     & Push    │
       │                  │                    │                 │────────────────→│
       │                  │                    │                 │               │
       │                  │                    │  9. Response   │               │
       │                  │                    │←────────────────│               │
       │                  │                    │                 │               │
       │                  │ 10. Handle Invalid │                 │               │
       │                  │     Tokens         │                 │               │
       │                  │←───────────────────│                 │               │
       │                  │                    │                 │               │
```

### Chi tiết từng bước:

#### Bước 1: Event trigger (ví dụ: Leave Request được approve)

```typescript
// leave.service.ts
async approveLeaveRequest(leaveId: number, approverId: number) {
  // Update leave status
  const leave = await this.leaveRepository.update(leaveId, {
    status: 'APPROVED',
    approvedBy: approverId,
    approvedAt: new Date(),
  });

  // Trigger notification
  await this.eventBus.publish(
    new LeaveApprovedEvent(leave.userId, leave.id)
  );
}
```

#### Bước 2-3: Get preferences và filter channels

```typescript
// send-notification.use-case.ts
async execute(dto: SendNotificationDto): Promise<Notification> {
  console.log('📤 [SEND] Requested channels:', dto.channels);
  // Input: ["PUSH", "IN_APP", "EMAIL", "SMS"]

  // Get user preferences
  const preferences = await this.preferenceRepository.findByUserId(dto.userId);
  // preferences = {
  //   email: true,
  //   push: true,
  //   sms: false,
  //   in_app: true
  // }

  // Filter channels
  const allowedChannels = this.filterChannelsByPreference(
    dto.channels, 
    preferences
  );
  console.log('✅ [SEND] Allowed channels:', allowedChannels);
  // Output: ["PUSH", "IN_APP", "EMAIL"]
  // SMS bị loại vì user tắt

  return allowedChannels;
}
```

#### Bước 4: Save to database

```typescript
// Tạo notification entity
const notification = Notification.create({
  userId: 123,
  title: "Leave Request Approved",
  message: "Your leave from 10/11 to 15/11 has been approved",
  type: "LEAVE_APPROVED",
  channels: ["PUSH", "IN_APP", "EMAIL"],
  data: {
    targetId: "456",
    route: "/leave-detail",
    leaveType: "ANNUAL",
    startDate: "2025-11-10",
    endDate: "2025-11-15"
  },
  isRead: false,
  createdAt: new Date(),
});

// Lưu vào database
const saved = await this.notificationRepository.save(notification);

// Database result:
// notifications table:
// ┌────┬─────────┬──────────────────────┬────────────┬───────────────────┬─────────┬─────────┐
// │ id │ user_id │        title         │  channels  │       data        │ is_read │ created │
// ├────┼─────────┼──────────────────────┼────────────┼───────────────────┼─────────┼─────────┤
// │789 │   123   │Leave Request Approved│{PUSH,IN_APP│{"targetId":"456"} │  false  │  now()  │
// └────┴─────────┴──────────────────────┴────────────┴───────────────────┴─────────┴─────────┘
```

#### Bước 5: Get FCM Tokens

```typescript
// push-token.repository.ts
const tokens = await this.pushTokenRepository.find({
  where: { 
    userId: 123,
    isActive: true 
  }
});

console.log(`📲 Found ${tokens.length} active devices`);

// Result:
// [
//   {
//     id: 1,
//     userId: 123,
//     token: "fN3BxYz3QK2:APA91bH...",  // Android device
//     deviceType: "ANDROID",
//     deviceId: "device_android_123"
//   },
//   {
//     id: 2,
//     userId: 123,
//     token: "cH7DyEq1RL3:APA91bJ...",  // iOS device
//     deviceType: "IOS",
//     deviceId: "device_ios_456"
//   }
// ]
```

#### Bước 6: Gửi qua Firebase Admin SDK

```typescript
// firebase-push-notification.service.ts
async send(request: PushNotificationRequest): Promise<void> {
  const messaging = this.firebaseApp.messaging();

  const message: admin.messaging.MulticastMessage = {
    // Danh sách FCM tokens (có thể gửi đến nhiều devices cùng lúc)
    tokens: [
      "fN3BxYz3QK2:APA91bH...",  // Android
      "cH7DyEq1RL3:APA91bJ..."   // iOS
    ],
    
    // Notification payload (title + body)
    notification: {
      title: "Leave Request Approved",
      body: "Your leave from 10/11 to 15/11 has been approved"
    },
    
    // Custom data (để app xử lý routing)
    data: {
      notificationId: "789",
      type: "LEAVE_APPROVED",
      targetId: "456",
      route: "/leave-detail",
      leaveType: "ANNUAL",
      startDate: "2025-11-10",
      endDate: "2025-11-15"
    },
    
    // Android specific config
    android: {
      priority: 'high',
      notification: {
        channelId: 'high_importance_channel',
        sound: 'default',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        color: '#FF5722',
        icon: 'ic_notification'
      }
    },
    
    // iOS specific config (APNs)
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          contentAvailable: true
        }
      }
    }
  };

  // Gửi đến tất cả tokens
  const response = await messaging.sendEachForMulticast(message);
  
  console.log(`✅ Successfully sent: ${response.successCount}`);
  console.log(`❌ Failed to send: ${response.failureCount}`);
}
```

#### Bước 7-8: Firebase routing và delivery

```
Firebase Cloud Messaging nhận message
│
├─→ Android devices → Send via FCM protocol
│   └─→ Google Play Services → Device → App
│
└─→ iOS devices → Send via APNs protocol
    └─→ Apple Push Notification service → Device → App
```

#### Bước 9-10: Handle response và invalid tokens

```typescript
// Xử lý response từ Firebase
if (response.failureCount > 0) {
  const failedTokens: string[] = [];
  
  response.responses.forEach((resp, idx) => {
    if (!resp.success) {
      const errorCode = resp.error?.code;
      const token = request.tokens[idx];
      
      console.error(`❌ Token ${token} failed:`, errorCode);
      
      // Token không hợp lệ (user đã uninstall app, token expired, etc.)
      if (
        errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/registration-token-not-registered'
      ) {
        failedTokens.push(token);
      }
    }
  });

  // Xóa các tokens không hợp lệ khỏi database
  if (failedTokens.length > 0) {
    console.log('🗑️ Removing invalid tokens:', failedTokens);
    
    await this.pushTokenRepository.delete({
      token: In(failedTokens)
    });
  }
}

// Success response structure:
// {
//   successCount: 2,
//   failureCount: 0,
//   responses: [
//     { success: true, messageId: 'projects/zentry-hr-system/messages/0:1234...' },
//     { success: true, messageId: 'projects/zentry-hr-system/messages/0:5678...' }
//   ]
// }
```

---

## Luồng nhận Notification trên App

### Case 1: App đang MỞ (Foreground)

```
┌──────────┐         ┌─────────────┐         ┌─────────────────┐
│   FCM    │         │ Flutter App │         │  User Screen    │
└────┬─────┘         └──────┬──────┘         └────────┬────────┘
     │                      │                         │
     │  1. Push Message     │                         │
     │─────────────────────→│                         │
     │                      │                         │
     │                      │  2. onMessage triggered │
     │                      │                         │
     │                      │  3. Show Local         │
     │                      │     Notification        │
     │                      │                         │
     │                      │  4. Update Badge       │
     │                      │     (unread count)      │
     │                      │─────────────────────────→│
     │                      │                         │
     │                      │  User taps notification │
     │                      │←─────────────────────────│
     │                      │                         │
     │                      │  5. Parse data.route    │
     │                      │     & navigate          │
     │                      │                         │
     │                      │  6. Navigate to detail  │
     │                      │─────────────────────────→│
     │                      │                         │
```

**Code implementation:**

```dart
// Setup listener
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('📩 [FOREGROUND] Message received!');
  print('Title: ${message.notification?.title}');
  print('Body: ${message.notification?.body}');
  print('Data: ${message.data}');
  
  // Data structure:
  // {
  //   "notificationId": "789",
  //   "type": "LEAVE_APPROVED",
  //   "targetId": "456",
  //   "route": "/leave-detail",
  //   "leaveType": "ANNUAL"
  // }

  // Step 3: Show local notification (vì FCM không auto show khi app foreground)
  _showLocalNotification(message);
  
  // Step 4: Update badge count
  _updateNotificationBadge();
  
  // Optional: Show in-app banner/snackbar
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text('${message.notification?.title}'),
      action: SnackBarAction(
        label: 'View',
        onPressed: () {
          _handleNotificationTap(message);
        },
      ),
    ),
  );
});

// Show local notification
Future<void> _showLocalNotification(RemoteMessage message) async {
  const androidDetails = AndroidNotificationDetails(
    'high_importance_channel',
    'High Importance Notifications',
    importance: Importance.high,
    priority: Priority.high,
  );

  await _localNotifications.show(
    message.hashCode,
    message.notification?.title,
    message.notification?.body,
    NotificationDetails(android: androidDetails),
    payload: jsonEncode(message.data), // Để xử lý khi user tap
  );
}
```

---

### Case 2: App đang BACKGROUND

```
┌──────────┐         ┌─────────────┐         ┌─────────────────┐
│   FCM    │         │     OS      │         │  Flutter App    │
└────┬─────┘         └──────┬──────┘         └────────┬────────┘
     │                      │                         │
     │  1. Push Message     │                         │
     │─────────────────────→│                         │
     │                      │                         │
     │                      │  2. OS shows            │
     │                      │     notification        │
     │                      │     automatically       │
     │                      │                         │
     │                      │  User taps notification │
     │                      │                         │
     │                      │  3. Wake up app         │
     │                      │─────────────────────────→│
     │                      │                         │
     │                      │  4. onMessageOpenedApp  │
     │                      │     triggered           │
     │                      │                         │
     │                      │  5. Parse data & navigate│
     │                      │                         │
```

**Code implementation:**

```dart
// Setup listener
FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  print('🔔 [BACKGROUND] App opened from notification!');
  print('Data: ${message.data}');
  
  // Data: {
  //   "notificationId": "789",
  //   "type": "LEAVE_APPROVED",
  //   "targetId": "456",
  //   "route": "/leave-detail"
  // }

  // Navigate to specific screen
  _navigateToScreen(
    type: message.data['type'],
    targetId: message.data['targetId'],
    route: message.data['route'],
  );
});

void _navigateToScreen({String? type, String? targetId, String? route}) {
  if (route == null) return;

  // Delay để đảm bảo app đã ready
  Future.delayed(Duration(milliseconds: 500), () {
    Navigator.of(context).pushNamed(
      route,
      arguments: {
        'type': type,
        'id': targetId,
      },
    );
  });
}
```

---

### Case 3: App bị TẮT (Terminated)

```
┌──────────┐         ┌─────────────┐         ┌─────────────────┐
│   FCM    │         │     OS      │         │  Flutter App    │
└────┬─────┘         └──────┬──────┘         └────────┬────────┘
     │                      │                         │
     │  1. Push Message     │                         │
     │─────────────────────→│                         │
     │                      │                         │
     │                      │  2. OS shows            │
     │                      │     notification        │
     │                      │                         │
     │                      │  User taps notification │
     │                      │                         │
     │                      │  3. Launch app          │
     │                      │─────────────────────────→│
     │                      │                         │
     │                      │  4. main() runs         │
     │                      │                         │
     │                      │  5. getInitialMessage() │
     │                      │                         │
     │                      │  6. Parse data & navigate│
     │                      │                         │
```

**Code implementation:**

```dart
// In main.dart - after Firebase initialization
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  runApp(MyApp());
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    _checkInitialMessage();
  }

  Future<void> _checkInitialMessage() async {
    // Check if app was opened from a notification
    RemoteMessage? initialMessage = 
        await FirebaseMessaging.instance.getInitialMessage();
    
    if (initialMessage != null) {
      print('🚀 [TERMINATED] App launched from notification!');
      print('Data: ${initialMessage.data}');
      
      // Delay để đợi app build xong
      Future.delayed(Duration(seconds: 1), () {
        _navigateToScreen(
          type: initialMessage.data['type'],
          targetId: initialMessage.data['targetId'],
          route: initialMessage.data['route'],
        );
      });
    }
  }
}
```

---

### Background Handler (xử lý khi app terminated)

```dart
// Đặt NGOÀI class, ở top-level
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Khởi tạo Firebase (cần thiết cho background context)
  await Firebase.initializeApp();
  
  print('📩 [BACKGROUND HANDLER] Message received');
  print('Title: ${message.notification?.title}');
  print('Data: ${message.data}');
  
  // Có thể xử lý background tasks ở đây:
  // - Lưu vào local database
  // - Update badge count
  // - Fetch additional data
  // KHÔNG được show UI hoặc navigate (app đang không chạy)
}

// Đăng ký trong main()
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Đăng ký background handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  runApp(MyApp());
}
```

---

## Data Structure

### 1. Database Schema

#### Table: `push_tokens`
```sql
CREATE TABLE push_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('ANDROID', 'IOS', 'WEB')),
  device_id VARCHAR(255),
  device_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  
  CONSTRAINT unique_user_token UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_is_active ON push_tokens(is_active);
```

**Example data:**
```
┌────┬─────────┬─────────────────────────────────┬─────────────┬─────────────────┬────────────┬────────────┐
│ id │ user_id │             token               │ device_type │   device_id     │ is_active  │ created_at │
├────┼─────────┼─────────────────────────────────┼─────────────┼─────────────────┼────────────┼────────────┤
│  1 │   123   │ fN3BxYz3QK2:APA91bH...         │   ANDROID   │ abc123xyz       │    true    │ 2025-11-01 │
│  2 │   123   │ cH7DyEq1RL3:APA91bJ...         │     IOS     │ def456uvw       │    true    │ 2025-11-05 │
│  3 │   456   │ mP9FzWx5TN4:APA91bK...         │   ANDROID   │ ghi789rst       │    true    │ 2025-11-07 │
└────┴─────────┴─────────────────────────────────┴─────────────┴─────────────────┴────────────┴────────────┘
```

#### Table: `notifications`
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  channels VARCHAR(20)[] NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CHECK (array_length(channels, 1) > 0)
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

**Example data:**
```
┌────┬─────────┬─────────────────────────┬─────────────────┬─────────────────────┬────────────┬─────────┬────────────┐
│ id │ user_id │          title          │      type       │      channels       │    data    │ is_read │ created_at │
├────┼─────────┼─────────────────────────┼─────────────────┼─────────────────────┼────────────┼─────────┼────────────┤
│789 │   123   │Leave Request Approved   │ LEAVE_APPROVED  │ {PUSH,IN_APP,EMAIL} │ {...}      │  false  │ 2025-11-08 │
│790 │   123   │Attendance Reminder      │ATTENDANCE_REMIND│ {PUSH,IN_APP}       │ {...}      │  true   │ 2025-11-08 │
└────┴─────────┴─────────────────────────┴─────────────────┴─────────────────────┴────────────┴─────────┴────────────┘
```

---

### 2. API Request/Response Formats

#### POST /push-tokens/register

**Request:**
```json
{
  "token": "fN3BxYz3QK2:APA91bH...",
  "deviceType": "ANDROID",
  "deviceId": "abc123xyz",
  "deviceName": "Samsung Galaxy S23"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Push token registered successfully",
  "data": {
    "id": 1,
    "userId": 123,
    "deviceType": "ANDROID",
    "createdAt": "2025-11-08T10:30:00Z"
  }
}
```

---

#### DELETE /push-tokens/unregister

**Request:**
```json
{
  "token": "fN3BxYz3QK2:APA91bH..."
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Push token unregistered successfully"
}
```

---

#### POST /notifications (Send notification - Internal API)

**Request:**
```json
{
  "userId": 123,
  "title": "Leave Request Approved",
  "message": "Your leave from 10/11 to 15/11 has been approved",
  "type": "LEAVE_APPROVED",
  "channels": ["PUSH", "IN_APP", "EMAIL"],
  "data": {
    "targetId": "456",
    "route": "/leave-detail",
    "leaveType": "ANNUAL",
    "startDate": "2025-11-10",
    "endDate": "2025-11-15"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Notification sent successfully",
  "data": {
    "id": 789,
    "userId": 123,
    "channels": ["PUSH", "IN_APP", "EMAIL"],
    "createdAt": "2025-11-08T10:35:00Z"
  }
}
```

---

### 3. Firebase Message Payload Structure

#### Multicast Message (gửi đến nhiều devices)
```typescript
{
  // Danh sách FCM tokens
  tokens: [
    "fN3BxYz3QK2:APA91bH...",
    "cH7DyEq1RL3:APA91bJ..."
  ],
  
  // Notification display (title + body)
  notification: {
    title: "Leave Request Approved",
    body: "Your leave from 10/11 to 15/11 has been approved"
  },
  
  // Custom data for app to process
  data: {
    notificationId: "789",
    type: "LEAVE_APPROVED",
    targetId: "456",
    route: "/leave-detail",
    leaveType: "ANNUAL",
    startDate: "2025-11-10",
    endDate: "2025-11-15",
    // Có thể thêm bất kỳ data nào
    priority: "high",
    sound: "default"
  },
  
  // Android specific settings
  android: {
    priority: "high",
    notification: {
      channelId: "high_importance_channel",
      sound: "default",
      clickAction: "FLUTTER_NOTIFICATION_CLICK",
      color: "#FF5722",
      icon: "ic_notification",
      tag: "leave_456", // Group notifications
      defaultSound: true,
      defaultVibrateTimings: true
    },
    ttl: 3600000 // Time to live (1 hour)
  },
  
  // iOS (APNs) specific settings
  apns: {
    headers: {
      "apns-priority": "10"
    },
    payload: {
      aps: {
        alert: {
          title: "Leave Request Approved",
          body: "Your leave from 10/11 to 15/11 has been approved"
        },
        sound: "default",
        badge: 1,
        contentAvailable: true,
        category: "LEAVE_CATEGORY"
      }
    }
  }
}
```

---

### 4. Flutter RemoteMessage Structure

```dart
// RemoteMessage object nhận được từ FCM
RemoteMessage {
  // Unique ID của message
  messageId: "0:1699435200:123456",
  
  // Sender ID
  senderId: "1234567890",
  
  // Notification payload (có thể null nếu data-only message)
  notification: RemoteNotification {
    title: "Leave Request Approved",
    body: "Your leave from 10/11 to 15/11 has been approved",
    android: AndroidNotification {
      channelId: "high_importance_channel",
      sound: "default",
      color: "#FF5722"
    },
    apple: AppleNotification {
      sound: "default",
      badge: 1
    }
  },
  
  // Custom data (LUÔN CÓ, dùng để routing và xử lý logic)
  data: {
    "notificationId": "789",
    "type": "LEAVE_APPROVED",
    "targetId": "456",
    "route": "/leave-detail",
    "leaveType": "ANNUAL",
    "startDate": "2025-11-10",
    "endDate": "2025-11-15"
  },
  
  // Timestamp
  sentTime: DateTime(2025, 11, 8, 10, 35, 0),
  
  // TTL
  ttl: 3600
}
```

**Cách access data trong Flutter:**

```dart
void handleMessage(RemoteMessage message) {
  // Get notification content
  String? title = message.notification?.title;
  String? body = message.notification?.body;
  
  // Get custom data
  String notificationId = message.data['notificationId'];
  String type = message.data['type'];
  String targetId = message.data['targetId'];
  String route = message.data['route'];
  
  // Parse complex data
  Map<String, dynamic> leaveData = {
    'type': message.data['leaveType'],
    'startDate': DateTime.parse(message.data['startDate']),
    'endDate': DateTime.parse(message.data['endDate']),
  };
  
  // Navigate
  Navigator.pushNamed(context, route, arguments: {
    'id': targetId,
    'data': leaveData,
  });
}
```

---

## Sequence Diagrams

### Complete Flow: Event → Backend → Firebase → App

```
┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────┐  ┌──────┐  ┌─────┐
│ Leave   │  │ Backend │  │   DB     │  │   Firebase  │  │ FCM  │  │ App │
│ Service │  │         │  │          │  │  Admin SDK  │  │Server│  │     │
└────┬────┘  └────┬────┘  └────┬─────┘  └──────┬──────┘  └───┬──┘  └──┬──┘
     │            │             │               │              │        │
     │ Approve    │             │               │              │        │
     │   Leave    │             │               │              │        │
     │───────────→│             │               │              │        │
     │            │             │               │              │        │
     │            │  Get User   │               │              │        │
     │            │  Preferences│               │              │        │
     │            │────────────→│               │              │        │
     │            │             │               │              │        │
     │            │  Return     │               │              │        │
     │            │  Preferences│               │              │        │
     │            │←────────────│               │              │        │
     │            │             │               │              │        │
     │            │  Filter     │               │              │        │
     │            │  Channels   │               │              │        │
     │            │             │               │              │        │
     │            │  Save       │               │              │        │
     │            │  Notification│              │              │        │
     │            │────────────→│               │              │        │
     │            │             │               │              │        │
     │            │  Get FCM    │               │              │        │
     │            │  Tokens     │               │              │        │
     │            │────────────→│               │              │        │
     │            │             │               │              │        │
     │            │  Return     │               │              │        │
     │            │  Tokens     │               │              │        │
     │            │←────────────│               │              │        │
     │            │             │               │              │        │
     │            │  sendEachForMulticast()     │              │        │
     │            │─────────────────────────────→│              │        │
     │            │             │               │              │        │
     │            │             │               │  Forward     │        │
     │            │             │               │──────────────→│        │
     │            │             │               │              │        │
     │            │             │               │              │  Push  │
     │            │             │               │              │────────→│
     │            │             │               │              │        │
     │            │             │               │              │  Show  │
     │            │             │               │              │  Notif │
     │            │             │               │              │        │
     │            │             │               │  Response    │        │
     │            │             │               │←──────────────│        │
     │            │             │               │              │        │
     │            │  Return     │               │              │        │
     │            │  Response   │               │              │        │
     │            │←─────────────────────────────│              │        │
     │            │             │               │              │        │
     │            │  Update     │               │              │        │
     │            │  Invalid    │               │              │        │
     │            │  Tokens     │               │              │        │
     │            │────────────→│               │              │        │
     │            │             │               │              │        │
```

---

## Các loại Notification Types

### Định nghĩa các types trong hệ thống:

```typescript
enum NotificationType {
  // Leave related
  LEAVE_APPROVED = 'LEAVE_APPROVED',
  LEAVE_REJECTED = 'LEAVE_REJECTED',
  LEAVE_PENDING_APPROVAL = 'LEAVE_PENDING_APPROVAL',
  LEAVE_CANCELLED = 'LEAVE_CANCELLED',
  
  // Attendance related
  ATTENDANCE_REMINDER = 'ATTENDANCE_REMINDER',
  ATTENDANCE_LATE = 'ATTENDANCE_LATE',
  ATTENDANCE_MISSING = 'ATTENDANCE_MISSING',
  
  // Payroll related
  PAYROLL_READY = 'PAYROLL_READY',
  PAYROLL_PROCESSED = 'PAYROLL_PROCESSED',
  
  // Employee related
  EMPLOYEE_BIRTHDAY = 'EMPLOYEE_BIRTHDAY',
  EMPLOYEE_ANNIVERSARY = 'EMPLOYEE_ANNIVERSARY',
  
  // System related
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
}
```

### Mapping type → route → screen:

```dart
// Flutter app routing
Map<String, String> notificationRoutes = {
  'LEAVE_APPROVED': '/leave-detail',
  'LEAVE_REJECTED': '/leave-detail',
  'LEAVE_PENDING_APPROVAL': '/leave-approvals',
  'LEAVE_CANCELLED': '/leave-history',
  
  'ATTENDANCE_REMINDER': '/attendance/check-in',
  'ATTENDANCE_LATE': '/attendance/history',
  'ATTENDANCE_MISSING': '/attendance/history',
  
  'PAYROLL_READY': '/payroll/detail',
  'PAYROLL_PROCESSED': '/payroll/history',
  
  'EMPLOYEE_BIRTHDAY': '/employees/profile',
  'EMPLOYEE_ANNIVERSARY': '/employees/profile',
  
  'SYSTEM_ANNOUNCEMENT': '/announcements',
  'SYSTEM_MAINTENANCE': '/system-status',
};

// Usage:
void navigateFromNotification(String type, String targetId) {
  final route = notificationRoutes[type] ?? '/notifications';
  Navigator.pushNamed(context, route, arguments: {'id': targetId});
}
```

---

## Best Practices & Tips

### 1. Token Management

✅ **DO:**
- Lưu token ngay sau khi login thành công
- Update token khi `onTokenRefresh` trigger
- Xóa token khi user logout
- Xử lý multiple devices của cùng 1 user
- Tự động xóa invalid tokens từ Firebase response

❌ **DON'T:**
- Gửi token qua URL params (security risk)
- Lưu token trong SharedPreferences (dùng Secure Storage)
- Giữ inactive tokens quá lâu trong DB

---

### 2. Notification Data

✅ **DO:**
- Luôn include `route` để navigate đúng màn hình
- Include `targetId` để load chi tiết
- Dùng `type` để phân loại notification
- Keep data minimal (FCM có giới hạn 4KB)

❌ **DON'T:**
- Gửi sensitive data trong notification (password, token, etc.)
- Gửi quá nhiều data (dùng `targetId` và fetch từ API thay vì gửi full object)

---

### 3. Performance

✅ **DO:**
- Dùng `sendEachForMulticast()` cho multiple tokens (batch sending)
- Set appropriate TTL (time to live)
- Handle failures gracefully
- Implement retry logic cho failed sends

❌ **DON'T:**
- Send notifications trong vòng lặp (dùng batch)
- Gửi notifications quá thường xuyên (spam)
- Ignore Firebase response errors

---

### 4. User Experience

✅ **DO:**
- Show notification ngay cả khi app foreground
- Handle all 3 states: foreground, background, terminated
- Update badge count realtime
- Provide clear notification content
- Deep link đến đúng màn hình

❌ **DON'T:**
- Navigate automatically khi app đang open (show dialog/banner thay vì)
- Send notifications vào lúc không phù hợp (night time)
- Spam user với quá nhiều notifications

---

## Troubleshooting

### Common Issues:

#### 1. Token không được gửi lên Backend
```dart
// Check: Permission granted?
NotificationSettings settings = await FirebaseMessaging.instance.requestPermission();
if (settings.authorizationStatus != AuthorizationStatus.authorized) {
  print('❌ Permission denied');
}

// Check: Token available?
String? token = await FirebaseMessaging.instance.getToken();
if (token == null) {
  print('❌ Token not available');
}

// Check: Access token valid?
// Verify JWT token chưa expired
```

#### 2. Notification không hiển thị
```dart
// Android: Check notification channel created
const androidChannel = AndroidNotificationChannel(
  'high_importance_channel',
  'High Importance Notifications',
  importance: Importance.high,
);

await _localNotifications
    .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
    ?.createNotificationChannel(androidChannel);

// iOS: Check permission granted
// Settings → App → Notifications → Allow Notifications
```

#### 3. Navigation không hoạt động
```dart
// Check: Data có đầy đủ?
if (message.data['route'] == null) {
  print('❌ Missing route in notification data');
}

// Check: Route đã đăng ký?
MaterialApp(
  routes: {
    '/leave-detail': (context) => LeaveDetailScreen(),
    // ...
  },
)

// Check: Context available?
// Dùng Navigator.of(context) trong widget tree
// Hoặc navigatorKey.currentState?.pushNamed()
```

---

## Summary

### Key Points:

1. **FCM Token Registration:**
   - Lấy token sau khi login
   - Đăng ký với Backend API
   - Update khi token refresh
   - Xóa khi logout

2. **Backend Sending:**
   - Check user preferences
   - Save to DB (IN_APP)
   - Get FCM tokens
   - Send via Firebase Admin SDK
   - Handle invalid tokens

3. **App Receiving:**
   - Foreground: Show local notification
   - Background: OS shows automatically
   - Terminated: getInitialMessage()
   - Always parse data and navigate

4. **Data Flow:**
   ```
   Event → Use Case → Filter → Save → Get Tokens → 
   Firebase → FCM/APNs → Device → App → Navigate
   ```

---

**File này cung cấp tài liệu đầy đủ về Push Notification flow cho team Frontend và Backend tham khảo khi implement!** 🚀
