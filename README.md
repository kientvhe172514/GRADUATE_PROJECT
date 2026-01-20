<p align="center">
  <img src="docs/assets/logo.png" alt="Zentry Logo" width="120" />
</p>

<h1 align="center">🏢 Zentry - Smart HR Management System</h1>

<p align="center">
  <strong>Enterprise-grade Human Resource Management with AI-powered Face Recognition Attendance</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#documentation">Documentation</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"/>
  <img src="https://img.shields.io/badge/.NET%20Core%208-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt=".NET Core"/>
  <img src="https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white" alt="Flutter"/>
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes"/>
</p>

---

## 📋 Overview

**Zentry** is a comprehensive Human Resource Management System designed for modern enterprises. It features **AI-powered face recognition** for secure attendance tracking, **Bluetooth beacon** location validation, and a complete **leave management** workflow with multi-level approval.

Built with a **microservices architecture** using industry best practices, Zentry is production-ready with:
- ✅ High Availability (HA) configuration
- ✅ Horizontal Pod Autoscaling (HPA)
- ✅ CI/CD with GitHub Actions
- ✅ Prometheus + Grafana monitoring
- ✅ Role-Based Access Control (RBAC)

---

## ✨ Features

### 👤 Employee Management
- Employee CRUD operations with department hierarchy
- Role-based access control (Employee, Manager, HR Admin)
- Device session management with multi-device support
- Profile management with face embedding enrollment

### 📍 Smart Attendance System
- **AI Face Recognition** - MTCNN + FaceNet with 98%+ accuracy
- **Bluetooth Beacon Validation** - Verify physical office presence
- **GPS Location Tracking** - Geofencing for remote/field workers
- Real-time attendance dashboard
- Automated late/early departure alerts

### 📅 Leave Management
- Multiple leave types (Annual, Sick, Maternity, etc.)
- Multi-level approval workflow
- Leave balance tracking and accrual
- Calendar integration with team visibility
- Push notifications for status updates

### 📊 Reporting & Analytics
- Attendance reports (daily, weekly, monthly)
- Leave utilization analytics
- Department-wise statistics
- Export to PDF/Excel

### 🔔 Notifications
- Firebase Cloud Messaging (FCM) push notifications
- Email notifications (SMTP)
- In-app notification center
- Real-time WebSocket updates

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPLICATIONS                            │
├─────────────────────────────────┬───────────────────────────────────────┤
│   📱 Flutter Mobile App         │      🌐 Next.js Web Dashboard          │
│   (iOS & Android)               │      (React + TypeScript)             │
└─────────────────────────────────┴───────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        🔀 NGINX Ingress Controller                       │
│                   (Load Balancing, SSL, Rate Limiting)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
│  Auth Service │    │   Employee Service    │    │  Attendance Service   │
│   (NestJS)    │    │      (NestJS)         │    │      (NestJS)         │
└───────────────┘    └───────────────────────┘    └───────────────────────┘
        │                           │                           │
        ├───────────────────────────┼───────────────────────────┤
        ▼                           ▼                           ▼
┌───────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
│ Leave Service │    │ Notification Service  │    │  Reporting Service    │
│   (NestJS)    │    │      (NestJS)         │    │      (NestJS)         │
└───────────────┘    └───────────────────────┘    └───────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               🤖 Face Recognition Service (.NET Core 8 + Python ML)      │
│                        MTCNN Detection │ FaceNet Embeddings              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │ PostgreSQL│   │   Redis   │   │ RabbitMQ  │
            │  (HA)     │   │ (Sentinel)│   │   (HA)    │
            └───────────┘   └───────────┘   └───────────┘
```

---

## 🛠️ Tech Stack

### Backend Services

| Service | Technology | Port | Description |
|---------|------------|------|-------------|
| **Auth** | NestJS + TypeScript | 3001 | Authentication, JWT, Sessions |
| **Employee** | NestJS + TypeScript | 3003 | Employee CRUD, Departments |
| **Attendance** | NestJS + TypeScript | 3002 | Check-in/out, Beacon validation |
| **Leave** | NestJS + TypeScript | 3004 | Leave requests, Approvals |
| **Notification** | NestJS + TypeScript | 3005 | Push/Email notifications |
| **Reporting** | NestJS + TypeScript | 3006 | Reports, Analytics |
| **Face Recognition** | .NET Core 8 + C# | 8080 | AI Face verification |

### Client Applications

| Application | Technology | Platform |
|-------------|------------|----------|
| **Mobile App** | Flutter 3.x + Dart | iOS, Android |
| **Web Dashboard** | Next.js 14 + React | Web |

### Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Container Runtime** | Docker | Containerization |
| **Orchestration** | Kubernetes | Production deployment |
| **Database** | PostgreSQL 15 | Primary data store |
| **Cache** | Redis 7 (Sentinel) | Sessions, caching |
| **Message Queue** | RabbitMQ 3.12 | Event-driven messaging |
| **API Gateway** | NGINX Ingress | Routing, SSL, Load balancing |
| **Monitoring** | Prometheus + Grafana | Metrics & dashboards |
| **CI/CD** | GitHub Actions | Automated pipelines |
| **Local Dev** | Skaffold | Hot-reload development |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x LTS
- **pnpm** 9.x
- **Docker** & Docker Compose
- **.NET SDK** 8.0 (for Face Recognition service)
- **Flutter** 3.x (for mobile development)

### Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/graduate-project.git
cd graduate-project

# 2. Install dependencies
pnpm install:all

# 3. Start infrastructure (PostgreSQL, Redis, RabbitMQ)
docker-compose up -d

# 4. Run services (in separate terminals)
pnpm start:auth        # Auth service on :3001
pnpm start:employee    # Employee service on :3003
pnpm start:attendance  # Attendance service on :3002
pnpm start:leave       # Leave service on :3004
pnpm start:notif       # Notification service on :3005
pnpm start:reporting   # Reporting service on :3006

# 5. Face Recognition service (.NET)
cd services/face-recognition
dotnet run --project src/Zentry.API
```

### Environment Configuration

Each service has a `.env.example` file. Copy and configure:

```bash
cp services/auth/.env.example services/auth/.env
# Edit with your configuration
```

Key environment variables:
```env
# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/auth_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

# RabbitMQ
RABBITMQ_URL=amqp://admin:rabbitmq123@localhost:5672

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
```

---

## 📦 Deployment

### Kubernetes Deployment (Production)

The project uses **Skaffold** for streamlined Kubernetes deployment:

```bash
# Step 1: Create namespaces and platform resources
skaffold run -p step1-namespace

# Step 2: Deploy infrastructure (PostgreSQL, Redis, RabbitMQ, Monitoring)
skaffold run -p step2-infra

# Step 3: Deploy application services
skaffold run -p step3-services
```

### Development with Skaffold

```bash
# Hot-reload development with auto-sync
skaffold dev -p dev

# Access services via port-forwarding:
# - Auth: localhost:3001
# - Grafana: localhost:3030
# - Prometheus: localhost:9090
```

### CI/CD Pipeline

GitHub Actions workflow automates:
- ✅ Linting & type checking
- ✅ Unit & integration tests
- ✅ Docker image build & push
- ✅ Kubernetes deployment
- ✅ Automated rollback on failure

---

## 📚 Documentation

Comprehensive documentation available in the `/docs` folder:

| Document | Description |
|----------|-------------|
| [System Architecture](docs/SYSTEM_ARCHITECTURE_DIAGRAM.md) | High-level architecture & diagrams |
| [Database ERD](docs/DATABASE_ERD_DIAGRAM.dbml) | Entity Relationship Diagram |
| [API Sequence Diagrams](docs/CORE_SEQUENCE_DIAGRAMS.md) | Request/response flows |
| [Class Diagrams](docs/CORE_CLASS_DIAGRAM.md) | Domain model structure |
| [RBAC Permissions](docs/RBAC_PERMISSIONS_MATRIX.md) | Role-based access control |
| [Push Notifications](docs/PUSH_NOTIFICATION_FLOW.md) | FCM integration guide |
| [Deployment Guide](docs/FRONTEND_DEPLOYMENT_GUIDE.md) | Production deployment |
| [Secrets Management](docs/COMPLETE_SECRETS_GUIDE.md) | Kubernetes secrets |

---

## 📁 Project Structure

```
graduate_project/
├── 📂 clients/                    # Client applications
│   ├── 📂 flutter_app/            # Mobile app (Flutter)
│   └── 📂 nextjs_web/             # Web dashboard (Next.js)
│
├── 📂 services/                   # Backend microservices
│   ├── 📂 auth/                   # Authentication service
│   ├── 📂 employee/               # Employee management
│   ├── 📂 attendance/             # Attendance tracking
│   ├── 📂 leave/                  # Leave management
│   ├── 📂 notification/           # Push/Email notifications
│   ├── 📂 reporting/              # Reports & analytics
│   ├── 📂 face-recognition/       # AI face verification (.NET)
│   └── 📂 shared-common/          # Shared utilities
│
├── 📂 infra/                      # Infrastructure configs
│   └── 📂 k8s/                    # Kubernetes manifests
│       ├── 📂 platform/           # Namespace, quotas, network
│       ├── 📂 services/           # Service deployments
│       └── 📂 shared/             # DB, Redis, RabbitMQ, monitoring
│
├── 📂 docs/                       # Documentation
├── 📂 .github/workflows/          # CI/CD pipelines
│
├── 📄 docker-compose.yml          # Local dev infrastructure
├── 📄 skaffold.yaml               # Kubernetes development
├── 📄 package.json                # Workspace configuration
└── 📄 pnpm-workspace.yaml         # pnpm monorepo config
```

---

## 🔐 Security Features

- **JWT Authentication** with refresh token rotation
- **RBAC** (Role-Based Access Control) with fine-grained permissions
- **Device Session Management** with single/multi-device support
- **Rate Limiting** at API gateway level
- **Network Policies** in Kubernetes
- **Secrets Management** via Kubernetes Secrets
- **Face Embedding Storage** (not raw images) for privacy
- **HTTPS/TLS** for all communications

---

## 📈 Monitoring & Observability

- **Prometheus** - Metrics collection from all services
- **Grafana** - Pre-configured dashboards for:
  - Service health monitoring
  - Request latency & throughput
  - Database connection pools
  - Redis cache hit rates
  - RabbitMQ queue depths
- **AlertManager** - Automated alerting for critical issues
- **Structured Logging** - JSON logs for easy parsing

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is developed as a **Graduate Project** for educational purposes.

---

## 👨‍💻 Author

**Kiên Trần**
- 🎓 FPT University - Software Engineering
- 📧 kientvhe172514@fpt.edu.vn

---

<p align="center">
  Made with ❤️ for my Graduate Project @ FPT University
</p>
