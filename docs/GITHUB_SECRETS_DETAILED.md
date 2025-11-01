# 🔐 GITHUB SECRETS SETUP - Simplified Architecture

> **⚠️ CHÚ Ý:** GitHub Secrets CHỈ dùng để CI/CD có thể deploy, KHÔNG chứa app secrets!  
> **📖 Đọc:** `docs/SECRETS_ARCHITECTURE.md` để hiểu kiến trúc secrets management

---

## 🎯 KIẾN TRÚC MỚI (ĐÚNG CHUẨN)

### ✅ GitHub Secrets (6 secrets) - CHỈ cho CI/CD deployment
### ✅ Kubernetes Secrets (18+ secrets) - Setup trực tiếp trên EC2

**Tại sao?**
- 🔒 **Bảo mật hơn:** App secrets không đi qua GitHub Actions
- 🚀 **Đơn giản hơn:** Setup secrets 1 lần trên EC2, CI/CD chỉ deploy code
- 🎓 **Professional:** Đúng best practices cho production

---

---

## 📍 Cách Thêm GitHub Secrets

1. Vào GitHub Repository: `https://github.com/kientvhe172514/GRADUATE_PROJECT`
2. Click **Settings** (tab trên cùng)
3. Sidebar trái → **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Nhập **Name** và **Value** (copy từ bên dưới)
6. Click **Add secret**
7. Lặp lại cho tất cả secrets

---

## 🗂️ GITHUB SECRETS (CHỈ 6 SECRETS)

> **Mục đích:** Cho phép GitHub Actions SSH vào EC2 để deploy code

### 1. AWS EC2 Connection (3 secrets)

#### `EC2_HOST`
**Mô tả:** Public IP address của EC2 instance  
**Format:** `X.X.X.X` (IPv4)  
**Ví dụ giá trị:**
```
3.123.45.67
```
**Cách lấy:**
```
1. Vào AWS Console → EC2 → Instances
2. Chọn instance của bạn
3. Copy "Public IPv4 address"
```
**📋 Copy value này (THAY ĐỔI thành IP thật của bạn):**
```
THAY_BẰNG_EC2_PUBLIC_IP_CỦA_BẠN
```

---

#### `EC2_USER`
**Mô tả:** SSH username để connect vào EC2  
**Giá trị:**
- Ubuntu AMI: `ubuntu`
- Amazon Linux: `ec2-user`

**📋 Copy value này (tùy AMI của bạn):**
```
ubuntu
```

---

#### `EC2_SSH_PRIVATE_KEY`
**Mô tả:** Nội dung của file .pem key để SSH vào EC2  
**⚠️ QUAN TRỌNG:** Phải copy TOÀN BỘ nội dung file .pem!

**Cách lấy:**
```bash
# Windows PowerShell:
Get-Content "C:\path\to\your-key.pem" -Raw | clip

# macOS/Linux:
cat ~/path/to/your-key.pem | pbcopy
```

**Format phải như này:**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAx1y2...
(nhiều dòng base64)
...xYz123==
-----END RSA PRIVATE KEY-----
```

**📋 Copy toàn bộ nội dung file .pem của bạn (bao gồm BEGIN và END)**

---

### 2. AWS Credentials (2 secrets)

#### `AWS_ACCESS_KEY_ID`
**Mô tả:** AWS IAM user access key  
**Ví dụ giá trị:**
```
AKIAIOSFODNN7EXAMPLE
```
**Cách tạo:**
```
1. AWS Console → IAM → Users
2. Chọn user hoặc tạo mới
3. Security credentials tab
4. Create access key
5. Use case: Command Line Interface (CLI)
6. Copy Access key ID
```
**📋 Copy Access Key ID của bạn**

---

#### `AWS_SECRET_ACCESS_KEY`
**Mô tả:** AWS IAM user secret key (đi kèm với Access Key ID)  
**Ví dụ giá trị:**
```
wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```
**⚠️ Chỉ hiện 1 LẦN khi tạo! Phải save ngay!**  
**📋 Copy Secret Access Key của bạn**

---

### 3. GitHub Container Registry (1 secret)

#### `GHCR_TOKEN`
**Mô tả:** GitHub Personal Access Token để push Docker images  

**Cách tạo:**
```
1. GitHub → Settings (góc phải trên, click avatar)
2. Developer settings (sidebar dưới cùng)
3. Personal access tokens → Tokens (classic)
4. Generate new token (classic)
5. Note: "GHCR Token for Graduate Project"
6. Expiration: 90 days (hoặc No expiration nếu là đồ án)
7. Select scopes (QUAN TRỌNG):
   ✅ repo (Full control of private repositories)
   ✅ write:packages (Upload packages to GitHub Package Registry)
   ✅ read:packages (Download packages from GitHub Package Registry)
   ✅ delete:packages (Delete packages from GitHub Package Registry)
8. Generate token
9. Copy ngay (chỉ hiện 1 lần!)
```

**Format:**
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**📋 Copy GitHub PAT của bạn (bắt đầu bằng `ghp_`)**

---

## � SUMMARY - GitHub Secrets

| Secret Name | Purpose | Example |
|-------------|---------|---------|
| `EC2_HOST` | EC2 Public IP | `3.123.45.67` |
| `EC2_USER` | SSH Username | `ubuntu` hoặc `ec2-user` |
| `EC2_SSH_PRIVATE_KEY` | SSH Private Key | `-----BEGIN RSA...` |
| `AWS_ACCESS_KEY_ID` | AWS API Access | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS API Secret | `wJalrXUtnFEMI/K7...` |
| `GHCR_TOKEN` | GitHub PAT | `ghp_xxxxxxxx` |

**Total: 6 secrets only!**

---

## � APPLICATION SECRETS (Setup on EC2)

> **⚠️ KHÔNG setup trong GitHub Secrets!**  
> **📍 Setup Location:** Trực tiếp trên EC2 server khi chạy `setup-infrastructure-once.sh`

### Cần export các biến này TRÊN EC2:

```bash
# Infrastructure Passwords
export POSTGRES_PASSWORD='Zentry@Postgres#2024!Strong'
export MONGODB_USERNAME='admin'
export MONGODB_PASSWORD='Zentry@MongoDB#2024!Strong'
export RABBITMQ_USERNAME='admin'
export RABBITMQ_PASSWORD='Zentry@RabbitMQ#2024!Strong'
export REDIS_PASSWORD='Zentry@Redis#2024!Strong'

# Application Security
export JWT_SECRET='Zentry-HR-JWT-Secret-Key-2024-Super-Strong-Min-32-Chars-Graduate-Project-System'

# Optional: Notification Service
export FIREBASE_PROJECT_ID='your-project-id'
export FIREBASE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n'
export FIREBASE_CLIENT_EMAIL='firebase-adminsdk@project.iam.gserviceaccount.com'

export SMTP_HOST='smtp.gmail.com'
export SMTP_PORT='587'
export SMTP_USER='kientvhe172514@fpt.edu.vn'
export SMTP_PASSWORD='tlgs vqgb tbfe gslr'

export TWILIO_ACCOUNT_SID='ACxxxx'
export TWILIO_AUTH_TOKEN='your_token'
export TWILIO_PHONE_NUMBER='+1234567890'
```

**Chi tiết setup:** Xem `docs/EC2_SETUP_COMMANDS.md` - STEP 6

---

## ✅ QUICK SETUP CHECKLIST

### Phase 1: GitHub Secrets (6 secrets - Add vào GitHub repo settings)

```bash
# AWS Connection (3 secrets)
□ EC2_HOST
□ EC2_USER
□ EC2_SSH_PRIVATE_KEY

# AWS Credentials (2 secrets)
□ AWS_ACCESS_KEY_ID
□ AWS_SECRET_ACCESS_KEY

# GitHub (1 secret)
□ GHCR_TOKEN
```

### Phase 2: EC2 Server Setup (Export trên EC2, KHÔNG vào GitHub!)

```bash
# SSH vào EC2, export các biến này:

# Infrastructure (6 values)
□ POSTGRES_PASSWORD
□ MONGODB_USERNAME
□ MONGODB_PASSWORD
□ RABBITMQ_USERNAME
□ RABBITMQ_PASSWORD
□ REDIS_PASSWORD

# Security (1 value)
□ JWT_SECRET

# Optional - Notification Service (10 values)
□ FIREBASE_PROJECT_ID
□ FIREBASE_PRIVATE_KEY
□ FIREBASE_CLIENT_EMAIL
□ SMTP_HOST
□ SMTP_PORT
□ SMTP_USER
□ SMTP_PASSWORD
□ TWILIO_ACCOUNT_SID
□ TWILIO_AUTH_TOKEN
□ TWILIO_PHONE_NUMBER
```

**Sau khi export → Chạy:** `./scripts/generate-secrets.sh`

---

## 🎯 COPY & PASTE VALUES

### For GitHub Secrets (Setup once in GitHub repo settings)

```bash
# ⚠️ THAY ĐỔI những giá trị này:
EC2_HOST=YOUR_EC2_PUBLIC_IP_HERE
EC2_USER=ubuntu  # hoặc ec2-user nếu dùng Amazon Linux
EC2_SSH_PRIVATE_KEY=YOUR_ENTIRE_PEM_FILE_CONTENT_HERE

AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID_HERE
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY_HERE

GHCR_TOKEN=ghp_YOUR_GITHUB_PERSONAL_ACCESS_TOKEN_HERE
```

### For EC2 Server (Export khi SSH vào EC2)

**File:** Tạo script `~/setup-env.sh` trên EC2 với nội dung:

```bash
#!/bin/bash

# Infrastructure Passwords (THAY ĐỔI trong production!)
export POSTGRES_PASSWORD='Zentry@Postgres#2024!Strong'
export MONGODB_USERNAME='admin'
export MONGODB_PASSWORD='Zentry@MongoDB#2024!Strong'
export RABBITMQ_USERNAME='admin'
export RABBITMQ_PASSWORD='Zentry@RabbitMQ#2024!Strong'
export REDIS_PASSWORD='Zentry@Redis#2024!Strong'

# Application Security
export JWT_SECRET='Zentry-HR-JWT-Secret-Key-2024-Super-Strong-Min-32-Chars-Graduate-Project-System'

# Optional: Notification Service (bỏ qua nếu không dùng)
export FIREBASE_PROJECT_ID='zentry-hr-mock'
export FIREBASE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n'
export FIREBASE_CLIENT_EMAIL='firebase-mock@zentry.iam.gserviceaccount.com'

export SMTP_HOST='smtp.gmail.com'
export SMTP_PORT='587'
export SMTP_USER='your-email@gmail.com'
export SMTP_PASSWORD='your-gmail-app-password'

export TWILIO_ACCOUNT_SID='ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
export TWILIO_AUTH_TOKEN='mock-token'
export TWILIO_PHONE_NUMBER='+1234567890'

echo "✅ Environment variables exported!"
```

**Cách sử dụng:**

```bash
# Trên EC2:
chmod +x ~/setup-env.sh
source ~/setup-env.sh

# Verify
echo $POSTGRES_PASSWORD  # Phải hiện password

# Generate K8s secrets
cd ~/GRADUATE_PROJECT/scripts
./generate-secrets.sh
```

---

## 🔍 Verification

### Step 1: Check GitHub Secrets (phải có 6 secrets)

```bash
# Vào GitHub Repository
https://github.com/kientvhe172514/GRADUATE_PROJECT/settings/secrets/actions

# Phải thấy:
✅ EC2_HOST
✅ EC2_USER
✅ EC2_SSH_PRIVATE_KEY
✅ AWS_ACCESS_KEY_ID
✅ AWS_SECRET_ACCESS_KEY
✅ GHCR_TOKEN
```

### Step 2: Check K8s Secrets on EC2 (sau khi chạy setup-infrastructure-once.sh)

```bash
# SSH to EC2
ssh -i "your-key.pem" ubuntu@YOUR_EC2_IP

# List all secrets
kubectl get secrets -n infrastructure
kubectl get secrets -n default

# Expected output:
NAME                      TYPE     DATA   AGE
postgres-secret           Opaque   2      5m
mongodb-secret            Opaque   2      5m
rabbitmq-secret           Opaque   2      5m
redis-secret              Opaque   1      5m
auth-secrets              Opaque   8      5m
attendance-secrets        Opaque   8      5m
employee-secrets          Opaque   5      5m
leave-secrets             Opaque   7      5m
notification-secrets      Opaque   18     5m
reporting-secrets         Opaque   9      5m
face-recognition-secrets  Opaque   9      5m
```

### Step 3: Test Application Connections

```bash
# Check if pods can read secrets
kubectl exec -it deployment/notification-depl -- env | grep SMTP
# Expected:
# SMTP_HOST=smtp.gmail.com
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=<sensitive>

# Check database connections
kubectl logs -l app=notification --tail=20 | grep -i "connected\|error"
```

---

## 🚨 SECURITY WARNINGS

### ❌ NEVER DO THIS:

1. ❌ Commit secrets vào Git
2. ❌ Share secrets qua email/chat
3. ❌ Screenshot secrets
4. ❌ Use weak passwords như `123456`, `password`
5. ❌ Reuse same password cho nhiều services

### ✅ ALWAYS DO THIS:

1. ✅ Store secrets trong GitHub Secrets
2. ✅ Use strong passwords (16+ chars)
3. ✅ Different password cho mỗi service
4. ✅ Rotate secrets every 90 days
5. ✅ Enable 2FA trên GitHub account

---

## 💡 Pro Tips

### Generate Strong Passwords

```bash
# Method 1: OpenSSL
openssl rand -base64 20

# Method 2: pwgen
pwgen -s 20 1

# Method 3: Online (trusted sites only!)
# https://passwordsgenerator.net/
# Settings: 20 chars, uppercase, lowercase, numbers, symbols
```

### Save Secrets Locally (For backup)

```bash
# Create a .secrets file (NOT committed to Git!)
cat > .secrets << 'EOF'
POSTGRES_PASSWORD=Zentry@Postgres#2024!Strong
MONGODB_USERNAME=admin
MONGODB_PASSWORD=Zentry@MongoDB#2024!Strong
...
EOF

# Encrypt it
gpg -c .secrets
# This creates .secrets.gpg (encrypted)

# Delete plain text
rm .secrets

# To decrypt later:
gpg .secrets.gpg
```

---

## 📞 Need Help?

### Common Issues:

**Problem:** "Secret not found" error trong GitHub Actions  
**Solution:** Kiểm tra tên secret CHÍNH XÁC, phân biệt hoa thường

**Problem:** SSH connection failed  
**Solution:** Kiểm tra EC2_SSH_PRIVATE_KEY có đầy đủ BEGIN/END lines

**Problem:** Docker push failed  
**Solution:** Kiểm tra GHCR_TOKEN có đúng scopes (write:packages)

**Problem:** Services không kết nối được database  
**Solution:** Check POSTGRES_PASSWORD có khớp với password trong infrastructure setup không

---

**✅ Done! Sau khi add tất cả secrets, bạn có thể:**
1. Push code lên GitHub
2. GitHub Actions tự động build & deploy
3. Services sẽ sử dụng secrets này để connect các services

**Good luck with your graduation project! 🎓**
