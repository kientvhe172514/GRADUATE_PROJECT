# 📮 Quick Start - Postman Setup

## 🚀 **Import Collection & Environment**

### Step 1: Import Collection
1. Open Postman
2. Click **Import** button (top left)
3. Select file: `Auth_Service_RBAC.postman_collection.json`
4. Click **Import**

### Step 2: Import Environment
1. Click **Environments** (left sidebar)
2. Click **Import** button
3. Select file: `Auth_Service_Local.postman_environment.json`
4. Click **Import**

### Step 3: Select Environment
1. Select **Auth Service - Local** from environment dropdown (top right)
2. You're ready to test! 🎉

---

## ⚡ **Quick Test Flow**

### 1. Login as Admin
```
POST {{BASE_URL}}/login

Body:
{
  "email": "admin@zentry.com",
  "password": "Admin@123"
}
```
✅ Access token will be saved automatically to environment

### 2. Test Role Management
```
GET {{BASE_URL}}/roles
```
✅ Should return 4 system roles

### 3. Test Permission Management
```
GET {{BASE_URL}}/permissions
```
✅ Should return 69 permissions

---

## 📂 **Collection Structure**

```
Auth Service - RBAC APIs/
├── 🔐 Authentication (4 requests)
├── 👥 Role Management (7 requests)
├── 🔑 Permission Management (6 requests)
├── 👤 Account Management (4 requests)
└── 🔧 Admin (4 requests)

Total: 25 API requests
```

---

## 🔑 **Environment Variables**

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `BASE_URL` | API base URL | ✅ Manual |
| `ACCESS_TOKEN` | JWT access token | ✅ After login |
| `REFRESH_TOKEN` | JWT refresh token | ✅ After login |
| `TOKEN_EXPIRY` | Token expiration time | ✅ After login |

---

## 📝 **Testing Tips**

### Auto-Save Tokens
The collection includes scripts to automatically save tokens after login:
```javascript
// Login request → Test tab
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("ACCESS_TOKEN", jsonData.data.access_token);
    pm.environment.set("REFRESH_TOKEN", jsonData.data.refresh_token);
}
```

### Check Environment
Before testing, verify environment variables:
1. Click environment name (top right)
2. Check `ACCESS_TOKEN` has value
3. If empty, run **Login** request first

### View Responses
All responses follow ApiResponseDto format:
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "...",
  "data": { ... },
  "timestamp": "...",
  "path": "..."
}
```

---

## 🧪 **Common Test Scenarios**

### Scenario 1: Create Custom Role
1. Login as Admin
2. Create Role: `POST /roles`
3. Assign Permissions: `POST /roles/:id/permissions`
4. Verify: `GET /roles/:id`

### Scenario 2: Test Permission Restrictions
1. Login as Admin
2. Create Employee Account: `POST /register`
3. Logout: `POST /logout`
4. Login as Employee
5. Try `GET /roles` → Should fail with 403

### Scenario 3: View Audit Trail
1. Login as Admin
2. Perform various actions
3. View Logs: `GET /admin/audit-logs`

---

## 🔧 **Troubleshooting**

### "Unauthorized" Error
- **Cause:** Missing or expired token
- **Fix:** Run **Login** request again

### "BASE_URL not defined"
- **Cause:** Environment not selected
- **Fix:** Select "Auth Service - Local" from dropdown

### "Connection refused"
- **Cause:** Auth service not running
- **Fix:** 
  ```bash
  cd services/auth
  npm run start:dev
  ```

---

## 📚 **Documentation**

- **Detailed API Guide:** See `POSTMAN_API_TESTING.md`
- **Setup Guide:** See `SETUP.md`
- **Swagger UI:** http://localhost:3001/auth/swagger

---

## 🎯 **Success Checklist**

- [ ] Postman installed
- [ ] Collection imported
- [ ] Environment imported
- [ ] Environment selected
- [ ] Auth service running
- [ ] Login successful (token saved)
- [ ] GET /roles works
- [ ] Ready to test! 🚀

---

**Need help?** Check `POSTMAN_API_TESTING.md` for detailed request/response examples.
