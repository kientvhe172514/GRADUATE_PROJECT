# System Architecture Diagram (Mermaid)

High-level system architecture với icons đẹp hơn PlantUML.

> **Cách xem**: 
> - Trên GitHub (tự động render)
> - VS Code: Cài extension "Markdown Preview Mermaid Support"
> - Online: https://mermaid.live (copy code vào)

---

## 1. System Architecture Overview

```mermaid
graph TB
    %% ==================== ACTORS ====================
    Employee["👤<br/><b>Employee</b><br/><i>(End User)</i>"]
    Manager["👔<br/><b>Manager</b><br/><i>(Approver)</i>"]
    Admin["⚙️<br/><b>HR Admin</b><br/><i>(Administrator)</i>"]
    
    %% ==================== CLIENT LAYER ====================
    MobileApp["📱<br/><b>Mobile App</b><br/><i>(Flutter - iOS/Android)</i>"]
    WebApp["🌐<br/><b>Web Dashboard</b><br/><i>(Next.js - React)</i>"]
    
    %% ==================== BEACONS ====================
    Beacon["📡<br/><b>Bluetooth Beacons</b><br/><i>(Office Location Validator)</i>"]
    
    %% ==================== BACKEND ====================
    Backend["🖥️<br/><b>Backend Server</b><br/><i>(Microservices Architecture)</i>"]
    
    %% ==================== DATA LAYER ====================
    Database[("🗄️<br/><b>PostgreSQL</b><br/><i>(Primary Database)</i>")]
    Redis[("⚡<br/><b>Redis</b><br/><i>(Cache Layer)</i>")]
    
    %% ==================== EXTERNAL SERVICES ====================
    FCM["☁️<br/><b>Firebase</b><br/><i>(Push Notifications)</i>"]
    Email["📧<br/><b>Email Service</b><br/><i>(SMTP Server)</i>"]
    
    %% ==================== CONNECTIONS ====================
    Employee -->|Login, Check-in<br/>Submit leave| MobileApp
    Manager -->|Approve leaves<br/>View reports| WebApp
    Admin -->|Manage employees<br/>System config| WebApp
    
    MobileApp -.->|Scan beacon<br/>(Bluetooth)| Beacon
    
    MobileApp -->|HTTPS/REST API| Backend
    WebApp -->|HTTPS/REST API| Backend
    
    Backend -->|Read/Write data| Database
    Backend -->|Cache & Sessions| Redis
    
    Backend -->|Push notifications| FCM
    Backend -->|Email notifications| Email
    
    %% ==================== STYLING ====================
    classDef userClass fill:#FFB300,stroke:#FF8F00,stroke-width:3px,color:#000
    classDef clientClass fill:#FDD835,stroke:#F9A825,stroke-width:3px,color:#000
    classDef beaconClass fill:#29B6F6,stroke:#0288D1,stroke-width:3px,color:#000
    classDef backendClass fill:#5C6BC0,stroke:#3949AB,stroke-width:3px,color:#fff
    classDef dbClass fill:#4CAF50,stroke:#388E3C,stroke-width:3px,color:#fff
    classDef cacheClass fill:#EF5350,stroke:#D32F2F,stroke-width:3px,color:#fff
    classDef externalClass fill:#FF7043,stroke:#E64A19,stroke-width:3px,color:#fff
    
    class Employee,Manager,Admin userClass
    class MobileApp,WebApp clientClass
    class Beacon beaconClass
    class Backend backendClass
    class Database dbClass
    class Redis cacheClass
    class FCM,Email externalClass
```

---

## 2. Authentication & Check-in Flow

```mermaid
sequenceDiagram
    actor 👤 Employee
    participant 📱 Mobile App
    participant 📡 Beacon
    participant 🖥️ Backend
    participant 🗄️ Database
    participant ☁️ Firebase

    %% Authentication Flow
    rect rgb(255, 243, 224)
        Note over 👤 Employee,☁️ Firebase: Authentication Flow
        👤 Employee->>📱 Mobile App: Enter credentials
        📱 Mobile App->>🖥️ Backend: POST /auth/login
        🖥️ Backend->>🗄️ Database: Validate user
        🗄️ Database-->>🖥️ Backend: User data
        🖥️ Backend->>🗄️ Database: Create device session
        🖥️ Backend-->>📱 Mobile App: JWT token + Refresh token
        🖥️ Backend->>☁️ Firebase: Register FCM token
    end

    %% Check-in Flow
    rect rgb(224, 242, 255)
        Note over 👤 Employee,☁️ Firebase: Face Recognition Check-in Flow
        👤 Employee->>📱 Mobile App: Tap "Check-in"
        📱 Mobile App->>📡 Beacon: Scan Bluetooth beacon
        📡 Beacon-->>📱 Mobile App: Beacon ID (UUID, Major, Minor)
        👤 Employee->>📱 Mobile App: Capture face photo
        📱 Mobile App->>🖥️ Backend: POST /attendance/check-in<br/>(face image + beacon data)
        🖥️ Backend->>🖥️ Backend: Validate beacon location
        🖥️ Backend->>🖥️ Backend: Verify face (MTCNN + FaceNet)
        🖥️ Backend->>🗄️ Database: Save attendance record
        🗄️ Database-->>🖥️ Backend: Save successful
        🖥️ Backend-->>📱 Mobile App: Check-in confirmed
        🖥️ Backend->>☁️ Firebase: Send push notification
        ☁️ Firebase-->>📱 Mobile App: "Check-in successful!"
    end
```

---

## 3. Leave Request & Approval Flow

```mermaid
sequenceDiagram
    actor 👤 Employee
    actor 👔 Manager
    participant 📱 Mobile App
    participant 🌐 Web App
    participant 🖥️ Backend
    participant 🗄️ Database
    participant ☁️ Firebase

    %% Leave Request
    rect rgb(255, 248, 225)
        Note over 👤 Employee,☁️ Firebase: Leave Request Submission
        👤 Employee->>📱 Mobile App: Fill leave request form
        📱 Mobile App->>🖥️ Backend: POST /leave/requests
        🖥️ Backend->>🗄️ Database: Check leave balance
        🗄️ Database-->>🖥️ Backend: Balance available
        🖥️ Backend->>🗄️ Database: Create leave request (PENDING)
        🗄️ Database-->>🖥️ Backend: Request saved
        🖥️ Backend-->>📱 Mobile App: Request submitted successfully
        🖥️ Backend->>☁️ Firebase: Notify manager
        ☁️ Firebase->>👔 Manager: Push: "New leave request"
    end

    %% Leave Approval
    rect rgb(232, 245, 233)
        Note over 👤 Employee,☁️ Firebase: Leave Approval
        👔 Manager->>🌐 Web App: Login to dashboard
        👔 Manager->>🌐 Web App: Review leave request
        👔 Manager->>🌐 Web App: Click "Approve"
        🌐 Web App->>🖥️ Backend: PUT /leave/requests/:id/approve
        🖥️ Backend->>🗄️ Database: Update status to APPROVED
        🖥️ Backend->>🗄️ Database: Deduct from leave balance
        🗄️ Database-->>🖥️ Backend: Update successful
        🖥️ Backend-->>🌐 Web App: Approval recorded
        🖥️ Backend->>☁️ Firebase: Notify employee
        ☁️ Firebase->>👤 Employee: Push: "Leave approved!"
    end
```

---

## 4. Deployment Architecture

```mermaid
graph LR
    subgraph "👥 Users"
        iOS["📱 iOS Device"]
        Android["📱 Android Device"]
        Browser["💻 Web Browser"]
    end
    
    subgraph "🏢 Office"
        Beacon["📡 Bluetooth<br/>Beacons"]
    end
    
    subgraph "☁️ Cloud Infrastructure"
        subgraph "Application Tier"
            Backend["🖥️ Backend Server<br/>(Docker Container)"]
        end
        
        subgraph "Data Tier"
            PostgreSQL[("🗄️ PostgreSQL<br/>Database")]
            Redis[("⚡ Redis<br/>Cache")]
        end
    end
    
    subgraph "🌐 External Services"
        FCM["☁️ Firebase<br/>Cloud Messaging"]
        SMTP["📧 Email Service<br/>(SMTP)"]
    end
    
    iOS --> Backend
    Android --> Backend
    Browser --> Backend
    
    iOS -.-> Beacon
    Android -.-> Beacon
    
    Backend --> PostgreSQL
    Backend --> Redis
    Backend --> FCM
    Backend --> SMTP
    
    style iOS fill:#FFD700,stroke:#FFA500,stroke-width:2px
    style Android fill:#FFD700,stroke:#FFA500,stroke-width:2px
    style Browser fill:#FFD700,stroke:#FFA500,stroke-width:2px
    style Beacon fill:#29B6F6,stroke:#0288D1,stroke-width:2px
    style Backend fill:#5C6BC0,stroke:#3949AB,stroke-width:2px,color:#fff
    style PostgreSQL fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#fff
    style Redis fill:#EF5350,stroke:#D32F2F,stroke-width:2px,color:#fff
    style FCM fill:#FF7043,stroke:#E64A19,stroke-width:2px,color:#fff
    style SMTP fill:#26A69A,stroke:#00796B,stroke-width:2px,color:#fff
```

---

## 5. System Layers

```mermaid
graph TB
    subgraph "Presentation Layer"
        A1["📱 Mobile App<br/>(Flutter)"]
        A2["🌐 Web Dashboard<br/>(Next.js)"]
    end
    
    subgraph "Application Layer"
        B1["🖥️ Backend Server<br/>(Microservices)"]
    end
    
    subgraph "Data Layer"
        C1[("🗄️ PostgreSQL<br/>(Primary DB)")]
        C2[("⚡ Redis<br/>(Cache)")]
    end
    
    subgraph "External Services"
        D1["☁️ Firebase<br/>(Push)"]
        D2["📧 Email<br/>(SMTP)"]
        D3["📡 Beacons<br/>(BLE)"]
    end
    
    A1 --> B1
    A2 --> B1
    B1 --> C1
    B1 --> C2
    B1 --> D1
    B1 --> D2
    A1 -.-> D3
    
    style A1 fill:#FDD835,stroke:#F9A825,stroke-width:2px
    style A2 fill:#FDD835,stroke:#F9A825,stroke-width:2px
    style B1 fill:#5C6BC0,stroke:#3949AB,stroke-width:2px,color:#fff
    style C1 fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#fff
    style C2 fill:#EF5350,stroke:#D32F2F,stroke-width:2px,color:#fff
    style D1 fill:#FF7043,stroke:#E64A19,stroke-width:2px,color:#fff
    style D2 fill:#26A69A,stroke:#00796B,stroke-width:2px,color:#fff
    style D3 fill:#29B6F6,stroke:#0288D1,stroke-width:2px
```

---

## Tổng kết

### Icons trong Mermaid:
- 👤 Employee (End User)
- 👔 Manager (Approver)
- ⚙️ HR Admin (Administrator)
- 📱 Mobile App (Flutter)
- 🌐 Web Dashboard (Next.js)
- 📡 Bluetooth Beacons
- 🖥️ Backend Server
- 🗄️ PostgreSQL Database
- ⚡ Redis Cache
- ☁️ Firebase Cloud Messaging
- 📧 Email Service
- 💻 Web Browser

### Màu sắc:
- 🟡 Yellow (#FFB300, #FDD835): Users, Client Apps
- 🔵 Blue (#29B6F6, #5C6BC0): Beacons, Backend
- 🟢 Green (#4CAF50): PostgreSQL
- 🔴 Red (#EF5350): Redis
- 🟠 Orange (#FF7043): Firebase, Email

### Ưu điểm Mermaid:
✅ Icons emoji hiển thị tốt  
✅ Syntax đơn giản hơn PlantUML  
✅ GitHub render tự động  
✅ VS Code có extension hỗ trợ  
✅ Export sang PNG/SVG dễ dàng  

### Công cụ vẽ diagram:
1. **Mermaid Live Editor**: https://mermaid.live
2. **VS Code Extension**: Markdown Preview Mermaid Support
3. **Draw.io**: Import/Export với nhiều format
4. **Lucidchart**: Professional diagramming tool
