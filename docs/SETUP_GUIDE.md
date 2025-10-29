# 🚀 SETUP GUIDE - Deployment từ Đầu đến Cuối

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [AWS EC2 Setup](#2-aws-ec2-setup)
3. [GitHub Repository Setup](#3-github-repository-setup)
4. [Infrastructure Setup (One-time)](#4-infrastructure-setup-one-time)
5. [CI/CD Automation](#5-cicd-automation)
6. [Verification & Testing](#6-verification--testing)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

### ✅ Cần chuẩn bị:

**Local Machine:**
- [ ] Git installed
- [ ] SSH client
- [ ] kubectl installed (optional - for debugging)
- [ ] GitHub account với access token

**AWS Account:**
- [ ] AWS account active
- [ ] IAM user với EC2 permissions
- [ ] Key pair for EC2 (tạo mới hoặc sử dụng existing)

**Domain (Optional):**
- [ ] Domain name cho production
- [ ] DNS management access

---

## 2. AWS EC2 Setup

### Step 2.1: Tạo EC2 Instance

**Recommended Specs (ĐỒ ÁN TỐT NGHIỆP - Test Environment):**
- **Instance Type:** t2.medium (hoặc t3.medium nếu có credit)
- **OS:** Ubuntu 22.04 LTS
- **Storage:** 20GB gp3 SSD (hoặc gp2 để tiết kiệm)
- **vCPU:** 2 cores
- **RAM:** 4GB
- **💰 Cost:** ~$30-40/tháng (có thể dùng AWS Free Tier nếu eligible)

> **💡 Tip:** Nếu budget thấp, có thể dùng t2.small (1 vCPU, 2GB RAM) cho demo nhưng sẽ phải giảm replicas và tắt một số services không cần thiết.

**Security Group Rules:**
```
Inbound Rules:
- SSH (22)           - Your IP only
- HTTP (80)          - 0.0.0.0/0
- HTTPS (443)        - 0.0.0.0/0
- Custom TCP (3000-3010) - 0.0.0.0/0 (services ports)

Outbound Rules:
- All traffic - 0.0.0.0/0
```

### Step 2.2: Kết nối SSH và Setup Server

```bash
# 1. SSH vào EC2
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip

# 2. Update system
sudo apt update && sudo apt upgrade -y

# 3. Download và chạy setup script
wget https://raw.githubusercontent.com/kientvhe172514/GRADUATE_PROJECT/main/scripts/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

**Script này sẽ cài:**
- ✅ Docker & Docker Compose
- ✅ kubectl
- ✅ K3s (Lightweight Kubernetes)
- ✅ Skaffold (optional)
- ✅ Git

**Thời gian:** ~10-15 phút

### Step 2.3: Verify Installation

```bash
# Check Docker
docker --version
docker ps

# Check Kubernetes
kubectl version
kubectl get nodes

# Check K3s
sudo systemctl status k3s
```

---

## 3. GitHub Repository Setup

### Step 3.1: Fork/Clone Repository

```bash
# Trên EC2 server
cd /home/ubuntu
git clone https://github.com/kientvhe172514/GRADUATE_PROJECT.git
cd GRADUATE_PROJECT
```

### Step 3.2: Configure GitHub Secrets

Vào GitHub Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### 🔐 Required Secrets (BẮT BUỘC):

**Infrastructure Secrets:**
```bash
# Database
POSTGRES_PASSWORD           # Example: P@ssw0rd!2024$Strong
MONGODB_USERNAME            # Example: admin
MONGODB_PASSWORD            # Example: M0ng0DB!Secure#2024

# Messaging
RABBITMQ_USERNAME           # Example: admin
RABBITMQ_PASSWORD           # Example: RabbitMQ!Pass#2024
REDIS_PASSWORD              # Example: Redis!Secure#2024

# Security
JWT_SECRET                  # Example: my-super-secret-jwt-key-minimum-32-characters-long-2024
```

**AWS & CI/CD Secrets:**
```bash
# EC2 Connection
EC2_HOST                    # EC2 Public IP: 3.123.45.67
EC2_USER                    # Usually: ubuntu
EC2_SSH_PRIVATE_KEY         # Content của private key file (.pem)

# AWS Credentials
AWS_ACCESS_KEY_ID           # IAM user access key
AWS_SECRET_ACCESS_KEY       # IAM user secret key
AWS_REGION                  # Example: ap-southeast-1
```

**Container Registry:**
```bash
# GitHub Container Registry (GHCR)
GHCR_TOKEN                  # GitHub Personal Access Token
                            # Scopes: write:packages, read:packages, delete:packages
```

#### 🔔 Optional Secrets (Notification Service):

```bash
# Firebase Cloud Messaging
FIREBASE_PROJECT_ID         # Your Firebase project ID
FIREBASE_PRIVATE_KEY        # Firebase service account private key
FIREBASE_CLIENT_EMAIL       # Firebase service account email

# SMTP Email
SMTP_HOST                   # Example: smtp.gmail.com
SMTP_PORT                   # Example: 587
SMTP_USER                   # Your email address
SMTP_PASSWORD               # App password (not regular password)

# Twilio SMS
TWILIO_ACCOUNT_SID          # Twilio account SID
TWILIO_AUTH_TOKEN           # Twilio auth token
TWILIO_PHONE_NUMBER         # Twilio phone number: +1234567890
```

### Step 3.3: Generate Strong Passwords

```bash
# PostgreSQL Password (16+ characters)
openssl rand -base64 24

# JWT Secret (32+ characters)
openssl rand -base64 48

# Or use online generator: https://passwordsgenerator.net/
```

### Step 3.4: Setup GitHub Personal Access Token

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token**
3. Scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `write:packages` (Upload packages to GitHub Package Registry)
   - ✅ `read:packages` (Download packages from GitHub Package Registry)
   - ✅ `delete:packages` (Delete packages from GitHub Package Registry)
4. Copy token và save làm `GHCR_TOKEN` secret

---

## 4. Infrastructure Setup (One-time)

### ⚠️ QUAN TRỌNG: Phần này chỉ chạy 1 LẦN DUY NHẤT khi setup server!

### Step 4.1: Export Environment Variables

```bash
# SSH vào EC2
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
cd /home/ubuntu/GRADUATE_PROJECT

# Export secrets (THAY ĐỔI values!)
export POSTGRES_PASSWORD='P@ssw0rd!2024$Strong'
export MONGODB_USERNAME='admin'
export MONGODB_PASSWORD='M0ng0DB!Secure#2024'
export RABBITMQ_USERNAME='admin'
export RABBITMQ_PASSWORD='RabbitMQ!Pass#2024'
export REDIS_PASSWORD='Redis!Secure#2024'
export JWT_SECRET='my-super-secret-jwt-key-minimum-32-characters-long-2024'

# Optional (nếu có Notification service)
export FIREBASE_PROJECT_ID='your-project-id'
export FIREBASE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----'
export FIREBASE_CLIENT_EMAIL='firebase-adminsdk@your-project.iam.gserviceaccount.com'
export SMTP_HOST='smtp.gmail.com'
export SMTP_PORT='587'
export SMTP_USER='your-email@gmail.com'
export SMTP_PASSWORD='your-app-password'
export TWILIO_ACCOUNT_SID='your-account-sid'
export TWILIO_AUTH_TOKEN='your-auth-token'
export TWILIO_PHONE_NUMBER='+1234567890'
```

### Step 4.2: Run Initial Setup Script

```bash
cd scripts
chmod +x *.sh
./setup-infrastructure-once.sh
```

**Script này sẽ:**
1. ✅ Tạo namespace (`infrastructure`, `default`)
2. ✅ Generate Kubernetes secrets từ environment variables
3. ✅ Deploy PostgreSQL (với 7 databases)
4. ✅ Deploy MongoDB
5. ✅ Deploy Redis
6. ✅ Deploy RabbitMQ
7. ✅ Wait cho tất cả pods ready

**Thời gian:** ~3-5 phút

### Step 4.3: Verify Infrastructure

```bash
# Check all infrastructure pods
kubectl get pods -n infrastructure

# Expected output:
# NAME                            READY   STATUS    RESTARTS   AGE
# postgres-depl-xxxxx             1/1     Running   0          2m
# mongodb-depl-xxxxx              1/1     Running   0          2m
# redis-xxx                       1/1     Running   0          2m
# rabbitmq-depl-xxxxx             1/1     Running   0          2m

# Check services
kubectl get svc -n infrastructure

# Check databases created
kubectl exec -it -n infrastructure $(kubectl get pod -n infrastructure -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c '\l'

# Should see:
# - IAM
# - attendance_db
# - employee_db
# - leave_db
# - notification_db
# - reporting_db
# - zentry
```

### Step 4.4: Port Forward for Testing (Optional)

```bash
# RabbitMQ Management UI
kubectl port-forward -n infrastructure svc/rabbitmq-srv 15672:15672
# Access: http://localhost:15672
# Login: admin / RabbitMQ!Pass#2024

# PostgreSQL
kubectl port-forward -n infrastructure svc/postgres-srv 5432:5432
# Connect: psql -h localhost -U postgres

# MongoDB
kubectl port-forward -n infrastructure svc/mongodb-srv 27017:27017
# Connect: mongosh mongodb://admin:M0ng0DB!Secure#2024@localhost:27017

# Redis
kubectl port-forward -n infrastructure svc/redis-srv 6379:6379
# Connect: redis-cli -h localhost -a Redis!Secure#2024
```

---

## 5. CI/CD Automation

### ✅ Sau khi infrastructure ready, mọi deployment sẽ TỰ ĐỘNG qua GitHub Actions

### Step 5.1: Verify GitHub Actions is Enabled

1. GitHub Repository → **Actions** tab
2. Check workflows visible:
   - `CI/CD Main Pipeline`
   - `Build Node.js Service`
   - `Build .NET Service`

### Step 5.2: Test CI/CD Pipeline

**Option A: Push code change**
```bash
# Make a small change
git add .
git commit -m "test: trigger ci/cd"
git push origin main
```

**Option B: Manual trigger**
1. GitHub → **Actions** → `CI/CD Main Pipeline`
2. **Run workflow** → Select branch → **Run workflow**
3. Optional: Select specific service to deploy

### Step 5.3: Monitor Deployment

**GitHub Actions:**
- Vào **Actions** tab
- Click vào workflow run
- Xem realtime logs của từng job

**On EC2 Server:**
```bash
# Watch pods deploying
watch kubectl get pods -n default

# Check deployment status
kubectl rollout status deployment/auth-depl -n default
kubectl rollout status deployment/attendance-depl -n default
kubectl rollout status deployment/employee-depl -n default
kubectl rollout status deployment/leave-depl -n default
kubectl rollout status deployment/notification-depl -n default
kubectl rollout status deployment/reporting-depl -n default
kubectl rollout status deployment/face-recognition-depl -n default

# Check logs
kubectl logs -f -n default -l app=auth
```

### Step 5.4: How CI/CD Works

```
Developer Push Code
         ↓
GitHub Actions Triggered
         ↓
┌─────────────────────────────────────┐
│ 1. Detect Changes (paths-filter)   │
│    - Which services changed?        │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 2. Build Changed Services (parallel)│
│    - pnpm install                   │
│    - docker build                   │
│    - push to GHCR                   │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 3. Deploy to EC2                    │
│    - SSH to server                  │
│    - Generate secrets               │
│    - kubectl set image              │
│    - Wait for rollout               │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 4. Verify & Notify                  │
│    - Check pod status               │
│    - Send Slack notification        │
└─────────────────────────────────────┘
```

---

## 6. Verification & Testing

### Step 6.1: Health Check All Services

```bash
# Get all service IPs
kubectl get svc -n default

# Test Auth Service
curl http://auth-srv:3001/health

# Test Employee Service
curl http://employee-srv:3002/health

# Test Attendance Service
curl http://attendance-srv:3004/health

# Test Leave Service
curl http://leave-srv:3003/health

# Test Notification Service
curl http://notification-srv:3004/health

# Test Reporting Service
curl http://reporting-srv:3005/health

# Test Face Recognition Service
curl http://face-recognition-srv:5000/health
```

### Step 6.2: Test Database Connections

```bash
# Auth Service - IAM database
kubectl exec -n default $(kubectl get pod -n default -l app=auth -o jsonpath='{.items[0].metadata.name}') -- env | grep DATABASE_URL

# Check all services can connect to their databases
kubectl logs -n default -l app=auth | grep -i "database\|postgres\|connected"
kubectl logs -n default -l app=attendance | grep -i "database\|postgres\|connected"
kubectl logs -n default -l app=employee | grep -i "database\|postgres\|connected"
```

### Step 6.3: Test RabbitMQ Queues

```bash
# Access RabbitMQ Management UI
kubectl port-forward -n infrastructure svc/rabbitmq-srv 15672:15672

# Open browser: http://localhost:15672
# Login: admin / RabbitMQ!Pass#2024
# Check Queues tab - should see:
# - iam_queue
# - employee_queue
# - attendance_queue
# - leave_queue
# - notification_queue
# - reporting_queue
```

### Step 6.4: End-to-End Test

**Test Flow: Register → Login → Create Employee → Mark Attendance**

```bash
# 1. Register user (Auth service)
curl -X POST http://<EC2_IP>:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'

# 2. Login (Auth service)
curl -X POST http://<EC2_IP>:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
# Save the token

# 3. Create employee (Employee service)
curl -X POST http://<EC2_IP>:3002/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "department": "IT"
  }'

# 4. Mark attendance (Attendance service)
curl -X POST http://<EC2_IP>:3004/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "employeeId": "employee-id-from-step-3"
  }'
```

---

## 7. Troubleshooting

### Issue 1: Infrastructure Pods Not Starting

**Symptoms:**
```bash
kubectl get pods -n infrastructure
# NAME                          READY   STATUS              RESTARTS   AGE
# postgres-depl-xxxxx           0/1     ContainerCreating   0          5m
```

**Solutions:**
```bash
# Check events
kubectl describe pod postgres-depl-xxxxx -n infrastructure

# Common issues:
# 1. PVC not bound
kubectl get pvc -n infrastructure
kubectl describe pvc postgres-pvc -n infrastructure

# 2. Resource limits
kubectl top nodes
kubectl top pods -n infrastructure

# 3. Image pull errors
kubectl logs postgres-depl-xxxxx -n infrastructure
```

### Issue 2: Service Can't Connect to Database

**Symptoms:**
```bash
kubectl logs -n default auth-xxxxx
# Error: connect ECONNREFUSED postgres-srv:5432
```

**Solutions:**
```bash
# 1. Check service exists
kubectl get svc -n infrastructure postgres-srv

# 2. Test DNS resolution from pod
kubectl exec -it -n default auth-xxxxx -- nslookup postgres-srv.infrastructure.svc.cluster.local

# 3. Check secret exists and correct
kubectl get secret auth-secrets -n default -o yaml
kubectl get secret auth-secrets -n default -o jsonpath='{.data.DATABASE_URL}' | base64 -d

# 4. Verify PostgreSQL is accepting connections
kubectl exec -it -n infrastructure postgres-depl-xxxxx -- psql -U postgres -c "SELECT 1"

# 5. Regenerate secrets
cd /home/ubuntu/GRADUATE_PROJECT/scripts
export POSTGRES_PASSWORD='your-password'
./generate-secrets.sh
```

### Issue 3: CI/CD Pipeline Fails

**Symptoms:**
- GitHub Actions shows red X
- Build job fails
- Deploy job fails

**Solutions:**

**Check GitHub Secrets:**
```bash
# All required secrets set?
# Settings → Secrets → Actions
# - POSTGRES_PASSWORD ✓
# - MONGODB_PASSWORD ✓
# - RABBITMQ_PASSWORD ✓
# - REDIS_PASSWORD ✓
# - JWT_SECRET ✓
# - EC2_HOST ✓
# - EC2_USER ✓
# - EC2_SSH_PRIVATE_KEY ✓
# - GHCR_TOKEN ✓
```

**Check EC2 SSH Access:**
```bash
# Test SSH from local machine
ssh -i your-key.pem ubuntu@your-ec2-ip

# Check SSH key format in GitHub Secret
# - Must be entire content of .pem file
# - Include BEGIN/END lines
# - No extra spaces or newlines
```

**Check Docker Build:**
```bash
# On EC2, manually test build
cd /home/ubuntu/GRADUATE_PROJECT/services/auth
docker build -t test-auth .
```

**Check Kubernetes Deployment:**
```bash
# On EC2, check if deployment exists
kubectl get deployment -n default

# Check deployment events
kubectl describe deployment auth-depl -n default

# Check pod events
kubectl describe pod -n default -l app=auth
```

### Issue 4: Port Conflicts

**Symptoms:**
```bash
# Service can't bind to port
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3001
sudo lsof -i :3001

# Kill process if needed
sudo kill -9 <PID>

# Or change port in ConfigMap
kubectl edit configmap auth-config -n default
```

### Issue 5: Secrets Not Applied

**Symptoms:**
```bash
# Pod shows missing env vars
kubectl exec -n default auth-xxxxx -- env | grep DATABASE_URL
# (nothing)
```

**Solutions:**
```bash
# 1. Check secret exists
kubectl get secret auth-secrets -n default

# 2. Check secret referenced in deployment
kubectl get deployment auth-depl -n default -o yaml | grep -A 5 secretRef

# 3. Recreate secret
kubectl delete secret auth-secrets -n default
cd /home/ubuntu/GRADUATE_PROJECT/scripts
export POSTGRES_PASSWORD='your-password'
export RABBITMQ_PASSWORD='your-password'
export REDIS_PASSWORD='your-password'
export JWT_SECRET='your-secret'
./generate-secrets.sh

# 4. Restart deployment
kubectl rollout restart deployment/auth-depl -n default
```

### Issue 6: Out of Resources

**Symptoms:**
```bash
kubectl get pods -n default
# NAME                      READY   STATUS    RESTARTS   AGE
# auth-xxxxx                0/1     Pending   0          2m

kubectl describe pod auth-xxxxx -n default
# Warning: FailedScheduling ... Insufficient cpu
```

**Solutions:**
```bash
# 1. Check node resources
kubectl top nodes
kubectl describe node

# 2. Scale down non-critical services
kubectl scale deployment notification-depl -n default --replicas=0

# 3. Reduce resource requests in deployment
kubectl edit deployment auth-depl -n default
# Change resources.requests.cpu/memory to lower values

# 4. Or upgrade EC2 instance type
# AWS Console → EC2 → Stop instance → Change instance type → Start
```

---

## 📊 Monitoring & Maintenance

### Daily Operations

**Check System Health:**
```bash
# Infrastructure
kubectl get pods -n infrastructure
kubectl top pods -n infrastructure

# Services
kubectl get pods -n default
kubectl top pods -n default

# Storage
kubectl get pvc --all-namespaces
df -h
```

**View Logs:**
```bash
# All services
stern -n default .

# Specific service
kubectl logs -f -n default -l app=auth

# Last 100 lines
kubectl logs -n default -l app=auth --tail=100

# Previous container (if crashed)
kubectl logs -n default auth-xxxxx --previous
```

**Backup Databases:**
```bash
# PostgreSQL backup
kubectl exec -n infrastructure postgres-depl-xxxxx -- pg_dumpall -U postgres > backup-$(date +%Y%m%d).sql

# MongoDB backup
kubectl exec -n infrastructure mongodb-depl-xxxxx -- mongodump --archive > mongodb-backup-$(date +%Y%m%d).archive
```

### Weekly Maintenance

**Update Images:**
```bash
# Trigger rebuild via CI/CD
git commit --allow-empty -m "chore: weekly rebuild"
git push origin main
```

**Check Resource Usage:**
```bash
kubectl top nodes
kubectl top pods --all-namespaces | sort -k 3 -r
```

**Review Logs for Errors:**
```bash
kubectl logs -n default -l tier=microservices --since=7d | grep -i error
```

### Monthly Tasks

**Rotate Secrets:**
```bash
# Generate new passwords
export POSTGRES_PASSWORD=$(openssl rand -base64 24)
export JWT_SECRET=$(openssl rand -base64 48)

# Update GitHub Secrets
# Then trigger redeploy

# Update on server
cd /home/ubuntu/GRADUATE_PROJECT/scripts
./generate-secrets.sh
kubectl rollout restart deployment --all -n default
```

**Update System:**
```bash
# SSH to EC2
sudo apt update && sudo apt upgrade -y
sudo reboot
```

---

## ✅ Setup Checklist

Print this and check off as you complete each step:

### Phase 1: Preparation
- [ ] AWS account created
- [ ] EC2 key pair generated
- [ ] GitHub account ready
- [ ] Strong passwords generated
- [ ] GitHub PAT created

### Phase 2: AWS EC2
- [ ] EC2 instance launched (t3.large+, Ubuntu 22.04)
- [ ] Security group configured
- [ ] SSH access verified
- [ ] setup-ec2.sh executed
- [ ] Docker, kubectl, K3s installed
- [ ] Repository cloned

### Phase 3: GitHub Secrets
- [ ] POSTGRES_PASSWORD set
- [ ] MONGODB_USERNAME set
- [ ] MONGODB_PASSWORD set
- [ ] RABBITMQ_USERNAME set
- [ ] RABBITMQ_PASSWORD set
- [ ] REDIS_PASSWORD set
- [ ] JWT_SECRET set
- [ ] EC2_HOST set
- [ ] EC2_USER set
- [ ] EC2_SSH_PRIVATE_KEY set
- [ ] AWS_ACCESS_KEY_ID set
- [ ] AWS_SECRET_ACCESS_KEY set
- [ ] GHCR_TOKEN set
- [ ] Optional: Firebase, SMTP, Twilio secrets

### Phase 4: Infrastructure Setup
- [ ] Environment variables exported
- [ ] setup-infrastructure-once.sh executed
- [ ] PostgreSQL pod running
- [ ] MongoDB pod running
- [ ] Redis pod running
- [ ] RabbitMQ pod running
- [ ] All 7 databases created
- [ ] Secrets applied to cluster

### Phase 5: CI/CD
- [ ] GitHub Actions enabled
- [ ] Test deployment triggered
- [ ] Build jobs successful
- [ ] Images pushed to GHCR
- [ ] Deploy job successful
- [ ] All service pods running

### Phase 6: Verification
- [ ] Health checks passed
- [ ] Database connections working
- [ ] RabbitMQ queues visible
- [ ] End-to-end test successful
- [ ] Logs show no errors

---

## 🎉 Congratulations!

Your microservices platform is now fully deployed and automated!

**What happens next:**
- ✅ Push code → Auto build → Auto deploy
- ✅ Only changed services rebuild
- ✅ Secrets managed securely
- ✅ Zero downtime deployments
- ✅ Infrastructure stable

**Support:**
- 📖 Docs: `/docs` folder
- 🐛 Issues: GitHub Issues
- 💬 Questions: Create Discussion

**Happy Coding! 🚀**
