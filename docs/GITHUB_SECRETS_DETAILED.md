# 🔐 GITHUB SECRETS SETUP - Chi Tiết 100%

> **Copy & Paste Guide** - Bạn chỉ cần đọc và copy chính xác values này vào GitHub Secrets!

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

## 🗂️ REQUIRED SECRETS (BẮT BUỘC)

### 1. Infrastructure Database & Messaging

#### `POSTGRES_PASSWORD`
**Mô tả:** Password cho PostgreSQL database (master password)  
**Ví dụ giá trị:**
```
P@ssw0rd!2024$Zentry
```
**Hướng dẫn tạo:**
```bash
# Tạo password mạnh 16-20 ký tự
openssl rand -base64 16
# Hoặc dùng: https://passwordsgenerator.net/
```
**📋 Copy value này:**
```
Zentry@Postgres#2024!Strong
```

---

#### `MONGODB_USERNAME`
**Mô tả:** MongoDB admin username  
**Giá trị cố định:**
```
admin
```
**📋 Copy value này:**
```
admin
```

---

#### `MONGODB_PASSWORD`
**Mô tả:** Password cho MongoDB  
**Ví dụ giá trị:**
```
M0ng0DB!Secure#2024
```
**Hướng dẫn tạo:**
```bash
openssl rand -base64 16
```
**📋 Copy value này:**
```
Zentry@MongoDB#2024!Strong
```

---

#### `RABBITMQ_USERNAME`
**Mô tả:** RabbitMQ admin username  
**Giá trị cố định:**
```
admin
```
**📋 Copy value này:**
```
admin
```

---

#### `RABBITMQ_PASSWORD`
**Mô tả:** Password cho RabbitMQ message broker  
**Ví dụ giá trị:**
```
RabbitMQ!Pass#2024
```
**📋 Copy value này:**
```
Zentry@RabbitMQ#2024!Strong
```

---

#### `REDIS_PASSWORD`
**Mô tả:** Password cho Redis cache  
**Ví dụ giá trị:**
```
Redis!Secure#2024
```
**📋 Copy value này:**
```
Zentry@Redis#2024!Strong
```

---

### 2. Application Security

#### `JWT_SECRET`
**Mô tả:** Secret key để tạo JWT tokens cho authentication  
**⚠️ QUAN TRỌNG:** Phải tối thiểu 32 ký tự!  
**Ví dụ giá trị:**
```
my-super-secret-jwt-key-minimum-32-characters-long-2024-zentry-hr-system
```
**Hướng dẫn tạo:**
```bash
# Tạo JWT secret 64 ký tự
openssl rand -base64 48
```
**📋 Copy value này:**
```
Zentry-HR-JWT-Secret-Key-2024-Super-Strong-Min-32-Chars-Graduate-Project
```

---

### 3. AWS EC2 Connection

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
**Giá trị cố định cho Ubuntu:**
```
ubuntu
```
**📋 Copy value này:**
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

### 4. AWS Credentials

#### `AWS_ACCESS_KEY_ID`
**Mô tả:** AWS IAM user access key để GitHub Actions có thể tương tác với AWS  
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

#### `AWS_REGION`
**Mô tả:** AWS region nơi EC2 instance được deploy  
**Ví dụ giá trị:**
```
ap-southeast-1
```
**Common regions:**
- `ap-southeast-1` - Singapore (gần Việt Nam nhất)
- `us-east-1` - US East (N. Virginia)
- `us-west-2` - US West (Oregon)
- `eu-west-1` - Europe (Ireland)

**Cách kiểm tra:**
```
AWS Console → EC2 → Region dropdown (góc trên bên phải)
```
**📋 Copy value này (hoặc thay đổi theo region của bạn):**
```
ap-southeast-1
```

---

### 5. GitHub Container Registry

#### `GHCR_TOKEN`
**Mô tả:** GitHub Personal Access Token để push Docker images vào GHCR  

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

## 🔔 OPTIONAL SECRETS (Notification Service)

> **💡 Tip:** Bạn có thể BỎ QUA phần này nếu không dùng Notification service hoặc set `USE_MOCK_SERVICES=true`

### 6. Firebase Cloud Messaging (Push Notifications)

#### `FIREBASE_PROJECT_ID`
**Mô tả:** Firebase project ID cho push notifications  
**Ví dụ giá trị:**
```
zentry-hr-system
```
**Cách lấy:**
```
1. Firebase Console: https://console.firebase.google.com/
2. Chọn project hoặc tạo mới
3. Project settings (icon bánh răng)
4. General tab → Project ID
```
**📋 Copy value này (hoặc để mock):**
```
zentry-hr-graduation-project
```

---

#### `FIREBASE_PRIVATE_KEY`
**Mô tả:** Firebase service account private key  
**⚠️ QUAN TRỌNG:** Phải giữ nguyên format với `\n`!

**Cách lấy:**
```
1. Firebase Console → Project settings
2. Service accounts tab
3. Generate new private key
4. Download JSON file
5. Mở file JSON, tìm key "private_key"
6. Copy value (bao gồm -----BEGIN và END-----)
```

**Format:**
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhki...\n...xyz==\n-----END PRIVATE KEY-----\n
```

**📋 Copy private_key từ Firebase JSON (hoặc để mock):**
```
-----BEGIN PRIVATE KEY-----\nMOCK_KEY_FOR_TESTING\n-----END PRIVATE KEY-----\n
```

---

#### `FIREBASE_CLIENT_EMAIL`
**Mô tả:** Firebase service account email  
**Ví dụ giá trị:**
```
firebase-adminsdk-xxxxx@zentry-hr-system.iam.gserviceaccount.com
```
**Cách lấy:** Từ file JSON giống như private_key, tìm key "client_email"  
**📋 Copy value này (hoặc để mock):**
```
firebase-adminsdk-mock@zentry-hr-graduation.iam.gserviceaccount.com
```

---

### 7. SMTP Email Service

#### `SMTP_HOST`
**Mô tả:** SMTP server hostname để gửi email  
**Common values:**
- Gmail: `smtp.gmail.com`
- Outlook: `smtp-mail.outlook.com`
- Yahoo: `smtp.mail.yahoo.com`

**📋 Copy value này (nếu dùng Gmail):**
```
smtp.gmail.com
```

---

#### `SMTP_PORT`
**Mô tả:** SMTP server port  
**Common ports:**
- `587` - TLS (recommended)
- `465` - SSL
- `25` - Unencrypted (không recommend)

**📋 Copy value này:**
```
587
```

---

#### `SMTP_USER`
**Mô tả:** Email address dùng để gửi email  
**Ví dụ giá trị:**
```
your-email@gmail.com
```
**📋 Copy email của bạn:**
```
YOUR_EMAIL_HERE@gmail.com
```

---

#### `SMTP_PASSWORD`
**Mô tả:** Password hoặc App Password cho email  

**⚠️ Với Gmail: PHẢI dùng App Password, không phải password thường!**

**Cách tạo Gmail App Password:**
```
1. Vào: https://myaccount.google.com/security
2. Enable 2-Step Verification (nếu chưa có)
3. Tìm "App passwords"
4. Select app: Mail
5. Select device: Other (nhập "Zentry HR System")
6. Generate
7. Copy 16-ký tự password (vd: abcd efgh ijkl mnop)
```

**Format:**
```
abcdefghijklmnop
```

**📋 Copy App Password của bạn (16 ký tự, không có spaces):**
```
YOUR_GMAIL_APP_PASSWORD
```

---

### 8. Twilio SMS Service

#### `TWILIO_ACCOUNT_SID`
**Mô tả:** Twilio account identifier  
**Ví dụ giá trị:**
```
ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
**Cách lấy:**
```
1. Đăng ký: https://www.twilio.com/try-twilio
2. Console Dashboard: https://console.twilio.com/
3. Account Info → Account SID
```
**📋 Copy value này (hoặc để mock):**
```
ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

#### `TWILIO_AUTH_TOKEN`
**Mô tả:** Twilio authentication token  
**Ví dụ giá trị:**
```
your_auth_token_here
```
**Cách lấy:** Từ Twilio Console Dashboard, bên cạnh Account SID  
**📋 Copy value này (hoặc để mock):**
```
MOCK_TWILIO_AUTH_TOKEN
```

---

#### `TWILIO_PHONE_NUMBER`
**Mô tả:** Twilio phone number để gửi SMS  
**Format:** `+1234567890` (phải có dấu +)  
**Ví dụ giá trị:**
```
+14155551234
```
**Cách lấy:**
```
1. Twilio Console → Phone Numbers → Manage Numbers
2. Copy số phone (Trial account có thể có free number)
```
**📋 Copy value này (hoặc để mock):**
```
+1234567890
```

---

## 📊 SUMMARY TABLE - Tất cả Secrets

| Secret Name | Category | Required? | Example Value |
|-------------|----------|-----------|---------------|
| `POSTGRES_PASSWORD` | Infrastructure | ✅ Required | `Zentry@Postgres#2024!Strong` |
| `MONGODB_USERNAME` | Infrastructure | ✅ Required | `admin` |
| `MONGODB_PASSWORD` | Infrastructure | ✅ Required | `Zentry@MongoDB#2024!Strong` |
| `RABBITMQ_USERNAME` | Infrastructure | ✅ Required | `admin` |
| `RABBITMQ_PASSWORD` | Infrastructure | ✅ Required | `Zentry@RabbitMQ#2024!Strong` |
| `REDIS_PASSWORD` | Infrastructure | ✅ Required | `Zentry@Redis#2024!Strong` |
| `JWT_SECRET` | Security | ✅ Required | `Zentry-HR-JWT-Secret-Key-2024-Super-Strong-Min-32-Chars` |
| `EC2_HOST` | AWS | ✅ Required | `3.123.45.67` |
| `EC2_USER` | AWS | ✅ Required | `ubuntu` |
| `EC2_SSH_PRIVATE_KEY` | AWS | ✅ Required | `-----BEGIN RSA PRIVATE KEY-----\n...` |
| `AWS_ACCESS_KEY_ID` | AWS | ✅ Required | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS | ✅ Required | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLE` |
| `AWS_REGION` | AWS | ✅ Required | `ap-southeast-1` |
| `GHCR_TOKEN` | GitHub | ✅ Required | `ghp_xxxxxxxxxxxxxxxxxxxx` |
| `FIREBASE_PROJECT_ID` | Notification | ⭕ Optional | `zentry-hr-graduation-project` |
| `FIREBASE_PRIVATE_KEY` | Notification | ⭕ Optional | `-----BEGIN PRIVATE KEY-----\n...` |
| `FIREBASE_CLIENT_EMAIL` | Notification | ⭕ Optional | `firebase-adminsdk@project.iam.gserviceaccount.com` |
| `SMTP_HOST` | Notification | ⭕ Optional | `smtp.gmail.com` |
| `SMTP_PORT` | Notification | ⭕ Optional | `587` |
| `SMTP_USER` | Notification | ⭕ Optional | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Notification | ⭕ Optional | `abcdefghijklmnop` |
| `TWILIO_ACCOUNT_SID` | Notification | ⭕ Optional | `ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| `TWILIO_AUTH_TOKEN` | Notification | ⭕ Optional | `your_auth_token` |
| `TWILIO_PHONE_NUMBER` | Notification | ⭕ Optional | `+1234567890` |

**Total:** 24 secrets (14 required, 10 optional)

---

## ✅ QUICK SETUP CHECKLIST

### Step 1: Required Secrets (14 secrets)

```bash
# Infrastructure (6 secrets)
□ POSTGRES_PASSWORD
□ MONGODB_USERNAME
□ MONGODB_PASSWORD
□ RABBITMQ_USERNAME
□ RABBITMQ_PASSWORD
□ REDIS_PASSWORD

# Security (1 secret)
□ JWT_SECRET

# AWS Connection (4 secrets)
□ EC2_HOST
□ EC2_USER
□ EC2_SSH_PRIVATE_KEY
□ AWS_REGION

# AWS Credentials (2 secrets)
□ AWS_ACCESS_KEY_ID
□ AWS_SECRET_ACCESS_KEY

# GitHub (1 secret)
□ GHCR_TOKEN
```

### Step 2: Optional Secrets (10 secrets) - Skip if not using

```bash
# Firebase (3 secrets)
□ FIREBASE_PROJECT_ID
□ FIREBASE_PRIVATE_KEY
□ FIREBASE_CLIENT_EMAIL

# SMTP (4 secrets)
□ SMTP_HOST
□ SMTP_PORT
□ SMTP_USER
□ SMTP_PASSWORD

# Twilio (3 secrets)
□ TWILIO_ACCOUNT_SID
□ TWILIO_AUTH_TOKEN
□ TWILIO_PHONE_NUMBER
```

---

## 🎯 PRODUCTION-READY VALUES (COPY & PASTE)

> **⚠️ CHÚ Ý:** Đây là ví dụ values cho môi trường PRODUCTION. Bạn NÊN thay đổi để bảo mật hơn!

### Infrastructure Passwords

```bash
POSTGRES_PASSWORD=Zentry@Postgres#2024!Strong
MONGODB_USERNAME=admin
MONGODB_PASSWORD=Zentry@MongoDB#2024!Strong
RABBITMQ_USERNAME=admin
RABBITMQ_PASSWORD=Zentry@RabbitMQ#2024!Strong
REDIS_PASSWORD=Zentry@Redis#2024!Strong
JWT_SECRET=Zentry-HR-JWT-Secret-Key-2024-Super-Strong-Min-32-Chars-Graduate-Project-System
```

### AWS Configuration

```bash
EC2_USER=ubuntu
AWS_REGION=ap-southeast-1

# THAY ĐỔI các giá trị này:
EC2_HOST=YOUR_EC2_PUBLIC_IP
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
EC2_SSH_PRIVATE_KEY=YOUR_PEM_FILE_CONTENT
GHCR_TOKEN=YOUR_GITHUB_PERSONAL_ACCESS_TOKEN
```

### Optional - Mock Values (nếu không dùng thật)

```bash
FIREBASE_PROJECT_ID=zentry-hr-mock
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-mock@zentry.iam.gserviceaccount.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@zentry.local
SMTP_PASSWORD=mock-password
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=mock-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🔍 Verification

### Check if all required secrets are set:

```bash
# Vào GitHub Repository Settings
Settings → Secrets and variables → Actions → Repository secrets

# Phải thấy ít nhất 14 secrets:
✅ POSTGRES_PASSWORD
✅ MONGODB_USERNAME
✅ MONGODB_PASSWORD
✅ RABBITMQ_USERNAME
✅ RABBITMQ_PASSWORD
✅ REDIS_PASSWORD
✅ JWT_SECRET
✅ EC2_HOST
✅ EC2_USER
✅ EC2_SSH_PRIVATE_KEY
✅ AWS_ACCESS_KEY_ID
✅ AWS_SECRET_ACCESS_KEY
✅ AWS_REGION
✅ GHCR_TOKEN
```

### Test Secrets on EC2:

```bash
# SSH to EC2
ssh -i "your-key.pem" ubuntu@YOUR_EC2_IP

# Test if secrets work
cd /home/ubuntu/GRADUATE_PROJECT/scripts
export POSTGRES_PASSWORD='Zentry@Postgres#2024!Strong'
export MONGODB_PASSWORD='Zentry@MongoDB#2024!Strong'
# ... export all other secrets

./generate-secrets.sh
# Should generate without errors
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
