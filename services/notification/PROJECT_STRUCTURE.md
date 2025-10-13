# 📁 Project Structure

```
services/notification/
│
├── src/
│   ├── domain/                          # 🎯 DOMAIN LAYER - Business Logic
│   │   ├── entities/                    # Business entities
│   │   │   ├── notification.entity.ts
│   │   │   ├── notification-preference.entity.ts
│   │   │   ├── notification-template.entity.ts
│   │   │   ├── push-token.entity.ts
│   │   │   └── scheduled-notification.entity.ts
│   │   │
│   │   ├── enums/                       # Enumerations
│   │   │   ├── notification-type.enum.ts
│   │   │   └── priority.enum.ts
│   │   │
│   │   ├── value-objects/               # Value objects (immutable)
│   │   │   └── delivery-channel.vo.ts
│   │   │
│   │   └── events/                      # Domain events
│   │       ├── notification-sent.event.ts
│   │       ├── notification-read.event.ts
│   │       └── notification-delivery-failed.event.ts
│   │
│   ├── application/                     # 🎪 APPLICATION LAYER - Use Cases
│   │   ├── use-cases/                   # Business use cases
│   │   │   ├── send-notification.use-case.ts
│   │   │   ├── send-notification-from-template.use-case.ts
│   │   │   ├── get-user-notifications.use-case.ts
│   │   │   ├── mark-notification-as-read.use-case.ts
│   │   │   ├── mark-all-notifications-as-read.use-case.ts
│   │   │   ├── update-notification-preference.use-case.ts
│   │   │   ├── get-notification-preferences.use-case.ts
│   │   │   ├── register-push-token.use-case.ts
│   │   │   └── unregister-push-token.use-case.ts
│   │   │
│   │   ├── ports/                       # Interfaces (abstractions)
│   │   │   ├── notification.repository.port.ts
│   │   │   ├── notification-preference.repository.port.ts
│   │   │   ├── notification-template.repository.port.ts
│   │   │   ├── push-token.repository.port.ts
│   │   │   ├── scheduled-notification.repository.port.ts
│   │   │   ├── push-notification.service.port.ts
│   │   │   ├── email.service.port.ts
│   │   │   ├── sms.service.port.ts
│   │   │   └── event-publisher.port.ts
│   │   │
│   │   └── dtos/                        # Data Transfer Objects
│   │       ├── send-notification.dto.ts
│   │       ├── send-notification-from-template.dto.ts
│   │       ├── update-notification-preference.dto.ts
│   │       ├── get-user-notifications.dto.ts
│   │       └── push-token.dto.ts
│   │
│   ├── infrastructure/                  # 🔧 INFRASTRUCTURE LAYER - Technical Details
│   │   ├── persistence/                 # Database implementation
│   │   │   ├── typeorm/
│   │   │   │   ├── schemas/            # Database schemas
│   │   │   │   │   ├── notification.schema.ts
│   │   │   │   │   ├── notification-preference.schema.ts
│   │   │   │   │   ├── notification-template.schema.ts
│   │   │   │   │   ├── push-token.schema.ts
│   │   │   │   │   └── scheduled-notification.schema.ts
│   │   │   │   │
│   │   │   │   └── mappers/            # Entity ↔ Schema mappers
│   │   │   │       ├── notification.mapper.ts
│   │   │   │       ├── notification-preference.mapper.ts
│   │   │   │       └── push-token.mapper.ts
│   │   │   │
│   │   │   ├── postgres-notification.repository.ts
│   │   │   ├── postgres-notification-preference.repository.ts
│   │   │   └── postgres-push-token.repository.ts
│   │   │
│   │   ├── messaging/                   # Message queue
│   │   │   ├── rabbitmq-event-publisher.ts
│   │   │   └── rabbitmq-event-consumer.ts
│   │   │
│   │   └── external-services/           # External APIs
│   │       ├── firebase-push-notification.service.ts
│   │       └── nodemailer-email.service.ts
│   │
│   └── presentation/                    # 🌐 PRESENTATION LAYER - API/HTTP
│       ├── controllers/                 # REST controllers
│       │   ├── notification.controller.ts
│       │   ├── notification-preference.controller.ts
│       │   ├── push-token.controller.ts
│       │   └── health.controller.ts
│       │
│       └── guards/                      # Auth guards
│           └── jwt-auth.guard.ts
│
├── config/                              # 🔐 Configuration
│   ├── firebase-service-account.json
│   └── firebase-service-account.example.json
│
├── database/                            # 💾 Database scripts
│   └── init.sql
│
├── docs/                                # 📚 Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── FIREBASE_SETUP.md
│
├── test/                                # 🧪 Tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── .env                                 # Environment variables
├── .env.example
├── .gitignore
├── Dockerfile                           # Docker configuration
├── docker-compose.yml
├── nest-cli.json                        # Nest CLI config
├── package.json                         # Dependencies
├── tsconfig.json                        # TypeScript config
├── tsconfig.build.json
├── eslint.config.mjs                    # ESLint config
├── README.md                            # Main documentation
└── QUICKSTART.md                        # Quick start guide
```

---

## 📊 Layer Dependency Flow

```
┌────────────────────────────────────────┐
│     Presentation Layer                 │
│  (Controllers, Guards, DTOs)           │
└──────────────┬─────────────────────────┘
               │ depends on ↓
┌──────────────▼─────────────────────────┐
│     Application Layer                  │
│  (Use Cases, Ports/Interfaces)         │
└──────────────┬─────────────────────────┘
               │ depends on ↓
┌──────────────▼─────────────────────────┐
│     Domain Layer                       │
│  (Entities, Value Objects, Events)     │
└────────────────────────────────────────┘
               ▲ implemented by
┌──────────────┴─────────────────────────┐
│     Infrastructure Layer               │
│  (Database, External Services, Queue)  │
└────────────────────────────────────────┘
```

---

## 🔑 Key Principles

### 1. **Dependency Rule**
Dependencies always point **inward**. Inner layers don't know about outer layers.

### 2. **Separation of Concerns**
- **Domain**: Pure business logic
- **Application**: Orchestration & use cases
- **Infrastructure**: Technical implementation
- **Presentation**: API/UI layer

### 3. **Dependency Inversion**
High-level modules depend on **abstractions** (ports), not concrete implementations.

---

## 🎯 Benefits

✅ **Testability** - Easy to mock and test  
✅ **Maintainability** - Clean separation of concerns  
✅ **Flexibility** - Easy to swap implementations  
✅ **Scalability** - Easy to add features  
✅ **Independence** - Framework agnostic domain  

---

## 📝 Naming Conventions

- **Entities**: `*.entity.ts`
- **Value Objects**: `*.vo.ts`
- **Events**: `*.event.ts`
- **DTOs**: `*.dto.ts`
- **Use Cases**: `*.use-case.ts`
- **Ports**: `*.port.ts`
- **Repositories**: `*.repository.ts`
- **Schemas**: `*.schema.ts`
- **Mappers**: `*.mapper.ts`
- **Controllers**: `*.controller.ts`
- **Guards**: `*.guard.ts`

---

## 🔄 Data Flow Example

**Send Notification Flow:**

```
1. POST /api/notifications
   ↓
2. NotificationController
   ↓
3. SendNotificationUseCase
   ↓
4. Notification Entity (domain logic)
   ↓
5. NotificationRepositoryPort (interface)
   ↓
6. PostgresNotificationRepository (implementation)
   ↓
7. TypeORM → PostgreSQL
   ↓
8. PushNotificationServicePort (interface)
   ↓
9. FirebasePushNotificationService (implementation)
   ↓
10. Firebase Cloud Messaging
```

---

## 📦 Module Dependencies

```typescript
// NotificationModule provides:
- SendNotificationUseCase
- GetUserNotificationsUseCase
- All other use cases

// And injects:
- Repositories (PostgreSQL)
- External Services (Firebase, Email)
- Event Publisher (RabbitMQ)
```

---

## 🧩 SOLID in Action

### Single Responsibility
Each use case does **one thing** only.

### Open/Closed
Add new channels without modifying existing code.

### Liskov Substitution
Swap Firebase with OneSignal seamlessly.

### Interface Segregation
Small, focused port interfaces.

### Dependency Inversion
Use cases depend on **ports**, not concrete classes.

---

## 📚 Further Reading

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [NestJS Documentation](https://docs.nestjs.com/)
