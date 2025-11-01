1. Client → Ingress NGINX
2. Ingress → Auth Service /api/v1/auth/verify
   - Auth service verify JWT
   - Check permissions
   - Return 200 OK + user info headers
3. Ingress → Forward to Target Service (Employee/Leave/...)
   - Request có headers: X-User-Id, X-User-Email, X-User-Permissions
4. Service chỉ cần đọc headers → Không cần verify JWT!