# 🖥️ EC2 SERVER SETUP - Step by Step Commands

> **Copy & Paste Guide** - Chỉ cần copy từng command block và chạy!

---

## 📍 Prerequisites

- ✅ EC2 instance đã khởi tạo (Ubuntu 22.04)
- ✅ Key pair (.pem file) đã download
- ✅ Security Group đã mở ports: 22, 80, 443, 3000-3010
- ✅ Có Public IP của EC2

---

## STEP 1: Connect to EC2

### Windows (PowerShell):

```powershell
# Set key permissions
icacls "C:\path\to\your-key.pem" /inheritance:r
icacls "C:\path\to\your-key.pem" /grant:r "$($env:USERNAME):(R)"

# Connect
ssh -i "C:\path\to\your-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

### macOS/Linux:

```bash
# Set key permissions
chmod 400 ~/path/to/your-key.pem

# Connect
ssh -i ~/path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**Replace:**
- `C:\path\to\your-key.pem` → Đường dẫn thật đến file .pem của bạn
- `YOUR_EC2_PUBLIC_IP` → IP thật của EC2 (vd: `3.123.45.67`)

---

## STEP 2: Update System

```bash
# Update package list
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Reboot (if kernel updated)
sudo reboot
```

**⏱️ Thời gian:** 2-3 phút  
**Sau reboot:** SSH lại vào EC2

---

## STEP 3: Run Automated Setup Script

```bash
# Download setup script
wget https://raw.githubusercontent.com/kientvhe172514/GRADUATE_PROJECT/main/scripts/setup-ec2.sh

# Make executable
chmod +x setup-ec2.sh

# Run setup
./setup-ec2.sh
```

**⏱️ Thời gian:** 10-15 phút

**Script này sẽ cài:**
- ✅ Docker & Docker Compose
- ✅ kubectl (Kubernetes CLI)
- ✅ K3s (Lightweight Kubernetes)
- ✅ Git
- ✅ curl, wget, jq (utilities)

**Output mong đợi:**
```
============================================
✅ EC2 SETUP COMPLETE
============================================
Docker version: 24.x.x
kubectl version: v1.28.x
K3s: Running
============================================
```

---

## STEP 4: Verify Installation

```bash
# Check Docker
docker --version
docker ps

# Check Kubernetes
kubectl version --client
kubectl get nodes

# Check K3s
sudo systemctl status k3s

# Check kubectl can connect
kubectl get pods --all-namespaces
```

**Expected output:**
```bash
# docker --version
Docker version 24.0.7, build afdd53b

# kubectl get nodes
NAME        STATUS   ROLES                  AGE   VERSION
ip-xxx      Ready    control-plane,master   1m    v1.28.4+k3s1

# kubectl get pods --all-namespaces
NAMESPACE     NAME                                     READY   STATUS    RESTARTS   AGE
kube-system   coredns-xxx                              1/1     Running   0          1m
kube-system   local-path-provisioner-xxx               1/1     Running   0          1m
...
```

---

## STEP 5: Clone Repository

```bash
# Go to home directory
cd /home/ubuntu

# Clone project
git clone https://github.com/kientvhe172514/GRADUATE_PROJECT.git

# Enter project
cd GRADUATE_PROJECT

# Check structure
ls -la
```

**Output:**
```
drwxr-xr-x  clients/
drwxr-xr-x  docs/
drwxr-xr-x  infra/
drwxr-xr-x  scripts/
drwxr-xr-x  services/
-rw-r--r--  README.md
-rw-r--r--  docker-compose.yml
...
```

---

## STEP 6: Setup Environment Variables

### Option A: Quick Setup (Copy-Paste Values)

```bash
# Export infrastructure passwords
export POSTGRES_PASSWORD='Zentry@Postgres#2024!Strong'
export MONGODB_USERNAME='admin'
export MONGODB_PASSWORD='Zentry@MongoDB#2024!Strong'
export RABBITMQ_USERNAME='admin'
export RABBITMQ_PASSWORD='Zentry@RabbitMQ#2024!Strong'
export REDIS_PASSWORD='Zentry@Redis#2024!Strong'
export JWT_SECRET='Zentry-HR-JWT-Secret-Key-2024-Super-Strong-Min-32-Chars-Graduate-Project-System'

# Verify
echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "JWT_SECRET: $JWT_SECRET"
```

### Option B: Interactive Setup

```bash
# PostgreSQL
read -sp "Enter POSTGRES_PASSWORD: " POSTGRES_PASSWORD
echo
export POSTGRES_PASSWORD

# MongoDB
export MONGODB_USERNAME='admin'
read -sp "Enter MONGODB_PASSWORD: " MONGODB_PASSWORD
echo
export MONGODB_PASSWORD

# RabbitMQ
export RABBITMQ_USERNAME='admin'
read -sp "Enter RABBITMQ_PASSWORD: " RABBITMQ_PASSWORD
echo
export RABBITMQ_PASSWORD

# Redis
read -sp "Enter REDIS_PASSWORD: " REDIS_PASSWORD
echo
export REDIS_PASSWORD

# JWT
read -sp "Enter JWT_SECRET (min 32 chars): " JWT_SECRET
echo
export JWT_SECRET
```

### Optional: Notification Service Variables

```bash
# Firebase (Optional)
export FIREBASE_PROJECT_ID='zentry-hr-mock'
export FIREBASE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n'
export FIREBASE_CLIENT_EMAIL='firebase-mock@zentry.iam.gserviceaccount.com'

# SMTP (Optional)
export SMTP_HOST='smtp.gmail.com'
export SMTP_PORT='587'
export SMTP_USER='your-email@gmail.com'
export SMTP_PASSWORD='your-app-password'

# Twilio (Optional)
export TWILIO_ACCOUNT_SID='ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
export TWILIO_AUTH_TOKEN='mock-token'
export TWILIO_PHONE_NUMBER='+1234567890'
```

---

## STEP 7: Run Infrastructure Setup (ONE-TIME ONLY!)

```bash
# Navigate to scripts
cd /home/ubuntu/GRADUATE_PROJECT/scripts

# Make scripts executable
chmod +x *.sh

# Run infrastructure setup
./setup-infrastructure-once.sh
```

**⏱️ Thời gian:** 3-5 phút

**Output mong đợi:**
```
============================================
🏗️  INITIAL INFRASTRUCTURE SETUP
============================================

⚠️  WARNING: This script should only be run ONCE
    during initial server setup!

Continue? (yes/no) yes

============================================
STEP 1: Creating Namespaces
============================================
namespace/infrastructure created
namespace/default unchanged

============================================
STEP 2: Generating Secrets from Environment
============================================
✅ All required environment variables present

📝 Generating secrets from templates...

🏗️  Infrastructure Secrets:
   ✅ Generated: postgres-secret.yaml
   ✅ Generated: mongodb-secret.yaml
   ✅ Generated: rabbitmq-secret.yaml

🔧 Service Secrets:
   ✅ Generated: auth-secrets.yaml
   ✅ Generated: attendance-secrets.yaml
   ✅ Generated: employee-secrets.yaml
   ✅ Generated: leave-secrets.yaml
   ✅ Generated: notification-secrets.yaml
   ✅ Generated: reporting-secrets.yaml
   ✅ Generated: face-recognition-secrets.yaml

============================================
✅ ALL SECRETS GENERATED
============================================

============================================
STEP 3: Deploying Infrastructure
============================================
📦 Creating infrastructure namespace...
🐘 Deploying PostgreSQL...
⏳ Waiting for PostgreSQL to be ready...
pod/postgres-depl-xxxxx condition met

🍃 Deploying MongoDB...
⏳ Waiting for MongoDB to be ready...
pod/mongodb-depl-xxxxx condition met

🔴 Deploying Redis...
⏳ Waiting for Redis to be ready...
pod/redis-xxxxx condition met

🐰 Deploying RabbitMQ...
⏳ Waiting for RabbitMQ to be ready...
pod/rabbitmq-depl-xxxxx condition met

============================================
✅ INFRASTRUCTURE SETUP COMPLETE
============================================

📊 Infrastructure Status:
NAME                         READY   STATUS    RESTARTS   AGE
postgres-depl-xxxxx          1/1     Running   0          2m
mongodb-depl-xxxxx           1/1     Running   0          2m
redis-xxxxx                  1/1     Running   0          1m
rabbitmq-depl-xxxxx          1/1     Running   0          1m

🔌 Services:
NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)
postgres-srv      ClusterIP   10.43.xxx.xxx   <none>        5432/TCP
mongodb-srv       ClusterIP   10.43.xxx.xxx   <none>        27017/TCP
redis-srv         ClusterIP   10.43.xxx.xxx   <none>        6379/TCP
rabbitmq-srv      ClusterIP   10.43.xxx.xxx   <none>        5672/TCP,15672/TCP

============================================
✅ ALL INFRASTRUCTURE READY FOR SERVICES
============================================
```

---

## STEP 8: Verify Infrastructure

### Check PostgreSQL Databases

```bash
# Get PostgreSQL pod name
POSTGRES_POD=$(kubectl get pod -n infrastructure -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# List all databases
kubectl exec -it -n infrastructure $POSTGRES_POD -- psql -U postgres -c '\l'
```

**Expected output:**
```
                                List of databases
      Name       |  Owner   | Encoding |   Collate   |    Ctype    
-----------------+----------+----------+-------------+-------------
 IAM             | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8
 attendance_db   | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8
 employee_db     | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8
 leave_db        | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8
 notification_db | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8
 reporting_db    | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8
 zentry          | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8
```

**✅ Phải thấy đủ 7 databases!**

### Check MongoDB

```bash
# Get MongoDB pod name
MONGODB_POD=$(kubectl get pod -n infrastructure -l app=mongodb -o jsonpath='{.items[0].metadata.name}')

# Test connection
kubectl exec -it -n infrastructure $MONGODB_POD -- mongosh -u admin -p $MONGODB_PASSWORD --eval "db.adminCommand('ping')"
```

**Expected:** `{ ok: 1 }`

### Check Redis

```bash
# Get Redis pod name
REDIS_POD=$(kubectl get pod -n infrastructure -l app=redis -o jsonpath='{.items[0].metadata.name}')

# Test connection
kubectl exec -it -n infrastructure $REDIS_POD -- redis-cli -a $REDIS_PASSWORD ping
```

**Expected:** `PONG`

### Check RabbitMQ

```bash
# Port forward RabbitMQ Management UI
kubectl port-forward -n infrastructure svc/rabbitmq-srv 15672:15672 &

# Open in browser: http://localhost:15672
# Login: admin / Zentry@RabbitMQ#2024!Strong
```

**Expected:** RabbitMQ management dashboard accessible

---

## STEP 9: Setup GitHub Actions Integration

### Add SSH Key to authorized_keys (for CI/CD)

```bash
# View current authorized keys
cat ~/.ssh/authorized_keys

# This should already contain your key pair
# GitHub Actions will use the same key (EC2_SSH_PRIVATE_KEY secret)
```

### Test SSH from Local (simulate GitHub Actions)

```bash
# On your local machine
ssh -i "your-key.pem" ubuntu@YOUR_EC2_IP "kubectl get nodes"
```

**Expected:** Should show K3s node

---

## STEP 10: Trigger First Deployment

### Option A: From Local (Manual Test)

```bash
# On EC2 server
cd /home/ubuntu/GRADUATE_PROJECT/scripts

# Deploy all services manually
./deploy-services.sh
```

### Option B: From GitHub (Automated)

```bash
# On your local machine
cd /path/to/local/GRADUATE_PROJECT

# Make a test change
git add .
git commit -m "test: trigger ci/cd"
git push origin main

# Then watch GitHub Actions:
# https://github.com/kientvhe172514/GRADUATE_PROJECT/actions
```

---

## 📊 VERIFICATION CHECKLIST

After setup, verify everything:

```bash
# 1. Infrastructure pods
kubectl get pods -n infrastructure
# Expected: All Running (4 pods)

# 2. Infrastructure services
kubectl get svc -n infrastructure
# Expected: postgres-srv, mongodb-srv, redis-srv, rabbitmq-srv

# 3. Databases created
kubectl exec -it -n infrastructure $(kubectl get pod -n infrastructure -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c '\l' | grep -E '(IAM|attendance_db|employee_db|leave_db|notification_db|reporting_db|zentry)'
# Expected: 7 databases

# 4. Persistent volumes
kubectl get pvc -n infrastructure
# Expected: All Bound

# 5. Secrets exist
kubectl get secrets -n infrastructure
kubectl get secrets -n default
# Expected: Multiple secrets

# 6. Nodes healthy
kubectl get nodes
# Expected: Ready

# 7. K3s running
sudo systemctl status k3s
# Expected: active (running)

# 8. Docker working
docker ps
# Expected: Multiple K3s containers
```

---

## 🎯 READY FOR CI/CD!

After completing all steps:

✅ **Infrastructure:** PostgreSQL, MongoDB, Redis, RabbitMQ running  
✅ **Secrets:** Generated và applied  
✅ **Kubernetes:** K3s cluster healthy  
✅ **SSH:** GitHub Actions can connect  

**Next:** Push code to GitHub → CI/CD tự động deploy services!

---

## 💾 BACKUP COMMANDS (Important!)

### Backup Environment Variables

```bash
# Create backup file (KHÔNG commit vào Git!)
cat > ~/infrastructure-secrets-backup.txt << EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
MONGODB_USERNAME=$MONGODB_USERNAME
MONGODB_PASSWORD=$MONGODB_PASSWORD
RABBITMQ_USERNAME=$RABBITMQ_USERNAME
RABBITMQ_PASSWORD=$RABBITMQ_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
JWT_SECRET=$JWT_SECRET
EOF

# Encrypt backup
chmod 600 ~/infrastructure-secrets-backup.txt
```

### Backup Kubernetes Config

```bash
# Copy kubeconfig
sudo cp /etc/rancher/k3s/k3s.yaml ~/kubeconfig-backup.yaml
sudo chown ubuntu:ubuntu ~/kubeconfig-backup.yaml
chmod 600 ~/kubeconfig-backup.yaml
```

### Backup Database

```bash
# PostgreSQL
kubectl exec -it -n infrastructure $(kubectl get pod -n infrastructure -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- pg_dumpall -U postgres > ~/postgres-backup-$(date +%Y%m%d).sql

# MongoDB
kubectl exec -it -n infrastructure $(kubectl get pod -n infrastructure -l app=mongodb -o jsonpath='{.items[0].metadata.name}') -- mongodump --archive > ~/mongodb-backup-$(date +%Y%m%d).archive
```

---

## 🚨 TROUBLESHOOTING

### Issue 1: Permission Denied (SSH)

```bash
# Fix key permissions
chmod 400 your-key.pem

# Try again
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### Issue 2: Pods Not Starting

```bash
# Check pod status
kubectl describe pod -n infrastructure postgres-depl-xxxxx

# Check logs
kubectl logs -n infrastructure postgres-depl-xxxxx

# Common fix: Increase resources
# Edit deployment:
kubectl edit deployment postgres-depl -n infrastructure
# Change resources.limits.memory to higher value
```

### Issue 3: Database Not Created

```bash
# Check init script logs
kubectl logs -n infrastructure postgres-depl-xxxxx | grep -i "database"

# Manually create if needed
kubectl exec -it -n infrastructure $(kubectl get pod -n infrastructure -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "CREATE DATABASE IAM;"
```

### Issue 4: Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a --volumes

# Clean K3s
sudo k3s crictl rmi --prune
```

### Issue 5: K3s Not Starting

```bash
# Check K3s logs
sudo journalctl -u k3s -f

# Restart K3s
sudo systemctl restart k3s

# Reset K3s (CAUTION: Loses all data!)
sudo /usr/local/bin/k3s-killall.sh
sudo /usr/local/bin/k3s-uninstall.sh
# Then re-run setup-ec2.sh
```

---

## 📞 SUPPORT

**Issues?** Check:
1. `docs/SETUP_GUIDE.md` - Full guide
2. `docs/GITHUB_SECRETS_DETAILED.md` - Secrets setup
3. `docs/TROUBLESHOOTING.md` - Common problems

**Still stuck?** Create GitHub Issue with:
- Error message
- Output của `kubectl get pods --all-namespaces`
- Output của `kubectl describe pod <pod-name>`

---

**🎉 Congratulations!** Server setup complete! Bây giờ mỗi lần push code, GitHub Actions sẽ tự động deploy!
