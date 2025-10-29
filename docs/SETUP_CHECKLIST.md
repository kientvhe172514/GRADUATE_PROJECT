# ✅ DEPLOYMENT CHECKLIST

Print và check từng bước khi deploy!

---

## 📋 PRE-DEPLOYMENT

### AWS EC2 (ĐỒ ÁN TỐT NGHIỆP - Test Environment)
- [ ] Instance type: **t2.medium** (hoặc t3.medium)
- [ ] OS: **Ubuntu 22.04 LTS**
- [ ] Storage: **20GB** gp3/gp2
- [ ] vCPU: **2 cores**
- [ ] RAM: **4GB**
- [ ] Security Group: Ports **22, 80, 443, 3000-3010** open
- [ ] Elastic IP: Optional (có thể dùng Public IP tạm)
- [ ] Key pair: Downloaded và secure
- [ ] 💰 **Cost**: ~$30-40/tháng (hoặc FREE với AWS Free Tier)

### GitHub
- [ ] Repository forked/cloned
- [ ] Personal Access Token (PAT) created
  - Scopes: `repo`, `write:packages`, `read:packages`
- [ ] Actions enabled

### Passwords Generated
- [ ] PostgreSQL: **16+ chars** → `_________________`
- [ ] MongoDB: **16+ chars** → `_________________`
- [ ] RabbitMQ: **16+ chars** → `_________________`
- [ ] Redis: **16+ chars** → `_________________`
- [ ] JWT Secret: **32+ chars** → `_________________`

---

## 🖥️ EC2 SETUP

```bash
# 1. SSH to EC2
ssh -i "your-key.pem" ubuntu@YOUR_EC2_IP

# 2. Run setup
wget https://raw.githubusercontent.com/kientvhe172514/GRADUATE_PROJECT/main/scripts/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

- [ ] Docker installed → `docker --version`
- [ ] kubectl installed → `kubectl version`
- [ ] K3s running → `sudo systemctl status k3s`
- [ ] Git installed → `git --version`

---

## 🔐 GITHUB SECRETS

Settings → Secrets and variables → Actions → New repository secret

### Infrastructure (Required)
- [ ] `POSTGRES_PASSWORD` → PostgreSQL password
- [ ] `MONGODB_USERNAME` → `admin`
- [ ] `MONGODB_PASSWORD` → MongoDB password
- [ ] `RABBITMQ_USERNAME` → `admin`
- [ ] `RABBITMQ_PASSWORD` → RabbitMQ password
- [ ] `REDIS_PASSWORD` → Redis password
- [ ] `JWT_SECRET` → JWT secret key

### AWS & CI/CD (Required)
- [ ] `EC2_HOST` → EC2 Public IP
- [ ] `EC2_USER` → `ubuntu`
- [ ] `EC2_SSH_PRIVATE_KEY` → Content của .pem file
- [ ] `AWS_ACCESS_KEY_ID` → IAM user key
- [ ] `AWS_SECRET_ACCESS_KEY` → IAM secret
- [ ] `GHCR_TOKEN` → GitHub PAT

### Optional (Notification Service)
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_PRIVATE_KEY`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASSWORD`
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_PHONE_NUMBER`

---

## 🏗️ INFRASTRUCTURE SETUP

```bash
# 1. SSH to EC2
ssh -i "your-key.pem" ubuntu@YOUR_EC2_IP

# 2. Clone repo
cd /home/ubuntu
git clone https://github.com/kientvhe172514/GRADUATE_PROJECT.git
cd GRADUATE_PROJECT

# 3. Export secrets (THAY ĐỔI values!)
export POSTGRES_PASSWORD='Your-Password-Here'
export MONGODB_USERNAME='admin'
export MONGODB_PASSWORD='Your-Password-Here'
export RABBITMQ_USERNAME='admin'
export RABBITMQ_PASSWORD='Your-Password-Here'
export REDIS_PASSWORD='Your-Password-Here'
export JWT_SECRET='Your-JWT-Secret-Here'

# 4. Run setup (ONE-TIME ONLY!)
cd scripts
chmod +x *.sh
./setup-infrastructure-once.sh
```

- [ ] Namespace created
- [ ] PostgreSQL running → `kubectl get pods -n infrastructure`
- [ ] MongoDB running
- [ ] Redis running
- [ ] RabbitMQ running
- [ ] All databases created → Check with psql

---

## 🚀 CI/CD VERIFICATION

### GitHub Actions
- [ ] Go to **Actions** tab
- [ ] See 3 workflows:
  - CI/CD Main Pipeline
  - Build Node.js Service
  - Build .NET Service

### Trigger First Deploy
```bash
# Option A: Push code
git commit --allow-empty -m "test: first deploy"
git push origin main

# Option B: Manual trigger
# GitHub → Actions → CI/CD Main Pipeline → Run workflow
```

### Monitor Deployment
- [ ] GitHub Actions: All jobs **green**
- [ ] Build jobs: Images pushed to GHCR
- [ ] Deploy job: SSH success
- [ ] Services deployed

### On EC2 Server
```bash
# Watch pods
watch kubectl get pods -n default

# Expected: All pods Running
# auth-depl-xxxxx           1/1     Running
# attendance-depl-xxxxx     1/1     Running
# employee-depl-xxxxx       1/1     Running
# leave-depl-xxxxx          1/1     Running
# notification-depl-xxxxx   1/1     Running
# reporting-depl-xxxxx      1/1     Running
# face-recognition-xxxxx    1/1     Running
```

- [ ] All service pods: **Running**
- [ ] No **CrashLoopBackOff**
- [ ] No **ImagePullBackOff**

---

## ✅ VERIFICATION

### Infrastructure
```bash
# PostgreSQL databases
kubectl exec -it -n infrastructure \
  $(kubectl get pod -n infrastructure -l app=postgres -o jsonpath='{.items[0].metadata.name}') \
  -- psql -U postgres -c '\l'
```
- [ ] IAM database exists
- [ ] attendance_db exists
- [ ] employee_db exists
- [ ] leave_db exists
- [ ] notification_db exists
- [ ] reporting_db exists
- [ ] zentry database exists

### Services Health
```bash
# Get service IPs
kubectl get svc -n default
```
- [ ] auth-srv: Port 3001
- [ ] employee-srv: Port 3002
- [ ] leave-srv: Port 3003
- [ ] attendance-srv: Port 3004
- [ ] notification-srv: Port 3004
- [ ] reporting-srv: Port 3005
- [ ] face-recognition-srv: Port 5000

### Logs Check
```bash
# No errors in logs
kubectl logs -n default -l app=auth --tail=50
kubectl logs -n default -l app=employee --tail=50
```
- [ ] Auth logs: No errors
- [ ] Employee logs: No errors
- [ ] Database connections: Success
- [ ] RabbitMQ connections: Success

### RabbitMQ Queues
```bash
# Port forward
kubectl port-forward -n infrastructure svc/rabbitmq-srv 15672:15672

# Open: http://localhost:15672
# Login: admin / Your-RabbitMQ-Password
```
- [ ] iam_queue created
- [ ] employee_queue created
- [ ] attendance_queue created
- [ ] leave_queue created
- [ ] notification_queue created
- [ ] reporting_queue created

---

## 🧪 END-TO-END TEST

```bash
# Replace YOUR_EC2_IP with actual IP

# 1. Register user
curl -X POST http://YOUR_EC2_IP:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```
- [ ] Response: **201 Created**

```bash
# 2. Login
curl -X POST http://YOUR_EC2_IP:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```
- [ ] Response: **200 OK** with token

```bash
# 3. Create employee (use token from step 2)
curl -X POST http://YOUR_EC2_IP:3002/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"John Doe","email":"john@example.com","department":"IT"}'
```
- [ ] Response: **201 Created**

```bash
# 4. Mark attendance
curl -X POST http://YOUR_EC2_IP:3004/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"employeeId":"EMPLOYEE_ID_FROM_STEP_3"}'
```
- [ ] Response: **201 Created**

---

## 🎉 SUCCESS CRITERIA

### Infrastructure ✅
- [ ] PostgreSQL: **Running** + 7 databases
- [ ] MongoDB: **Running**
- [ ] Redis: **Running**
- [ ] RabbitMQ: **Running** + queues

### Services ✅
- [ ] Auth: **Running** + Healthy
- [ ] Employee: **Running** + Healthy
- [ ] Attendance: **Running** + Healthy
- [ ] Leave: **Running** + Healthy
- [ ] Notification: **Running** + Healthy
- [ ] Reporting: **Running** + Healthy
- [ ] Face Recognition: **Running** + Healthy

### CI/CD ✅
- [ ] GitHub Actions: **All green**
- [ ] Auto-deploy: **Working**
- [ ] Change detection: **Working**
- [ ] Secrets: **Secure**

### Testing ✅
- [ ] Register: **Success**
- [ ] Login: **Success**
- [ ] Create Employee: **Success**
- [ ] Mark Attendance: **Success**

---

## 📞 SUPPORT

### Issues?
- 📖 Read: `docs/SETUP_GUIDE.md`
- 🔐 Security: `docs/SECURITY_SECRETS_MANAGEMENT.md`
- 🏗️ Infrastructure: `docs/INFRASTRUCTURE_VALIDATION.md`
- 🐛 Troubleshooting: Section 7 in SETUP_GUIDE.md

### Common Problems
1. **Pods not starting** → Check resources: `kubectl top nodes`
2. **Can't connect DB** → Regenerate secrets: `./generate-secrets.sh`
3. **CI/CD fails** → Verify GitHub Secrets
4. **Port conflicts** → Check: `sudo netstat -tulpn`

---

## 🎯 NEXT STEPS

After successful deployment:

1. **Setup Domain** (Optional)
   - Point DNS to EC2 IP
   - Configure Ingress
   - Setup SSL/TLS

2. **Monitoring**
   - Deploy Prometheus
   - Deploy Grafana
   - Setup alerts

3. **Backup**
   - Schedule database backups
   - Test restore process

4. **Security**
   - Change default passwords
   - Rotate secrets every 90 days
   - Enable firewall rules

5. **Scale**
   - Increase replicas
   - Add more nodes
   - Setup auto-scaling

---

**Date:** _______________
**Deployed by:** _______________
**Environment:** Production / Staging / Dev
**EC2 IP:** _______________

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
