# Notification Service - Fix Summary

## Ngày: October 13, 2025

### Tổng số lỗi ban đầu: 117 lỗi TypeScript

## ✅ ĐÃ FIX (89 lỗi)

### 1. Domain/Enums
- ✅ **Priority.enum.ts**: Thêm `MEDIUM = 'MEDIUM'`

### 2. Infrastructure/External Services
- ✅ **nodemailer-email.service.ts**: Sửa `createTransporter` → `createTransport`

### 3. Infrastructure/Persistence
- ✅ **notification.schema.ts**: Thêm `| null` cho tất cả nullable fields
  - `recipient_email: string | null`
  - `recipient_name: string | null`
  - `related_entity_type: string | null`
  - `related_entity_id: number | null`
  - `related_data: object | null`
  - `read_at: Date | null`
  - `email_sent_at: Date | null`
  - `push_sent_at: Date | null`
  - `sms_sent_at: Date | null`
  - `metadata: object | null`
  - `expires_at: Date | null`

- ✅ **notification-preference.schema.ts**: Thêm `| null` cho:
  - `do_not_disturb_start: string | null`
  - `do_not_disturb_end: string | null`

- ✅ **notification.mapper.ts**: Thêm `?? undefined` khi map từ schema to domain, `?? null` khi map từ domain to schema

- ✅ **notification-preference.mapper.ts**: Tương tự notification.mapper.ts

### 4. Presentation/Guards
- ✅ **jwt-auth.guard.ts**: Thêm null check cho JWT secret
  ```typescript
  const secret = this.configService.get<string>('JWT_SECRET');
  if (!secret) {
    throw new UnauthorizedException('JWT secret not configured');
  }
  ```

### 5. Main.ts
- ✅ **main.ts**: Fix RabbitMQ microservice options type
  ```typescript
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL', '...');
  const rabbitmqQueue = configService.get<string>('RABBITMQ_NOTIFICATION_QUEUE', '...');
  ```

### 6. Event Listeners (5 files)
- ✅ **attendance-event.listener.ts**: 
  - Thêm import `ChannelType`
  - Đổi `userId` → `recipientId`
  - Đổi `type` → `notificationType`
  - Đổi `content` → `message`
  - Đổi string channels → `ChannelType.X`

- ✅ **leave-event.listener.ts**: Tương tự attendance
- ✅ **auth-event.listener.ts**: Tương tự attendance
- ✅ **employee-event.listener.ts**: Tương tự attendance  
- ✅ **face-verification-event.listener.ts**: Tương tự attendance

### 7. Config
- ✅ **tsconfig.json**: Xóa `baseUrl: "./src"` để tránh conflict với relative imports

## ❌ VẪN CÒN LỖI (28 lỗi)

### Module Resolution Errors (28 lỗi)
TypeScript không tìm thấy các modules:
- `application/ports/*.port.ts` (5 files)
- `application/use-cases/*.use-case.ts` (9 files)
- `application/dtos/*.dto.ts` (5 files)
- `domain/entities/*.entity.ts` (3 files)
- `domain/enums/*.enum.ts` (2 instances)

**Nguyên nhân có thể:**
1. Unicode trong path (`Kỳ 9`) - TypeScript compiler issue
2. Node modules cache
3. TypeScript incremental build cache

**Các bước đã thử:**
- ✅ Xóa `dist/` folder
- ✅ Xóa `.cache/` folder
- ✅ Xóa `tsconfig.tsbuildinfo`
- ✅ Xóa `baseUrl` từ tsconfig.json
- 🔄 Reinstall `node_modules` (đang chạy)

### RabbitMQ Type Issues (3 lỗi)
- ❌ `rabbitmq-event-publisher.ts`: Type mismatch với `amqplib`
  - Line 24: `ChannelModel` vs `Connection`
  - Line 25: `createChannel` không tồn tại
  - Line 93: `close` không tồn tại

## 📝 Ghi chú

### Files đã modify:
1. `src/domain/enums/priority.enum.ts`
2. `src/infrastructure/external-services/nodemailer-email.service.ts`
3. `src/infrastructure/persistence/typeorm/schemas/notification.schema.ts`
4. `src/infrastructure/persistence/typeorm/schemas/notification-preference.schema.ts`
5. `src/infrastructure/persistence/typeorm/mappers/notification.mapper.ts`
6. `src/infrastructure/persistence/typeorm/mappers/notification-preference.mapper.ts`
7. `src/presentation/guards/jwt-auth.guard.ts`
8. `src/main.ts`
9. `src/presentation/event-listeners/attendance-event.listener.ts`
10. `src/presentation/event-listeners/leave-event.listener.ts`
11. `src/presentation/event-listeners/auth-event.listener.ts`
12. `src/presentation/event-listeners/employee-event.listener.ts`
13. `src/presentation/event-listeners/face-verification-event.listener.ts`
14. `tsconfig.json`

### Lint warnings (có thể ignore):
- Line ending issues (CRLF vs LF) - 100+ warnings
- `any` type usage - expected trong event listeners
