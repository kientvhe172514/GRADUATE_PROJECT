# 🚀 HƯỚNG DẪN DEPLOY VÀ TRUY CẬP API TỪ BÊN NGOÀI

## 📋 Flow hoàn chỉnh của CI/CD:

```
1. Code Push → GitHub
   ↓
2. Workflow Trigger
   ↓
3. Build shared-common (nếu cần)
   ↓
4. Build Docker images cho từng service
   ↓
5. Push images lên Docker Hub
   ↓
6. Deploy Infrastructure (Job 1)
   - Tạo namespaces
   - Apply secrets (Postgres, MongoDB, RabbitMQ, Redis)
   - Apply deployments cho databases/messaging
   ↓
7. Deploy Services (Job 2 - chạy SAU infrastructure)
   - Apply secrets cho từng service
   - Apply deployment YAML cho từng service
   - Update image với tag mới (github.sha)
   - Restart deployment
   - Wait for rollout to complete
   ↓
8. Ingress expose services ra ngoài
   ↓
9. ✅ Truy cập API từ bên ngoài qua:
   - http://<EC2_PUBLIC_IP>/api/v1/auth/...
   - http://<EC2_PUBLIC_IP>/api/v1/attendance/...
   - etc.
```

---

## ✅ Kiểm tra deployment đã chạy chưa:

### 1. Check namespaces
```bash
kubectl get namespaces
```
Phải thấy:
- `infrastructure`
- `graduate-project`
- `monitoring`

### 2. Check infrastructure pods (Postgres, Mongo, RabbitMQ, Redis)
```bash
kubectl get pods -n infrastructure
kubectl get svc -n infrastructure
```

### 3. Check service pods (Auth, Attendance, Employee, v.v.)
```bash
kubectl get pods -n graduate-project
kubectl get svc -n graduate-project
```

### 4. Check ingress
```bash
kubectl get ingress -n default
kubectl describe ingress microservices-ingress -n default
```

### 5. Check logs nếu pod crash
```bash
kubectl logs <pod-name> -n graduate-project
kubectl describe pod <pod-name> -n graduate-project
```

---

## 🌐 Truy cập API từ bên ngoài:

### Option 1: Dùng Public IP của EC2
```bash
# Lấy IP public của EC2
curl http://<EC2_PUBLIC_IP>/api/v1/auth/health

# Hoặc từ máy local
curl http://<EC2_PUBLIC_IP>/api/v1/attendance/health
```

### Option 2: Dùng domain (nếu có setup DNS)
```bash
curl http://microservices.local/api/v1/auth/health
```

---

## 🔧 Nếu không truy cập được:

### 1. Check Ingress Controller đã cài chưa
```bash
kubectl get pods -n ingress-nginx
```

**Nếu chưa có, cài Nginx Ingress Controller:**
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
```

### 2. Check service có ClusterIP/NodePort
```bash
kubectl get svc -n graduate-project
```

### 3. Check security group của EC2
- Phải mở port **80** (HTTP) và **443** (HTTPS) cho inbound traffic
- AWS Console → EC2 → Security Groups → Edit inbound rules

### 4. Expose Ingress ra NodePort (nếu cần)
```bash
kubectl edit svc ingress-nginx-controller -n ingress-nginx
```
Đổi `type: LoadBalancer` → `type: NodePort`

### 5. Get NodePort của Ingress
```bash
kubectl get svc ingress-nginx-controller -n ingress-nginx
```
Lấy port (ví dụ: 30080, 30443)

Truy cập:
```bash
curl http://<EC2_PUBLIC_IP>:30080/api/v1/auth/health
```

---

## 📝 Test từng bước:

### 1. Test namespace và pods
```bash
# SSH vào EC2
ssh -i your-key.pem ec2-user@<EC2_IP>

# Check pods
kubectl get pods -n graduate-project

# Nếu không có pods, check workflow logs trên GitHub
```

### 2. Test service locally (từ trong EC2)
```bash
# Port-forward để test
kubectl port-forward svc/auth-srv 3001:3001 -n graduate-project

# Test từ terminal khác
curl http://localhost:3001/api/v1/health
```

### 3. Test ingress
```bash
# Check ingress
kubectl get ingress -n default

# Test từ bên trong cluster
kubectl run test-pod --image=curlimages/curl --rm -it -- /bin/sh
curl http://auth-srv.graduate-project:3001/api/v1/health
```

### 4. Test từ bên ngoài
```bash
# Từ máy local
curl http://<EC2_PUBLIC_IP>/api/v1/auth/health
```

---

## 🎯 Endpoints API (sau khi deploy thành công):

```
Auth Service:        http://<EC2_IP>/api/v1/auth/*
Face Recognition:    http://<EC2_IP>/api/v1/face/*
Attendance:          http://<EC2_IP>/api/v1/attendance/*
Employee:            http://<EC2_IP>/api/v1/employee/*
Leave:               http://<EC2_IP>/api/v1/leave/*
Notification:        http://<EC2_IP>/api/v1/notification/*
Reporting:           http://<EC2_IP>/api/v1/reporting/*
```

---

## ⚠️ Troubleshooting:

### Pods không chạy
```bash
# Check events
kubectl get events -n graduate-project --sort-by='.lastTimestamp'

# Check logs
kubectl logs <pod-name> -n graduate-project

# Check describe
kubectl describe pod <pod-name> -n graduate-project
```

### Image pull error
- Check Docker Hub credentials trong secrets
- Check image tag có đúng không

### CrashLoopBackOff
- Check logs để xem lỗi gì
- Check secrets có đủ không
- Check database connection

### Ingress không hoạt động
- Check Ingress Controller đã cài chưa
- Check service name và port trong Ingress YAML
- Check EC2 Security Group

---

## 🚀 Quick Fix Commands:

```bash
# Force redeploy tất cả services
kubectl rollout restart deployment -n graduate-project

# Xóa pod để force recreate
kubectl delete pod <pod-name> -n graduate-project

# Apply lại tất cả manifest
kubectl apply -f ~/GRADUATE_PROJECT/infra/k8s/platform/
kubectl apply -f ~/GRADUATE_PROJECT/infra/k8s/services/auth/
kubectl apply -f ~/GRADUATE_PROJECT/infra/k8s/services/attendance/
# ... (tương tự cho các service khác)

# Check all resources
kubectl get all -n graduate-project
kubectl get all -n infrastructure
```
