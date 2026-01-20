# 🚀 Frontend Deployment Guide

## 📋 Tổng quan

Hướng dẫn deploy Frontend cho dự án Graduate Project:
- **Next.js Web App** → Vercel Hosting (Recommended - có SSL + custom domain miễn phí)
- **Flutter Mobile App** → APK Direct Download (vì chưa có tài khoản CH Play)

---

## 1️⃣ Deploy Next.js Web App lên Vercel (Recommended)

### **Tại sao chọn Vercel?**
- ✅ **Miễn phí** cho personal projects
- ✅ **Auto SSL** (HTTPS) không cần setup
- ✅ **Custom Domain** miễn phí (graduate-project.com)
- ✅ **Auto Deploy** từ GitHub (CI/CD tự động)
- ✅ **Global CDN** (nhanh toàn cầu)
- ✅ **Zero Config** cho Next.js

### **Prerequisites**
```powershell
- GitHub repository: kientvhe172514/GRADUATE_PROJECT
- Vercel account (free): https://vercel.com/signup
- Domain name (optional): graduate-project.com
```

---

### **Step 1: Chuẩn bị Source Code**

#### 1.1. Tạo file cấu hình Vercel

**`clients/nextjs_web/vercel.json`**
```json
{
  "version": 2,
  "buildCommand": "pnpm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_WS_URL": "@ws_url"
  },
  "regions": ["sin1"],
  "github": {
    "enabled": true,
    "autoAlias": true
  }
}
```

#### 1.2. Environment Variables Template

**`clients/nextjs_web/.env.example`**
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://3.27.15.166:32527/api
NEXT_PUBLIC_WS_URL=ws://3.27.15.166:32527

# Service Endpoints
NEXT_PUBLIC_AUTH_SERVICE=/v1/auth
NEXT_PUBLIC_ATTENDANCE_SERVICE=/v1/attendance
NEXT_PUBLIC_EMPLOYEE_SERVICE=/v1/employees
NEXT_PUBLIC_LEAVE_SERVICE=/v1/leaves
NEXT_PUBLIC_REPORTING_SERVICE=/v1/reports

# App Configuration
NEXT_PUBLIC_APP_NAME=Graduate Project
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### 1.3. Push code lên GitHub

```powershell
git add clients/nextjs_web
git commit -m "feat: setup Next.js for Vercel deployment"
git push origin main
```

---

### **Step 2: Deploy lên Vercel**

#### 2.1. Import Project từ GitHub

1. Truy cập https://vercel.com
2. Click **"Add New Project"**
3. Import repository: `kientvhe172514/GRADUATE_PROJECT`
4. **Root Directory:** `clients/nextjs_web`
5. **Framework Preset:** Next.js (auto-detected)
6. **Build Command:** `pnpm run build` (auto)
7. **Output Directory:** `.next` (auto)
8. Click **"Deploy"**

⏱️ **Deploy lần đầu:** ~2-3 phút

#### 2.2. Setup Environment Variables

Vercel Dashboard → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=http://3.27.15.166:32527/api
NEXT_PUBLIC_WS_URL=ws://3.27.15.166:32527
NEXT_PUBLIC_APP_NAME=Graduate Project
```

Click **"Save"** → **"Redeploy"**

---

### **Step 3: Custom Domain (Trỏ tên miền)**

#### 3.1. Add Domain vào Vercel

Vercel Dashboard → Project → Settings → Domains:

1. Click **"Add Domain"**
2. Nhập: `graduate-project.com`
3. Click **"Add"**

Vercel sẽ cho 2 options:

#### 3.2. Configure DNS (Chọn 1 trong 2)

**Option A - CNAME (Recommended, giữ DNS provider hiện tại):**

Vào DNS Provider (GoDaddy, Namecheap, Cloudflare...):

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: Auto

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

**Option B - Nameservers (Vercel quản lý DNS toàn bộ):**

Đổi nameservers của domain về:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

#### 3.3. Wait for DNS Propagation

- ⏱️ **Thời gian:** 5 phút - 48 giờ (thường 15-30 phút)
- ✅ **SSL:** Vercel tự động tạo HTTPS certificate (Let's Encrypt)
- 🔒 **Result:** `https://graduate-project.com` với SSL xanh

**Check DNS:**
```powershell
# Windows
nslookup graduate-project.com

# Linux/Mac
dig graduate-project.com
```

---

### **Step 4: Auto Deploy với GitHub Actions (Optional)**

Vercel đã tự động deploy khi push code, nhưng nếu muốn custom workflow:

**`.github/workflows/deploy-vercel.yml`**
```yaml
name: 🚀 Deploy to Vercel

on:
  push:
    branches: [main]
    paths:
      - 'clients/nextjs_web/**'
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./clients/nextjs_web
```

**GitHub Secrets:**
- `VERCEL_TOKEN`: Vercel → Settings → Tokens → Create
- `VERCEL_ORG_ID`: Check file `.vercel/project.json`
- `VERCEL_PROJECT_ID`: Check file `.vercel/project.json`

---

### **Step 5: Verify Deployment**

```powershell
# Test Vercel URL
curl https://your-project.vercel.app

# Test custom domain
curl https://graduate-project.com

# Check SSL
curl -I https://graduate-project.com
# Should see: HTTP/2 200
```

**Access URLs:**
- 🌐 Vercel URL: `https://graduate-project-xxx.vercel.app`
- 🌐 Custom Domain: `https://graduate-project.com`
- 📊 Analytics: Vercel Dashboard → Project → Analytics

---

## 2️⃣ Deploy Next.js lên VPS (Alternative - nếu muốn tự host)

### **Prerequisites**
```powershell
# VPS Requirements:
- Ubuntu 22.04 LTS
- 2GB RAM minimum
- Node.js 20.x
- Nginx
- PM2 (process manager)
- Domain name (optional)
```

### **Step 1: Chuẩn bị VPS Server**

#### 1.1. SSH vào VPS
```bash
ssh user@your-vps-ip
# Example: ssh ubuntu@3.27.15.166
```

#### 1.2. Install Node.js & pnpm
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Verify
node --version  # v20.x
pnpm --version  # 9.x
```

#### 1.3. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2

# Setup PM2 startup
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

#### 1.4. Install Nginx
```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

### **Step 2: Deploy Next.js Application**

#### 2.1. Clone source code
```bash
cd /home/ubuntu
git clone https://github.com/kientvhe172514/GRADUATE_PROJECT.git
cd GRADUATE_PROJECT/clients/nextjs_web
```

#### 2.2. Setup Environment Variables
```bash
# Create .env.production
cat > .env.production << EOF
# API Configuration
NEXT_PUBLIC_API_URL=http://3.27.15.166:32527/api
NEXT_PUBLIC_WS_URL=ws://3.27.15.166:32527

# Service Endpoints
NEXT_PUBLIC_AUTH_SERVICE=/v1/auth
NEXT_PUBLIC_ATTENDANCE_SERVICE=/v1/attendance
NEXT_PUBLIC_EMPLOYEE_SERVICE=/v1/employees
NEXT_PUBLIC_LEAVE_SERVICE=/v1/leaves
NEXT_PUBLIC_REPORTING_SERVICE=/v1/reports

# App Configuration
NEXT_PUBLIC_APP_NAME=Graduate Project
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
PORT=3000
EOF
```

#### 2.3. Build & Start Application
```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build for production
pnpm run build

# Start with PM2
pm2 start pnpm --name "nextjs-web" -- start
pm2 save
pm2 list
```

---

### **Step 3: Configure Nginx Reverse Proxy**

#### 3.1. Create Nginx config

**Không có tên miền (chỉ dùng IP):**
```bash
sudo nano /etc/nginx/sites-available/nextjs-web
```

Paste config:
```nginx
server {
    listen 80;
    server_name 3.27.15.166;  # Your VPS IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Có tên miền (VD: graduate-project.com):**
```bash
sudo nano /etc/nginx/sites-available/nextjs-web
```

Paste config:
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name graduate-project.com www.graduate-project.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name graduate-project.com www.graduate-project.com;

    # SSL Certificate (sẽ setup ở bước sau)
    ssl_certificate /etc/letsencrypt/live/graduate-project.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/graduate-project.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### 3.2. Enable site & restart Nginx
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/nextjs-web /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

### **Step 4: Setup SSL Certificate (nếu có tên miền)**

#### 4.1. Trỏ tên miền về VPS

Vào DNS Provider (GoDaddy, Cloudflare, etc.):
```
Type: A Record
Name: @
Value: <VPS-IP>
TTL: Automatic

Type: A Record  
Name: www
Value: <VPS-IP>
TTL: Automatic
```

#### 4.2. Install Certbot & Get SSL Certificate
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d graduate-project.com -d www.graduate-project.com

# Auto-renewal test
sudo certbot renew --dry-run
```

**Certbot sẽ tự động:**
- Tạo SSL certificate
- Update Nginx config
- Setup auto-renewal

---

### **Step 5: Setup GitHub Actions Auto-Deploy**

**`.github/workflows/deploy-nextjs-vps.yml`**
```yaml
name: 🚀 Deploy Next.js to VPS

on:
  push:
    branches: [main, develop]
    paths:
      - 'clients/nextjs_web/**'
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to VPS via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/ubuntu/GRADUATE_PROJECT
            git pull origin main
            cd clients/nextjs_web
            pnpm install --frozen-lockfile
            pnpm run build
            pm2 restart nextjs-web
            pm2 save

      - name: Check deployment status
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            pm2 list
            pm2 logs nextjs-web --lines 50
```

**GitHub Secrets cần thêm:**
```
VPS_HOST=3.27.15.166
VPS_USER=ubuntu
VPS_SSH_KEY=<private-ssh-key-content>
```

---

### **Step 6: Monitoring & Maintenance**

```bash
# View PM2 logs
pm2 logs nextjs-web
pm2 logs nextjs-web --lines 100

# Restart app
pm2 restart nextjs-web

# Stop app
pm2 stop nextjs-web

# Monitor resources
pm2 monit

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check app status
curl http://localhost:3000
curl http://your-domain.com
```

---

## 2️⃣ Deploy Next.js lên Vercel (Alternative)

### **Prerequisites**
```powershell
- GitHub repository với code Next.js
- Vercel account (free tier OK)
```

### **Step 1: Tạo file cấu hình Vercel

**`clients/nextjs_web/vercel.json`**
```json
{
  "version": 2,
  "buildCommand": "pnpm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_WS_URL": "@ws_url"
  },
  "regions": ["sin1"],
  "github": {
    "enabled": true,
    "autoAlias": true
  }
}
```

#### 1.3. Environment Variables

**`clients/nextjs_web/.env.example`**
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://3.27.15.166:32527/api
NEXT_PUBLIC_WS_URL=ws://3.27.15.166:32527

# Service Endpoints
NEXT_PUBLIC_AUTH_SERVICE=/v1/auth
NEXT_PUBLIC_ATTENDANCE_SERVICE=/v1/attendance
NEXT_PUBLIC_EMPLOYEE_SERVICE=/v1/employees
NEXT_PUBLIC_LEAVE_SERVICE=/v1/leaves
NEXT_PUBLIC_REPORTING_SERVICE=/v1/reports

# App Configuration
NEXT_PUBLIC_APP_NAME=Graduate Project
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### 1.2. Push code lên GitHub

```powershell
git add clients/nextjs_web
git commit -m "feat: setup Next.js web app for Vercel deployment"
git push origin main
```

---

### **Step 2: Deploy trên Vercel**

#### 2.1. Tạo Vercel Project
```yaml
name: 🚀 Deploy Next.js to Vercel

on:
  push:
    branches: [main, develop]
    paths:
      - 'clients/nextjs_web/**'
  pull_request:
    branches: [main]
  workflow_dispatch:

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: clients/nextjs_web/pnpm-lock.yaml

      - name: Install dependencies
        working-directory: clients/nextjs_web
        run: pnpm install --frozen-lockfile

      - name: Build project
        working-directory: clients/nextjs_web
        run: pnpm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        working-directory: clients/nextjs_web
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        working-directory: clients/nextjs_web
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        working-directory: clients/nextjs_web
        run: |
          vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }} > deployment-url.txt
          echo "DEPLOYMENT_URL=$(cat deployment-url.txt)" >> $GITHUB_ENV

      - name: Comment Deployment URL
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Deployed to Vercel: ${{ env.DEPLOYMENT_URL }}'
            })
```

1. Truy cập https://vercel.com
2. Click **"Add New Project"**
3. Import GitHub repository: `kientvhe172514/GRADUATE_PROJECT`
4. **Root Directory:** `clients/nextjs_web`
5. **Framework Preset:** Next.js
6. **Build Command:** `pnpm run build`
7. **Output Directory:** `.next`
8. Click **"Deploy"**

#### 2.2. Setup Environment Variables trên Vercel

Vercel Dashboard → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=http://3.27.15.166:32527/api
NEXT_PUBLIC_WS_URL=ws://3.27.15.166:32527
NEXT_PUBLIC_APP_NAME=Graduate Project
```

---

### **Step 3: Custom Domain trên Vercel (CÓ THỂ TRỎ TÊN MIỀN!)**

#### 3.1. Add Domain vào Vercel

Vercel Dashboard → Project → Settings → Domains:

1. Click **"Add Domain"**
2. Nhập tên miền: `graduate-project.com`
3. Click **"Add"**

#### 3.2. Configure DNS Records

Vercel sẽ show hướng dẫn, thường là:

**Option A - Nameservers (Recommended):**
```
Nameserver 1: ns1.vercel-dns.com
Nameserver 2: ns2.vercel-dns.com
```

**Option B - A Records:**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Automatic

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Automatic
```

#### 3.3. SSL Certificate

Vercel **tự động** tạo SSL certificate (Let's Encrypt) khi domain được verify. Không cần setup thủ công!

**Kết quả:**
- ✅ `graduate-project.com` → HTTPS enabled
- ✅ `www.graduate-project.com` → HTTPS enabled
- ✅ Auto SSL renewal

---

### **Step 4: Verify Deployment**

```bash
# Test Vercel deployment
curl https://graduate-project.vercel.app
curl https://graduate-project.com  # Custom domain

# Test VPS deployment
curl http://3.27.15.166
curl https://graduate-project.com  # Custom domain
```

---

## 3️⃣ Deploy Flutter Mobile App (APK Direct Download)

### **Tại sao không lên CH Play/App Store?**
- ❌ **Chưa có tài khoản Google Play Console** ($25 one-time fee)
- ❌ **Chưa có Apple Developer Account** ($99/year)
- ❌ **Review process lâu** (3-7 days)
- ✅ **Alternative:** Deploy APK để download trực tiếp (faster, free)

---

### **Step 1: Build APK Release**

```powershell
cd clients/flutter_app/app-fe-v2

# Clean build
flutter clean
flutter pub get

# Build release APK
flutter build apk --release --split-per-abi

# Output:
# build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk  (ARM 32-bit)
# build/app/outputs/flutter-apk/app-arm64-v8a-release.apk    (ARM 64-bit) ← Most common
# build/app/outputs/flutter-apk/app-x86_64-release.apk       (x86 64-bit)
```

**Recommended:** Dùng `app-arm64-v8a-release.apk` (nhẹ hơn, hỗ trợ hầu hết thiết bị mới)

---

### **Step 2: Setup Code Signing (Optional nhưng nên có)**

#### 2.1. Generate Keystore

```powershell
cd clients/flutter_app/app-fe-v2/android

keytool -genkey -v -keystore graduate-project-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias graduate-project
```

**Nhập thông tin:**
- Password: `[Your-Password]`
- Name: `Graduate Project`
- Organization: `Graduate Project`
- Country: `VN`

#### 2.2. Configure Signing

**`android/key.properties`** (tạo mới):
```properties
storePassword=your-password-here
keyPassword=your-password-here
keyAlias=graduate-project
storeFile=graduate-project-key.jks
```

**`android/app/build.gradle`** (sửa):
```gradle
// Add before android block
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...
    
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

#### 2.3. Rebuild APK

```powershell
flutter build apk --release --split-per-abi
```

---

### **Step 3: Deploy APK (3 Options)**

#### **Option A - Upload lên GitHub Releases (Recommended)**

```powershell
# Tag version
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Upload APK manually:
# 1. Go to: https://github.com/kientvhe172514/GRADUATE_PROJECT/releases
# 2. Click "Draft a new release"
# 3. Choose tag: v1.0.0
# 4. Upload: app-arm64-v8a-release.apk
# 5. Add release notes
# 6. Publish release
```

**Download URL:** 
```
https://github.com/kientvhe172514/GRADUATE_PROJECT/releases/download/v1.0.0/app-arm64-v8a-release.apk
```

#### **Option B - Host trên Web Server riêng**

```bash
# Upload APK lên VPS
scp build/app/outputs/flutter-apk/app-arm64-v8a-release.apk user@vps:/var/www/html/downloads/

# Nginx config for downloads
server {
    listen 80;
    server_name downloads.graduate-project.com;
    
    location /apk {
        alias /var/www/html/downloads;
        autoindex on;
        add_header Content-Disposition 'attachment';
    }
}

# Access: http://downloads.graduate-project.com/apk/app-arm64-v8a-release.apk
```

#### **Option C - Dùng Firebase App Distribution**

```powershell
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy APK
firebase appdistribution:distribute \
  build/app/outputs/flutter-apk/app-arm64-v8a-release.apk \
  --app [FIREBASE_APP_ID] \
  --groups "testers"
```

---

### **Step 4: Tạo Landing Page cho Download**

**`clients/nextjs_web/app/download/page.tsx`**
```tsx
export default function DownloadPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Download App</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
        <img src="/app-icon.png" alt="App Icon" className="w-24 h-24 mx-auto mb-4" />
        
        <h2 className="text-2xl font-bold text-center mb-2">
          Graduate Project Mobile
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Version 1.0.0 (Build 1)
        </p>
        
        <a 
          href="https://github.com/kientvhe172514/GRADUATE_PROJECT/releases/download/v1.0.0/app-arm64-v8a-release.apk"
          className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700"
          download
        >
          📥 Download APK (ARM64)
        </a>
        
        <div className="mt-6 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Installation Guide:</h3>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Download APK file</li>
            <li>Open downloaded file</li>
            <li>Allow "Install from Unknown Sources" if prompted</li>
            <li>Tap "Install"</li>
          </ol>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Security:</strong> This APK is signed with our release key. 
            Only download from official sources.
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Access:** `https://graduate-project.com/download`

---

### **Step 5: QR Code for Easy Download**

Tạo QR code trỏ tới download link:

```powershell
# Online tools:
# - https://www.qr-code-generator.com/
# - https://qrcode.tec-it.com/

# Input URL:
https://graduate-project.com/download

# Download QR code PNG → print/share
```

---

### **Future: Lên CH Play/App Store (khi có budget)**

#### **Google Play Store:**
1. Tạo tài khoản: https://play.google.com/console ($25 one-time)
2. Upload AAB: `flutter build appbundle --release`
3. Fill metadata, screenshots, privacy policy
4. Submit for review (~2-3 days)

#### **Apple App Store:**
1. Tạo tài khoản: https://developer.apple.com ($99/year)
2. Build IPA: `flutter build ipa --release`
3. Upload via Xcode/Transporter
4. Submit for review (~3-7 days)

**Estimated Total Cost:**
- Google Play: $25 (lifetime)
- Apple App Store: $99/year
- Both: $124 first year, $99/year after

---

## 4️⃣ GitHub Actions Auto Build APK

**`.github/workflows/build-flutter-apk.yml`**
```yaml
name: 🤖 Build Flutter APK

on:
  push:
    branches: [main]
    paths:
      - 'clients/flutter_app/app-fe-v2/**'
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-apk:
    name: Build Release APK
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.24.x'
          channel: 'stable'

      - name: Install dependencies
        working-directory: clients/flutter_app/app-fe-v2
        run: flutter pub get

      - name: Build APK (split per ABI)
        working-directory: clients/flutter_app/app-fe-v2
        run: flutter build apk --release --split-per-abi

      - name: Upload ARM64 APK
        uses: actions/upload-artifact@v4
        with:
          name: app-arm64-v8a-release
          path: clients/flutter_app/app-fe-v2/build/app/outputs/flutter-apk/app-arm64-v8a-release.apk

      - name: Upload ARMv7 APK
        uses: actions/upload-artifact@v4
        with:
          name: app-armeabi-v7a-release
          path: clients/flutter_app/app-fe-v2/build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk

      - name: Create Release (on tag push)
        if: startsWith(github.ref, 'refs/tags/')
        uses: softprops/action-gh-release@v1
        with:
          files: |
            clients/flutter_app/app-fe-v2/build/app/outputs/flutter-apk/app-arm64-v8a-release.apk
            clients/flutter_app/app-fe-v2/build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk
          body: |
            ## 📱 Graduate Project Mobile App
            
            ### Download:
            - **ARM64 (Recommended):** app-arm64-v8a-release.apk
            - **ARMv7 (Older devices):** app-armeabi-v7a-release.apk
            
            ### Installation:
            1. Download APK
            2. Enable "Install from Unknown Sources"
            3. Install APK
            
            ### Changes:
            See commits for details.
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Trigger build:**
```powershell
# Auto build on push
git push origin main

# Create release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

---

## 5️⃣ Monitoring & Analytics

### **Vercel Analytics (Built-in)**

Vercel Dashboard → Project → Analytics:

- 📊 **Real-time Visitors**
- 📈 **Page Views & Unique Visitors**
- ⚡ **Core Web Vitals** (LCP, FID, CLS)
- 🌍 **Geographic Distribution**
- 🔗 **Top Pages & Referrers**
- ⚠️ **Error Tracking**

**Enable Web Vitals:**
```tsx
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### **APK Download Tracking**

Track APK downloads với Google Analytics:

```tsx
// app/download/page.tsx
'use client';

const handleDownload = () => {
  // Track download event
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'download', {
      event_category: 'APK',
      event_label: 'app-arm64-v8a-release.apk',
      value: 1
    });
  }
};

<a onClick={handleDownload} href="...">Download APK</a>
```

### **Rollback Deployment**

```powershell
# Vercel Dashboard → Project → Deployments → [Old Deployment] → "Promote to Production"

# Or via CLI
vercel rollback <deployment-url>
```

---

## 6️⃣ Troubleshooting

| Issue | Solution |
|-------|----------|
| **Vercel: Build failed** | Check build logs in Dashboard, verify `package.json` scripts and dependencies |
| **Vercel: Environment variables not working** | Redeploy after adding env vars. Check variable names start with `NEXT_PUBLIC_` |
| **Custom domain not working** | Wait 15-30 min for DNS propagation. Use `nslookup domain.com` to check |
| **Custom domain: DNS_PROBE_FINISHED_NXDOMAIN** | DNS not propagated yet. Wait longer or check DNS settings |
| **SSL certificate not working** | Vercel auto-creates SSL. If failed, check domain verification |
| **404 on routes** | Check `next.config.js`, verify routes exist in `app/` directory |
| **API calls failing (CORS)** | Backend must allow `https://graduate-project.com` in CORS origins |
| **Flutter: Build failed** | Run `flutter clean && flutter pub get && flutter doctor` |
| **APK: Installation blocked** | Enable "Install from Unknown Sources" in Android settings |
| **APK: App not compatible** | Download correct ABI version. ARM64 works for most devices |

---

## 7️⃣ Best Practices

### **Next.js on Vercel**
- ✅ Use `NEXT_PUBLIC_` prefix for client-side env vars
- ✅ Enable Vercel Analytics & Speed Insights
- ✅ Optimize images with `next/image` (auto WebP conversion)
- ✅ Use `next/link` for client-side navigation (faster)
- ✅ Enable ISR for dynamic content: `revalidate: 60`
- ✅ Add `robots.txt` and `sitemap.xml` for SEO

### **Flutter APK Distribution**
- ✅ **Sign APK** with release keystore (security)
- ✅ **Split per ABI** to reduce file size (50% smaller)
- ✅ **Version properly** (update `pubspec.yaml` version)
- ✅ **Test on multiple devices** before releasing
- ✅ **Provide clear installation instructions**
- ✅ **Create download landing page** with QR code
- ✅ **Use GitHub Releases** for version tracking

---

## 📚 Resources

### **Documentation**
- **Vercel Docs:** https://vercel.com/docs
- **Vercel Custom Domains:** https://vercel.com/docs/concepts/projects/domains
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Flutter Deployment:** https://docs.flutter.dev/deployment
- **GitHub Releases:** https://docs.github.com/en/repositories/releasing-projects-on-github

### **Tools**
- **DNS Checker:** https://dnschecker.org/
- **QR Code Generator:** https://www.qr-code-generator.com/
- **SSL Checker:** https://www.sslshopper.com/ssl-checker.html

---

## 🎯 Quick Commands

### **Vercel Deployment**
```powershell
# Deploy to Vercel (first time)
cd clients/nextjs_web
npm install -g vercel
vercel

# Deploy to production
vercel --prod

# Check deployments
vercel ls

# View logs
vercel logs

# Rollback
vercel rollback <deployment-url>
```

### **Flutter APK Build**
```powershell
# Build release APK (split per ABI)
cd clients/flutter_app/app-fe-v2
flutter clean
flutter pub get
flutter build apk --release --split-per-abi

# Output locations:
# build/app/outputs/flutter-apk/app-arm64-v8a-release.apk
# build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk
```

### **Git Release**
```powershell
# Create release tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# GitHub Actions will auto-build and create release
```

### **DNS Check**
```powershell
# Check DNS propagation
nslookup graduate-project.com

# Check with specific DNS server
nslookup graduate-project.com 8.8.8.8

# Full dig (Linux/Mac)
dig graduate-project.com +short
```

---

**Last Updated:** December 12, 2025  
**Version:** 1.0.0  
**Maintainer:** kientvhe172514
