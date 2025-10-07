# Mobile App API Guide - Session-Based Authentication

## **🔐 AUTHENTICATION FLOW**

### **1. Device Registration**

```http
POST /api/devices/register
Content-Type: application/json

{
  "deviceName": "Samsung Galaxy S24",
  "androidId": "abc123def456",
  "platform": "Android",
  "osVersion": "14",
  "model": "Galaxy S24",
  "manufacturer": "Samsung",
  "appVersion": "1.0.0",
  "pushNotificationToken": "fcm_token_here"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "deviceId": "guid-here",
    "deviceToken": "server-generated-token",
    "message": "Device registered successfully"
  }
}
```

### **2. Sign In**

```http
POST /api/auth/sign-in
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "deviceToken": "server-generated-token"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionKey": "session_abc123def456",
    "userInfo": {
      "id": "user-guid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "Student"
    },
    "expiresAt": "2024-01-15T10:30:00Z"
  }
}
```

### **3. API Requests (Protected Endpoints)**

```http
GET /api/attendance/sessions
X-Device-Token: server-generated-token
X-Session-Key: session_abc123def456
```

## **📱 MOBILE APP IMPLEMENTATION**

### **1. Store Credentials**

```typescript
interface AppCredentials {
  deviceToken: string;
  sessionKey: string;
  expiresAt: Date;
}

// Lưu vào secure storage
await SecureStore.setItemAsync("deviceToken", deviceToken);
await SecureStore.setItemAsync("sessionKey", sessionKey);
await SecureStore.setItemAsync("expiresAt", expiresAt.toISOString());
```

### **2. API Client Setup**

```typescript
class ApiClient {
  private async getHeaders(): Promise<Record<string, string>> {
    const deviceToken = await SecureStore.getItemAsync("deviceToken");
    const sessionKey = await SecureStore.getItemAsync("sessionKey");

    return {
      "Content-Type": "application/json",
      "X-Device-Token": deviceToken || "",
      "X-Session-Key": sessionKey || "",
    };
  }

  async get<T>(url: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(url, { headers });

    if (response.status === 401) {
      // Session expired, redirect to login
      await this.handleSessionExpired();
      throw new Error("Session expired");
    }

    return response.json();
  }
}
```

### **3. Session Management**

```typescript
class SessionManager {
  async checkSessionValid(): Promise<boolean> {
    const expiresAt = await SecureStore.getItemAsync("expiresAt");
    if (!expiresAt) return false;

    const expiryDate = new Date(expiresAt);
    return expiryDate > new Date();
  }

  async refreshSession(): Promise<void> {
    // Implement refresh logic if needed
    // For now, redirect to login
    await this.logout();
  }

  async logout(): Promise<void> {
    try {
      await this.apiClient.post("/api/auth/logout");
    } catch (error) {
      console.log("Logout API call failed:", error);
    } finally {
      await SecureStore.deleteItemAsync("deviceToken");
      await SecureStore.deleteItemAsync("sessionKey");
      await SecureStore.deleteItemAsync("expiresAt");
      // Redirect to login screen
    }
  }
}
```

## **🔄 ERROR HANDLING**

### **1. Session Expired (401)**

- Clear stored credentials
- Redirect to login screen
- Show message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"

### **2. Device Not Active (401)**

- Show message: "Thiết bị không hoạt động, vui lòng liên hệ admin"
- Redirect to device registration

### **3. Rate Limit Exceeded (429)**

- Show message: "Quá nhiều yêu cầu, vui lòng thử lại sau"
- Implement exponential backoff

## **🔒 SECURITY FEATURES**

### **1. Device Binding**

- Mỗi device chỉ được đăng nhập 1 user
- Device token được generate server-side
- Android ID được validate

### **2. Session Management**

- Session TTL: 30 phút
- Auto logout khi device change
- Force logout khi có suspicious activity

### **3. Rate Limiting**

- Login: 5 lần/giờ
- Device change: 1 lần/tháng
- API calls: Configurable per endpoint

## **📋 TESTING CHECKLIST**

- [ ] Device registration works
- [ ] Sign in with valid device token
- [ ] Sign in with invalid device token (should fail)
- [ ] API calls with valid session
- [ ] API calls with expired session (should return 401)
- [ ] Logout clears session
- [ ] Device change forces logout
- [ ] Rate limiting works
- [ ] Error messages are user-friendly
