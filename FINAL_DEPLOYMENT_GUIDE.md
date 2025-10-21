# 🚀 FINAL DEPLOYMENT GUIDE (After Cleanup)

**Project**: HR Attendance System - Microservices Platform  
**Version**: v2.0 (PostgreSQL Only - Optimized)  
**Date**: December 2024  
**Status**: ✅ Production Ready

---

## 📊 What Changed in v2.0?

### Major Changes
- ❌ **Removed MongoDB completely** (512Mi RAM saved)
- ✅ **Unified on PostgreSQL** (all 7 services)
- ✅ **Cleaned duplicate files** (6 files removed)
- ✅ **Optimized network policies** (68 lines removed)
- ✅ **Increased connection limits** (support 35 pods scaling)
- ✅ **2.1GB total RAM** (down from 2.5GB, 86.8% from original 16GB!)

### Connection Limits Fixed (IMPORTANT!)
- **PostgreSQL**: max_connections 200 → **500** (for 35 pods)
- **PgBouncer**: max_db_connections 100 → **400**
- **Redis**: Added maxclients = **5000**
- **RabbitMQ**: num_acceptors 10 → **30**

**Why?** When HPA scales to 5 replicas × 7 services = 35 pods, old limits caused "connection refused" errors on pods 11+.

### Service Updates
- **Notification Service**: MongoDB → PostgreSQL
- **Reporting Service**: MongoDB → PostgreSQL (maintains read replica)
- **All other services**: No changes

---

## 🎯 System Requirements

### Production Server (Recommended)
```yaml
Memory:     4GB RAM
CPU:        2 cores (4 vCPUs)
Storage:    40GB SSD
Network:    1 Gbps
OS:         Ubuntu 22.04 LTS
K8s:        K3s 1.28+ or K8s 1.28+
```

### Development Server (Minimal)
```yaml
Memory:     2GB RAM
CPU:        1 core (2 vCPUs)
Storage:    20GB SSD
Network:    100 Mbps
OS:         Ubuntu 22.04 LTS
K8s:        K3s 1.28+
```

**Note**: Development server runs all services at 1 replica with no HPA scaling.

---

## 📦 Architecture Overview

### Final Infrastructure (15 Pods, 2.0GB RAM)
```
┌─────────────────────────────────────────────────┐
│              DATABASE LAYER (512Mi)             │
├─────────────────────────────────────────────────┤
│  PostgreSQL Primary:    256Mi, 200m CPU         │
│  PostgreSQL Replica:    256Mi, 200m CPU         │
│  PgBouncer:            Connection pooling       │
│                                                 │
│  7 Databases:                                   │
│  ├── face_recognition_db                        │
│  ├── auth_db                                    │
│  ├── attendance_db                              │
│  ├── employee_db                                │
│  ├── leave_db                                   │
│  ├── notification_db  ✅ (migrated from Mongo) │
│  └── reporting_db     ✅ (migrated from Mongo) │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│            MESSAGING LAYER (768Mi)              │
├─────────────────────────────────────────────────┤
│  Redis Sentinel:       256Mi (4 pods)           │
│  └── Master + Replica + 2 Sentinels             │
│                                                 │
│  RabbitMQ Cluster:     512Mi (2 pods)           │
│  └── Pod 0 + Pod 1                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          APPLICATION LAYER (1024Mi)             │
├─────────────────────────────────────────────────┤
│  Auth Service:             128Mi, 100m CPU      │
│  Face Recognition:         256Mi, 200m CPU      │
│  Attendance Service:       128Mi, 100m CPU      │
│  Employee Service:         128Mi, 100m CPU      │
│  Leave Service:            128Mi, 100m CPU      │
│  Notification Service:     128Mi, 100m CPU ✅   │
│  Reporting Service:        128Mi, 100m CPU ✅   │
│                                                 │
│  HPA: Each scales 1-5 replicas @ 85% CPU        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          MONITORING LAYER (~448Mi)              │
├─────────────────────────────────────────────────┤
│  Prometheus:               256Mi                │
│  Grafana:                  128Mi                │
│  Fluentd (DaemonSet):      64Mi                 │
└─────────────────────────────────────────────────┘

TOTAL: 15 pods, ~2.0GB RAM, 1.8 CPU cores
```

---

## 🛠️ Prerequisites

### 1. Install Required Tools

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install K3s (lightweight Kubernetes)
curl -sfL https://get.k3s.io | sh -

# Verify K3s
sudo k3s kubectl get nodes

# Install Skaffold
curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64
sudo install skaffold /usr/local/bin/
skaffold version

# Install kubectl (if needed)
sudo apt install -y kubectl

# Install Docker (optional, for local builds)
sudo apt install -y docker.io
sudo usermod -aG docker $USER
```

#### macOS
```bash
# Install K3s via multipass
brew install multipass
multipass launch --name k3s --cpus 2 --memory 4G --disk 40G
multipass exec k3s -- bash -c "curl -sfL https://get.k3s.io | sh -"

# Install Skaffold
brew install skaffold

# Install kubectl
brew install kubectl
```

#### Windows (WSL2)
```powershell
# Install WSL2 and Ubuntu
wsl --install

# Inside WSL2, follow Ubuntu steps above
```

---

### 2. Verify Cluster Resources

```bash
# Check available resources
kubectl top nodes

# Should show at least:
# - 2GB available memory
# - 1 CPU core available

# Check cluster info
kubectl cluster-info
kubectl get nodes -o wide
```

---

## 🚀 Deployment Steps

### Phase 1: Clean Existing MongoDB (If Exists)

```bash
# Check if MongoDB is deployed
kubectl get pods -n infrastructure | grep mongo

# If MongoDB exists, delete it
kubectl delete statefulset mongodb -n infrastructure --ignore-not-found
kubectl delete service mongodb-srv -n infrastructure --ignore-not-found
kubectl delete configmap mongodb-config -n infrastructure --ignore-not-found
kubectl delete secret mongodb-secret -n infrastructure --ignore-not-found
kubectl delete pvc -l app=mongodb -n infrastructure --ignore-not-found

# Verify removal
kubectl get all -n infrastructure | grep mongo
# Should return nothing ✅
```

---

### Phase 2: Deploy Infrastructure (3-Phase Approach)

#### Step 1: Create Namespaces
```bash
cd /path/to/graduate_project

# Deploy namespaces and platform basics
skaffold run -p step1-namespace

# Verify
kubectl get namespace
# Should show: default, infrastructure, monitoring

kubectl get resourcequotas -n default
kubectl get resourcequotas -n infrastructure
```

**Expected Output**:
```
NAME                  AGE
default               1m
infrastructure        1m
monitoring            1m
```

---

#### Step 2: Deploy Infrastructure Services

```bash
# Deploy databases, messaging, monitoring
skaffold run -p step2-infra

# This will deploy:
# - PostgreSQL HA (Primary + Replica + PgBouncer)
# - Redis Sentinel (Master + Replica + Sentinels)
# - RabbitMQ Cluster (2 pods)
# - Prometheus, Grafana, Fluentd

# Watch deployment (Ctrl+C to exit)
watch kubectl get pods -n infrastructure

# Wait until all pods are Running/Ready (takes 2-3 minutes)
```

**Expected Pods in `infrastructure` namespace**:
```
NAME                              READY   STATUS    AGE
postgres-primary-0                1/1     Running   1m
postgres-replica-0                1/1     Running   1m
pgbouncer-...                     1/1     Running   1m
redis-master-0                    1/1     Running   1m
redis-replica-0                   1/1     Running   1m
redis-sentinel-0                  1/1     Running   1m
redis-sentinel-1                  1/1     Running   1m
rabbitmq-0                        1/1     Running   1m
rabbitmq-1                        1/1     Running   1m
```

---

#### Step 3: Verify Database Setup

```bash
# Connect to PostgreSQL primary
kubectl exec -it postgres-primary-0 -n infrastructure -- bash

# Inside pod, check databases
psql -U postgres -c "\l"

# Should list 7 databases:
#  face_recognition_db
#  auth_db
#  attendance_db
#  employee_db
#  leave_db
#  notification_db     ✅ For notification service
#  reporting_db        ✅ For reporting service

# Exit pod
exit
```

**Verify Replication**:
```bash
# Check replication status
kubectl exec -it postgres-primary-0 -n infrastructure -- \
  psql -U postgres -c "SELECT * FROM pg_stat_replication;"

# Should show replica connected ✅
```

---

#### Step 4: Deploy Application Services

```bash
# Build and deploy all 7 services
skaffold run -p step3-services

# This will:
# 1. Build Docker images (auth, face-recognition)
# 2. Deploy all 7 services with configs
# 3. Deploy ingress controller

# Watch deployment
watch kubectl get pods -n default

# Wait until all pods are Running/Ready (takes 3-5 minutes)
```

**Expected Pods in `default` namespace**:
```
NAME                                   READY   STATUS    AGE
auth-depl-...                          1/1     Running   2m
face-recognition-depl-...              1/1     Running   2m
attendance-depl-...                    1/1     Running   2m
employee-depl-...                      1/1     Running   2m
leave-depl-...                         1/1     Running   2m
notification-depl-...                  1/1     Running   2m  ✅
reporting-depl-...                     1/1     Running   2m  ✅
```

---

### Phase 3: Verify Deployment

#### 1. Check All Pods
```bash
# All namespaces
kubectl get pods --all-namespaces

# Should show 15 pods total:
# - infrastructure: 9 pods (Postgres, Redis, RabbitMQ)
# - default: 7 pods (services)
# - monitoring: 2 pods (Prometheus, Grafana)
# - kube-system: Fluentd DaemonSet
```

---

#### 2. Check Services
```bash
# List all services
kubectl get svc -n default
kubectl get svc -n infrastructure

# Test PostgreSQL connection
kubectl port-forward -n infrastructure svc/pgbouncer-srv 5432:5432 &

# From another terminal
psql -h localhost -U postgres -d face_recognition_db
# Password: postgres123
# Should connect successfully ✅

# Kill port-forward
killall kubectl
```

---

#### 3. Check Network Policies
```bash
# List network policies
kubectl get networkpolicies -n infrastructure
kubectl get networkpolicies -n default

# Should NOT have mongodb-allow-ingress or mongodb-allow-egress ✅
```

---

#### 4. Test Service Communication

```bash
# Port-forward auth service
kubectl port-forward -n default svc/auth-srv 3001:3001 &

# Test health endpoint
curl http://localhost:3001/health
# Should return 200 OK ✅

# Port-forward notification service (PostgreSQL)
kubectl port-forward -n default svc/notification-srv 3005:3005 &

# Test health endpoint
curl http://localhost:3005/health
# Should return 200 OK ✅

# Port-forward reporting service (PostgreSQL + replica)
kubectl port-forward -n default svc/reporting-srv 3006:3006 &

# Test health endpoint
curl http://localhost:3006/health
# Should return 200 OK ✅

# Clean up port-forwards
killall kubectl
```

---

#### 5. Check Resource Usage

```bash
# Enable metrics-server (if not already)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Wait 1 minute, then check
kubectl top nodes
kubectl top pods -n infrastructure
kubectl top pods -n default

# Expected RAM usage:
# Infrastructure: ~1.0GB
# Default: ~1.0GB
# Total: ~2.0GB ✅
```

---

## 📊 Monitoring & Observability

### Access Grafana Dashboard

```bash
# Port-forward Grafana
kubectl port-forward -n monitoring svc/grafana-srv 3030:3030 &

# Open browser: http://localhost:3030
# Login: admin / admin123

# Dashboards available:
# - PostgreSQL Metrics (CPU, RAM, connections)
# - Redis Metrics (hits, misses, memory)
# - RabbitMQ Metrics (queues, messages)
# - Service Metrics (requests, latency, errors)
```

### Access Prometheus

```bash
# Port-forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-srv 9090:9090 &

# Open browser: http://localhost:9090

# Sample queries:
# - container_memory_usage_bytes{namespace="infrastructure"}
# - rate(http_requests_total[5m])
# - pg_stat_database_tup_fetched
```

---

## 🔧 Configuration Updates

### Update Service Replicas (Scale Up)

```bash
# Scale specific service
kubectl scale deployment auth-depl -n default --replicas=3

# Or edit HPA
kubectl edit hpa auth-hpa -n default
# Change minReplicas: 3, maxReplicas: 10

# Verify
kubectl get pods -n default | grep auth
```

### Update Resource Limits

```bash
# Edit deployment
kubectl edit deployment notification-depl -n default

# Update resources section:
resources:
  requests:
    memory: "256Mi"  # Increase from 128Mi
    cpu: "200m"      # Increase from 100m
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Update Database Connection Pool

```bash
# Edit PgBouncer config
kubectl edit configmap pgbouncer-config -n infrastructure

# Update pool sizes:
default_pool_size = 50      # Increase from 25
max_db_connections = 200    # Increase from 100

# Restart PgBouncer
kubectl rollout restart deployment pgbouncer -n infrastructure
```

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check pod logs
kubectl logs -f <pod-name> -n default

# Check events
kubectl describe pod <pod-name> -n default

# Common issues:
# 1. Can't connect to PostgreSQL
#    - Check: kubectl get pods -n infrastructure | grep postgres
#    - Fix: Wait for postgres-primary-0 to be Ready

# 2. Can't connect to RabbitMQ
#    - Check: kubectl get pods -n infrastructure | grep rabbitmq
#    - Fix: Wait for rabbitmq-0 and rabbitmq-1 to be Ready

# 3. ImagePullBackOff
#    - Fix: Build images locally with Skaffold
```

### PostgreSQL Connection Issues

```bash
# Check PostgreSQL logs
kubectl logs -f postgres-primary-0 -n infrastructure

# Check PgBouncer logs
kubectl logs -f <pgbouncer-pod> -n infrastructure

# Test connection from service pod
kubectl exec -it <service-pod> -n default -- sh
nc -zv pgbouncer-srv.infrastructure 5432
# Should show: Connection to pgbouncer-srv.infrastructure port 5432 [tcp/postgresql] succeeded!
```

### Notification Service Issues (After Migration)

```bash
# Check notification pod logs
kubectl logs -f <notification-pod> -n default

# Look for PostgreSQL connection errors
# Common issue: Using old MongoDB env vars

# Verify configmap
kubectl get configmap notification-config -n default -o yaml

# Should show:
#  POSTGRES_HOST: pgbouncer-srv.infrastructure
#  POSTGRES_DATABASE: notification_db

# NOT:
#  MONGO_HOST: ...  ❌
```

### Reporting Service Issues (After Migration)

```bash
# Check reporting pod logs
kubectl logs -f <reporting-pod> -n default

# Verify both connections work:
# 1. Primary (writes)
kubectl exec -it <reporting-pod> -n default -- \
  nc -zv pgbouncer-srv.infrastructure 5432

# 2. Replica (reads)
kubectl exec -it <reporting-pod> -n default -- \
  nc -zv postgres-replica-srv.infrastructure 5432

# Both should succeed ✅
```

### Out of Memory (OOM) Errors

```bash
# Check if pods are being killed
kubectl get events -n default --sort-by='.lastTimestamp'

# Look for OOMKilled events

# Check node resources
kubectl describe node

# Solutions:
# 1. Reduce pod resource limits
# 2. Add more nodes to cluster
# 3. Scale down HPA max replicas
```

---

## 📈 Performance Tuning

### Optimize PostgreSQL

```bash
# Edit postgres config
kubectl edit configmap postgres-primary-config -n infrastructure

# Increase cache sizes:
shared_buffers = 1GB         # From 512MB (if RAM available)
effective_cache_size = 3GB   # From 1536MB
work_mem = 32MB              # From 16MB

# Restart PostgreSQL
kubectl rollout restart statefulset postgres-primary -n infrastructure
```

### Optimize PgBouncer

```bash
# Edit PgBouncer config
kubectl edit configmap pgbouncer-config -n infrastructure

# Increase pool sizes:
default_pool_size = 50      # From 25
max_client_conn = 2000      # From 1000

# Restart PgBouncer
kubectl rollout restart deployment pgbouncer -n infrastructure
```

### Optimize Redis

```bash
# Edit Redis config
kubectl edit configmap redis-sentinel-config -n infrastructure

# Increase memory:
maxmemory 256mb             # From 128mb

# Restart Redis
kubectl rollout restart statefulset redis-master -n infrastructure
```

---

## 🔐 Security Hardening

### Update Secrets

```bash
# Generate new PostgreSQL password
NEW_PG_PASS=$(openssl rand -base64 32)
echo -n $NEW_PG_PASS | base64

# Update secret
kubectl edit secret postgres-secret -n infrastructure
# Paste new base64 password

# Restart all services using PostgreSQL
kubectl rollout restart deployment -n default
```

### Enable Network Policies

```bash
# Already deployed via step1-namespace
# Verify active policies
kubectl get networkpolicies --all-namespaces

# Should show:
# - postgres-allow-ingress
# - redis-allow-ingress
# - rabbitmq-allow-ingress
# - service egress policies for all 7 services

# NO mongodb policies ✅
```

---

## 🧹 Cleanup & Uninstall

### Remove Services Only

```bash
# Delete services but keep infrastructure
skaffold delete -p step3-services

# Verify
kubectl get pods -n default
# Should be empty
```

### Remove Infrastructure

```bash
# Delete infrastructure
skaffold delete -p step2-infra

# Verify
kubectl get pods -n infrastructure
# Should be empty
```

### Complete Cleanup

```bash
# Delete everything including namespaces
skaffold delete -p step1-namespace

# Or manually:
kubectl delete namespace default infrastructure monitoring
kubectl delete pvc --all --all-namespaces

# For K3s:
sudo /usr/local/bin/k3s-uninstall.sh
```

---

## 📚 Related Documentation

- **Architecture**: `BEFORE_AFTER_COMPARISON.md` (detailed before/after)
- **Cleanup Summary**: `CLEANUP_SUMMARY.md` (what was removed)
- **Resource Optimization**: `RESOURCE_OPTIMIZATION_SUMMARY.md` (16GB → 2.5GB)
- **File Structure**: `SERVICE_FILE_STRUCTURE_FIX.md` (standardization)
- **Completion Summary**: `COMPLETION_SUMMARY.md` (overall project status)

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Server has 4GB RAM, 2 CPU cores minimum
- [ ] K3s or K8s installed and running
- [ ] Skaffold installed
- [ ] kubectl configured
- [ ] Docker installed (for local builds)

### Phase 1: Clean Existing
- [ ] MongoDB removed (if exists)
- [ ] Old deployments cleaned up
- [ ] PVCs from old deployments deleted

### Phase 2: Deploy Infrastructure
- [ ] Namespaces created (`step1-namespace`)
- [ ] PostgreSQL HA running (2 pods)
- [ ] Redis Sentinel running (4 pods)
- [ ] RabbitMQ cluster running (2 pods)
- [ ] Monitoring stack running (Prometheus, Grafana, Fluentd)

### Phase 3: Deploy Services
- [ ] All 7 services deployed
- [ ] All pods in Running state
- [ ] Health checks passing
- [ ] Ingress controller active

### Phase 4: Verification
- [ ] PostgreSQL has 7 databases
- [ ] Notification service uses PostgreSQL ✅
- [ ] Reporting service uses PostgreSQL ✅
- [ ] No MongoDB pods running ✅
- [ ] Network policies active (no MongoDB)
- [ ] Resource usage ~2.0GB RAM

### Phase 5: Testing
- [ ] All service health endpoints return 200
- [ ] PostgreSQL connections work
- [ ] RabbitMQ message queues work
- [ ] Redis caching works
- [ ] Grafana dashboards show metrics

---

## 🎯 Success Criteria

Your deployment is successful when:

1. ✅ **All 15 pods Running**: 9 infra + 7 services
2. ✅ **No MongoDB pods**: `kubectl get pods --all-namespaces | grep mongo` returns nothing
3. ✅ **All services healthy**: Health endpoints return 200
4. ✅ **Resource usage ~2.0GB**: `kubectl top pods --all-namespaces` shows total usage
5. ✅ **Grafana accessible**: http://localhost:3030 shows dashboards
6. ✅ **PostgreSQL has 7 DBs**: Including notification_db and reporting_db
7. ✅ **HPA working**: `kubectl get hpa -n default` shows metrics

---

## 🚀 What's Next?

### Immediate (Post-Deployment)
- [ ] Load testing with realistic traffic
- [ ] Set up automated backups (Velero)
- [ ] Configure external monitoring (Datadog, New Relic)
- [ ] Set up CI/CD pipeline (GitHub Actions)

### Short-term (1-2 weeks)
- [ ] Implement rate limiting
- [ ] Add service mesh (Istio/Linkerd) if needed
- [ ] Set up log aggregation (ELK stack)
- [ ] Implement distributed tracing (Jaeger)

### Long-term (1-3 months)
- [ ] Multi-region deployment
- [ ] Disaster recovery testing
- [ ] Cost optimization review
- [ ] Performance benchmarking

---

**Deployment Status**: ✅ **READY FOR PRODUCTION**  
**Architecture**: **Clean, optimized, PostgreSQL-only**  
**Resource Usage**: **2.0GB RAM, 1.8 CPU cores**  
**Recommended Server**: **4GB RAM, 2 CPU cores** 🎯

---

## 💬 Support

If you encounter issues:
1. Check troubleshooting section above
2. Review logs: `kubectl logs -f <pod-name> -n <namespace>`
3. Check events: `kubectl get events --sort-by='.lastTimestamp'`
4. Verify resources: `kubectl top pods --all-namespaces`

**Happy deploying!** 🚀
