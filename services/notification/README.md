# 🔔 Notification Service

> Microservice xử lý thông báo đa kênh cho hệ thống Zentry HR System

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=flat&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)

---

## 🚀 Tính năng

### ✅ Core Features
- 📬 **Multi-channel notifications**: Email, Push, SMS, In-App
- 🔥 **Firebase Cloud Messaging**: Push notifications cho mobile & web
- 📧 **Email notifications**: Via SMTP (Nodemailer)
- 📱 **Push token management**: Device registration & management
- ⚙️ **User preferences**: Per-user notification settings
- 🌙 **Do Not Disturb mode**: Time-based notification filtering
- 📝 **Template-based notifications**: Reusable notification templates
- 📅 **Scheduled notifications**: One-time & recurring (future)
- 🔄 **Event-driven**: Listen to events from other services via RabbitMQ

### 🏗️ Architecture
- ✨ **Clean Architecture**: Domain → Application → Infrastructure → Presentation
- 🎯 **SOLID Principles**: Maintainable & testable code
- 🔌 **Dependency Inversion**: Easy to swap implementations
- 🧪 **Highly testable**: Mocked dependencies via ports/interfaces

---

## 📋 Requirements

- **Node.js** 20+
- **PostgreSQL** 14+
- **RabbitMQ** 3.12+
- **Firebase Project** (for push notifications)

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Setup Database
```bash
# Start PostgreSQL
docker run --name postgres-notification \
  -e POSTGRES_DB=notification_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgres:14

# Run init script
psql -U postgres -d notification_db -f database/init.sql
```

### 4. Setup Firebase
1. Create Firebase project
2. Download service account key
3. Save to `config/firebase-service-account.json`
4. See [FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md) for details

### 5. Start Service
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

**Service runs on:** `http://localhost:3004`

📚 **[Full Quick Start Guide →](./QUICKSTART.md)**

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [API Documentation](./docs/API.md) | Complete REST API reference with examples |
| [Architecture Guide](./docs/ARCHITECTURE.md) | Clean Architecture & SOLID principles explained |
| [Firebase Setup](./docs/FIREBASE_SETUP.md) | Step-by-step Firebase integration guide |
| [Project Structure](./PROJECT_STRUCTURE.md) | Complete file tree & dependency flow |
| [Quick Start](./QUICKSTART.md) | Fast local setup with Docker |

---

## 🎯 API Endpoints

### 📬 Notifications
- `POST /api/notifications` - Send notification
- `GET /api/notifications/user/:userId` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### ⚙️ Preferences
- `GET /api/preferences/:userId` - Get preferences
- `PUT /api/preferences/:userId` - Update preferences

### 📱 Push Tokens
- `POST /api/push-tokens` - Register device token
- `DELETE /api/push-tokens/:token` - Unregister token

### 💚 Health Check
- `GET /health` - Service health status

📖 **[Full API Documentation →](./docs/API.md)**

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Notification│  │ Preferences │  │ Push Tokens │         │
│  │ Controller  │  │ Controller  │  │ Controller  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
┌─────────┼─────────────────┼─────────────────┼───────────────┐
│         ▼                 ▼                 ▼                │
│                    Application Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Send      │  │    Get      │  │   Update    │         │
│  │ Notification│  │Notifications│  │ Preferences │         │
│  │  Use Case   │  │  Use Case   │  │  Use Case   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
┌─────────┼─────────────────┼─────────────────┼───────────────┐
│         ▼                 ▼                 ▼                │
│                   Infrastructure Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  PostgreSQL │  │   Firebase  │  │   RabbitMQ  │         │
│  │ Repositories│  │ Push Service│  │   Consumer  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
┌─────────┼─────────────────┼─────────────────┼───────────────┐
│         ▼                 ▼                 ▼                │
│                       Domain Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Notification│  │  Preference │  │ Push Token  │         │
│  │   Entity    │  │   Entity    │  │   Entity    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

**Key Principles:**
- ✅ **Dependency Rule**: Dependencies point inward (Presentation → Application → Domain)
- ✅ **Single Responsibility**: Each use case does one thing
- ✅ **Dependency Inversion**: Depend on abstractions (ports), not concretions
- ✅ **Interface Segregation**: Small, focused interfaces
- ✅ **Open/Closed**: Extend behavior without modifying existing code

🔗 **[Detailed Architecture Guide →](./docs/ARCHITECTURE.md)**

---

## 🔄 Event-Driven Integration

Service listens to events from other microservices via RabbitMQ:

| Source Service | Event | Action |
|---------------|-------|--------|
| **Attendance** | `attendance.checked-in` | Send check-in confirmation |
| **Attendance** | `attendance.late` | Send late arrival alert |
| **Leave** | `leave.approved` | Send approval notification |
| **Leave** | `leave.rejected` | Send rejection notification |
| **Face Recognition** | `face.verification-failed` | Send verification failure alert |
| **Auth** | `auth.password-changed` | Send password change confirmation |
| **Employee** | `employee.created` | Send welcome notification |

**RabbitMQ Configuration:**
- **Exchange**: `microservices-events` (topic)
- **Queue**: `notification-service-queue`
- **Routing Keys**: `attendance.*`, `leave.*`, `face.*`, `auth.*`, `employee.*`

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t notification-service:latest .
```

### Run Container
```bash
docker run -d \
  --name notification-service \
  -p 3004:3004 \
  -e DATABASE_URL=postgresql://postgres:postgres@postgres:5432/notification_db \
  -e RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672 \
  notification-service:latest
```

### Docker Compose
```bash
docker-compose up -d
```

---

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Service port | `3004` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USER` | Database user | `postgres` |
| `DATABASE_PASSWORD` | Database password | `postgres` |
| `DATABASE_NAME` | Database name | `notification_db` |
| `RABBITMQ_URL` | RabbitMQ connection URL | `amqp://guest:guest@localhost:5672` |
| `RABBITMQ_EXCHANGE` | RabbitMQ exchange name | `microservices-events` |
| `RABBITMQ_QUEUE` | RabbitMQ queue name | `notification-service-queue` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Firebase credentials path | `config/firebase-service-account.json` |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP port | `587` |
| `SMTP_USER` | Email SMTP user | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Email SMTP password | `your-app-password` |
| `JWT_SECRET` | JWT verification secret | `your-jwt-secret` |

---

## 📊 Database Schema

![Database Schema](https://via.placeholder.com/800x400?text=See+database/init.sql+for+complete+schema)

**Core Tables:**
- `notifications` - Main notification records
- `notification_preferences` - Per-user preferences
- `notification_templates` - Reusable templates
- `push_notification_tokens` - FCM device tokens
- `notification_delivery_logs` - Delivery status tracking
- `scheduled_notifications` - Future/recurring notifications

📄 **[View Schema →](./database/init.sql)**

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📝 License

This project is part of Zentry HR System - Graduate Project

---

## 👨‍💻 Maintainer

**Graduate Project Team**  
Semester 9 - 2024

---

## 🔗 Related Services

- [Auth Service](../auth) - Authentication & authorization
- [Employee Service](../employee) - Employee management
- [Attendance Service](../attendance) - Attendance tracking
- [Leave Service](../leave) - Leave management
- [Face Recognition Service](../face-recognition) - Biometric verification
- [Reporting Service](../reporting) - Analytics & reports

---

**Made with ❤️ using Clean Architecture & SOLID Principles**

$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
