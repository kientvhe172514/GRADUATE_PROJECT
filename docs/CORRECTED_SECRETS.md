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
SKIP_AUTH=false
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
SKIP_AUTH=false
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
SKIP_AUTH=false
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
SKIP_AUTH=false
```

---

## ✅ NOTIFICATION_SECRET (CORRECTED)

```env
NODE_ENV=development
APP_PORT=3005
SERVICE_NAME=notification
USE_MOCK_SERVICES=false
DATABASE_URL=postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-primary-srv.infrastructure.svc.cluster.local:5432/notification_db
RABBITMQ_URL=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-srv.infrastructure.svc.cluster.local:5672
RABBITMQ_NOTIFICATION_QUEUE=notification_queue
JWT_SECRET=AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
JWT_EXPIRY=24h
FIREBASE_PROJECT_ID=zentry-hr-system
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDmkBXCJdLWKbSv\nPwxrUz6/gfnsS752GQXBTQtVY5gEl51b5BorUBebtvP9tofcrEJzpLXxjrCYeaKv\nI7JMTrb6V7u3dWNI5CaSbMyRo5czezy9dT8/wa/W+BIfSa76xEfySfCYpyRgh8MD\n2TYzYptiJNjmRqOP6swQLeRozDKmtgzQRviFbvswWqMFY+PqzDvrScyYVmZlf7EE\n/dfQe8junH2FBMk81MzkSF697o2gg+hMUNi/Lurd9ZHNsAajWARjP90hdq9axN1u\nO/UqAFLtZBzSkANj8B1ICax8oXZhWhGYiwh6GrfQXyHVhJlp2URJaA8xalGH1tvq\nGw/qzY0RAgMBAAECggEAFakhsiy1gxNF+1TUCN04PuuqHC39hcDSDpf7YZlKtdu8\nl951Ku6KWUG16HcWin/QembWBQyfwKNkyklzPcIDZL+LTjAEFNwCV61LBr+0u8xv\nJ2l1eLrslyiVI0Vb4AlCrRuPM/g37a2zf5APjIJOEMlfazrlsOahJz/4fnP4qjqw\nkOXnrOJymx/mhaBif9XB0BD691kfB3NTBHw4T+GReBnjWJmvi++Mv0aIzKeSob/m\nqj/VPYImP0VpZa4lJczNfxcxoWrh5KVZTLFDPs2Y9DF8+uDZ5ZeJ5Tv3ctwU13I7\nIdQpIJhTRVqb9t2J2P4L8RRwu85d0x7nYmHriSZlpQKBgQD052i4uDis+pApAhpf\nqUyUlf2BioFuFe7QdTszEEPkVgZBF2qvj8WfLz/P1H80zS6hVAwJFzLbk3wmWsdD\ndN0aCu5GH3SW4u4D/O9WJ6TE0FHKGz3k/TZj46ZXHa+zt16MC/wTWQ8ye6/pe3r0\nhLdlITXOIqlknvl15q+S4DIWKwKBgQDxAlYYxJmofsg0WLw6HKY2NHWe/N06evWa\nV9O9pvwr4CumuXtTcc4+7ZGZNyvvnjcIQ0wxGjoFqzNU83KvpFDzP00caI+9w1YK\ndk6T8lCWpVkf2aFV4/FAyCQbAGn6EQLwseJIdoMQrKDcu+9A6vUtZyFsKhu1AfK1\nFYkYivanswKBgDhz+2TROmdNXtvFG1U/zmJV7Njml41LywAMdfgAYNYKqmhowHP1\nvUVDe/8paaU/Qud3W0rhKR0Kc0zYEiTPlIQDTwelCpgZeWo77OO8QbQInUHsY6kc\nYWRHPrnIIw9XTpkTziibl/A4KMW2bBJfYXMTY7a/sLJ8Ht75rTE7MvB/AoGAHuqU\nztKRf4rb9dMYOkAoljV+jSmU24agcO8pS1/bY2l7UATlLBwiP/JLxiLMsQ1Ts+ym\nHnplzQpcKF6ebKegdsO9CZLkNYyUQf1RMStZaSnG2A4b4x+9d/j0oL4Z2ilKfkPj\najZBs+bhL8+v7lz1nKBpKi3wpfSdBNvBXXOeFn8CgYAwQC7uH+vwrzEkfol2iQTj\nN4KNz4MYzeHx1nzpZCuHN6Aga0VHFdODUxYr9+ug5g9EIhF41x37Uvu9oP1RJX5G\nVQiKIKTfzToR//vPSVza32Fm82IFiz2rHOfRir7u3f+pJEFyK7WdRmJORXypYYPW\nKOlSlYy9Xm0oqXwWk7S3aw==\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@zentry-hr-system.iam.gserviceaccount.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=kientvhe172514@fpt.edu.vn
SMTP_PASSWORD=tlgs vqgb tbfe gslr
SMTP_FROM_NAME=Zentry HR System
SMTP_FROM_EMAIL=noreply@zentry.com
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
SKIP_AUTH=false
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
SKIP_AUTH=false
```

---

## ✅ FACE_RECOGNITION_SECRET (CORRECTED)

**Copy toàn bộ đoạn này vào GitHub Secret:**

```env
ConnectionStrings__DefaultConnection=Host=postgres-primary-srv.infrastructure.svc.cluster.local;Port=5432;Database=zentry;Username=postgres;Password=Qqanhkien@2024SecurePassword;Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100;
Redis__ConnectionString=redis-master-srv.infrastructure.svc.cluster.local:6379,password=Redis@SecurePassword2024,ssl=false,abortConnect=false,connectTimeout=5000,syncTimeout=5000
RabbitMQ__ConnectionString=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-srv.infrastructure.svc.cluster.local:5672/
Jwt__Secret=AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
Jwt__Issuer=https://api.zentry.com
Jwt__Audience=https://app.zentry.com
Jwt__ExpirationMinutes=60
POSTGRES_HOST=postgres-primary-srv.infrastructure.svc.cluster.local
POSTGRES_PORT=5432
POSTGRES_DATABASE=zentry
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=Qqanhkien@2024SecurePassword
REDIS_HOST=redis-master-srv.infrastructure.svc.cluster.local
REDIS_PORT=6379
REDIS_PASSWORD=Redis@SecurePassword2024
REDIS_CONNECTION_STRING=redis-master-srv.infrastructure.svc.cluster.local:6379,password=Redis@SecurePassword2024
RABBITMQ_HOST=rabbitmq-srv.infrastructure.svc.cluster.local
RABBITMQ_USERNAME=admin
RABBITMQ_PASSWORD=RabbitMQ@SecurePass2024
JWT_SECRET=AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
JWT_ISSUER=https://api.zentry.com
JWT_AUDIENCE=https://app.zentry.com
JWT_EXPIRATION_MINUTES=60
MONGODB_CONNECTION_STRING=mongodb://admin:MongoSecure@2024Password@mongodb-srv.infrastructure.svc.cluster.local:27017/zentry
ASPNETCORE_ENVIRONMENT=Production
AllowedHosts=*
FACEID_EMBEDDING_KEY=+GeH5w82DBbq68NUMXajWfVEtapwOcHxI+4JtWmawCs=
```

**🎯 5 dòng QUAN TRỌNG (THÊM MỚI - fix lỗi validation):**
- `ConnectionStrings__DefaultConnection=...` ← .NET đọc từ `configuration["ConnectionStrings:DefaultConnection"]`
- `Redis__ConnectionString=...` ← .NET đọc từ `configuration["Redis:ConnectionString"]`
- `RabbitMQ__ConnectionString=...` ← .NET đọc từ `configuration["RabbitMQ:ConnectionString"]`
- `Jwt__Secret=...` ← .NET đọc từ `configuration["Jwt:Secret"]`
- `FACEID_EMBEDDING_KEY=...` ← **32-byte AES-256-GCM key để mã hóa face embeddings**



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
