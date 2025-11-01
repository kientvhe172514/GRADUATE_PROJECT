# 🔐 HƯỚNG DẪN SECRETS ĐẦY ĐỦ - LUỒNG TÁCH RIÊNG

## 📋 TỔNG QUAN

### Kiến trúc Secrets:
```
GitHub Secrets (Individual Variables)
         ↓
  K8s ConfigMap/Secret
         ↓
    Pod Environment Variables
         ↓
  Application Runtime
```

### Tổng số secrets cần tạo: **63 SECRETS**

---

## 🗂️ DANH SÁCH SECRETS ĐẦY ĐỦ

### 1️⃣ **AWS & CI/CD** (7 secrets)

#### Deployment Infrastructure:
```plaintext
EC2_HOST
→ Copy: 3.1.123.45

EC2_USER
→ Copy: ubuntu

EC2_SSH_PRIVATE_KEY
→ Copy: -----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAACmFlczI1Ni1jdHIAAAAGYmNyeXB0AAAAGAAAABCZ...
(toàn bộ nội dung file .pem)
-----END OPENSSH PRIVATE KEY-----

AWS_ACCESS_KEY_ID
→ Copy: AKIAIOSFODNN7EXAMPLE

AWS_SECRET_ACCESS_KEY
→ Copy: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

#### Docker Hub:
```plaintext
DOCKERHUB_USERNAME
→ Copy: yourdockerhubusername

DOCKERHUB_PASSWORD
→ Copy: dckr_pat_xxxxxxxxxxxxxxxxxxxxx
```

---

### 2️⃣ **INFRASTRUCTURE SECRETS** (14 secrets)

#### PostgreSQL (7 databases):
```plaintext
POSTGRES_HOST
→ Copy: postgres-cluster-ip-service

POSTGRES_PORT
→ Copy: 5432

POSTGRES_USER
→ Copy: postgres

POSTGRES_PASSWORD
→ Copy: Qqanhkien@2024SecurePassword

# Individual Database Names (7 DBs)
POSTGRES_DB_IAM
→ Copy: IAM

POSTGRES_DB_ATTENDANCE
→ Copy: attendance_db

POSTGRES_DB_EMPLOYEE
→ Copy: employee_db

POSTGRES_DB_LEAVE
→ Copy: leave_db

POSTGRES_DB_NOTIFICATION
→ Copy: notification_db

POSTGRES_DB_REPORTING
→ Copy: reporting_db

POSTGRES_DB_ZENTRY
→ Copy: zentry
```

#### MongoDB:
```plaintext
MONGODB_HOST
→ Copy: mongodb-cluster-ip-service

MONGODB_PORT
→ Copy: 27017

MONGODB_DATABASE
→ Copy: zentry

MONGODB_USERNAME
→ Copy: admin

MONGODB_PASSWORD
→ Copy: MongoSecure@2024Password
```

#### RabbitMQ:
```plaintext
RABBITMQ_HOST
→ Copy: rabbitmq-cluster-ip-service

RABBITMQ_PORT
→ Copy: 5672

RABBITMQ_USERNAME
→ Copy: admin

RABBITMQ_PASSWORD
→ Copy: RabbitMQ@SecurePass2024

RABBITMQ_MANAGEMENT_PORT
→ Copy: 15672
```

#### Redis:
```plaintext
REDIS_HOST
→ Copy: redis-cluster-ip-service

REDIS_PORT
→ Copy: 6379

REDIS_PASSWORD
→ Copy: Redis@SecurePassword2024
```

---

### 3️⃣ **AUTH SERVICE** (10 secrets)

```plaintext
AUTH_DATABASE_URL
→ Copy: postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-cluster-ip-service:5432/IAM

AUTH_JWT_SECRET
→ Copy: AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes

AUTH_JWT_EXPIRES_IN
→ Copy: 15m

AUTH_JWT_REFRESH_EXPIRES_IN
→ Copy: 7d

AUTH_APP_PORT
→ Copy: 3001

AUTH_NODE_ENV
→ Copy: production

AUTH_RABBITMQ_URL
→ Copy: amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-cluster-ip-service:5672

AUTH_REDIS_HOST
→ Copy: redis-cluster-ip-service

AUTH_REDIS_PORT
→ Copy: 6379

AUTH_REDIS_PASSWORD
→ Copy: Redis@SecurePassword2024
```

**RabbitMQ Queues (ConfigMap - không phải secret):**
- RABBITMQ_EMPLOYEE_QUEUE: `employee_queue`
- RABBITMQ_IAM_QUEUE: `iam_queue`
- RABBITMQ_NOTIFICATION_QUEUE: `notification_queue`

---

### 4️⃣ **ATTENDANCE SERVICE** (17 secrets)

```plaintext
ATTENDANCE_APP_PORT
→ Copy: 3004

ATTENDANCE_NODE_ENV
→ Copy: production

ATTENDANCE_DATABASE_URL
→ Copy: postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-cluster-ip-service:5432/attendance_db

ATTENDANCE_RABBITMQ_URL
→ Copy: amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-cluster-ip-service:5672

ATTENDANCE_REDIS_URL
→ Copy: redis://:Redis@SecurePassword2024@redis-cluster-ip-service:6379

ATTENDANCE_JWT_SECRET
→ Copy: AttendanceServiceJWTSecret2024!@#$MinLength32BytesRequired

ATTENDANCE_JWT_EXPIRATION
→ Copy: 1d

ATTENDANCE_CHECK_IN_GRACE_PERIOD_MINUTES
→ Copy: 15

ATTENDANCE_CHECK_OUT_GRACE_PERIOD_MINUTES
→ Copy: 15

ATTENDANCE_BEACON_DETECTION_RADIUS_METERS
→ Copy: 100

ATTENDANCE_GPS_ACCURACY_THRESHOLD_METERS
→ Copy: 50

ATTENDANCE_FACE_RECOGNITION_CONFIDENCE_THRESHOLD
→ Copy: 0.85

ATTENDANCE_DEFAULT_PAGE_SIZE
→ Copy: 10

ATTENDANCE_MAX_PAGE_SIZE
→ Copy: 100
```

**RabbitMQ Queues (ConfigMap):**
- RABBITMQ_ATTENDANCE_QUEUE: `attendance_queue`
- RABBITMQ_EMPLOYEE_QUEUE: `employee_queue`
- RABBITMQ_LEAVE_QUEUE: `leave_queue`
- RABBITMQ_NOTIFICATION_QUEUE: `notification_queue`

---

### 5️⃣ **EMPLOYEE SERVICE** (6 secrets)

```plaintext
EMPLOYEE_APP_PORT
→ Copy: 3002

EMPLOYEE_DATABASE_URL
→ Copy: postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-cluster-ip-service:5432/employee_db

EMPLOYEE_RABBITMQ_URL
→ Copy: amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-cluster-ip-service:5672

EMPLOYEE_REDIS_URL
→ Copy: redis://:Redis@SecurePassword2024@redis-cluster-ip-service:6379
```

**RabbitMQ Queues (ConfigMap):**
- RABBITMQ_IAM_QUEUE: `iam_queue`
- RABBITMQ_EMPLOYEE_QUEUE: `employee_queue`

---

### 6️⃣ **LEAVE SERVICE** (10 secrets)

```plaintext
LEAVE_APP_PORT
→ Copy: 3003

LEAVE_NODE_ENV
→ Copy: production

LEAVE_DATABASE_URL
→ Copy: postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-cluster-ip-service:5432/leave_db

LEAVE_RABBITMQ_URL
→ Copy: amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-cluster-ip-service:5672

LEAVE_REDIS_URL
→ Copy: redis://:Redis@SecurePassword2024@redis-cluster-ip-service:6379

LEAVE_JWT_SECRET
→ Copy: LeaveServiceJWTSecretKey2024!@#$MinLength32BytesRequired

LEAVE_JWT_EXPIRATION
→ Copy: 1d

LEAVE_DEFAULT_PAGE_SIZE
→ Copy: 10

LEAVE_MAX_PAGE_SIZE
→ Copy: 100
```

**RabbitMQ Queues (ConfigMap):**
- RABBITMQ_LEAVE_QUEUE: `leave_queue`
- RABBITMQ_EMPLOYEE_QUEUE: `employee_queue`
- RABBITMQ_NOTIFICATION_QUEUE: `notification_queue`

---

### 7️⃣ **NOTIFICATION SERVICE** (17 secrets)

```plaintext
NOTIFICATION_NODE_ENV
→ Copy: production

NOTIFICATION_APP_PORT
→ Copy: 3006

NOTIFICATION_SERVICE_NAME
→ Copy: notification

NOTIFICATION_USE_MOCK_SERVICES
→ Copy: false

NOTIFICATION_DATABASE_URL
→ Copy: postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-cluster-ip-service:5432/notification_db

NOTIFICATION_RABBITMQ_URL
→ Copy: amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-cluster-ip-service:5672

NOTIFICATION_JWT_SECRET
→ Copy: NotificationServiceJWTSecret2024!@#$MinLength32Bytes

NOTIFICATION_JWT_EXPIRY
→ Copy: 24h

NOTIFICATION_FIREBASE_PROJECT_ID
→ Copy: your-firebase-project-id

NOTIFICATION_FIREBASE_PRIVATE_KEY
→ Copy: -----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7...
-----END PRIVATE KEY-----

NOTIFICATION_FIREBASE_CLIENT_EMAIL
→ Copy: firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

NOTIFICATION_SMTP_HOST
→ Copy: smtp.gmail.com

NOTIFICATION_SMTP_PORT
→ Copy: 587

NOTIFICATION_SMTP_SECURE
→ Copy: false

NOTIFICATION_SMTP_USER
→ Copy: your-email@gmail.com

NOTIFICATION_SMTP_PASSWORD
→ Copy: your-16-char-app-password

NOTIFICATION_SMTP_FROM_NAME
→ Copy: Zentry HR System

NOTIFICATION_SMTP_FROM_EMAIL
→ Copy: noreply@zentry.com

NOTIFICATION_LOG_LEVEL
→ Copy: info

NOTIFICATION_CORS_ORIGIN
→ Copy: https://yourdomain.com
```

**Optional SMS (ConfigMap):**
- SMS_PROVIDER: `twilio`
- TWILIO_ACCOUNT_SID: `AC...`
- TWILIO_AUTH_TOKEN: `...`
- TWILIO_PHONE_NUMBER: `+1234567890`

**RabbitMQ Queue (ConfigMap):**
- RABBITMQ_NOTIFICATION_QUEUE: `notification_queue`

---

### 8️⃣ **REPORTING SERVICE** (14 secrets)

```plaintext
REPORTING_APP_PORT
→ Copy: 3005

REPORTING_NODE_ENV
→ Copy: production

REPORTING_DATABASE_URL
→ Copy: postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-cluster-ip-service:5432/reporting_db

REPORTING_RABBITMQ_URL
→ Copy: amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-cluster-ip-service:5672

REPORTING_REDIS_URL
→ Copy: redis://:Redis@SecurePassword2024@redis-cluster-ip-service:6379

REPORTING_JWT_SECRET
→ Copy: ReportingServiceJWTSecret2024!@#$MinLength32BytesRequired

REPORTING_JWT_EXPIRATION
→ Copy: 1d

REPORTING_EXPORT_STORAGE_PATH
→ Copy: /tmp/reports

REPORTING_EXPORT_FILE_RETENTION_DAYS
→ Copy: 30

REPORTING_MAX_EXPORT_RECORDS
→ Copy: 100000

REPORTING_REPORT_GENERATION_TIMEOUT_SECONDS
→ Copy: 300

REPORTING_DEFAULT_PAGE_SIZE
→ Copy: 10

REPORTING_MAX_PAGE_SIZE
→ Copy: 100
```

**RabbitMQ Queues (ConfigMap):**
- RABBITMQ_REPORTING_QUEUE: `reporting_queue`
- RABBITMQ_ATTENDANCE_QUEUE: `attendance_queue`
- RABBITMQ_LEAVE_QUEUE: `leave_queue`
- RABBITMQ_EMPLOYEE_QUEUE: `employee_queue`
- RABBITMQ_NOTIFICATION_QUEUE: `notification_queue`

---

### 9️⃣ **FACE RECOGNITION SERVICE (.NET)** (10 secrets)

```plaintext
FACE_RECOGNITION_POSTGRES_HOST
→ Copy: postgres-cluster-ip-service

FACE_RECOGNITION_POSTGRES_PORT
→ Copy: 5432

FACE_RECOGNITION_POSTGRES_DATABASE
→ Copy: zentry

FACE_RECOGNITION_POSTGRES_USERNAME
→ Copy: postgres

FACE_RECOGNITION_POSTGRES_PASSWORD
→ Copy: Qqanhkien@2024SecurePassword

FACE_RECOGNITION_REDIS_CONNECTION_STRING
→ Copy: redis-cluster-ip-service:6379,password=Redis@SecurePassword2024

FACE_RECOGNITION_MONGODB_CONNECTION_STRING
→ Copy: mongodb://admin:MongoSecure@2024Password@mongodb-cluster-ip-service:27017/zentry

FACE_RECOGNITION_RABBITMQ_HOST
→ Copy: rabbitmq-cluster-ip-service

FACE_RECOGNITION_RABBITMQ_USERNAME
→ Copy: admin

FACE_RECOGNITION_RABBITMQ_PASSWORD
→ Copy: RabbitMQ@SecurePass2024

FACE_RECOGNITION_JWT_SECRET
→ Copy: FaceRecognitionJWTSecretKey2024!@#$MinLength32BytesRequired

FACE_RECOGNITION_JWT_ISSUER
→ Copy: https://api.zentry.com

FACE_RECOGNITION_JWT_AUDIENCE
→ Copy: https://app.zentry.com

FACE_RECOGNITION_JWT_EXPIRATION_MINUTES
→ Copy: 60
```

**Non-Secret Config (ConfigMap):**
- ASPNETCORE_ENVIRONMENT: `Production`
- AllowedHosts: `*`

---

## 🚀 CÁC BƯỚC THỰC HIỆN

### BƯỚC 1: Tạo GitHub Secrets

1. Vào GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Copy từng secret từ danh sách trên:
   - **Name**: Tên secret (VD: `POSTGRES_PASSWORD`)
   - **Value**: Giá trị secret (VD: `Qqanhkien@2024SecurePassword`)
4. Click **Add secret**
5. Lặp lại cho **TẤT CẢ 63 secrets**

### BƯỚC 2: Workflow Tự Động Deploy

File `.github/workflows/ci-cd-main.yml` sẽ:

1. **Build Docker images** khi code thay đổi
2. **Push images** lên Docker Hub
3. **SSH vào EC2** và thực hiện:
   - Tạo K8s Secrets từ GitHub Secrets
   - Tạo K8s ConfigMaps cho non-secret values
   - Apply/Update Kubernetes deployments
   - Rollout restart services

### BƯỚC 3: Kiểm Tra Deployment

```bash
# SSH vào EC2
ssh -i your-key.pem ubuntu@<EC2_HOST>

# Kiểm tra secrets đã tạo
kubectl get secrets -n graduate-project

# Kiểm tra pods có lỗi không
kubectl get pods -n graduate-project

# Xem logs nếu có lỗi
kubectl logs <pod-name> -n graduate-project

# Kiểm tra secrets được mount đúng
kubectl describe pod <pod-name> -n graduate-project
```

---

## 📝 TEMPLATE K8S SECRET (Auto-generated by Workflow)

### Infrastructure Example (PostgreSQL):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: graduate-project
type: Opaque
stringData:
  POSTGRES_HOST: postgres-cluster-ip-service
  POSTGRES_PORT: "5432"
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: Qqanhkien@2024SecurePassword
  POSTGRES_DB_IAM: IAM
  POSTGRES_DB_ATTENDANCE: attendance_db
  POSTGRES_DB_EMPLOYEE: employee_db
  POSTGRES_DB_LEAVE: leave_db
  POSTGRES_DB_NOTIFICATION: notification_db
  POSTGRES_DB_REPORTING: reporting_db
  POSTGRES_DB_ZENTRY: zentry
```

### Service Example (Auth):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: auth-secret
  namespace: graduate-project
type: Opaque
stringData:
  DATABASE_URL: postgresql://postgres:Qqanhkien@2024SecurePassword@postgres-cluster-ip-service:5432/IAM
  JWT_SECRET: AuthServiceJWTSuperSecretKey2024!@#$%^&*()_MinLength32Bytes
  JWT_EXPIRES_IN: "15m"
  JWT_REFRESH_EXPIRES_IN: "7d"
  APP_PORT: "3001"
  NODE_ENV: production
  RABBITMQ_URL: amqp://admin:RabbitMQ@SecurePass2024@rabbitmq-cluster-ip-service:5672
  REDIS_HOST: redis-cluster-ip-service
  REDIS_PORT: "6379"
  REDIS_PASSWORD: Redis@SecurePassword2024
```

### ConfigMap Example (RabbitMQ Queues):
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: auth-config
  namespace: graduate-project
data:
  RABBITMQ_EMPLOYEE_QUEUE: employee_queue
  RABBITMQ_IAM_QUEUE: iam_queue
  RABBITMQ_NOTIFICATION_QUEUE: notification_queue
```

---

## ⚙️ CÁCH DEPLOYMENT HOẠT ĐỘNG

### 1. Infrastructure Deployment (Step 1):
```yaml
# Workflow creates secrets for databases
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_HOST=postgres-cluster-ip-service \
  --from-literal=POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }} \
  ...

kubectl create secret generic mongodb-secret \
  --from-literal=MONGODB_HOST=mongodb-cluster-ip-service \
  --from-literal=MONGODB_PASSWORD=${{ secrets.MONGODB_PASSWORD }} \
  ...

kubectl create secret generic rabbitmq-secret \
  --from-literal=RABBITMQ_HOST=rabbitmq-cluster-ip-service \
  --from-literal=RABBITMQ_PASSWORD=${{ secrets.RABBITMQ_PASSWORD }} \
  ...

kubectl create secret generic redis-secret \
  --from-literal=REDIS_HOST=redis-cluster-ip-service \
  --from-literal=REDIS_PASSWORD=${{ secrets.REDIS_PASSWORD }} \
  ...

# Then deploy infrastructure
kubectl apply -f infra/k8s/shared/databases/
kubectl apply -f infra/k8s/shared/messaging/
```

### 2. Service Deployment (Step 2):
```yaml
# For each changed service, workflow:
# 1. Creates service-specific secret
kubectl create secret generic auth-secret \
  --from-literal=DATABASE_URL=${{ secrets.AUTH_DATABASE_URL }} \
  --from-literal=JWT_SECRET=${{ secrets.AUTH_JWT_SECRET }} \
  ...

# 2. Creates ConfigMap for non-secrets
kubectl create configmap auth-config \
  --from-literal=RABBITMQ_EMPLOYEE_QUEUE=employee_queue \
  ...

# 3. Updates deployment
kubectl apply -f infra/k8s/services/auth/
kubectl set image deployment/auth-depl \
  auth=${{ secrets.DOCKERHUB_USERNAME }}/graduate-project-auth:${{ github.sha }}

# 4. Restart to pick up new secrets
kubectl rollout restart deployment/auth-depl -n graduate-project
```

### 3. Pod Configuration:
```yaml
# Deployment YAML mounts secrets as env vars
spec:
  containers:
  - name: auth
    image: dockerhub/graduate-project-auth:latest
    envFrom:
    - secretRef:
        name: auth-secret      # All secrets as env vars
    - configMapRef:
        name: auth-config      # All configs as env vars
    env:
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: auth-secret
          key: DATABASE_URL
    - name: JWT_SECRET
      valueFrom:
        secretKeyRef:
          name: auth-secret
          key: JWT_SECRET
```

---

## 🔄 QUY TRÌNH CẬP NHẬT SECRETS

### Khi cần đổi password/secret:

1. **Update GitHub Secret**:
   - Vào GitHub repo → Settings → Secrets
   - Tìm secret cần đổi (VD: `POSTGRES_PASSWORD`)
   - Click **Update** → Nhập giá trị mới → **Save**

2. **Trigger Deployment**:
   - Workflow sẽ tự chạy khi code thay đổi
   - Hoặc chạy thủ công: **Actions** → **CI/CD Pipeline** → **Run workflow**

3. **Secrets được update tự động**:
   - Workflow xóa secret cũ: `kubectl delete secret postgres-secret`
   - Tạo secret mới với giá trị mới
   - Restart pods: `kubectl rollout restart deployment/...`

4. **Pods nhận secrets mới**:
   - K8s tự động inject secrets vào pods mới
   - Application đọc từ environment variables

---

## 🛡️ BẢO MẬT

### ✅ Được làm:
- ✅ Secrets lưu trong GitHub Secrets (encrypted at rest)
- ✅ Secrets được truyền qua SSH secure connection
- ✅ Secrets lưu trong K8s Secrets (base64 encoded)
- ✅ Không commit secrets vào Git
- ✅ Sử dụng strong passwords (min 32 bytes cho JWT)
- ✅ Rotate secrets định kỳ

### ❌ KHÔNG làm:
- ❌ Hardcode secrets trong code
- ❌ Commit file .env vào Git
- ❌ Log secrets ra console
- ❌ Share secrets qua chat/email không mã hóa
- ❌ Sử dụng weak passwords

---

## 📊 CHECKLIST

### Trước khi deploy:
- [ ] Đã tạo đủ 63 GitHub Secrets
- [ ] Đã thay đổi tất cả password mặc định
- [ ] Đã chuẩn bị Firebase credentials (nếu dùng FCM)
- [ ] Đã chuẩn bị SMTP credentials (nếu dùng email)
- [ ] Đã kiểm tra EC2 có K3s chạy
- [ ] Đã setup kubectl trên EC2

### Sau khi deploy:
- [ ] Kiểm tra tất cả secrets: `kubectl get secrets -n graduate-project`
- [ ] Kiểm tra tất cả pods running: `kubectl get pods -n graduate-project`
- [ ] Test connection tới databases
- [ ] Test RabbitMQ message flow
- [ ] Test Redis caching
- [ ] Test API endpoints
- [ ] Kiểm tra logs không có lỗi secret

---

## 🆘 TROUBLESHOOTING

### Lỗi: Pod CrashLoopBackOff
```bash
# Xem logs
kubectl logs <pod-name> -n graduate-project

# Thường do:
# - Secret không tồn tại: kubectl get secret <secret-name>
# - Secret key sai tên: kubectl describe secret <secret-name>
# - Connection string sai format
```

### Lỗi: ImagePullBackOff
```bash
# Kiểm tra Docker Hub credentials
kubectl get secret regcred -n graduate-project -o yaml

# Tạo lại nếu cần
kubectl create secret docker-registry regcred \
  --docker-server=docker.io \
  --docker-username=${{ secrets.DOCKERHUB_USERNAME }} \
  --docker-password=${{ secrets.DOCKERHUB_PASSWORD }} \
  -n graduate-project
```

### Lỗi: Database connection failed
```bash
# Kiểm tra PostgreSQL pod
kubectl get pods -l app=postgres -n graduate-project

# Kiểm tra secret có đúng không
kubectl get secret postgres-secret -o yaml | base64 -d

# Test connection từ pod khác
kubectl run -it --rm debug --image=postgres:16 --restart=Never -- \
  psql -h postgres-cluster-ip-service -U postgres -d IAM
```

---

## 📚 TÀI LIỆU THAM KHẢO

- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Hub Access Tokens](https://docs.docker.com/docker-hub/access-tokens/)
- [K3s Documentation](https://docs.k3s.io/)

---

**Tạo bởi**: GitHub Copilot  
**Cập nhật**: 2024-10-29  
**Version**: 2.0 - Complete Secrets Architecture
