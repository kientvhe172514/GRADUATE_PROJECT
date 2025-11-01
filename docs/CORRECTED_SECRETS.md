# 🔧 CORRECTED GITHUB SECRETS - SERVICE NAMES FIXED

> **Copy các secrets này để update trên GitHub**

---

## ✅ AUTH_SECRET (CORRECTED)

```env
DATABASE_URL=postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-primary-srv.infrastructure.svc.cluster.local:5432/IAM
JWT_SECRET=AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
APP_PORT=3001
NODE_ENV=production
RABBITMQ_URL=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-srv.infrastructure.svc.cluster.local:5672
RABBITMQ_EMPLOYEE_QUEUE=employee_queue
RABBITMQ_IAM_QUEUE=iam_queue
RABBITMQ_NOTIFICATION_QUEUE=notification_queue
REDIS_HOST=redis-master-srv.infrastructure.svc.cluster.local
REDIS_PORT=6379
REDIS_PASSWORD=Redis@SecurePassword2024
```

---

## ✅ ATTENDANCE_SECRET (CORRECTED)

```env
APP_PORT=3002
NODE_ENV=production
DATABASE_URL=postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-primary-srv.infrastructure.svc.cluster.local:5432/attendance_db
RABBITMQ_URL=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-srv.infrastructure.svc.cluster.local:5672
RABBITMQ_ATTENDANCE_QUEUE=attendance_queue
RABBITMQ_EMPLOYEE_QUEUE=employee_queue
RABBITMQ_LEAVE_QUEUE=leave_queue
RABBITMQ_NOTIFICATION_QUEUE=notification_queue
REDIS_URL=redis://:Redis@SecurePassword2024@redis-master-srv.infrastructure.svc.cluster.local:6379
JWT_SECRET=AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
JWT_EXPIRATION=1d
CHECK_IN_GRACE_PERIOD_MINUTES=15
CHECK_OUT_GRACE_PERIOD_MINUTES=15
BEACON_DETECTION_RADIUS_METERS=100
GPS_ACCURACY_THRESHOLD_METERS=50
FACE_RECOGNITION_CONFIDENCE_THRESHOLD=0.85
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
```

---

## ✅ EMPLOYEE_SECRET (CORRECTED)

```env
APP_PORT=3003
DATABASE_URL=postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-primary-srv.infrastructure.svc.cluster.local:5432/employee_db
RABBITMQ_URL=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-srv.infrastructure.svc.cluster.local:5672
RABBITMQ_IAM_QUEUE=iam_queue
RABBITMQ_EMPLOYEE_QUEUE=employee_queue
REDIS_URL=redis://:Redis@SecurePassword2024@redis-master-srv.infrastructure.svc.cluster.local:6379
```

---

## ✅ LEAVE_SECRET (CORRECTED)

```env
APP_PORT=3004
NODE_ENV=production
DATABASE_URL=postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-primary-srv.infrastructure.svc.cluster.local:5432/leave_db
RABBITMQ_URL=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-srv.infrastructure.svc.cluster.local:5672
RABBITMQ_LEAVE_QUEUE=leave_queue
RABBITMQ_EMPLOYEE_QUEUE=employee_queue
RABBITMQ_NOTIFICATION_QUEUE=notification_queue
REDIS_URL=redis://:Redis@SecurePassword2024@redis-master-srv.infrastructure.svc.cluster.local:6379
JWT_SECRET=AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
JWT_EXPIRATION=1d
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
```

---

## ✅ NOTIFICATION_SECRET (CORRECTED)

```env
NODE_ENV=production
APP_PORT=3005
SERVICE_NAME=notification
USE_MOCK_SERVICES=false
DATABASE_URL=postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-primary-srv.infrastructure.svc.cluster.local:5432/notification_db
RABBITMQ_URL=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-srv.infrastructure.svc.cluster.local:5672
RABBITMQ_NOTIFICATION_QUEUE=notification_queue
JWT_SECRET=AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
JWT_EXPIRY=24h
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7XXXXXXXX
-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=kientvhe172514@fpt.edu.vn
SMTP_PASSWORD=tlgs vqgb tbfe gslr
SMTP_FROM_NAME=Zentry HR System
SMTP_FROM_EMAIL=noreply@zentry.com
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
```

---

## ✅ REPORTING_SECRET (CORRECTED)

```env
APP_PORT=3006
NODE_ENV=production
DATABASE_URL=postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-primary-srv.infrastructure.svc.cluster.local:5432/reporting_db
RABBITMQ_URL=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-srv.infrastructure.svc.cluster.local:5672
RABBITMQ_REPORTING_QUEUE=reporting_queue
RABBITMQ_ATTENDANCE_QUEUE=attendance_queue
RABBITMQ_LEAVE_QUEUE=leave_queue
RABBITMQ_EMPLOYEE_QUEUE=employee_queue
RABBITMQ_NOTIFICATION_QUEUE=notification_queue
REDIS_URL=redis://:Redis@SecurePassword2024@redis-master-srv.infrastructure.svc.cluster.local:6379
JWT_SECRET=AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
JWT_EXPIRATION=1d
EXPORT_STORAGE_PATH=/tmp/reports
EXPORT_FILE_RETENTION_DAYS=30
MAX_EXPORT_RECORDS=100000
REPORT_GENERATION_TIMEOUT_SECONDS=300
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
```

---

## ✅ FACE_RECOGNITION_SECRET (CORRECTED)

```env
POSTGRES_HOST=postgres-primary-srv.infrastructure.svc.cluster.local
POSTGRES_PORT=5432
POSTGRES_DATABASE=zentry
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=Qqanhkien@2024SecurePassword
REDIS_CONNECTION_STRING=redis-master-srv.infrastructure.svc.cluster.local:6379,password=Redis@SecurePassword2024
MONGODB_CONNECTION_STRING=mongodb://admin:MongoSecure@2024Password@mongodb-srv.infrastructure.svc.cluster.local:27017/zentry
RABBITMQ_HOST=rabbitmq-srv.infrastructure.svc.cluster.local
RABBITMQ_USERNAME=admin
RABBITMQ_PASSWORD=RabbitMQ@SecurePass2024
JWT_SECRET=AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
JWT_ISSUER=https://api.zentry.com
JWT_AUDIENCE=https://app.zentry.com
JWT_EXPIRATION_MINUTES=60
ASPNETCORE_ENVIRONMENT=Production
AllowedHosts=*
```

---

## 📋 HƯỚNG DẪN UPDATE

### Cách 1: Update từng secret trên GitHub UI

1. Vào: https://github.com/kientvhe172514/GRADUATE_PROJECT/settings/secrets/actions
2. Click **Edit** (✏️) bên cạnh mỗi secret
3. Copy nội dung từ file này
4. Paste vào và Save

### Cách 2: Update bằng GitHub CLI (NHANH HƠN)

```bash
# Save mỗi secret vào file tạm
cat > /tmp/auth_secret.txt << 'EOF'
DATABASE_URL=postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-primary-srv.infrastructure.svc.cluster.local:5432/IAM
JWT_SECRET=AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
APP_PORT=3001
NODE_ENV=production
RABBITMQ_URL=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-srv.infrastructure.svc.cluster.local:5672
RABBITMQ_EMPLOYEE_QUEUE=employee_queue
RABBITMQ_IAM_QUEUE=iam_queue
RABBITMQ_NOTIFICATION_QUEUE=notification_queue
REDIS_HOST=redis-master-srv.infrastructure.svc.cluster.local
REDIS_PORT=6379
REDIS_PASSWORD=Redis@SecurePassword2024
EOF

# Update secret
gh secret set AUTH_SECRET < /tmp/auth_secret.txt

# Lặp lại cho các secrets khác...
```

---

## 🔍 NHỮNG GÌ ĐÃ THAY ĐỔI

| Old (SAI) | New (ĐÚNG) | Service Type |
|-----------|------------|--------------|
| `postgres-cluster-ip-service` | `postgres-primary-srv.infrastructure.svc.cluster.local` | PostgreSQL Primary |
| `rabbitmq-cluster-ip-service` | `rabbitmq-srv.infrastructure.svc.cluster.local` | RabbitMQ |
| `redis-cluster-ip-service` | `redis-master-srv.infrastructure.svc.cluster.local` | Redis Master |
| `mongodb-cluster-ip-service` | `mongodb-srv.infrastructure.svc.cluster.local` | MongoDB |

### Tại sao cần FQDN (Fully Qualified Domain Name)?

- Services gọi **CROSS-NAMESPACE** (từ `graduate-project` → `infrastructure`)
- Format: `<service-name>.<namespace>.svc.cluster.local`
- Ví dụ: `postgres-primary-srv.infrastructure.svc.cluster.local`

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **ĐỔI TẤT CẢ PASSWORDS** trước khi deploy production!
2. Update Firebase credentials trong `NOTIFICATION_SECRET`
3. Update SMTP credentials với App Password thật
4. Sau khi update secrets, trigger lại CI/CD để redeploy

---

## 🚀 SAU KHI UPDATE

```bash
# SSH vào server
ssh -i ~/.ssh/id_rsa ec2-user@<EC2_IP>

# Delete và recreate secrets
kubectl delete secret auth-secrets -n graduate-project
kubectl delete secret attendance-secrets -n graduate-project
kubectl delete secret employee-secrets -n graduate-project
kubectl delete secret leave-secrets -n graduate-project
kubectl delete secret notification-secrets -n graduate-project
kubectl delete secret reporting-secrets -n graduate-project
kubectl delete secret face-recognition-secrets -n graduate-project

# Trigger workflow hoặc manual deploy
cd ~/GRADUATE_PROJECT
git pull origin main

# Manual recreate secret (example for auth)
kubectl create secret generic auth-secrets \
  --from-literal=.env='<paste AUTH_SECRET content here>' \
  -n graduate-project

# Restart deployments
kubectl rollout restart deployment -n graduate-project
```
