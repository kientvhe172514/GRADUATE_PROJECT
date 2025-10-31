# 🔐 HƯỚNG DẪN GITHUB SECRETS - KIẾN TRÚC ĐƠN GIẢN HÓA

> **Tổng số secrets: 31 secrets** (Infrastructure tách riêng + Services gộp lại)

---

## 📊 TỔNG QUAN KIẾN TRÚC

### Nguyên tắc phân chia:
- **Infrastructure**: Tách riêng từng biến (PostgreSQL, MongoDB, RabbitMQ, Redis) - **24 secrets**
- **Services**: Gộp tất cả biến của 1 service vào 1 secret - **7 secrets**

### Luồng hoạt động:
```
GitHub Secrets
      ↓
Workflow inject vào K8s
      ↓
K8s Secret (stringData: .env: |)
      ↓
Pod mount as .env file
      ↓
Application reads process.env
```

---

## 🗂️ DANH SÁCH 31 SECRETS

### PHẦN 1: AWS & DOCKER HUB (7 secrets)

#### 1. EC2_HOST
```
Value: 3.1.123.45
```

#### 2. EC2_USER
```
Value: ubuntu
```

#### 3. EC2_SSH_PRIVATE_KEY
```
Value: -----BEGIN OPENSSH PRIVATE KEY-----
(Toàn bộ nội dung file .pem)
-----END OPENSSH PRIVATE KEY-----
```

#### 4. AWS_ACCESS_KEY_ID
```
Value: AKIAIOSFODNN7EXAMPLE
```

#### 5. AWS_SECRET_ACCESS_KEY
```
Value: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

#### 6. DOCKERHUB_USERNAME
```
Value: yourdockerhubusername
```

#### 7. DOCKERHUB_PASSWORD
```
Value: dckr_pat_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### PHẦN 2: INFRASTRUCTURE - POSTGRESQL (11 secrets)

#### 8. POSTGRES_HOST
```
Value: postgres-cluster-ip-service
```

#### 9. POSTGRES_PORT
```
Value: 5432
```

#### 10. POSTGRES_USER
```
Value: postgres
```

#### 11. POSTGRES_PASSWORD
```
Value: Qqanhkien@2024SecurePassword
```
**⚠️ ĐỔI PASSWORD NÀY!**

#### 12-18. Database Names (7 secrets)
```
POSTGRES_DB_IAM: IAM
POSTGRES_DB_ATTENDANCE: attendance_db
POSTGRES_DB_EMPLOYEE: employee_db
POSTGRES_DB_LEAVE: leave_db
POSTGRES_DB_NOTIFICATION: notification_db
POSTGRES_DB_REPORTING: reporting_db
POSTGRES_DB_ZENTRY: zentry
```

---

### PHẦN 3: INFRASTRUCTURE - MONGODB (5 secrets)

#### 19. MONGODB_HOST
```
Value: mongodb-cluster-ip-service
```

#### 20. MONGODB_PORT
```
Value: 27017
```

#### 21. MONGODB_DATABASE
```
Value: zentry
```

#### 22. MONGODB_USERNAME
```
Value: admin
```

#### 23. MONGODB_PASSWORD
```
Value: MongoSecure@2024Password
```
**⚠️ ĐỔI PASSWORD NÀY!**

---

### PHẦN 4: INFRASTRUCTURE - RABBITMQ (5 secrets)

#### 24. RABBITMQ_HOST
```
Value: rabbitmq-cluster-ip-service
```

#### 25. RABBITMQ_PORT
```
Value: 5672
```

#### 26. RABBITMQ_USERNAME
```
Value: admin
```

#### 27. RABBITMQ_PASSWORD
```
Value: RabbitMQ@SecurePass2024
```
**⚠️ ĐỔI PASSWORD NÀY!**

#### 28. RABBITMQ_MANAGEMENT_PORT
```
Value: 15672
```

---

### PHẦN 5: INFRASTRUCTURE - REDIS (3 secrets)

#### 29. REDIS_HOST
```
Value: redis-cluster-ip-service
```

#### 30. REDIS_PORT
```
Value: 6379
```

#### 31. REDIS_PASSWORD
```
Value: Redis@SecurePassword2024
```
**⚠️ ĐỔI PASSWORD NÀY!**

---

## 🎯 PHẦN 6: SERVICES (7 SECRETS GỘP)

### 32. AUTH_SECRET
```
Value: (Copy toàn bộ nội dung bên dưới)

DATABASE_URL=postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-cluster-ip-service:5432/IAM
JWT_SECRET=AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
APP_PORT=3001
NODE_ENV=production
RABBITMQ_URL=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-cluster-ip-service:5672
RABBITMQ_EMPLOYEE_QUEUE=employee_queue
RABBITMQ_IAM_QUEUE=iam_queue
RABBITMQ_NOTIFICATION_QUEUE=notification_queue
REDIS_HOST=redis-cluster-ip-service
REDIS_PORT=6379
REDIS_PASSWORD=Redis@SecurePassword2024
```
**⚠️ Nhớ đổi: JWT_SECRET, POSTGRES_PASSWORD, RABBITMQ_PASSWORD, REDIS_PASSWORD**

---

### 33. ATTENDANCE_SECRET
```
Value:

APP_PORT=3004
NODE_ENV=production
DATABASE_URL=postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-cluster-ip-service:5432/attendance_db
RABBITMQ_URL=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-cluster-ip-service:5672
RABBITMQ_ATTENDANCE_QUEUE=attendance_queue
RABBITMQ_EMPLOYEE_QUEUE=employee_queue
RABBITMQ_LEAVE_QUEUE=leave_queue
RABBITMQ_NOTIFICATION_QUEUE=notification_queue
REDIS_URL=redis://:Redis@SecurePassword2024@redis-cluster-ip-service:6379
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
**⚠️ Nhớ đổi: JWT_SECRET, passwords**

---

### 34. EMPLOYEE_SECRET
```
Value:

APP_PORT=3002
DATABASE_URL=postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-cluster-ip-service:5432/employee_db
RABBITMQ_URL=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-cluster-ip-service:5672
RABBITMQ_IAM_QUEUE=iam_queue
RABBITMQ_EMPLOYEE_QUEUE=employee_queue
REDIS_URL=redis://:Redis@SecurePassword2024@redis-cluster-ip-service:6379
```
**⚠️ Nhớ đổi: passwords**

---

### 35. LEAVE_SECRET
```
Value:

APP_PORT=3003
NODE_ENV=production
DATABASE_URL=postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-cluster-ip-service:5432/leave_db
RABBITMQ_URL=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-cluster-ip-service:5672
RABBITMQ_LEAVE_QUEUE=leave_queue
RABBITMQ_EMPLOYEE_QUEUE=employee_queue
RABBITMQ_NOTIFICATION_QUEUE=notification_queue
REDIS_URL=redis://:Redis@SecurePassword2024@redis-cluster-ip-service:6379
JWT_SECRET=AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
JWT_EXPIRATION=1d
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
```
**⚠️ Nhớ đổi: JWT_SECRET, passwords**

---

### 36. NOTIFICATION_SECRET
```
Value:

NODE_ENV=production
APP_PORT=3006
SERVICE_NAME=notification
USE_MOCK_SERVICES=false
DATABASE_URL=postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-cluster-ip-service:5432/notification_db
RABBITMQ_URL=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-cluster-ip-service:5672
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
**⚠️ Nhớ đổi: JWT_SECRET, Firebase keys, SMTP credentials**

**Lấy Firebase credentials:**
1. [Firebase Console](https://console.firebase.google.com/) → Project Settings → Service accounts
2. Generate new private key → Download JSON
3. Copy `project_id`, `private_key`, `client_email`

**Lấy Gmail App Password:**
1. [Google Account](https://myaccount.google.com/) → Security → 2-Step Verification → Enable
2. App passwords → Create → Copy 16-char password

---

### 37. REPORTING_SECRET
```
Value:

APP_PORT=3005
NODE_ENV=production
DATABASE_URL=postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-cluster-ip-service:5432/reporting_db
RABBITMQ_URL=amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-cluster-ip-service:5672
RABBITMQ_REPORTING_QUEUE=reporting_queue
RABBITMQ_ATTENDANCE_QUEUE=attendance_queue
RABBITMQ_LEAVE_QUEUE=leave_queue
RABBITMQ_EMPLOYEE_QUEUE=employee_queue
RABBITMQ_NOTIFICATION_QUEUE=notification_queue
REDIS_URL=redis://:Redis@SecurePassword2024@redis-cluster-ip-service:6379
JWT_SECRET=AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
JWT_EXPIRATION=1d
EXPORT_STORAGE_PATH=/tmp/reports
EXPORT_FILE_RETENTION_DAYS=30
MAX_EXPORT_RECORDS=100000
REPORT_GENERATION_TIMEOUT_SECONDS=300
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
```
**⚠️ Nhớ đổi: JWT_SECRET, passwords**

---

### 38. FACE_RECOGNITION_SECRET
```
Value:

POSTGRES_HOST=postgres-cluster-ip-service
POSTGRES_PORT=5432
POSTGRES_DATABASE=zentry
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=Qqanhkien@2024SecurePassword
REDIS_CONNECTION_STRING=redis-cluster-ip-service:6379,password=Redis@SecurePassword2024
MONGODB_CONNECTION_STRING=mongodb://admin:MongoSecure@2024Password@mongodb-cluster-ip-service:27017/zentry
RABBITMQ_HOST=rabbitmq-cluster-ip-service
RABBITMQ_USERNAME=admin
RABBITMQ_PASSWORD=RabbitMQ@SecurePass2024
JWT_SECRET=AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
JWT_ISSUER=https://api.zentry.com
JWT_AUDIENCE=https://app.zentry.com
JWT_EXPIRATION_MINUTES=60
ASPNETCORE_ENVIRONMENT=Production
AllowedHosts=*
```
**⚠️ Nhớ đổi: JWT_SECRET, passwords**

---

## 🚀 HƯỚNG DẪN TẠO SECRETS

### Cách 1: Tạo từng secret trên GitHub (Recommended)

```bash
# 1. Vào GitHub repo → Settings → Secrets and variables → Actions
# 2. Click "New repository secret"
# 3. Name: AUTH_SECRET
# 4. Value: (Copy toàn bộ nội dung từ trên)
# 5. Click "Add secret"
# 6. Lặp lại cho 31 secrets (chỉ 38 - 7 = 31 vì số thứ tự từ 32-38)
```

---

### Cách 2: Tạo nhanh bằng GitHub CLI

```bash
# Cài GitHub CLI: https://cli.github.com/

# Login
gh auth login

# Tạo infrastructure secrets (24 secrets)
gh secret set POSTGRES_HOST -b"postgres-cluster-ip-service"
gh secret set POSTGRES_PORT -b"5432"
gh secret set POSTGRES_USER -b"postgres"
gh secret set POSTGRES_PASSWORD -b"YOUR_STRONG_PASSWORD"
gh secret set POSTGRES_DB_IAM -b"IAM"
gh secret set POSTGRES_DB_ATTENDANCE -b"attendance_db"
# ... (lặp lại cho các secrets còn lại)

# Tạo service secrets (7 secrets)
gh secret set AUTH_SECRET < auth-secret.txt
gh secret set ATTENDANCE_SECRET < attendance-secret.txt
# ... (lặp lại cho các services)
```

---

## ✅ KIỂM TRA SAU KHI TẠO

```bash
# SSH vào EC2
ssh -i your-key.pem ubuntu@<EC2_HOST>

# Kiểm tra K8s secrets đã tạo chưa
kubectl get secrets -n graduate-project

# Output mong đợi:
# NAME                         TYPE     DATA   AGE
# postgres-secret             Opaque   11     5m
# mongodb-secret              Opaque   5      5m
# rabbitmq-secret             Opaque   5      5m
# redis-secret                Opaque   3      5m
# auth-secret                 Opaque   1      3m  <- .env file
# attendance-secret           Opaque   1      3m  <- .env file
# employee-secret             Opaque   1      3m  <- .env file
# leave-secret                Opaque   1      3m  <- .env file
# notification-secret         Opaque   1      3m  <- .env file
# reporting-secret            Opaque   1      3m  <- .env file
# face-recognition-secret     Opaque   1      3m  <- .env file

# Kiểm tra nội dung 1 secret
kubectl get secret auth-secret -n graduate-project -o jsonpath='{.data.\.env}' | base64 -d

# Phải thấy toàn bộ nội dung .env file
```

---

## 🔄 CẬP NHẬT SECRETS

### Update Infrastructure Secret (VD: Đổi POSTGRES_PASSWORD):
```bash
# 1. Vào GitHub → Settings → Secrets
# 2. Chọn POSTGRES_PASSWORD → Update
# 3. Nhập password mới → Save
# 4. Push code hoặc trigger workflow
# 5. Workflow tự update K8s secret và restart pods
```

### Update Service Secret (VD: Đổi AUTH_SECRET):
```bash
# 1. Copy toàn bộ nội dung AUTH_SECRET hiện tại
# 2. Sửa dòng cần đổi (VD: JWT_SECRET=new_value)
# 3. Vào GitHub → Settings → Secrets → AUTH_SECRET → Update
# 4. Paste nội dung mới → Save
# 5. Push code hoặc trigger workflow
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### Bảo mật:
- ✅ **PHẢI ĐỔI** tất cả passwords mặc định
- ✅ JWT Secrets phải min 32 ký tự
- ✅ Không commit secrets vào Git
- ✅ Không log secrets ra console
- ❌ Không share secrets qua chat không mã hóa

### Format .env trong secret:
- Mỗi dòng 1 biến: `KEY=VALUE`
- Không có dấu ngoặc kép: `JWT_SECRET=abc123` ✅
- Không có spaces: `JWT_SECRET = abc123` ❌
- Không có comments: `# This is JWT` ❌
- Multiline values phải escape `\n`: 
  ```
  PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----
  ```

### Passwords mạnh:
```bash
# Generate random passwords
openssl rand -base64 32  # 32 bytes = strong password

# VD passwords:
POSTGRES_PASSWORD=K7mN9pQ2rS4tU6vW8xY0zA1bC3dE5fG7
MONGODB_PASSWORD=H8jK0lM2nO4pQ6rS8tU0vW2xY4zA6bC8
RABBITMQ_PASSWORD=D9eF1gH3iJ5kL7mN9oP1qR3sT5uV7wX9
REDIS_PASSWORD=Y0zA2bC4dE6fG8hI0jK2lM4nO6pQ8rS0
```

---

## 📋 CHECKLIST DEPLOY

- [ ] Tạo đủ 31 GitHub Secrets
- [ ] Đổi tất cả passwords mặc định (5 passwords)
- [ ] Đổi tất cả JWT secrets (7 services)
- [ ] Setup Firebase credentials (Notification)
- [ ] Setup Gmail SMTP (Notification)
- [ ] Test push code → Workflow chạy thành công
- [ ] Kiểm tra pods Running: `kubectl get pods -n graduate-project`
- [ ] Test API endpoints hoạt động

---

## 🆘 TROUBLESHOOTING

### Lỗi: Pod không start (CrashLoopBackOff)
```bash
# Xem logs
kubectl logs <pod-name> -n graduate-project

# Thường do:
# - Secret sai format (có space, quotes, comments)
# - Password trong DATABASE_URL không khớp với POSTGRES_PASSWORD
# - Connection string sai
```

### Lỗi: "database does not exist"
```bash
# Kiểm tra database name trong secret
kubectl get secret auth-secret -n graduate-project -o jsonpath='{.data.\.env}' | base64 -d | grep DATABASE_URL

# So sánh với POSTGRES_DB_IAM
kubectl get secret postgres-secret -n graduate-project -o jsonpath='{.data.POSTGRES_DB_IAM}' | base64 -d
```

### Lỗi: Workflow fail ở "Deploy Service"
```bash
# Check GitHub Actions logs
# Thường do:
# - Service secret không tồn tại
# - Secret name sai (phải là AUTH_SECRET không phải AUTH_SERVICE_ENV)
# - EC2 SSH fail
```

---

## 📚 TÀI LIỆU LIÊN QUAN

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Hướng dẫn deploy đầy đủ
- [QUICK_START.md](./QUICK_START.md) - Deploy nhanh 5 phút
- [COMPLETE_SECRETS_GUIDE.md](./COMPLETE_SECRETS_GUIDE.md) - Kiến trúc chi tiết

---

**Tạo bởi**: GitHub Copilot  
**Ngày**: 2024-10-29  
**Version**: 2.0 - Simplified Secrets (Infrastructure tách riêng + Services gộp)
