# 📌 TÓM TẮT KIẾN TRÚC SECRETS - VERSION 2.0

> **Mục tiêu**: Đơn giản hóa quản lý secrets - Infrastructure tách riêng + Services gộp lại

---

## 🎯 KIẾN TRÚC MỚI

### Nguyên tắc:
```
Infrastructure (PostgreSQL, MongoDB, RabbitMQ, Redis)
├── Tách riêng từng biến
├── Lý do: Dễ quản lý, update 1 chỗ → áp dụng toàn bộ services
└── Total: 24 secrets

Services (Auth, Attendance, Employee, Leave, Notification, Reporting, Face Recognition)
├── Gộp tất cả biến của 1 service vào 1 secret (format .env)
├── Lý do: Đơn giản, copy-paste từ file .env local
└── Total: 7 secrets
```

---

## 📊 SO SÁNH

| | **Version 1.0 (Cũ)** | **Version 2.0 (Mới)** |
|---|---|---|
| **Tổng secrets** | 63 secrets | 31 secrets |
| **Infrastructure** | 24 secrets tách riêng | 24 secrets tách riêng ✅ |
| **Services** | 39 secrets tách riêng | 7 secrets gộp lại ✅ |
| **Ưu điểm** | Granular control | Đơn giản hơn 50% |
| **Nhược điểm** | Quá nhiều secrets | Update service cần copy toàn bộ |

---

## 🗂️ DANH SÁCH 31 SECRETS

### 1. AWS & Docker Hub (7 secrets)
```
EC2_HOST
EC2_USER
EC2_SSH_PRIVATE_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
DOCKERHUB_USERNAME
DOCKERHUB_PASSWORD
```

### 2. PostgreSQL (11 secrets)
```
POSTGRES_HOST
POSTGRES_PORT
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB_IAM
POSTGRES_DB_ATTENDANCE
POSTGRES_DB_EMPLOYEE
POSTGRES_DB_LEAVE
POSTGRES_DB_NOTIFICATION
POSTGRES_DB_REPORTING
POSTGRES_DB_ZENTRY
```

### 3. MongoDB (5 secrets)
```
MONGODB_HOST
MONGODB_PORT
MONGODB_DATABASE
MONGODB_USERNAME
MONGODB_PASSWORD
```

### 4. RabbitMQ (5 secrets)
```
RABBITMQ_HOST
RABBITMQ_PORT
RABBITMQ_USERNAME
RABBITMQ_PASSWORD
RABBITMQ_MANAGEMENT_PORT
```

### 5. Redis (3 secrets)
```
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
```

### 6. Services (7 secrets - GỘP)
```
AUTH_SECRET
ATTENDANCE_SECRET
EMPLOYEE_SECRET
LEAVE_SECRET
NOTIFICATION_SECRET
REPORTING_SECRET
FACE_RECOGNITION_SECRET
```

**Format mỗi SERVICE_SECRET**:
```bash
# VD: AUTH_SECRET chứa toàn bộ .env content
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=15m
APP_PORT=3001
...
```

---

## 🔄 WORKFLOW HOẠT ĐỘNG

### Infrastructure Deployment:
```yaml
# Workflow tạo K8s Secret từ GitHub Secrets
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_HOST=${{ secrets.POSTGRES_HOST }} \
  --from-literal=POSTGRES_PORT=${{ secrets.POSTGRES_PORT }} \
  --from-literal=POSTGRES_USER=${{ secrets.POSTGRES_USER }} \
  --from-literal=POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }} \
  ...
```

### Service Deployment:
```yaml
# Workflow tạo K8s Secret với .env file
cat > /tmp/auth-secret.yaml << 'YAML'
apiVersion: v1
kind: Secret
metadata:
  name: auth-secret
  namespace: graduate-project
type: Opaque
stringData:
  .env: |
    ${{ secrets.AUTH_SECRET }}
YAML

kubectl apply -f /tmp/auth-secret.yaml
```

### Pod Configuration:
```yaml
# Deployment YAML mount .env file
spec:
  containers:
  - name: auth
    volumeMounts:
    - name: env-secret
      mountPath: /app/.env
      subPath: .env
  volumes:
  - name: env-secret
    secret:
      secretName: auth-secret
```

---

## ✅ ƯU ĐIỂM

1. **Ít secrets hơn**: 31 thay vì 63 (giảm 50%)
2. **Dễ copy-paste**: Copy từ file .env local → GitHub Secret
3. **Infrastructure tách riêng**: Update 1 password → Áp dụng toàn bộ services
4. **Dễ troubleshoot**: Xem toàn bộ config của 1 service trong 1 secret

---

## ⚠️ NHƯỢC ĐIỂM

1. **Update 1 biến = Update toàn bộ secret**: Phải copy lại toàn bộ nội dung
2. **Khó rotate 1 biến cụ thể**: VD: Chỉ muốn đổi JWT_SECRET của Auth
3. **Git diff khó theo dõi**: Không biết biến nào thay đổi

---

## 💡 KHI NÀO DÙNG?

### Dùng Version 2.0 (Mới - Services gộp) khi:
- ✅ Đồ án tốt nghiệp / Pet project
- ✅ Team nhỏ (1-5 người)
- ✅ Ít update secrets
- ✅ Muốn setup nhanh

### Dùng Version 1.0 (Cũ - Tất cả tách riêng) khi:
- ✅ Production system
- ✅ Team lớn (5+ người)
- ✅ Thường xuyên rotate secrets
- ✅ Cần audit trail chi tiết
- ✅ Compliance requirements (SOC2, ISO27001)

---

## 🚀 QUICK START

```bash
# 1. Tạo 31 GitHub Secrets
# Xem: GITHUB_SECRETS_COPYPASTE.md

# 2. Push code
git push origin main

# 3. Workflow tự động:
# - Build Docker images
# - Push to Docker Hub
# - SSH to EC2
# - Create 11 K8s Secrets (4 infrastructure + 7 services)
# - Deploy all pods
# - Verify deployment

# 4. Kiểm tra
kubectl get pods -n graduate-project
# Tất cả pods phải Running
```

---

## 📚 TÀI LIỆU

- **[GITHUB_SECRETS_COPYPASTE.md](./GITHUB_SECRETS_COPYPASTE.md)**: Danh sách 31 secrets đầy đủ với values mẫu
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**: Hướng dẫn deploy từ A-Z
- **[QUICK_START.md](./QUICK_START.md)**: Deploy nhanh 5 phút
- **[COMPLETE_SECRETS_GUIDE.md](./COMPLETE_SECRETS_GUIDE.md)**: Kiến trúc chi tiết (Version 1.0)

---

## 🔄 MIGRATION TỪ VERSION 1.0

Nếu đang dùng Version 1.0 (63 secrets), muốn chuyển sang Version 2.0:

```bash
# 1. Gộp secrets của mỗi service thành 1 file
# VD: AUTH_SECRET
DATABASE_URL=${{ secrets.AUTH_DATABASE_URL }}
JWT_SECRET=${{ secrets.AUTH_JWT_SECRET }}
JWT_EXPIRES_IN=${{ secrets.AUTH_JWT_EXPIRES_IN }}
...

# 2. Tạo secret mới AUTH_SECRET với nội dung trên
gh secret set AUTH_SECRET -b"$(cat auth-env.txt)"

# 3. Xóa các secrets cũ
gh secret delete AUTH_DATABASE_URL
gh secret delete AUTH_JWT_SECRET
...

# 4. Update workflow file (đã làm sẵn)
```

---

**Version**: 2.0  
**Ngày**: 2024-10-29  
**Tạo bởi**: GitHub Copilot
