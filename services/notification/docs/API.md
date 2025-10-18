# API Documentation - Notification Service

## Base URL
```
http://localhost:3004/api
```

## Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📬 Notifications

### 1. Send Notification
Send a notification to a user.

**POST** `/notifications`

**Body:**
```json
{
  "recipientId": 123,
  "recipientEmail": "user@example.com",
  "recipientName": "John Doe",
  "title": "New Message",
  "message": "You have received a new message",
  "notificationType": "SYSTEM_ANNOUNCEMENT",
  "priority": "HIGH",
  "channels": ["EMAIL", "PUSH", "IN_APP"],
  "relatedEntityType": "message",
  "relatedEntityId": 456,
  "metadata": {
    "sender": "Admin"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "recipientId": 123,
    "title": "New Message",
    "isRead": false,
    "createdAt": "2025-10-13T10:00:00Z"
  }
}
```

---

### 2. Send Notification from Template
Send a notification using a predefined template.

**POST** `/notifications/template`

**Body:**
```json
{
  "recipientId": 123,
  "templateCode": "ATTENDANCE_REMINDER",
  "variables": {
    "employee_name": "John Doe",
    "location": "Head Office"
  },
  "priority": "NORMAL"
}
```

---

### 3. Get User Notifications
Get all notifications for the authenticated user.

**GET** `/notifications?limit=20&offset=0&unreadOnly=false`

**Query Parameters:**
- `limit` (optional): Number of notifications to return (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `unreadOnly` (optional): Filter unread only (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "total": 50,
    "unreadCount": 5,
    "hasMore": true
  }
}
```

---

### 4. Mark Notification as Read
Mark a specific notification as read.

**PUT** `/notifications/:id/read`

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### 5. Mark All Notifications as Read
Mark all user's notifications as read.

**PUT** `/notifications/read-all`

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## ⚙️ Notification Preferences

### 1. Get Preferences
Get notification preferences for the authenticated user.

**GET** `/notification-preferences`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employeeId": 123,
      "notificationType": "ATTENDANCE_REMINDER",
      "emailEnabled": true,
      "pushEnabled": true,
      "smsEnabled": false,
      "inAppEnabled": true,
      "doNotDisturbStart": "22:00",
      "doNotDisturbEnd": "08:00"
    }
  ]
}
```

---

### 2. Update Preference
Update notification preference for a specific type.

**PUT** `/notification-preferences`

**Body:**
```json
{
  "notificationType": "ATTENDANCE_REMINDER",
  "emailEnabled": false,
  "pushEnabled": true,
  "doNotDisturbStart": "23:00",
  "doNotDisturbEnd": "07:00"
}
```

---

## 📱 Push Tokens

### 1. Register Push Token
Register a device token for push notifications.

**POST** `/push-tokens/register`

**Body:**
```json
{
  "deviceId": "device-unique-id",
  "token": "firebase-cloud-messaging-token",
  "platform": "ANDROID"
}
```

**Platforms:** `ANDROID`, `IOS`, `WEB`

**Response:**
```json
{
  "success": true,
  "message": "Push token registered successfully",
  "data": {
    "id": 1,
    "deviceId": "device-unique-id",
    "platform": "ANDROID",
    "isActive": true
  }
}
```

---

### 2. Unregister Push Token
Unregister a device token.

**DELETE** `/push-tokens/unregister`

**Body:**
```json
{
  "deviceId": "device-unique-id"
}
```

or

```json
{
  "token": "firebase-cloud-messaging-token"
}
```

---

## 📋 Notification Types

- `ATTENDANCE_REMINDER`
- `ATTENDANCE_LATE_WARNING`
- `ATTENDANCE_ABSENCE_WARNING`
- `ATTENDANCE_REPORT`
- `LEAVE_REQUEST_SUBMITTED`
- `LEAVE_REQUEST_APPROVED`
- `LEAVE_REQUEST_REJECTED`
- `LEAVE_REQUEST_UPDATED`
- `LEAVE_BALANCE_LOW`
- `FACE_VERIFICATION_REQUEST`
- `FACE_VERIFICATION_SUCCESS`
- `FACE_VERIFICATION_FAILED`
- `SYSTEM_ANNOUNCEMENT`
- `SYSTEM_MAINTENANCE`
- `PASSWORD_RESET`
- `ACCOUNT_LOCKED`
- `EMPLOYEE_BIRTHDAY`
- `EMPLOYEE_ANNIVERSARY`
- `PAYROLL_AVAILABLE`

## 🎯 Priority Levels

- `LOW`
- `NORMAL` (default)
- `HIGH`
- `URGENT`

## 📢 Delivery Channels

- `EMAIL` - Send via email
- `PUSH` - Send via push notification (Firebase)
- `SMS` - Send via SMS (future)
- `IN_APP` - Store in database for in-app display
