# 🔄 PUSH TOKEN & NOTIFICATION SYNC ANALYSIS

## 📊 Tổng quan hiện trạng

Sau khi phân tích dự án, đây là hiện trạng đồng bộ giữa các service:

### ✅ ĐÃ CÓ (Well Implemented)

#### 1. **Auth Service → Notification Service (Event-driven)**
```typescript
// Auth Service: Login flow tự động tạo device session
Device Session Created → Publish Event 'device_session_created' → RabbitMQ

// Notification Service: Tự động lắng nghe và đăng ký FCM token
@EventPattern('device_session_created')
async handleDeviceSessionCreated(data: DeviceSessionCreatedPayload) {
  // Tự động đăng ký FCM token khi có device session mới
  await registerPushTokenUseCase.execute(data.employeeId, {
    deviceId: data.deviceId,
    deviceSessionId: data.deviceSessionId, // ✅ Đã link với device session
    token: data.fcmToken,
    platform: data.platform
  });
}
```

**✅ Kết luận**: Luồng tự động đăng ký token khi login **ĐÃ HOẠT ĐỘNG TỐT**

#### 2. **JWT Token chứa employee_id**
```typescript
// Auth Service: JWT payload
{
  sub: account.id,           // account_id
  email: account.email,
  employee_id: account.employee_id,  // ✅ Có employee_id
  role: account.role,
  permissions: [...]
}
```

**✅ Kết luận**: JWT **ĐÃ CHỨA** employee_id, không cần truyền thêm

#### 3. **Device Session Tracking**
```typescript
// Auth Service: device_sessions table
{
  id: number,
  account_id: number,
  employee_id: number,        // ✅ Có employee_id
  device_id: string,
  fcm_token: string,          // ✅ Cache FCM token
  fcm_token_status: enum,
  platform: enum,
  status: enum,
  // ... tracking fields
}
```

**✅ Kết luận**: Device session **ĐÃ ĐỒNG BỘ** đầy đủ thông tin

#### 4. **Push Token Repository**
```typescript
// Notification Service: push_tokens table
{
  id: number,
  employee_id: number,        // ✅ Có employee_id
  device_id: string,
  device_session_id: number,  // ✅ Link với auth service
  token: string,              // FCM token
  platform: enum,
  is_active: boolean,
  last_used_at: date,
  created_at: date
}
```

**✅ Kết luận**: Push token **ĐÃ LINK** với device session và employee

#### 5. **Notification Preferences (Bật/tắt notification)**
```typescript
// ✅ ĐÃ CÓ controller để user bật/tắt notification
GET  /api/notification-preferences      // Xem setting
PUT  /api/notification-preferences      // Cập nhật setting

// Preferences structure
{
  employeeId: number,
  emailEnabled: boolean,      // ✅ Bật/tắt email
  pushEnabled: boolean,       // ✅ Bật/tắt push notification
  smsEnabled: boolean,        // ✅ Bật/tắt SMS
  inAppEnabled: boolean,      // ✅ Bật/tắt in-app notification
  doNotDisturbStart: time,    // ✅ Chế độ không làm phiền
  doNotDisturbEnd: time,
  preferredChannels: []       // ✅ Kênh ưu tiên
}
```

**✅ Kết luận**: User **ĐÃ CÓ** khả năng bật/tắt từng loại notification

---

## ⚠️ VẤN ĐỀ CẦN SỬA (Issues to Fix)

### 1. **Push Token Controller vẫn đang nhận employeeId từ JWT** ✅ ĐÚNG RỒI
```typescript
// e:\Kỳ 9\graduate_project\services\notification\src\presentation\controllers\push-token.controller.ts

@Post('register')
async registerToken(@Body() dto: RegisterPushTokenDto, @Req() req: any) {
  const employeeId = req.user.employee_id;  // ✅ Đã lấy từ JWT token
  const token = await this.registerTokenUseCase.execute(employeeId, dto);
  return ApiResponseDto.success(token, 'Push token registered successfully', 201);
}

@Delete('unregister')
async unregisterToken(@Body() dto: UnregisterPushTokenDto, @Req() req: any) {
  const employeeId = req.user.employee_id;  // ✅ Đã lấy từ JWT token
  await this.unregisterTokenUseCase.execute(employeeId, dto);
  return ApiResponseDto.success(null, 'Push token unregistered successfully');
}
```

**✅ Kết luận**: Controller **ĐÃ ĐÚNG**, lấy employee_id từ JWT, không cần client gửi

### 2. **RegisterPushTokenDto có thể tối ưu hơn**

**Hiện tại:**
```typescript
export class RegisterPushTokenDto {
  @IsNotEmpty()
  @IsString()
  deviceId: string;              // ✅ Cần

  @IsOptional()
  @IsNumber()
  deviceSessionId?: number;      // ⚠️ Client không nên biết device_session_id

  @IsNotEmpty()
  @IsString()
  token: string;                 // ✅ Cần (FCM token)

  @IsNotEmpty()
  @IsEnum(Platform)
  platform: Platform;            // ✅ Cần
}
```

**⚠️ Vấn đề**: `deviceSessionId` không nên do client gửi, vì:
- Client không biết device_session_id (đây là internal ID của auth service)
- Backend có thể tự tìm device_session_id dựa vào `employeeId + deviceId`

**✅ Đề xuất**: Xóa `deviceSessionId` khỏi DTO, backend tự tìm

---

## 🔧 CÁCH SỬA VÀ TỐI ÚU HÓA

### Bước 1: Cập nhật RegisterPushTokenDto

```typescript
// services/notification/src/application/dtos/push-token.dto.ts

export class RegisterPushTokenDto {
  @IsNotEmpty()
  @IsString()
  deviceId: string;              // Device unique ID

  @IsNotEmpty()
  @IsString()
  token: string;                 // FCM token

  @IsNotEmpty()
  @IsEnum(Platform)
  platform: Platform;            // IOS | ANDROID | WEB
  
  // ❌ XÓA deviceSessionId - backend sẽ tự tìm
}

export class UnregisterPushTokenDto {
  @IsOptional()
  @IsString()
  deviceId?: string;             // Unregister by device

  @IsOptional()
  @IsString()
  token?: string;                // Unregister by token
  
  // ℹ️ Ít nhất 1 trong 2 field phải có
}
```

### Bước 2: Cập nhật RegisterPushTokenUseCase để tự động tìm device_session_id

```typescript
// services/notification/src/application/use-cases/register-push-token.use-case.ts

import { Inject, Injectable, Logger, ConflictException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PushToken } from '../../domain/entities/push-token.entity';
import { PushTokenRepositoryPort } from '../ports/push-token.repository.port';
import { RegisterPushTokenDto } from '../dtos/push-token.dto';

export const PUSH_TOKEN_REPOSITORY = 'PUSH_TOKEN_REPOSITORY';
export const AUTH_SERVICE = 'AUTH_SERVICE'; // RabbitMQ client

@Injectable()
export class RegisterPushTokenUseCase {
  private readonly logger = new Logger(RegisterPushTokenUseCase.name);

  constructor(
    @Inject(PUSH_TOKEN_REPOSITORY)
    private readonly pushTokenRepo: PushTokenRepositoryPort,
    @Inject(AUTH_SERVICE)
    private readonly authServiceClient: ClientProxy, // ✅ Gọi auth service qua RabbitMQ
  ) {}

  async execute(employeeId: number, dto: RegisterPushTokenDto): Promise<PushToken> {
    this.logger.log(`Registering push token for employee ${employeeId}, device: ${dto.deviceId}`);

    // ✅ BẤT ĐỒNG BỘ: Tìm device_session_id từ Auth Service
    let deviceSessionId: number | undefined;
    try {
      const response = await firstValueFrom(
        this.authServiceClient.send('get_device_session', {
          employeeId,
          deviceId: dto.deviceId,
        })
      );
      deviceSessionId = response?.device_session_id;
      this.logger.log(`Found device_session_id: ${deviceSessionId} for device ${dto.deviceId}`);
    } catch (error) {
      this.logger.warn(`Could not find device_session_id for device ${dto.deviceId}:`, error);
      // Continue without device_session_id (có thể là device chưa login qua auth service)
    }

    // Check if device already registered
    const existing = await this.pushTokenRepo.findByDeviceId(employeeId, dto.deviceId);

    if (existing) {
      // Update existing token
      if (existing.token !== dto.token || existing.deviceSessionId !== deviceSessionId) {
        existing.token = dto.token;
        existing.platform = dto.platform;
        existing.deviceSessionId = deviceSessionId; // ✅ Update device_session_id
        existing.activate();
        return await this.pushTokenRepo.update(existing);
      }
      existing.updateLastUsed();
      return await this.pushTokenRepo.update(existing);
    }

    // Create new token
    const pushToken = new PushToken({
      employeeId,
      deviceId: dto.deviceId,
      deviceSessionId, // ✅ Auto-link với device session
      token: dto.token,
      platform: dto.platform,
      isActive: true,
    });

    return await this.pushTokenRepo.create(pushToken);
  }
}
```

### Bước 3: Cập nhật Auth Service để expose RPC endpoint

```typescript
// services/auth/src/application/use-cases/device/get-device-session.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { DeviceSessionRepositoryPort } from '../../ports/device-session.repository.port';
import { DEVICE_SESSION_REPOSITORY } from '../../tokens';

@Injectable()
export class GetDeviceSessionUseCase {
  constructor(
    @Inject(DEVICE_SESSION_REPOSITORY)
    private readonly deviceSessionRepo: DeviceSessionRepositoryPort,
  ) {}

  async execute(employeeId: number, deviceId: string): Promise<any> {
    const deviceSession = await this.deviceSessionRepo.findByEmployeeAndDevice(
      employeeId,
      deviceId
    );

    if (!deviceSession) {
      return null;
    }

    return {
      device_session_id: deviceSession.id,
      account_id: deviceSession.account_id,
      employee_id: deviceSession.employee_id,
      device_id: deviceSession.device_id,
      platform: deviceSession.platform,
      status: deviceSession.status,
      fcm_token: deviceSession.fcm_token,
      last_active_at: deviceSession.last_active_at,
    };
  }
}
```

```typescript
// services/auth/src/presentation/controllers/device-rpc.controller.ts

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetDeviceSessionUseCase } from '../../application/use-cases/device/get-device-session.use-case';

@Controller()
export class DeviceRpcController {
  constructor(
    private readonly getDeviceSessionUseCase: GetDeviceSessionUseCase,
  ) {}

  @MessagePattern('get_device_session')
  async getDeviceSession(@Payload() data: { employeeId: number; deviceId: string }) {
    return await this.getDeviceSessionUseCase.execute(data.employeeId, data.deviceId);
  }
}
```

### Bước 4: Cập nhật Notification Service Module để inject AUTH_SERVICE client

```typescript
// services/notification/src/notification.module.ts

import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // ... existing imports

    // ✅ Add RabbitMQ client for Auth Service
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: 'auth_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  // ... providers, controllers
})
export class NotificationModule {}
```

---

## 📊 LUỒNG SAU KHI SỬA (Updated Flow)

### Luồng 1: User đăng nhập → Tự động đăng ký FCM token

```
User -> Mobile App: Login với email/password + FCM token
Mobile App -> Auth Service: POST /api/auth/login
                             Body: {
                               email, password,
                               device_id, device_name,
                               platform: "IOS",
                               fcm_token: "fcm_abc123..."
                             }
Auth Service -> Auth Service: Validate credentials
Auth Service -> Auth Service: Create JWT with employee_id
Auth Service -> Database: Create/update device_sessions
                          {
                            account_id, employee_id,
                            device_id, fcm_token,
                            platform, status: ACTIVE
                          }
Auth Service -> RabbitMQ: Publish event 'device_session_created'
                          {
                            deviceSessionId: 123,
                            accountId: 1,
                            employeeId: 456,
                            deviceId: "iphone_xyz",
                            fcmToken: "fcm_abc123...",
                            platform: "IOS"
                          }
Auth Service -> Mobile App: Return JWT + refresh token

--- Event Processing (Async) ---
Notification Service -> RabbitMQ: Consume 'device_session_created'
Notification Service -> Database: Upsert push_tokens
                                  {
                                    employee_id: 456,
                                    device_id: "iphone_xyz",
                                    device_session_id: 123,  // ✅ Auto-linked
                                    token: "fcm_abc123...",
                                    platform: "IOS",
                                    is_active: true
                                  }
Notification Service -> Log: "FCM token registered for employee 456"
```

**✅ Kết quả**: User login xong là FCM token đã được tự động đăng ký, không cần gọi thêm API

### Luồng 2: User muốn cập nhật FCM token (device mới, token refresh)

```
User -> Mobile App: App detect FCM token refreshed
                    New token: "fcm_xyz789..."
Mobile App -> Notification Service: POST /api/push-tokens/register
                                     Header: Authorization Bearer {JWT}
                                     Body: {
                                       deviceId: "iphone_xyz",
                                       token: "fcm_xyz789...",
                                       platform: "IOS"
                                       // ❌ KHÔNG GỬI deviceSessionId
                                       // ❌ KHÔNG GỬI employeeId
                                     }
Notification Service -> Notification Service: Extract employee_id từ JWT
                                              → req.user.employee_id = 456
Notification Service -> Auth Service (RPC): Send 'get_device_session'
                                            { employeeId: 456, deviceId: "iphone_xyz" }
Auth Service -> Database: Query device_sessions
                          WHERE employee_id = 456 AND device_id = "iphone_xyz"
Auth Service -> Notification Service: Return { device_session_id: 123, ... }

Notification Service -> Database: UPDATE push_tokens
                                  SET token = "fcm_xyz789...",
                                      device_session_id = 123,  // ✅ Auto-updated
                                      last_used_at = NOW()
                                  WHERE employee_id = 456 AND device_id = "iphone_xyz"
Notification Service -> Mobile App: Return 200 OK
                                    { success: true, message: "Token updated" }
```

**✅ Kết quả**: Client chỉ cần gửi `deviceId` + `token` + `platform`, backend tự động sync với device_session

### Luồng 3: User logout → Revoke FCM token

```
User -> Mobile App: Tap "Logout"
Mobile App -> Auth Service: POST /api/auth/logout
                             Header: Authorization Bearer {JWT}
                             Body: { deviceId: "iphone_xyz" }
Auth Service -> Database: UPDATE device_sessions
                          SET status = 'REVOKED',
                              fcm_token_status = 'EXPIRED'
                          WHERE device_id = "iphone_xyz"
Auth Service -> RabbitMQ: Publish 'device_session_revoked'
                          { deviceSessionId: 123, deviceId: "iphone_xyz" }

--- Event Processing (Async) ---
Notification Service -> RabbitMQ: Consume 'device_session_revoked'
Notification Service -> Database: UPDATE push_tokens
                                  SET is_active = false
                                  WHERE device_session_id = 123
Notification Service -> Log: "FCM token revoked for device session 123"
```

**✅ Kết quả**: Logout tự động revoke FCM token, không nhận notification nữa

### Luồng 4: User bật/tắt Push Notification

```
User -> Mobile App: Settings → Tắt Push Notifications
Mobile App -> Notification Service: PUT /api/notification-preferences
                                     Header: Authorization Bearer {JWT}
                                     Body: {
                                       pushEnabled: false,  // ✅ Tắt push
                                       emailEnabled: true,
                                       inAppEnabled: true
                                     }
Notification Service -> Database: UPDATE notification_preferences
                                  SET push_enabled = false
                                  WHERE employee_id = req.user.employee_id
Notification Service -> Mobile App: Return 200 OK

--- Khi có notification ---
Attendance Service -> Notification Service: Send notification
Notification Service -> Database: Query notification_preferences
                                  → pushEnabled = false
Notification Service -> Database: Save to inbox (IN_APP) ✅
Notification Service -> Email Service: Send email ✅
Notification Service -> ❌ SKIP push notification (user disabled)
```

**✅ Kết quả**: User có control bật/tắt từng loại notification (push, email, SMS, in-app)

---

## ✅ CHECKLIST HOÀN THIỆN

### Backend (Auth Service)
- [x] JWT chứa `employee_id` ✅
- [x] Device session tracking với `employee_id`, `device_id`, `fcm_token` ✅
- [x] Publish event `device_session_created` khi login ✅
- [x] Publish event `device_session_revoked` khi logout ✅
- [ ] **TODO**: Thêm RPC endpoint `get_device_session` để Notification Service query 🔧

### Backend (Notification Service)
- [x] Auto-register FCM token khi nhận event `device_session_created` ✅
- [x] Push Token Controller lấy `employee_id` từ JWT ✅
- [x] Notification Preferences cho phép user bật/tắt notification ✅
- [x] Filter notification theo user preferences ✅
- [x] Link push_tokens với device_sessions qua `device_session_id` ✅
- [ ] **TODO**: Cập nhật RegisterPushTokenDto - xóa `deviceSessionId` từ DTO 🔧
- [ ] **TODO**: RegisterPushTokenUseCase tự động tìm `device_session_id` từ Auth Service 🔧
- [ ] **TODO**: Thêm RabbitMQ client để gọi Auth Service 🔧

### Mobile App (Flutter)
- [x] Gửi FCM token khi login ✅
- [x] Có UI để user bật/tắt notification ✅
- [ ] **TODO**: Cập nhật RegisterPushToken API call - không gửi `deviceSessionId` 🔧
- [ ] **TODO**: Handle FCM token refresh → call `/api/push-tokens/register` 🔧

---

## 🎯 KẾT LUẬN

### ✅ Những gì ĐÃ TỐT:
1. **Auth Service và Notification Service đã có event-driven architecture** → Tự động sync FCM token
2. **JWT đã chứa employee_id** → Controller không cần client gửi employee_id
3. **Device Session đã track đầy đủ thông tin** → Link được với push token
4. **User có thể bật/tắt notification** → Notification Preferences API hoạt động tốt

### ⚠️ Những gì CẦN SỬA (Minor improvements):
1. **RegisterPushTokenDto**: Xóa `deviceSessionId` từ DTO, backend tự tìm
2. **RegisterPushTokenUseCase**: Thêm logic gọi Auth Service RPC để tìm `device_session_id`
3. **Auth Service**: Expose RPC endpoint `get_device_session`

### 📈 Độ ưu tiên:
- **High**: Xóa `deviceSessionId` từ RegisterPushTokenDto (security concern - client không nên biết internal ID)
- **Medium**: Auto-sync device_session_id (hiện tại vẫn work nhưng không optimal)
- **Low**: RPC endpoint (có thể dùng event hoặc database join thay thế)

---

## 📝 UPDATED SEQUENCE DIAGRAM (Cập nhật vào CORE_SEQUENCE_DIAGRAMS.md)

### Luồng Push Token Registration (Updated)

```
User -> Mobile App: App khởi động/FCM token refresh
Mobile App -> Firebase: Request FCM token
Firebase -> Mobile App: Return FCM token "fcm_abc123..."
Mobile App -> Mobile App: Store FCM token locally

--- Option 1: Đăng ký khi Login (Recommended) ---
Mobile App -> Auth Service: POST /api/auth/login
                             Body: {
                               email, password,
                               device_id: "iphone_xyz",
                               fcm_token: "fcm_abc123...",
                               platform: "IOS"
                             }
Auth Service -> Database: Create device_session với fcm_token
Auth Service -> RabbitMQ: Publish 'device_session_created'
Notification Service -> Database: Auto-register push_token
                                  (device_session_id auto-linked)

--- Option 2: Cập nhật FCM token riêng (Token refresh) ---
Mobile App -> Notification Service: POST /api/push-tokens/register
                                     Header: Authorization Bearer {JWT}
                                     Body: {
                                       deviceId: "iphone_xyz",
                                       token: "fcm_abc123...",
                                       platform: "IOS"
                                     }
Notification Service -> Notification Service: Extract employee_id từ JWT
Notification Service -> Auth Service (RPC): get_device_session(employeeId, deviceId)
Auth Service -> Notification Service: Return device_session_id
Notification Service -> Database: Upsert push_token với device_session_id
Notification Service -> Mobile App: Return 200 OK

--- Bật/Tắt Notification ---
User -> Mobile App: Settings → Toggle "Push Notifications"
Mobile App -> Notification Service: PUT /api/notification-preferences
                                     Header: Authorization Bearer {JWT}
                                     Body: { pushEnabled: false }
Notification Service -> Database: UPDATE notification_preferences
Notification Service -> Mobile App: Return 200 OK

--- Logout → Auto Revoke Token ---
User -> Mobile App: Logout
Mobile App -> Auth Service: POST /api/auth/logout
Auth Service -> Database: UPDATE device_session status = REVOKED
Auth Service -> RabbitMQ: Publish 'device_session_revoked'
Notification Service -> Database: UPDATE push_token is_active = false
```

