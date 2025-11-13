# 🚀 Auth Service - Setup Guide

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14
- RabbitMQ >= 3.x
- Redis (optional)
- pnpm workspace

## 🔧 Environment Setup

### 1. Copy .env.example to .env
```bash
cp .env.example .env
```

### 2. Configure Database
Update `.env` with your PostgreSQL credentials:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/auth_db
```

### 3. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE auth_db;

# Exit psql
\q
```

### 4. Configure JWT Secret
⚠️ **IMPORTANT**: Change JWT_SECRET in production!
```env
JWT_SECRET=zentry_super_secret_jwt_key_for_graduate_project_2025_min_32_characters_long
```

### 5. Configure RabbitMQ
Ensure RabbitMQ is running:
```bash
# Check RabbitMQ status
docker ps | grep rabbitmq

# Or start via docker-compose (from project root)
docker-compose up -d rabbitmq
```

## 📦 Installation

### 1. Install Dependencies
```bash
# From project root (uses pnpm workspace)
pnpm install

# Or from auth service directory
cd services/auth
npm install
```

### 2. Build Shared-Common
```bash
cd services/shared-common
npm run build
```

### 3. Build Auth Service
```bash
cd services/auth
npm run build
```

## 🌱 Database Seeding

### Seed RBAC (Roles, Permissions, Admin Account)
```bash
npm run seed:rbac
```

This creates:
- **4 Roles:** ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE
- **69 Permissions** across all resources
- **Admin Account:** 
  - Email: `admin@zentry.com`
  - Password: `Admin@123`

## 🏃 Running the Service

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Docker Mode
```bash
docker-compose up -d auth
```

## 🌐 Access Points

- **Service:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/v1/auth/health
- **Swagger Docs:** http://localhost:3001/auth/swagger

## 🧪 Testing

### 1. Health Check
```bash
curl http://localhost:3001/api/v1/auth/health
```

### 2. Login as Admin
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@zentry.com",
    "password": "Admin@123"
  }'
```

### 3. Get All Roles (requires JWT)
```bash
curl http://localhost:3001/api/v1/auth/roles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🏗️ Architecture

### Clean Architecture Layers
```
src/
├── domain/           # Business logic (entities, value objects, factories)
├── application/      # Use cases, DTOs, ports
├── infrastructure/   # Database, messaging, external services
└── presentation/     # Controllers, guards, decorators
```

### Key Features
✅ **4-Level Role Hierarchy:** ADMIN → HR_MANAGER → DEPARTMENT_MANAGER → EMPLOYEE  
✅ **RBAC:** Permission-based access control  
✅ **JWT Authentication:** Access + Refresh tokens  
✅ **HttpOnly Cookies:** Secure token storage  
✅ **Audit Logs:** Track all account activities  
✅ **Temporary Passwords:** Force password change on first login  
✅ **Event-Driven:** RabbitMQ integration  

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user info

### Account Management
- `POST /api/v1/auth/register` - Create account
- `PUT /api/v1/auth/accounts/:id` - Update account
- `POST /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token

### Role Management (ADMIN only)
- `GET /api/v1/auth/roles` - List all roles
- `GET /api/v1/auth/roles/:id` - Get role details
- `POST /api/v1/auth/roles` - Create new role
- `PUT /api/v1/auth/roles/:id` - Update role
- `DELETE /api/v1/auth/roles/:id` - Delete role
- `POST /api/v1/auth/roles/:id/permissions` - Assign permissions

### Permission Management (ADMIN only)
- `GET /api/v1/auth/permissions` - List all permissions
- `GET /api/v1/auth/permissions/:id` - Get permission details
- `POST /api/v1/auth/permissions` - Create permission
- `PUT /api/v1/auth/permissions/:id` - Update permission
- `DELETE /api/v1/auth/permissions/:id` - Delete permission

### Admin Endpoints
- `GET /api/v1/auth/admin/accounts` - List all accounts (pagination)
- `GET /api/v1/auth/admin/accounts/:id` - Get account details
- `PUT /api/v1/auth/admin/accounts/:id/status` - Update account status
- `GET /api/v1/auth/admin/audit-logs` - View audit logs

## 🔐 Security Best Practices

### JWT Token Management
- Access token: **15 minutes** (short-lived)
- Refresh token: **7 days** (long-lived)
- Tokens stored in **HttpOnly cookies** (not accessible via JavaScript)
- CORS configured for specific origins

### Password Policy
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character
- Hashed with bcrypt (10 rounds)

### Rate Limiting
- 100 requests per minute per IP
- Configurable via `RATE_LIMIT_MAX` env variable

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -U postgres -l | grep auth_db

# Test connection
psql -U postgres -d auth_db -c "SELECT 1"
```

### RabbitMQ Connection Failed
```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# Access RabbitMQ Management UI
# http://localhost:15672 (admin/rabbitmq123)
```

### Build Errors
```bash
# Clean node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild shared-common
cd ../shared-common
npm run build

# Return to auth service
cd ../auth
npm run build
```

### Migration Issues
```bash
# Drop and recreate database (⚠️ DEVELOPMENT ONLY)
psql -U postgres -c "DROP DATABASE IF EXISTS auth_db"
psql -U postgres -c "CREATE DATABASE auth_db"

# Re-run seeds
npm run seed:rbac
```

## 📝 Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `JWT_SECRET` | Secret key for JWT signing | - | ✅ |
| `JWT_EXPIRES_IN` | Access token expiration | 15m | ✅ |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | 7d | ✅ |
| `APP_PORT` | Service port | 3001 | ✅ |
| `NODE_ENV` | Environment mode | development | ✅ |
| `COOKIE_DOMAIN` | Cookie domain | localhost | ✅ |
| `CORS_ORIGINS` | Allowed CORS origins | * | ✅ |
| `RABBITMQ_URL` | RabbitMQ connection URL | - | ✅ |
| `RABBITMQ_IAM_QUEUE` | Queue name for IAM events | iam_queue | ✅ |
| `RABBITMQ_EMPLOYEE_QUEUE` | Queue name for employee events | employee_queue | ✅ |
| `RABBITMQ_NOTIFICATION_QUEUE` | Queue name for notifications | notification_queue | ✅ |
| `REDIS_HOST` | Redis host | localhost | ❌ |
| `REDIS_PORT` | Redis port | 6379 | ❌ |
| `LOG_LEVEL` | Logging level | debug | ❌ |
| `SWAGGER_ENABLED` | Enable Swagger UI | true | ❌ |
| `RATE_LIMIT_MAX` | Max requests per minute | 100 | ❌ |
| `SMTP_HOST` | SMTP server host | - | ❌ |
| `SMTP_USER` | SMTP username | - | ❌ |
| `SMTP_PASSWORD` | SMTP password | - | ❌ |

## 🔄 Role Hierarchy

```
Level 1: ADMIN (Highest)
  └── Full system access
  └── All permissions

Level 2: HR_MANAGER
  └── HR & employee management
  └── Department/position CRUD
  └── Approve all leave/attendance

Level 3: DEPARTMENT_MANAGER
  └── Manage own department
  └── Approve team leave/attendance
  └── View department reports

Level 4: EMPLOYEE (Lowest)
  └── Self-service only
  └── Check-in/out, request leave
  └── View own information
```

## 📞 Support

For issues or questions:
- Check Swagger docs: http://localhost:3001/auth/swagger
- Review audit logs: `GET /api/v1/auth/admin/audit-logs`
- Enable debug logging: `LOG_LEVEL=debug` in .env

## 🎉 Success Checklist

- [ ] PostgreSQL installed and running
- [ ] RabbitMQ installed and running
- [ ] Database `auth_db` created
- [ ] `.env` file configured
- [ ] Dependencies installed (`pnpm install`)
- [ ] Shared-common built
- [ ] Auth service built (`npm run build`)
- [ ] RBAC seeded (`npm run seed:rbac`)
- [ ] Service running (`npm run start:dev`)
- [ ] Health check passes (http://localhost:3001/api/v1/auth/health)
- [ ] Admin login works (admin@zentry.com / Admin@123)
- [ ] Swagger docs accessible (http://localhost:3001/auth/swagger)
