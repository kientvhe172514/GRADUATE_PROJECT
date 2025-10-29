# 🚀 CI/CD Workflow - Giải thích chi tiết

## 📋 Tổng quan

Workflow này tự động hóa toàn bộ quá trình **BUILD → PUSH → DEPLOY** lên AWS EC2 K3s cluster.

---

## 🔄 Luồng hoạt động (Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│  1️⃣  DETECT CHANGES                                             │
│     - Phát hiện service nào thay đổi                            │
│     - Dùng dorny/paths-filter để check git diff                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  2️⃣  BUILD SHARED (nếu cần)                                     │
│     - Build services/shared-common                              │
│     - Cache cho các service khác dùng                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  3️⃣  BUILD SERVICES (song song - parallel)                      │
│     ┌─────────────────────────────────────────────────┐        │
│     │  Auth Service                                   │        │
│     │  • pnpm install (sử dụng pnpm-lock.yaml)       │        │
│     │  • pnpm build                                   │        │
│     │  • Docker build từ ROOT context                │        │
│     │  • Push lên Docker Hub với tags:               │        │
│     │    - main, latest, <sha>, main-<short-sha>     │        │
│     └─────────────────────────────────────────────────┘        │
│     │                                                            │
│     ├─── Attendance, Employee, Leave (tương tự)                 │
│     ├─── Notification, Reporting (tương tự)                     │
│     └─── Face Recognition (.NET - build riêng)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  4️⃣  DEPLOY INFRASTRUCTURE                                      │
│     - SSH vào EC2                                               │
│     - git pull origin main                                      │
│     - Tạo secrets cho infrastructure:                           │
│       • postgres-secret (namespace: infrastructure)             │
│       • mongodb-secret (namespace: infrastructure)              │
│       • rabbitmq-secret (namespace: infrastructure)             │
│       • redis-secret (namespace: infrastructure)                │
│     - kubectl apply -f infra/k8s/platform/                      │
│       (Tạo namespaces, ingress, network policies)               │
│     - kubectl apply -f infra/k8s/shared/                        │
│       (Deploy Postgres, MongoDB, RabbitMQ, Redis)               │
│     - Đợi tất cả infrastructure pods ready                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  5️⃣  DEPLOY SERVICES                                            │
│     - SSH vào EC2                                               │
│     - git pull origin main                                      │
│     - **BƯỚC CHUẨN BỊ (một lần duy nhất):**                     │
│       • Replace DOCKERHUB_USERNAME_PLACEHOLDER trong tất cả     │
│         file *.yaml bằng username thực                          │
│                                                                  │
│     - **Mỗi service:**                                          │
│       1. Tạo secret consolidated (1 file .env)                  │
│       2. kubectl apply -f infra/k8s/services/<service>/         │
│          → K8s đọc deployment.yaml                              │
│          → Thấy image: username/graduate-project-<service>:latest│
│          → **PULL IMAGE TỪ DOCKER HUB** 🎯                      │
│       3. kubectl set image (update to commit SHA)               │
│       4. kubectl rollout restart                                │
│       5. kubectl rollout status (đợi healthy)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🐳 Chi tiết: Docker Image Pull Process

### Trước khi sửa (❌ SAI):
```yaml
# deployment-ha.yaml
containers:
- name: auth
  image: auth-service:latest  # ❌ Local image, không có registry
  imagePullPolicy: IfNotPresent  # ❌ Không pull từ Docker Hub
```

**Vấn đề:** K8s chỉ tìm local, không biết pull từ đâu.

### Sau khi sửa (✅ ĐÚNG):
```yaml
# deployment-ha.yaml (TRƯỚC khi replace)
containers:
- name: auth
  image: DOCKERHUB_USERNAME_PLACEHOLDER/graduate-project-auth:latest
  imagePullPolicy: Always  # ✅ Luôn pull image mới
```

**Khi workflow chạy:**
1. Build image `kientvhe172514/graduate-project-auth:main` và push lên Docker Hub
2. SSH vào EC2, chạy sed command:
   ```bash
   sed -i "s|DOCKERHUB_USERNAME_PLACEHOLDER|kientvhe172514|g" deployment-ha.yaml
   ```
3. File deployment trở thành:
   ```yaml
   image: kientvhe172514/graduate-project-auth:latest
   imagePullPolicy: Always
   ```
4. `kubectl apply -f` → K8s thấy image từ Docker Hub → **PULL về và chạy** 🎯

---

## 📦 Build Context - Tại sao build từ ROOT?

### Cấu trúc pnpm workspace:
```
graduate_project/
├── pnpm-lock.yaml          ← Cần thiết cho pnpm install
├── pnpm-workspace.yaml     ← Định nghĩa workspace
├── package.json            ← Root package
├── services/
│   ├── shared-common/      ← Dependency cho tất cả services
│   │   ├── package.json
│   │   └── src/
│   └── auth/
│       ├── Dockerfile      ← Build từ đây
│       ├── package.json
│       └── src/
```

### Dockerfile strategy:
```dockerfile
# Stage 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Copy workspace files từ ROOT
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/shared-common ./services/shared-common
COPY services/auth ./services/auth

# Build shared-common trước
WORKDIR /app/services/shared-common
RUN pnpm install --frozen-lockfile && pnpm run build

# Build auth service
WORKDIR /app/services/auth
RUN pnpm install --frozen-lockfile && pnpm run build

# Stage 2: Production
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/services/auth/dist ./dist
COPY --from=builder /app/services/auth/node_modules ./node_modules
CMD ["node", "dist/main.js"]
```

### GitHub Actions build command:
```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .  # ✅ Build từ ROOT để có pnpm-lock.yaml
    file: services/auth/Dockerfile  # Dockerfile path
    push: true
    tags: ${{ steps.meta.outputs.tags }}
```

**Tại sao cần `.dockerignore` sửa?**
- File `.dockerignore` ở root ban đầu có `pnpm-lock.yaml`
- Docker build context = `.` → đọc `.dockerignore` → ignore `pnpm-lock.yaml`
- Dockerfile COPY `pnpm-lock.yaml` → ❌ File not found
- **Giải pháp:** Xóa `pnpm-lock.yaml` khỏi `.dockerignore`

---

## 🔐 Secrets Management

### Infrastructure Secrets (namespace: infrastructure):
```yaml
# Postgres
postgres-secret:
  postgres-user: admin
  postgres-password: <encrypted>

# MongoDB
mongodb-secret:
  mongodb-root-username: admin
  mongodb-root-password: <encrypted>

# RabbitMQ
rabbitmq-secret:
  rabbitmq-default-user: admin
  rabbitmq-default-pass: <encrypted>
  rabbitmq-erlang-cookie: <random>

# Redis
redis-secret:
  redis-password: <encrypted>
```

### Service Secrets (namespace: graduate-project):
```yaml
# Auth Service (CONSOLIDATED - GỘP LẠI)
auth-secret:
  .env: |
    DATABASE_URL=postgresql://...
    REDIS_URL=redis://...
    JWT_SECRET=...
    PORT=3001
    ... (tất cả env vars trong 1 file)
```

**Cách service đọc secret:**
```yaml
# deployment-ha.yaml
envFrom:
- secretRef:
    name: auth-secret  # Load tất cả key từ secret
```

---

## 🌐 External Access

### Ingress Configuration:
```yaml
# infra/k8s/platform/ingress-srv.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: graduate-project-ingress
  namespace: graduate-project
spec:
  rules:
  - http:
      paths:
      - path: /api/v1/auth
        backend:
          service:
            name: auth-srv
            port: 3001
```

### Truy cập từ bên ngoài:
```
Internet
   ↓
AWS EC2 Public IP (Security Group: port 80, 443)
   ↓
Nginx Ingress Controller (K3s)
   ↓
/api/v1/auth → auth-srv:3001
/api/v1/attendance → attendance-srv:3002
...
```

**Endpoint:** `http://<EC2_PUBLIC_IP>/api/v1/auth/health`

---

## 🛠️ Troubleshooting

### ❌ Error: pnpm-lock.yaml not found
**Nguyên nhân:** `.dockerignore` ignore file này
**Giải pháp:** Xóa `pnpm-lock.yaml` khỏi `.dockerignore`

### ❌ Error: ImagePullBackOff
**Nguyên nhân:** K8s không tìm thấy image trên Docker Hub
**Kiểm tra:**
```bash
# Trên EC2
kubectl describe pod <pod-name> -n graduate-project

# Check events:
# Failed to pull image "auth-service:latest"
```
**Giải pháp:** Sửa `image:` trong deployment.yaml thành `username/graduate-project-<service>:latest`

### ❌ Error: CrashLoopBackOff
**Nguyên nhân:** Container start lên nhưng crash ngay
**Kiểm tra logs:**
```bash
kubectl logs <pod-name> -n graduate-project
kubectl describe pod <pod-name> -n graduate-project
```
**Thường gặp:** Secret keys sai format, database connection fail

### ❌ Error: Pending PVC
**Nguyên nhân:** StorageClass không tồn tại
**K3s chỉ có:** `local-path` (không có `standard`)
**Giải pháp:** Sửa tất cả PVC `storageClassName: local-path`

---

## ✅ Checklist Deploy thành công

- [ ] `.dockerignore` không có `pnpm-lock.yaml`
- [ ] Tất cả deployment.yaml có `image: DOCKERHUB_USERNAME_PLACEHOLDER/graduate-project-<service>:latest`
- [ ] Tất cả deployment.yaml có `imagePullPolicy: Always`
- [ ] Workflow có step "Prepare deployment files" để replace placeholder
- [ ] Tất cả PVC có `storageClassName: local-path`
- [ ] Infrastructure secrets có đúng key format (lowercase-hyphen)
- [ ] Service secrets là consolidated (1 file .env)
- [ ] EC2 Security Group mở port 80, 443
- [ ] K3s có Nginx Ingress Controller installed

---

## 🎯 Kết luận

**Workflow này đảm bảo:**
1. ✅ Build image với đúng context (pnpm workspace)
2. ✅ Push image lên Docker Hub với nhiều tags
3. ✅ Deploy infrastructure trước (databases, messaging)
4. ✅ Deploy services sau với đúng image từ Docker Hub
5. ✅ **K8s tự động PULL image từ Docker Hub khi apply deployment**
6. ✅ Secrets được tạo đúng namespace và format
7. ✅ Services có thể truy cập từ bên ngoài qua Ingress

**Điểm quan trọng nhất:** File `deployment-ha.yaml` có `image:` trỏ đến Docker Hub → K8s biết pull từ đâu! 🚀
