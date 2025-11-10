# 🧪 Auth Service - Postman API Testing Guide

Complete guide for testing Auth Service APIs with request/response examples.

---

## 📋 **Table of Contents**

1. [Setup Postman Environment](#setup-postman-environment)
2. [Authentication APIs](#authentication-apis)
3. [Role Management APIs](#role-management-apis)
4. [Permission Management APIs](#permission-management-apis)
5. [Account Management APIs](#account-management-apis)
6. [Admin APIs](#admin-apis)

---

## 🔧 **Setup Postman Environment**

### Create Environment Variables

1. Open Postman → Environments → Create New Environment
2. Add variables:

```
BASE_URL = http://localhost:3001/api/v1/auth
ACCESS_TOKEN = (will be set after login)
REFRESH_TOKEN = (will be set after login)
```

### Import Collection

Create a new Postman Collection: **Auth Service APIs**

---

## 🔐 **Authentication APIs**

### 1. Login (Get Access Token)

**Endpoint:** `POST {{BASE_URL}}/login`

**Request Body:**
```json
{
  "email": "admin@zentry.com",
  "password": "Admin@123"
}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@zentry.com",
      "full_name": "",
      "role": "ADMIN"
    }
  },
  "timestamp": "2025-11-10T10:30:00.000Z",
  "path": "/api/v1/auth/login"
}
```

**Postman Test Script:**
```javascript
// Save tokens to environment
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("ACCESS_TOKEN", jsonData.data.access_token);
    pm.environment.set("REFRESH_TOKEN", jsonData.data.refresh_token);
    console.log("✅ Tokens saved to environment");
}
```

---

### 2. Get Current User Info

**Endpoint:** `GET {{BASE_URL}}/me`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Account retrieved successfully",
  "data": {
    "id": 1,
    "email": "admin@zentry.com",
    "full_name": "",
    "role": "ADMIN",
    "status": "active",
    "created_at": "2025-11-10T08:00:00.000Z",
    "updated_at": "2025-11-10T08:00:00.000Z"
  },
  "timestamp": "2025-11-10T10:35:00.000Z",
  "path": "/api/v1/auth/me"
}
```

---

### 3. Refresh Token

**Endpoint:** `POST {{BASE_URL}}/refresh`

**Request Body:**
```json
{
  "refresh_token": "{{REFRESH_TOKEN}}"
}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-11-10T10:45:00.000Z",
  "path": "/api/v1/auth/refresh"
}
```

---

### 4. Logout

**Endpoint:** `POST {{BASE_URL}}/logout`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "refresh_token": "{{REFRESH_TOKEN}}"
}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Logout successful",
  "data": {
    "message": "Logged out successfully"
  },
  "timestamp": "2025-11-10T11:00:00.000Z",
  "path": "/api/v1/auth/logout"
}
```

---

## 👥 **Role Management APIs**

> **Note:** All role management endpoints require `Authorization: Bearer {{ACCESS_TOKEN}}` header

### 1. List All Roles

**Endpoint:** `GET {{BASE_URL}}/roles?page=1&limit=10&status=active`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (active | inactive)

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Roles retrieved successfully",
  "data": {
    "roles": [
      {
        "id": 1,
        "code": "ADMIN",
        "name": "System Administrator",
        "description": "Full system access with all permissions",
        "level": 1,
        "is_system_role": true,
        "status": "active",
        "created_at": "2025-11-10T08:00:00.000Z",
        "updated_at": "2025-11-10T08:00:00.000Z"
      },
      {
        "id": 2,
        "code": "HR_MANAGER",
        "name": "HR Manager",
        "description": "Human Resources Manager - Full employee and HR management",
        "level": 2,
        "is_system_role": true,
        "status": "active",
        "created_at": "2025-11-10T08:00:00.000Z",
        "updated_at": "2025-11-10T08:00:00.000Z"
      },
      {
        "id": 3,
        "code": "DEPARTMENT_MANAGER",
        "name": "Department Manager",
        "description": "Department-level manager - Manage team members and operations",
        "level": 3,
        "is_system_role": true,
        "status": "active",
        "created_at": "2025-11-10T08:00:00.000Z",
        "updated_at": "2025-11-10T08:00:00.000Z"
      },
      {
        "id": 4,
        "code": "EMPLOYEE",
        "name": "Employee",
        "description": "Regular employee - Basic self-service access",
        "level": 4,
        "is_system_role": true,
        "status": "active",
        "created_at": "2025-11-10T08:00:00.000Z",
        "updated_at": "2025-11-10T08:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 4,
      "totalPages": 1
    }
  },
  "timestamp": "2025-11-10T11:10:00.000Z",
  "path": "/api/v1/auth/roles"
}
```

---

### 2. Get Role Details (with Permissions)

**Endpoint:** `GET {{BASE_URL}}/roles/:id`

**Example:** `GET {{BASE_URL}}/roles/2`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Role retrieved successfully",
  "data": {
    "id": 2,
    "code": "HR_MANAGER",
    "name": "HR Manager",
    "description": "Human Resources Manager - Full employee and HR management",
    "level": 2,
    "is_system_role": true,
    "status": "active",
    "created_at": "2025-11-10T08:00:00.000Z",
    "updated_at": "2025-11-10T08:00:00.000Z",
    "permissions": [
      {
        "id": 1,
        "code": "auth.login",
        "name": "Login",
        "description": "Login to system",
        "resource": "auth",
        "action": "login",
        "scope": null
      },
      {
        "id": 10,
        "code": "employee.create",
        "name": "Create Employee",
        "description": "Create new employee",
        "resource": "employee",
        "action": "create",
        "scope": null
      },
      {
        "id": 11,
        "code": "employee.read.all",
        "name": "Read All Employees",
        "description": "View all employee information",
        "resource": "employee",
        "action": "read",
        "scope": "all"
      }
      // ... more permissions
    ]
  },
  "timestamp": "2025-11-10T11:15:00.000Z",
  "path": "/api/v1/auth/roles/2"
}
```

---

### 3. Create New Role

**Endpoint:** `POST {{BASE_URL}}/roles`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "code": "TEAM_LEAD",
  "name": "Team Lead",
  "description": "Team leader with limited management permissions",
  "level": 3,
  "is_system_role": false
}
```

**Response (201 Created):**
```json
{
  "status": "SUCCESS",
  "statusCode": 201,
  "message": "Role created successfully",
  "data": {
    "id": 5,
    "code": "TEAM_LEAD",
    "name": "Team Lead",
    "description": "Team leader with limited management permissions",
    "level": 3,
    "is_system_role": false,
    "status": "active",
    "created_at": "2025-11-10T11:20:00.000Z",
    "updated_at": "2025-11-10T11:20:00.000Z",
    "created_by": 1
  },
  "errorCode": "ROLE_CREATED",
  "timestamp": "2025-11-10T11:20:00.000Z",
  "path": "/api/v1/auth/roles"
}
```

**Error Response (400 Bad Request) - Duplicate Code:**
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Role code 'TEAM_LEAD' already exists",
  "data": null,
  "errorCode": "ROLE_CODE_ALREADY_EXISTS",
  "timestamp": "2025-11-10T11:25:00.000Z",
  "path": "/api/v1/auth/roles"
}
```

**Error Response (403 Forbidden) - Higher Level:**
```json
{
  "status": "ERROR",
  "statusCode": 403,
  "message": "Cannot create role with higher privileges (level 1) than your role (level 2)",
  "data": null,
  "errorCode": "PERMISSION_DENIED",
  "timestamp": "2025-11-10T11:30:00.000Z",
  "path": "/api/v1/auth/roles"
}
```

---

### 4. Update Role

**Endpoint:** `PUT {{BASE_URL}}/roles/:id`

**Example:** `PUT {{BASE_URL}}/roles/5`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "name": "Senior Team Lead",
  "description": "Senior team leader with enhanced permissions",
  "status": "active"
}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Role updated successfully",
  "data": {
    "id": 5,
    "code": "TEAM_LEAD",
    "name": "Senior Team Lead",
    "description": "Senior team leader with enhanced permissions",
    "level": 3,
    "is_system_role": false,
    "status": "active",
    "created_at": "2025-11-10T11:20:00.000Z",
    "updated_at": "2025-11-10T11:35:00.000Z",
    "created_by": 1,
    "updated_by": 1
  },
  "errorCode": "ROLE_UPDATED",
  "timestamp": "2025-11-10T11:35:00.000Z",
  "path": "/api/v1/auth/roles/5"
}
```

**Error Response (403 Forbidden) - System Role:**
```json
{
  "status": "ERROR",
  "statusCode": 403,
  "message": "Cannot modify system role",
  "data": null,
  "errorCode": "PERMISSION_DENIED",
  "timestamp": "2025-11-10T11:40:00.000Z",
  "path": "/api/v1/auth/roles/1"
}
```

---

### 5. Delete Role

**Endpoint:** `DELETE {{BASE_URL}}/roles/:id`

**Example:** `DELETE {{BASE_URL}}/roles/5`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Role deleted successfully",
  "data": {
    "id": 5,
    "code": "TEAM_LEAD",
    "deleted": true
  },
  "errorCode": "ROLE_DELETED",
  "timestamp": "2025-11-10T11:45:00.000Z",
  "path": "/api/v1/auth/roles/5"
}
```

**Error Response (400 Bad Request) - Role In Use:**
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Cannot delete role: 5 account(s) are using this role",
  "data": null,
  "errorCode": "ROLE_IN_USE",
  "timestamp": "2025-11-10T11:50:00.000Z",
  "path": "/api/v1/auth/roles/2"
}
```

**Error Response (403 Forbidden) - System Role:**
```json
{
  "status": "ERROR",
  "statusCode": 403,
  "message": "Cannot delete system role",
  "data": null,
  "errorCode": "PERMISSION_DENIED",
  "timestamp": "2025-11-10T11:55:00.000Z",
  "path": "/api/v1/auth/roles/1"
}
```

---

### 6. Assign Permissions to Role

**Endpoint:** `POST {{BASE_URL}}/roles/:id/permissions`

**Example:** `POST {{BASE_URL}}/roles/5/permissions`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "permission_ids": [1, 2, 3, 10, 11, 12, 20, 21]
}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Permissions assigned to role successfully",
  "data": {
    "role_id": 5,
    "role_code": "TEAM_LEAD",
    "assigned_permissions": 8,
    "permission_ids": [1, 2, 3, 10, 11, 12, 20, 21]
  },
  "errorCode": "PERMISSIONS_ASSIGNED",
  "timestamp": "2025-11-10T12:00:00.000Z",
  "path": "/api/v1/auth/roles/5/permissions"
}
```

**Error Response (404 Not Found) - Invalid Permission:**
```json
{
  "status": "ERROR",
  "statusCode": 404,
  "message": "Permission with ID 999 not found",
  "data": null,
  "errorCode": "PERMISSION_NOT_FOUND",
  "timestamp": "2025-11-10T12:05:00.000Z",
  "path": "/api/v1/auth/roles/5/permissions"
}
```

---

### 7. Get Role Permissions

**Endpoint:** `GET {{BASE_URL}}/roles/:id/permissions`

**Example:** `GET {{BASE_URL}}/roles/5/permissions`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Role permissions retrieved successfully",
  "data": {
    "role_id": 5,
    "role_code": "TEAM_LEAD",
    "role_name": "Senior Team Lead",
    "permissions": [
      {
        "id": 1,
        "code": "auth.login",
        "name": "Login",
        "description": "Login to system",
        "resource": "auth",
        "action": "login",
        "scope": null
      },
      {
        "id": 2,
        "code": "auth.logout",
        "name": "Logout",
        "description": "Logout from system",
        "resource": "auth",
        "action": "logout",
        "scope": null
      }
      // ... more permissions
    ]
  },
  "timestamp": "2025-11-10T12:10:00.000Z",
  "path": "/api/v1/auth/roles/5/permissions"
}
```

---

## 🔑 **Permission Management APIs**

> **Note:** All permission management endpoints require `Authorization: Bearer {{ACCESS_TOKEN}}` header

### 1. List All Permissions

**Endpoint:** `GET {{BASE_URL}}/permissions?page=1&limit=20&status=active`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (active | inactive)

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Permissions retrieved successfully",
  "data": {
    "permissions": [
      {
        "id": 1,
        "code": "auth.login",
        "name": "Login",
        "description": "Login to system",
        "resource": "auth",
        "action": "login",
        "scope": null,
        "is_system_permission": true,
        "status": "active",
        "created_at": "2025-11-10T08:00:00.000Z",
        "updated_at": "2025-11-10T08:00:00.000Z"
      },
      {
        "id": 10,
        "code": "employee.create",
        "name": "Create Employee",
        "description": "Create new employee",
        "resource": "employee",
        "action": "create",
        "scope": null,
        "is_system_permission": false,
        "status": "active",
        "created_at": "2025-11-10T08:00:00.000Z",
        "updated_at": "2025-11-10T08:00:00.000Z"
      },
      {
        "id": 11,
        "code": "employee.read.own",
        "name": "Read Own Employee",
        "description": "View own employee information",
        "resource": "employee",
        "action": "read",
        "scope": "own",
        "is_system_permission": false,
        "status": "active",
        "created_at": "2025-11-10T08:00:00.000Z",
        "updated_at": "2025-11-10T08:00:00.000Z"
      }
      // ... more permissions
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 69,
      "totalPages": 4
    }
  },
  "timestamp": "2025-11-10T12:15:00.000Z",
  "path": "/api/v1/auth/permissions"
}
```

---

### 2. Get Permissions by Resource

**Endpoint:** `GET {{BASE_URL}}/permissions/by-resource/:resource`

**Example:** `GET {{BASE_URL}}/permissions/by-resource/employee`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Permissions retrieved successfully",
  "data": {
    "resource": "employee",
    "permissions": [
      {
        "id": 10,
        "code": "employee.create",
        "name": "Create Employee",
        "description": "Create new employee",
        "resource": "employee",
        "action": "create",
        "scope": null,
        "is_system_permission": false,
        "status": "active"
      },
      {
        "id": 11,
        "code": "employee.read.own",
        "name": "Read Own Employee",
        "description": "View own employee information",
        "resource": "employee",
        "action": "read",
        "scope": "own",
        "is_system_permission": false,
        "status": "active"
      },
      {
        "id": 12,
        "code": "employee.read.department",
        "name": "Read Department Employees",
        "description": "View employees in own department",
        "resource": "employee",
        "action": "read",
        "scope": "department",
        "is_system_permission": false,
        "status": "active"
      },
      {
        "id": 13,
        "code": "employee.read.all",
        "name": "Read All Employees",
        "description": "View all employee information",
        "resource": "employee",
        "action": "read",
        "scope": "all",
        "is_system_permission": false,
        "status": "active"
      }
      // ... more employee permissions
    ]
  },
  "timestamp": "2025-11-10T12:20:00.000Z",
  "path": "/api/v1/auth/permissions/by-resource/employee"
}
```

---

### 3. Get Permission Details

**Endpoint:** `GET {{BASE_URL}}/permissions/:id`

**Example:** `GET {{BASE_URL}}/permissions/10`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Permission retrieved successfully",
  "data": {
    "id": 10,
    "code": "employee.create",
    "name": "Create Employee",
    "description": "Create new employee",
    "resource": "employee",
    "action": "create",
    "scope": null,
    "is_system_permission": false,
    "status": "active",
    "created_at": "2025-11-10T08:00:00.000Z",
    "updated_at": "2025-11-10T08:00:00.000Z"
  },
  "timestamp": "2025-11-10T12:25:00.000Z",
  "path": "/api/v1/auth/permissions/10"
}
```

---

### 4. Create New Permission

**Endpoint:** `POST {{BASE_URL}}/permissions`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "code": "report.export.pdf",
  "resource": "report",
  "action": "export",
  "scope": "pdf",
  "description": "Export reports in PDF format",
  "is_system_permission": false
}
```

**Response (201 Created):**
```json
{
  "status": "SUCCESS",
  "statusCode": 201,
  "message": "Permission created successfully",
  "data": {
    "id": 70,
    "code": "report.export.pdf",
    "resource": "report",
    "action": "export",
    "scope": "pdf",
    "description": "Export reports in PDF format",
    "is_system_permission": false,
    "status": "active",
    "created_at": "2025-11-10T12:30:00.000Z",
    "updated_at": "2025-11-10T12:30:00.000Z",
    "created_by": 1
  },
  "errorCode": "PERMISSION_CREATED",
  "timestamp": "2025-11-10T12:30:00.000Z",
  "path": "/api/v1/auth/permissions"
}
```

**Error Response (400 Bad Request) - Invalid Code Format:**
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Permission code must follow format: resource.action or resource.action.scope",
  "data": null,
  "errorCode": "VALIDATION_ERROR",
  "timestamp": "2025-11-10T12:35:00.000Z",
  "path": "/api/v1/auth/permissions"
}
```

**Error Response (400 Bad Request) - Duplicate Code:**
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Permission code 'report.export.pdf' already exists",
  "data": null,
  "errorCode": "PERMISSION_CODE_ALREADY_EXISTS",
  "timestamp": "2025-11-10T12:40:00.000Z",
  "path": "/api/v1/auth/permissions"
}
```

---

### 5. Update Permission

**Endpoint:** `PUT {{BASE_URL}}/permissions/:id`

**Example:** `PUT {{BASE_URL}}/permissions/70`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "description": "Export detailed reports in PDF format with charts",
  "status": "active"
}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Permission updated successfully",
  "data": {
    "id": 70,
    "code": "report.export.pdf",
    "resource": "report",
    "action": "export",
    "scope": "pdf",
    "description": "Export detailed reports in PDF format with charts",
    "is_system_permission": false,
    "status": "active",
    "created_at": "2025-11-10T12:30:00.000Z",
    "updated_at": "2025-11-10T12:45:00.000Z",
    "created_by": 1,
    "updated_by": 1
  },
  "errorCode": "PERMISSION_UPDATED",
  "timestamp": "2025-11-10T12:45:00.000Z",
  "path": "/api/v1/auth/permissions/70"
}
```

**Error Response (403 Forbidden) - System Permission:**
```json
{
  "status": "ERROR",
  "statusCode": 403,
  "message": "Cannot modify system permission code or resource",
  "data": null,
  "errorCode": "PERMISSION_DENIED",
  "timestamp": "2025-11-10T12:50:00.000Z",
  "path": "/api/v1/auth/permissions/1"
}
```

---

### 6. Delete Permission

**Endpoint:** `DELETE {{BASE_URL}}/permissions/:id`

**Example:** `DELETE {{BASE_URL}}/permissions/70`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Permission deleted successfully",
  "data": {
    "id": 70,
    "code": "report.export.pdf",
    "deleted": true
  },
  "errorCode": "PERMISSION_DELETED",
  "timestamp": "2025-11-10T12:55:00.000Z",
  "path": "/api/v1/auth/permissions/70"
}
```

**Error Response (400 Bad Request) - Permission In Use:**
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Cannot delete permission: 3 role(s) are using this permission",
  "data": null,
  "errorCode": "PERMISSION_IN_USE",
  "timestamp": "2025-11-10T13:00:00.000Z",
  "path": "/api/v1/auth/permissions/10"
}
```

---

## 👤 **Account Management APIs**

### 1. Create Account (Register)

**Endpoint:** `POST {{BASE_URL}}/register`

**Headers:** None (Public endpoint)

**Request Body:**
```json
{
  "email": "john.doe@company.com",
  "password": "SecurePass@123",
  "full_name": "John Doe",
  "role": "EMPLOYEE"
}
```

**Response (201 Created):**
```json
{
  "status": "SUCCESS",
  "statusCode": 201,
  "message": "Account created successfully",
  "data": {
    "id": 2,
    "email": "john.doe@company.com",
    "full_name": "John Doe",
    "role": "EMPLOYEE",
    "status": "active",
    "created_at": "2025-11-10T13:05:00.000Z"
  },
  "timestamp": "2025-11-10T13:05:00.000Z",
  "path": "/api/v1/auth/register"
}
```

**Error Response (400 Bad Request) - Email Exists:**
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Account with email john.doe@company.com already exists",
  "data": null,
  "errorCode": "ACCOUNT_ALREADY_EXISTS",
  "timestamp": "2025-11-10T13:10:00.000Z",
  "path": "/api/v1/auth/register"
}
```

---

### 2. Change Password

**Endpoint:** `POST {{BASE_URL}}/change-password`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "old_password": "SecurePass@123",
  "new_password": "NewSecurePass@456"
}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Password changed successfully",
  "data": {
    "message": "Password updated successfully"
  },
  "timestamp": "2025-11-10T13:15:00.000Z",
  "path": "/api/v1/auth/change-password"
}
```

---

### 3. Forgot Password

**Endpoint:** `POST {{BASE_URL}}/forgot-password`

**Headers:** None (Public endpoint)

**Request Body:**
```json
{
  "email": "john.doe@company.com"
}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Password reset email sent",
  "data": {
    "message": "If the email exists, a password reset link has been sent"
  },
  "timestamp": "2025-11-10T13:20:00.000Z",
  "path": "/api/v1/auth/forgot-password"
}
```

---

### 4. Reset Password

**Endpoint:** `POST {{BASE_URL}}/reset-password`

**Headers:** None (Public endpoint)

**Request Body:**
```json
{
  "token": "abc123def456ghi789",
  "new_password": "BrandNewPass@789"
}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Password reset successfully",
  "data": {
    "message": "Password has been reset. You can now login with your new password"
  },
  "timestamp": "2025-11-10T13:25:00.000Z",
  "path": "/api/v1/auth/reset-password"
}
```

---

## 🔧 **Admin APIs**

### 1. List All Accounts (Admin)

**Endpoint:** `GET {{BASE_URL}}/admin/accounts?page=1&limit=10&role=EMPLOYEE&status=active`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `role` (optional): Filter by role
- `status` (optional): Filter by status
- `search` (optional): Search by email or name

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Accounts retrieved successfully",
  "data": {
    "accounts": [
      {
        "id": 1,
        "email": "admin@zentry.com",
        "full_name": "",
        "role": "ADMIN",
        "status": "active",
        "created_at": "2025-11-10T08:00:00.000Z",
        "updated_at": "2025-11-10T08:00:00.000Z"
      },
      {
        "id": 2,
        "email": "john.doe@company.com",
        "full_name": "John Doe",
        "role": "EMPLOYEE",
        "status": "active",
        "created_at": "2025-11-10T13:05:00.000Z",
        "updated_at": "2025-11-10T13:05:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "totalPages": 1
    }
  },
  "timestamp": "2025-11-10T13:30:00.000Z",
  "path": "/api/v1/auth/admin/accounts"
}
```

---

### 2. Get Account Details (Admin)

**Endpoint:** `GET {{BASE_URL}}/admin/accounts/:id`

**Example:** `GET {{BASE_URL}}/admin/accounts/2`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Account details retrieved successfully",
  "data": {
    "id": 2,
    "email": "john.doe@company.com",
    "full_name": "John Doe",
    "role": "EMPLOYEE",
    "status": "active",
    "last_login": "2025-11-10T13:05:00.000Z",
    "created_at": "2025-11-10T13:05:00.000Z",
    "updated_at": "2025-11-10T13:05:00.000Z"
  },
  "timestamp": "2025-11-10T13:35:00.000Z",
  "path": "/api/v1/auth/admin/accounts/2"
}
```

---

### 3. Update Account Status (Admin)

**Endpoint:** `PUT {{BASE_URL}}/admin/accounts/:id/status`

**Example:** `PUT {{BASE_URL}}/admin/accounts/2/status`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "status": "inactive"
}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Account status updated successfully",
  "data": {
    "id": 2,
    "email": "john.doe@company.com",
    "status": "inactive",
    "updated_at": "2025-11-10T13:40:00.000Z"
  },
  "timestamp": "2025-11-10T13:40:00.000Z",
  "path": "/api/v1/auth/admin/accounts/2/status"
}
```

---

### 4. View Audit Logs (Admin)

**Endpoint:** `GET {{BASE_URL}}/admin/audit-logs?page=1&limit=20&action=login`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `account_id` (optional): Filter by account
- `action` (optional): Filter by action
- `start_date` (optional): From date
- `end_date` (optional): To date

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Audit logs retrieved successfully",
  "data": {
    "logs": [
      {
        "id": 1,
        "account_id": 1,
        "action": "login",
        "ip_address": "127.0.0.1",
        "user_agent": "PostmanRuntime/7.36.0",
        "success": true,
        "metadata": {
          "email": "admin@zentry.com"
        },
        "created_at": "2025-11-10T10:30:00.000Z"
      },
      {
        "id": 2,
        "account_id": 2,
        "action": "login",
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "success": true,
        "metadata": {
          "email": "john.doe@company.com"
        },
        "created_at": "2025-11-10T13:05:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "totalPages": 1
    }
  },
  "timestamp": "2025-11-10T13:45:00.000Z",
  "path": "/api/v1/auth/admin/audit-logs"
}
```

---

## 📝 **Common Error Responses**

### 401 Unauthorized - Missing Token
```json
{
  "status": "ERROR",
  "statusCode": 401,
  "message": "Unauthorized",
  "data": null,
  "errorCode": "UNAUTHORIZED",
  "timestamp": "2025-11-10T14:00:00.000Z",
  "path": "/api/v1/auth/roles"
}
```

### 401 Unauthorized - Invalid Token
```json
{
  "status": "ERROR",
  "statusCode": 401,
  "message": "Invalid or expired token",
  "data": null,
  "errorCode": "INVALID_TOKEN",
  "timestamp": "2025-11-10T14:05:00.000Z",
  "path": "/api/v1/auth/roles"
}
```

### 403 Forbidden - Missing Permission
```json
{
  "status": "ERROR",
  "statusCode": 403,
  "message": "Missing required permissions: role:create",
  "data": null,
  "errorCode": "PERMISSION_DENIED",
  "timestamp": "2025-11-10T14:10:00.000Z",
  "path": "/api/v1/auth/roles"
}
```

### 404 Not Found
```json
{
  "status": "ERROR",
  "statusCode": 404,
  "message": "Role not found",
  "data": null,
  "errorCode": "ROLE_NOT_FOUND",
  "timestamp": "2025-11-10T14:15:00.000Z",
  "path": "/api/v1/auth/roles/999"
}
```

### 400 Validation Error
```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Validation failed",
  "data": null,
  "errorCode": "VALIDATION_ERROR",
  "errorDetails": "code should not be empty; name should not be empty",
  "timestamp": "2025-11-10T14:20:00.000Z",
  "path": "/api/v1/auth/roles"
}
```

---

## 🧪 **Postman Collection Structure**

Suggested folder structure:

```
Auth Service APIs/
├── 🔐 Authentication/
│   ├── Login
│   ├── Get Current User
│   ├── Refresh Token
│   └── Logout
│
├── 👥 Role Management/
│   ├── List All Roles
│   ├── Get Role Details
│   ├── Create Role
│   ├── Update Role
│   ├── Delete Role
│   ├── Assign Permissions to Role
│   └── Get Role Permissions
│
├── 🔑 Permission Management/
│   ├── List All Permissions
│   ├── Get Permissions by Resource
│   ├── Get Permission Details
│   ├── Create Permission
│   ├── Update Permission
│   └── Delete Permission
│
├── 👤 Account Management/
│   ├── Register Account
│   ├── Change Password
│   ├── Forgot Password
│   └── Reset Password
│
└── 🔧 Admin/
    ├── List All Accounts
    ├── Get Account Details
    ├── Update Account Status
    └── View Audit Logs
```

---

## 🎯 **Testing Workflow**

### Complete Test Flow

1. **Login as Admin**
   - `POST /login` → Save access_token

2. **View All Roles**
   - `GET /roles`

3. **Create Custom Role**
   - `POST /roles` (TEAM_LEAD)

4. **View All Permissions**
   - `GET /permissions`

5. **Assign Permissions to New Role**
   - `POST /roles/5/permissions`

6. **Verify Role Permissions**
   - `GET /roles/5/permissions`

7. **Create Employee Account**
   - `POST /register`

8. **Login as Employee**
   - `POST /login` with employee credentials

9. **Test Permission Restrictions**
   - Try `GET /roles` → Should fail with 403

10. **Login as Admin Again**
    - Test admin operations

11. **View Audit Logs**
    - `GET /admin/audit-logs`

---

## 💡 **Tips & Best Practices**

### Postman Environment Setup
```javascript
// Pre-request Script (Collection level)
if (!pm.environment.get("BASE_URL")) {
    pm.environment.set("BASE_URL", "http://localhost:3001/api/v1/auth");
}

// Test Script (Login request)
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("ACCESS_TOKEN", jsonData.data.access_token);
    pm.environment.set("REFRESH_TOKEN", jsonData.data.refresh_token);
}
```

### Auto-Refresh Token
```javascript
// Pre-request Script (Collection level)
const tokenExpiry = pm.environment.get("TOKEN_EXPIRY");
const now = new Date().getTime();

if (tokenExpiry && now > tokenExpiry) {
    // Token expired, refresh it
    pm.sendRequest({
        url: pm.environment.get("BASE_URL") + "/refresh",
        method: "POST",
        header: {
            "Content-Type": "application/json"
        },
        body: {
            mode: "raw",
            raw: JSON.stringify({
                refresh_token: pm.environment.get("REFRESH_TOKEN")
            })
        }
    }, function (err, response) {
        if (!err && response.code === 200) {
            var data = response.json().data;
            pm.environment.set("ACCESS_TOKEN", data.access_token);
            pm.environment.set("REFRESH_TOKEN", data.refresh_token);
            // Set expiry (15 minutes)
            pm.environment.set("TOKEN_EXPIRY", now + (15 * 60 * 1000));
        }
    });
}
```

---

## 📞 **Support & Resources**

- **Swagger UI:** http://localhost:3001/auth/swagger
- **Service Status:** http://localhost:3001/api/v1/auth/health
- **Setup Guide:** See `SETUP.md`
- **Architecture:** See main `README.md`

---

**Last Updated:** November 10, 2025  
**Version:** 1.0.0  
**Service:** Auth Service - RBAC APIs
