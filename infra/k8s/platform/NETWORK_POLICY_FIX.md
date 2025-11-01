# 🔧 Network Policy Fix Summary

## ❌ Các lỗi đã fix (2025-11-01)

### 1. **DNS Label Sai**
- **Trước**: `kubernetes.io/metadata.kubernetes.io/metadata.name: kube-system` (double prefix)
- **Sau**: `kubernetes.io/metadata.name: kube-system`

### 2. **Namespace Sai cho Services**
- **Trước**: Tất cả services ở `namespace: default`
- **Sau**: Tất cả services ở `namespace: graduate-project`

### 3. **Redis/RabbitMQ Ingress Policies Sai**
- **Trước**: Allow từ `name: default`
- **Sau**: Allow từ `kubernetes.io/metadata.name: graduate-project`

### 4. **Label Selectors Không đúng format**
- **Trước**: `name: infrastructure`, `name: ingress-nginx`, `name: monitoring`
- **Sau**: `kubernetes.io/metadata.name: infrastructure`, `app.kubernetes.io/name: ingress-nginx`, `kubernetes.io/metadata.name: monitoring`

### 5. **Thiếu TCP DNS Port**
- **Thêm**: `port: 53` protocol TCP cho DNS resolution (ngoài UDP)

---

## ✅ Kết quả sau khi fix

### **Infrastructure Namespace Policies**
- ✅ PostgreSQL: Allow ingress từ `graduate-project`
- ✅ Redis: Allow ingress từ `graduate-project`  
- ✅ RabbitMQ: Allow ingress từ `graduate-project`
- ✅ DNS: Allow egress đến `kube-system` (UDP + TCP port 53)

### **Graduate-Project Namespace Policies**
- ✅ Auth service: Allow egress đến infrastructure (Postgres, Redis, RabbitMQ)
- ✅ Attendance service: Allow egress đến infrastructure
- ✅ Employee service: Allow egress đến infrastructure
- ✅ Leave service: Allow egress đến infrastructure
- ✅ Notification service: Allow egress đến infrastructure + external SMTP
- ✅ Reporting service: Allow egress đến infrastructure
- ✅ Face-recognition service: Allow egress đến infrastructure
- ✅ DNS resolution: Allow egress đến `kube-system` cho tất cả pods

---

## 🚀 Áp dụng trên server

```bash
# Pull code mới
cd /home/ec2-user/GRADUATE_PROJECT
git pull origin main

# Apply NetworkPolicy đã fix
kubectl apply -f infra/k8s/platform/network-policies-hardened.yaml

# Xóa policy cũ conflict (nếu có)
kubectl delete networkpolicy -n graduate-project allow-graduate-project-egress 2>/dev/null || true

# Restart tất cả services để áp dụng policy mới
kubectl rollout restart deployment -n graduate-project

# Verify DNS resolution
kubectl exec -it -n graduate-project $(kubectl get pod -n graduate-project -l app=auth -o jsonpath='{.items[0].metadata.name}') -- nslookup postgres-primary-srv.infrastructure.svc.cluster.local

# Check logs
kubectl logs -f -n graduate-project -l app=auth --tail=50
```

---

## 📊 NetworkPolicy Matrix

| Service | Namespace | Can Access | Ports |
|---------|-----------|------------|-------|
| **Auth** | graduate-project | Postgres, Redis, RabbitMQ | 5432, 6379, 5672 |
| **Attendance** | graduate-project | Postgres, Redis, RabbitMQ | 5432, 6379, 5672 |
| **Employee** | graduate-project | Postgres, Redis | 5432, 6379 |
| **Leave** | graduate-project | Postgres | 5432 |
| **Notification** | graduate-project | Postgres, RabbitMQ, External | 5432, 5672, 443, 587 |
| **Reporting** | graduate-project | Postgres, External | 5432, 443 |
| **Face Recognition** | graduate-project | Postgres, Redis, RabbitMQ | 5432, 6379, 5672 |

---

## 🔍 Troubleshooting

### Nếu vẫn bị DNS timeout:
```bash
# Check CoreDNS
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns --tail=50

# Restart CoreDNS nếu cần
kubectl rollout restart deployment coredns -n kube-system
```

### Nếu vẫn không kết nối được DB:
```bash
# Check NetworkPolicy applied
kubectl get networkpolicy -n graduate-project
kubectl get networkpolicy -n infrastructure

# Describe để xem chi tiết
kubectl describe networkpolicy auth-allow-egress -n graduate-project
kubectl describe networkpolicy postgres-allow-ingress -n infrastructure
```

### Test connectivity từ pod:
```bash
# Test DNS
kubectl exec -it -n graduate-project <pod-name> -- nslookup postgres-primary-srv.infrastructure.svc.cluster.local

# Test port
kubectl exec -it -n graduate-project <pod-name> -- nc -zv postgres-primary-srv.infrastructure.svc.cluster.local 5432

# Check env vars
kubectl exec -it -n graduate-project <pod-name> -- env | grep DATABASE_URL
```
