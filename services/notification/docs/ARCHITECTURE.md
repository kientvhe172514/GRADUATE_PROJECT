# Clean Architecture trong Notification Service

## 📐 Nguyên tắc Clean Architecture

Service này tuân thủ **Clean Architecture** với 4 layers rõ ràng:

```
┌─────────────────────────────────────┐
│      Presentation Layer             │  ← Controllers, Guards
│     (API, HTTP, WebSocket)          │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│      Application Layer              │  ← Use Cases, DTOs, Ports
│    (Business Rules, Orchestration)  │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│       Domain Layer                  │  ← Entities, Value Objects
│    (Core Business Logic)            │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│     Infrastructure Layer            │  ← Database, External APIs
│  (Technical Details, Frameworks)    │
└─────────────────────────────────────┘
```

---

## 🎯 SOLID Principles

### 1. **Single Responsibility Principle (SRP)**

Mỗi class chỉ có **1 lý do để thay đổi**.

✅ **Example:**
```typescript
// ✅ Good - Mỗi use case chỉ làm 1 việc
class SendNotificationUseCase {
  execute(dto: SendNotificationDto): Promise<Notification>
}

class GetUserNotificationsUseCase {
  execute(userId: number): Promise<Notification[]>
}

// ❌ Bad - God class làm quá nhiều việc
class NotificationService {
  sendNotification()
  getNotifications()
  updatePreferences()
  registerPushToken()
  sendEmail()
  sendPush()
  // ... too many responsibilities
}
```

---

### 2. **Open/Closed Principle (OCP)**

Open for **extension**, closed for **modification**.

✅ **Example:**
```typescript
// ✅ Good - Dễ dàng thêm channel mới mà không sửa code cũ
interface NotificationChannel {
  send(notification: Notification): Promise<void>;
}

class EmailChannel implements NotificationChannel {
  send(notification: Notification) { ... }
}

class PushChannel implements NotificationChannel {
  send(notification: Notification) { ... }
}

// Thêm channel mới? Chỉ cần implement interface!
class WhatsAppChannel implements NotificationChannel {
  send(notification: Notification) { ... }
}
```

---

### 3. **Liskov Substitution Principle (LSP)**

Subtype phải thay thế được supertype mà không làm hỏng logic.

✅ **Example:**
```typescript
// ✅ Good - Có thể thay thế bất kỳ implementation nào
interface PushNotificationServicePort {
  sendToUser(userId: number, title: string, body: string): Promise<void>;
}

class FirebasePushNotificationService implements PushNotificationServicePort {
  sendToUser(...) { /* Firebase logic */ }
}

class OneSignalPushNotificationService implements PushNotificationServicePort {
  sendToUser(...) { /* OneSignal logic */ }
}

// Use case không cần biết implementation cụ thể
class SendNotificationUseCase {
  constructor(
    @Inject(PUSH_NOTIFICATION_SERVICE)
    private pushService: PushNotificationServicePort // ← Interface, not concrete
  ) {}
}
```

---

### 4. **Interface Segregation Principle (ISP)**

Clients không nên phụ thuộc vào interface mà nó không dùng.

✅ **Example:**
```typescript
// ✅ Good - Interface nhỏ gọn, tập trung
interface EmailServicePort {
  send(to: string, subject: string, body: string): Promise<void>;
}

interface PushNotificationServicePort {
  sendToUser(userId: number, title: string, body: string): Promise<void>;
}

// ❌ Bad - Fat interface
interface NotificationServicePort {
  sendEmail(...);
  sendPush(...);
  sendSms(...);
  registerDevice(...);
  unregisterDevice(...);
  updatePreferences(...);
  // ... too many methods
}
```

---

### 5. **Dependency Inversion Principle (DIP)**

High-level modules không nên phụ thuộc vào low-level modules. Cả hai phải phụ thuộc vào **abstractions**.

✅ **Example:**
```typescript
// ✅ Good - Use case phụ thuộc vào PORT (abstraction)
class SendNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)        // ← Port (interface)
    private notificationRepo: NotificationRepositoryPort,
    @Inject(PUSH_NOTIFICATION_SERVICE)      // ← Port (interface)
    private pushService: PushNotificationServicePort,
  ) {}
}

// Infrastructure implement port
class PostgresNotificationRepository implements NotificationRepositoryPort {
  // ... TypeORM logic
}

class FirebasePushNotificationService implements PushNotificationServicePort {
  // ... Firebase logic
}
```

---

## 🏗️ Dependency Flow

```
Presentation → Application → Domain ← Infrastructure
                    ↓
                  Ports (Interfaces)
                    ↑
              Infrastructure implements Ports
```

### Key Points:
1. **Domain Layer** không biết gì về Infrastructure
2. **Application Layer** chỉ biết về Domain và Ports
3. **Infrastructure** implement Ports của Application
4. **Presentation** chỉ gọi Use Cases

---

## 🔄 Request Flow Example

```
1. Client sends POST /notifications
         ↓
2. NotificationController (Presentation)
         ↓
3. SendNotificationUseCase (Application)
         ↓
4. Notification Entity (Domain) - Business logic
         ↓
5. NotificationRepositoryPort (Application Port)
         ↓
6. PostgresNotificationRepository (Infrastructure)
         ↓
7. TypeORM → PostgreSQL
```

---

## 🧪 Testing Benefits

### Easy to test with mocks:

```typescript
describe('SendNotificationUseCase', () => {
  it('should send notification', async () => {
    // Mock repositories and services
    const mockRepo = {
      create: jest.fn().mockResolvedValue(notification),
    };
    
    const mockPushService = {
      sendToUser: jest.fn().mockResolvedValue(undefined),
    };

    // Test use case in isolation
    const useCase = new SendNotificationUseCase(
      mockRepo,
      mockPushService,
      // ... other mocks
    );

    await useCase.execute(dto);

    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockPushService.sendToUser).toHaveBeenCalled();
  });
});
```

---

## 📦 Module Organization

```
src/
├── domain/                    # Pure business logic, no framework
│   ├── entities/             # Business objects
│   ├── enums/                # Constants
│   ├── value-objects/        # Immutable objects
│   └── events/               # Domain events
│
├── application/               # Use cases, orchestration
│   ├── use-cases/            # Application logic
│   ├── ports/                # Interfaces (abstractions)
│   └── dtos/                 # Data transfer objects
│
├── infrastructure/            # Technical implementation
│   ├── persistence/          # Database (TypeORM)
│   ├── messaging/            # RabbitMQ
│   └── external-services/    # Firebase, Email, etc.
│
└── presentation/              # HTTP, Controllers
    ├── controllers/          # REST endpoints
    └── guards/               # Auth, validation
```

---

## ✅ Benefits

1. **Testability** - Dễ dàng test từng layer độc lập
2. **Maintainability** - Code rõ ràng, dễ maintain
3. **Flexibility** - Dễ thay đổi implementation (PostgreSQL → MongoDB)
4. **Scalability** - Dễ mở rộng thêm features
5. **Independence** - Domain logic độc lập với framework

---

## 🎓 Further Reading

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
