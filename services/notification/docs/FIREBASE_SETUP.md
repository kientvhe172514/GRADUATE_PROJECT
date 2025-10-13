# Firebase Push Notification Setup Guide

## 📱 Thiết lập Firebase Project

### Bước 1: Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Nhập tên project: `zentry-hr-system`
4. Disable Google Analytics (optional)
5. Click **"Create project"**

---

### Bước 2: Thêm App vào Project

#### For Android:
1. Click icon Android trong project overview
2. Nhập **Android package name**: `com.zentry.hrapp`
3. Download `google-services.json`
4. Thêm vào Flutter project: `android/app/google-services.json`

#### For iOS:
1. Click icon iOS trong project overview
2. Nhập **iOS bundle ID**: `com.zentry.hrapp`
3. Download `GoogleService-Info.plist`
4. Thêm vào Flutter project: `ios/Runner/GoogleService-Info.plist`

#### For Web:
1. Click icon Web
2. Nhập app nickname: `Zentry Web`
3. Copy Firebase config object

---

### Bước 3: Tạo Service Account Key

1. Vào **Project Settings** (icon bánh răng)
2. Chọn tab **Service accounts**
3. Click **"Generate new private key"**
4. Lưu file JSON vào:
   ```
   services/notification/config/firebase-service-account.json
   ```

---

## 🔧 Backend Configuration

### 1. Update `.env` file

```env
FIREBASE_PROJECT_ID=zentry-hr-system
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

### 2. Verify Firebase Service

```typescript
// Test Firebase connection
const admin = require('firebase-admin');
const serviceAccount = require('./config/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('✅ Firebase initialized successfully');
```

---

## 📱 Flutter Client Setup

### 1. Install Dependencies

```yaml
# pubspec.yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.6
```

```bash
flutter pub get
```

---

### 2. Initialize Firebase

```dart
// lib/main.dart
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(MyApp());
}
```

---

### 3. Request Permission & Get Token

```dart
// lib/services/push_notification_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';

class PushNotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  Future<void> initialize() async {
    // Request permission (iOS)
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ User granted permission');
      
      // Get device token
      String? token = await _messaging.getToken();
      if (token != null) {
        print('📱 Device Token: $token');
        
        // Send token to backend
        await registerToken(token);
      }
    }

    // Listen to token refresh
    _messaging.onTokenRefresh.listen((newToken) {
      registerToken(newToken);
    });

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('📬 Foreground message: ${message.notification?.title}');
      _showLocalNotification(message);
    });

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }

  Future<void> registerToken(String token) async {
    // Call backend API
    await http.post(
      Uri.parse('http://your-backend/api/push-tokens/register'),
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'deviceId': await _getDeviceId(),
        'token': token,
        'platform': Platform.isAndroid ? 'ANDROID' : 'IOS',
      }),
    );
  }

  void _showLocalNotification(RemoteMessage message) {
    // Show local notification using flutter_local_notifications
  }
}

// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('📬 Background message: ${message.notification?.title}');
}
```

---

## 🧪 Testing Push Notifications

### Method 1: Via Backend API

```bash
curl -X POST http://localhost:3004/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": 123,
    "title": "Test Notification",
    "message": "This is a test push notification",
    "notificationType": "SYSTEM_ANNOUNCEMENT",
    "channels": ["PUSH", "IN_APP"]
  }'
```

---

### Method 2: Firebase Console

1. Vào Firebase Console
2. **Engage** → **Cloud Messaging**
3. Click **"Send your first message"**
4. Nhập:
   - **Notification title**: `Test`
   - **Notification text**: `Hello from Firebase`
5. Click **"Send test message"**
6. Paste device token
7. Click **"Test"**

---

### Method 3: Using Postman

Import this request:

```json
POST https://fcm.googleapis.com/fcm/send
Headers:
  Authorization: key=YOUR_SERVER_KEY
  Content-Type: application/json

Body:
{
  "to": "DEVICE_TOKEN",
  "notification": {
    "title": "Test Title",
    "body": "Test Body"
  },
  "data": {
    "notificationId": "123",
    "type": "TEST"
  }
}
```

**Get Server Key:**
1. Firebase Console → Project Settings
2. Cloud Messaging tab
3. Copy **Server key**

---

## 🔔 Notification Channels (Android)

### Create Channel

```dart
// lib/services/notification_channel_service.dart
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationChannelService {
  final FlutterLocalNotificationsPlugin _notifications = 
    FlutterLocalNotificationsPlugin();

  Future<void> createChannels() async {
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'zentry_notifications', // id
      'Zentry Notifications', // name
      description: 'Notifications from Zentry HR System',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
    );

    await _notifications
      .resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(channel);
  }
}
```

---

## 🎯 Best Practices

### 1. Token Management

```dart
// Save token to local storage
SharedPreferences prefs = await SharedPreferences.getInstance();
await prefs.setString('fcm_token', token);

// Check if token changed
String? oldToken = prefs.getString('fcm_token');
if (oldToken != token) {
  // Register new token
  await registerToken(token);
  await prefs.setString('fcm_token', token);
}
```

---

### 2. Handle Different Notification States

```dart
// When app is terminated and opened via notification
RemoteMessage? initialMessage = 
  await FirebaseMessaging.instance.getInitialMessage();

if (initialMessage != null) {
  _handleNotificationClick(initialMessage);
}

// When app is in background and notification clicked
FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  _handleNotificationClick(message);
});

void _handleNotificationClick(RemoteMessage message) {
  // Navigate to specific screen based on notification data
  String? notificationId = message.data['notificationId'];
  String? type = message.data['type'];
  
  // Navigate...
}
```

---

### 3. Unregister Token on Logout

```dart
Future<void> logout() async {
  String? token = await _messaging.getToken();
  
  if (token != null) {
    // Call backend to unregister
    await http.delete(
      Uri.parse('http://your-backend/api/push-tokens/unregister'),
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
        'Content-Type': 'application/json',
      },
      body: json.encode({'token': token}),
    );
  }
  
  // Delete local token
  await FirebaseMessaging.instance.deleteToken();
}
```

---

## 🐛 Troubleshooting

### iOS: Not receiving notifications

1. Enable Push Notifications capability in Xcode
2. Upload APNs certificate to Firebase Console
3. Check iOS permissions in device settings

### Android: Notifications not showing

1. Check notification channel is created
2. Verify `google-services.json` is correct
3. Check app has notification permission

### Token is null

1. Check internet connection
2. Verify Firebase project configuration
3. Try `await FirebaseMessaging.instance.deleteToken()` then get new token

---

## 📚 References

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [FlutterFire Documentation](https://firebase.flutter.dev/docs/messaging/overview)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
