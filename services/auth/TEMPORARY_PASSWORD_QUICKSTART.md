# 🔐 Temporary Password Flow - Quick Start Guide

## 📖 Tóm Tắt

Khi tạo employee mới, hệ thống tự động:
1. ✅ Tạo account với mật khẩu tạm `"1"`
2. ✅ Gửi email thông báo cho nhân viên
3. ✅ Yêu cầu đổi mật khẩu khi đăng nhập lần đầu

## 🚀 Quick Start

### 1. Setup Database

```bash
# Chạy migration để thêm column is_temporary_password
cd services/auth
psql -U postgres -d auth_db -f database/migrations/add_is_temporary_password_column.sql
```

### 2. Start Service

```bash
cd services/auth
pnpm install
pnpm start:dev
```

### 3. Test Flow

#### Option A: Sử dụng Postman Collection

1. Import file `Auth_Temporary_Password_Flow.postman_collection.json` vào Postman
2. Set environment variables:
   - `base_url`: http://localhost:3000
   - `test_email`: email của test account
3. Run collection tests

#### Option B: Sử dụng Bash Script

```bash
cd services/auth
chmod +x test-temporary-password-flow.sh
./test-temporary-password-flow.sh
```

#### Option C: Manual cURL Testing

**Bước 1: Tạo employee mới**
```bash
# Gọi Employee Service để tạo employee
# → Tự động tạo account với password = "1"
# → Gửi email cho nhân viên
```

**Bước 2: Login với temporary password (sẽ bị reject)**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemployee@example.com",
    "password": "1"
  }'

# Response:
# {
#   "success": false,
#   "error_code": "TEMPORARY_PASSWORD_MUST_CHANGE",
#   "message": "Bạn đang sử dụng mật khẩu tạm. Vui lòng đổi mật khẩu để tiếp tục.",
#   "status_code": 403
# }
```

**Bước 3: Đổi mật khẩu tạm**
```bash
curl -X POST http://localhost:3000/auth/change-temporary-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemployee@example.com",
    "current_password": "1",
    "new_password": "NewSecure@Pass123",
    "confirm_password": "NewSecure@Pass123"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "access_token": "eyJhbGc...",
#     "refresh_token": "eyJhbGc...",
#     "user": {
#       "id": 1,
#       "email": "newemployee@example.com",
#       "full_name": "Nguyễn Văn A",
#       "role": "EMPLOYEE"
#     }
#   },
#   "message": "Đổi mật khẩu thành công"
# }
```

**Bước 4: Login với mật khẩu mới**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemployee@example.com",
    "password": "NewSecure@Pass123"
  }'

# Response: 200 OK với access_token
```

## 🎨 Flutter/Mobile Client Implementation

### 1. Login Screen

```dart
Future<void> login(String email, String password) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      // Login success - navigate to home
      final data = jsonDecode(response.body);
      saveTokens(data['data']['access_token'], data['data']['refresh_token']);
      Navigator.pushReplacementNamed(context, '/home');
    } 
    else if (response.statusCode == 403) {
      // Check if temporary password must be changed
      final data = jsonDecode(response.body);
      if (data['error_code'] == 'TEMPORARY_PASSWORD_MUST_CHANGE') {
        // Navigate to change password screen
        Navigator.pushNamed(
          context, 
          '/change-temporary-password',
          arguments: {'email': email, 'tempPassword': password},
        );
      }
    } 
    else {
      // Show error
      showErrorDialog(response.body);
    }
  } catch (e) {
    print('Login error: $e');
  }
}
```

### 2. Change Temporary Password Screen

```dart
class ChangeTemporaryPasswordScreen extends StatefulWidget {
  final String email;
  final String tempPassword;

  ChangeTemporaryPasswordScreen({
    required this.email, 
    required this.tempPassword
  });

  @override
  _ChangeTemporaryPasswordScreenState createState() => _ChangeTemporaryPasswordScreenState();
}

class _ChangeTemporaryPasswordScreenState extends State<ChangeTemporaryPasswordScreen> {
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _changePassword() async {
    if (_newPasswordController.text != _confirmPasswordController.text) {
      showErrorDialog('Mật khẩu xác nhận không khớp');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/change-temporary-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': widget.email,
          'current_password': widget.tempPassword,
          'new_password': _newPasswordController.text,
          'confirm_password': _confirmPasswordController.text,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // Save tokens (auto-login after password change)
        saveTokens(
          data['data']['access_token'], 
          data['data']['refresh_token']
        );

        // Show success message
        showSuccessDialog('Đổi mật khẩu thành công!');

        // Navigate to home
        Navigator.pushReplacementNamed(context, '/home');
      } else {
        final error = jsonDecode(response.body);
        showErrorDialog(error['message']);
      }
    } catch (e) {
      showErrorDialog('Có lỗi xảy ra: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Đổi Mật Khẩu')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Bạn đang sử dụng mật khẩu tạm thời. '
              'Vui lòng đổi sang mật khẩu mới để bảo mật tài khoản.',
              style: TextStyle(fontSize: 16),
            ),
            SizedBox(height: 24),
            Text('Email: ${widget.email}', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 16),
            
            // New Password Field
            TextField(
              controller: _newPasswordController,
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'Mật khẩu mới',
                hintText: 'Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            
            // Confirm Password Field
            TextField(
              controller: _confirmPasswordController,
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'Xác nhận mật khẩu',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 24),
            
            // Submit Button
            ElevatedButton(
              onPressed: _isLoading ? null : _changePassword,
              child: _isLoading
                  ? CircularProgressIndicator(color: Colors.white)
                  : Text('Đổi Mật Khẩu'),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

## 📊 Database Verification

### Check temporary password status

```sql
-- Xem các account đang dùng temporary password
SELECT 
  id, 
  email, 
  full_name, 
  is_temporary_password,
  created_at
FROM accounts
WHERE is_temporary_password = TRUE;

-- Verify account sau khi đổi password
SELECT 
  id, 
  email, 
  is_temporary_password,
  last_login_at
FROM accounts
WHERE email = 'test@example.com';
```

### Check audit logs

```sql
-- Xem audit logs của temporary password flow
SELECT 
  action,
  success,
  error_message,
  ip_address,
  created_at
FROM audit_logs
WHERE account_id = 1
  AND action IN (
    'LOGIN_FAILED',
    'CHANGE_TEMPORARY_PASSWORD_FAILED',
    'CHANGE_TEMPORARY_PASSWORD_SUCCESS'
  )
ORDER BY created_at DESC;
```

## ⚠️ Common Issues & Solutions

### Issue 1: Password validation fails
```
Error: "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số"
```
**Solution**: New password must have:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)

Example valid passwords:
- `NewPass@123`
- `SecurePassword1`
- `MyP@ssw0rd`

### Issue 2: "Tài khoản không sử dụng mật khẩu tạm"
**Solution**: This endpoint is only for first-time password change. Use `/auth/me/password` for regular password changes.

### Issue 3: Cannot login after password change
**Solution**: Make sure you're using the NEW password, not the temporary "1" password.

## 📚 Additional Documentation

- [TEMPORARY_PASSWORD_FLOW.md](./docs/TEMPORARY_PASSWORD_FLOW.md) - Detailed technical documentation
- [API Documentation](http://localhost:3000/api) - Swagger UI (when service is running)

## 🔗 Related Endpoints

- `POST /auth/login` - Login (will reject temporary passwords)
- `POST /auth/change-temporary-password` - Change temporary password (this flow)
- `PUT /auth/me/password` - Change password (for non-temporary passwords)
- `POST /auth/forgot-password` - Reset forgotten password

## 💡 Tips

1. **For Testing**: Use `test-temporary-password-flow.sh` script to automate all test scenarios
2. **For Development**: Import Postman collection for quick API testing
3. **For Production**: Make sure to run database migration before deployment
4. **For Security**: Monitor audit logs regularly for suspicious password change attempts

## ✅ Checklist

Before deploying to production:

- [ ] Run database migration
- [ ] Test all scenarios using Postman/script
- [ ] Verify email notifications are sent
- [ ] Check audit logs are properly recorded
- [ ] Update Flutter app to handle temporary password flow
- [ ] Document process for support team
- [ ] Set up monitoring/alerts for failed password changes

## 🆘 Support

If you encounter any issues, check:
1. Database migration was applied successfully
2. Service logs for detailed error messages
3. Audit logs for security events
4. Network connectivity to notification service

For bugs or feature requests, contact the Auth Service team.
