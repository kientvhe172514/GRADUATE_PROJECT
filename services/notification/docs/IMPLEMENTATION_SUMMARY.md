# Notification Service - Implementation Summary

## 🎯 Architecture Overview

The Notification Service follows **Clean Architecture** and **SOLID principles** to ensure:
- ✅ Easy extension (add new channels without breaking existing code)
- ✅ Easy testing (mock services for development)
- ✅ Easy maintenance (clear separation of concerns)
- ✅ Production ready (real implementations available)

---

## 📁 Project Structure

```
src/
├── application/          # Business logic layer
│   ├── ports/           # Interfaces (contracts)
│   │   ├── email.service.port.ts
│   │   ├── sms.service.port.ts
│   │   └── push-notification.service.port.ts
│   ├── use-cases/       # Business use cases
│   └── dtos/            # Data transfer objects
│
├── domain/              # Core business entities
│   ├── entities/        # Domain models
│   ├── enums/           # Business enums
│   └── events/          # Domain events
│
├── infrastructure/      # External implementations
│   ├── external-services/
│   │   ├── nodemailer-email.service.ts      # Real email
│   │   ├── twilio-sms.service.ts            # Real SMS
│   │   ├── firebase-push-notification.service.ts  # Real push
│   │   ├── mock-email.service.ts            # Mock email
│   │   ├── mock-sms.service.ts              # Mock SMS
│   │   └── mock-push.service.ts             # Mock push
│   ├── persistence/     # Database repositories
│   └── messaging/       # RabbitMQ publishers
│
└── presentation/        # API layer
    ├── controllers/     # REST endpoints
    └── event-listeners/ # Event handlers
```

---

## 🔌 Notification Channels

| Channel | Status | Real Implementation | Mock Available |
|---------|--------|---------------------|----------------|
| **In-App** | ✅ Active | PostgreSQL | N/A |
| **Email** | ✅ Ready | Nodemailer (Gmail, SMTP) | ✅ Yes |
| **SMS** | ✅ Ready | Twilio | ✅ Yes |
| **Push** | ✅ Ready | Firebase Cloud Messaging | ✅ Yes |

---

## 🎛️ Configuration Modes

### Development Mode (Default)
```env
USE_MOCK_SERVICES=true
NODE_ENV=development
```
**Benefits:**
- No external API keys needed
- All notifications logged to console
- Fast testing and development
- No costs or rate limits

### Production Mode
```env
USE_MOCK_SERVICES=false
NODE_ENV=production

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-specific-password
SMTP_FROM=noreply@company.com

# SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Push Notification Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd services/notification
npm install

# Optional: Install Twilio for SMS (only if using real SMS)
npm install twilio
```

### 2. Configure Environment
```bash
# Copy example
cp .env.example .env

# For development (recommended)
USE_MOCK_SERVICES=true

# For production (configure external services)
USE_MOCK_SERVICES=false
```

### 3. Run Service
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

### 4. Check Service Health
```
GET http://localhost:3002/api/health
```

### 5. View API Documentation
```
http://localhost:3002/api
```

---

## 📡 API Endpoints

### Notifications
- `POST /api/notifications` - Send notification
- `POST /api/notifications/template` - Send from template
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### Push Tokens
- `POST /api/push-tokens/register` - Register device token
- `DELETE /api/push-tokens/unregister` - Unregister token

### Preferences
- `GET /api/notification-preferences` - Get preferences
- `PUT /api/notification-preferences` - Update preferences

### Health
- `GET /api/health` - Service health check

---

## 🔄 Event Listeners

The service listens to events from other microservices:

| Event Source | Events Handled |
|--------------|----------------|
| **Auth Service** | `user.registered`, `password.reset`, etc. |
| **Employee Service** | `employee.created`, `employee.updated` |
| **Leave Service** | `leave.requested`, `leave.approved` |
| **Attendance Service** | `check-in.late`, `check-out.missing` |
| **Face Recognition** | `face.verified`, `face.failed` |

---

## 🧪 Testing

### Mock Mode (No External Services)
```typescript
// Automatically logs to console
[MockEmailService] 📧 Email would be sent:
   To: user@example.com
   Subject: Welcome!
   Body: Hello...
```

### Integration Testing
```typescript
import { MockEmailService } from './infrastructure/external-services/mock-email.service';

describe('SendNotificationUseCase', () => {
  it('should send email notification', async () => {
    const mockEmail = new MockEmailService();
    const useCase = new SendNotificationUseCase(..., mockEmail, ...);
    // Test without real email sending
  });
});
```

---

## 🔐 External Service Setup

### Email (Gmail)
1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
```env
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=generated-app-password
```

### SMS (Twilio)
1. Sign up: https://www.twilio.com/try-twilio
2. Get Account SID, Auth Token, Phone Number
3. Add to `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Push (Firebase)
1. Firebase Console: https://console.firebase.google.com/
2. Project Settings → Service accounts
3. Generate new private key (JSON)
4. Copy values to `.env`:
```env
FIREBASE_PROJECT_ID=project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
```

See `docs/FIREBASE_SETUP.md` for detailed instructions.

---

## 📊 Monitoring & Logging

All notifications are logged with:
- ✅ Recipient information
- ✅ Channel used
- ✅ Success/failure status
- ✅ Error details (if any)

Example logs:
```
[SendNotificationUseCase] Sending notification to user 123
[NodemailerEmailService] ✅ Email sent successfully to user@example.com
[FirebasePushNotificationService] Push notification sent: 5/5 succeeded
```

---

## 🎯 SOLID Compliance

✅ **Single Responsibility** - Each service does one thing
✅ **Open/Closed** - Easy to add new channels
✅ **Liskov Substitution** - Mocks can replace real services
✅ **Interface Segregation** - Focused interfaces
✅ **Dependency Inversion** - Depend on abstractions

See `docs/SOLID_PRINCIPLES.md` for detailed explanation.

---

## 🛠️ Troubleshooting

### Service won't start
- Check PostgreSQL connection
- Check RabbitMQ connection
- Verify `.env` file exists

### Notifications not sending
- Check `USE_MOCK_SERVICES` setting
- Verify external service credentials
- Check service logs for errors

### Email not working
- Verify SMTP credentials
- Check Gmail App Password (not regular password)
- Ensure SMTP_PORT is correct (587 for TLS)

### SMS not working
- Verify Twilio credentials
- Check phone number format (+country code)
- Ensure Twilio account is active

### Push not working
- Verify Firebase credentials
- Check device tokens are registered
- Ensure Firebase project is active

---

## 📚 Documentation

- [`SOLID_PRINCIPLES.md`](./SOLID_PRINCIPLES.md) - Architecture & SOLID compliance
- [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md) - Firebase configuration guide
- [`README.md`](./README.md) - Quick reference

---

## ✅ Production Checklist

Before deploying to production:

- [ ] Set `USE_MOCK_SERVICES=false`
- [ ] Configure real SMTP credentials
- [ ] Configure Twilio credentials (if using SMS)
- [ ] Configure Firebase credentials (if using push)
- [ ] Set `NODE_ENV=production`
- [ ] Enable database SSL
- [ ] Set up monitoring/alerts
- [ ] Configure log aggregation
- [ ] Set up database backups
- [ ] Review security settings

---

**Service Status: ✅ Production Ready**

All channels implemented, tested, and documented!
