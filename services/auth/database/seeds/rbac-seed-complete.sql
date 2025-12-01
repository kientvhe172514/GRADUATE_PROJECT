-- ============================================
-- RBAC SEED DATA - COMPLETE VERSION
-- ============================================
-- Version: 2.0
-- Date: 2025-11-21
-- Changes: 
--   - Fixed Admin permissions (ensure all permissions assigned)
--   - Standardized notification permissions format
--   - Added missing permissions for read_own_detail
--   - Added admin.* permissions
--   - Added report.read permission
--   - Synchronized all permissions with controllers
-- ============================================

-- ============================================
-- 1. INSERT ROLES
-- ============================================
INSERT INTO roles (code, name, description, level, is_system_role, status, created_at, updated_at) VALUES
('ADMIN', 'Administrator', 'Full system access with all permissions', 1, true, 'active', NOW(), NOW()),
('HR_MANAGER', 'HR Manager', 'Manages employees, departments, positions, and HR operations', 2, true, 'active', NOW(), NOW()),
('DEPARTMENT_MANAGER', 'Department Manager', 'Manages department employees and operations', 3, true, 'active', NOW(), NOW()),
('EMPLOYEE', 'Employee', 'Basic employee access to view own information and submit requests', 4, true, 'active', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  is_system_role = EXCLUDED.is_system_role,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================
-- 2. INSERT PERMISSIONS
-- ============================================

-- ============ AUTH SERVICE ============
INSERT INTO permissions (code, resource, action, description, is_system_permission, status, created_at, updated_at) VALUES
-- Account Management
('auth.account.create', 'account', 'create', 'Create new user accounts', true, 'active', NOW(), NOW()),
('auth.account.read', 'account', 'read', 'View all account details', true, 'active', NOW(), NOW()),
('auth.account.read_own', 'account', 'read_own', 'View own account details', true, 'active', NOW(), NOW()),
('auth.account.update', 'account', 'update', 'Update any account information', true, 'active', NOW(), NOW()),
('auth.account.update_own', 'account', 'update_own', 'Update own account information', true, 'active', NOW(), NOW()),
('auth.account.delete', 'account', 'delete', 'Delete user accounts', true, 'active', NOW(), NOW()),
('auth.account.change_password', 'account', 'change_password', 'Change own password', true, 'active', NOW(), NOW()),
('auth.account.reset_password', 'account', 'reset_password', 'Reset user passwords', true, 'active', NOW(), NOW()),
('auth.account.manage_roles', 'account', 'manage_roles', 'Assign/change user roles', true, 'active', NOW(), NOW()),

-- Role Management
('auth.role.read', 'role', 'read', 'View roles and permissions', true, 'active', NOW(), NOW()),
('auth.role.create', 'role', 'create', 'Create new roles', true, 'active', NOW(), NOW()),
('auth.role.update', 'role', 'update', 'Update role information', true, 'active', NOW(), NOW()),
('auth.role.delete', 'role', 'delete', 'Delete roles', true, 'active', NOW(), NOW()),

-- Permission Management
('auth.permission.read', 'permission', 'read', 'View permissions', true, 'active', NOW(), NOW()),
('auth.permission.create', 'permission', 'create', 'Create new permissions', true, 'active', NOW(), NOW()),
('auth.permission.update', 'permission', 'update', 'Update permissions', true, 'active', NOW(), NOW()),
('auth.permission.delete', 'permission', 'delete', 'Delete permissions', true, 'active', NOW(), NOW()),

-- Device Management
('auth.device.read', 'device', 'read', 'View all registered devices', true, 'active', NOW(), NOW()),
('auth.device.read_own', 'device', 'read_own', 'View own registered devices', true, 'active', NOW(), NOW()),
('auth.device.create', 'device', 'create', 'Register new device', true, 'active', NOW(), NOW()),
('auth.device.delete', 'device', 'delete', 'Delete any registered devices', true, 'active', NOW(), NOW()),
('auth.device.delete_own', 'device', 'delete_own', 'Delete own registered devices', true, 'active', NOW(), NOW()),

-- Admin Management (NEW)
('admin.accounts.read', 'admin_accounts', 'read', 'View all accounts in admin panel', true, 'active', NOW(), NOW()),
('admin.accounts.update', 'admin_accounts', 'update', 'Update any account in admin panel', true, 'active', NOW(), NOW()),
('admin.accounts.update_status', 'admin_accounts', 'update_status', 'Update account status (active/inactive)', true, 'active', NOW(), NOW()),
('admin.audit_logs.read', 'admin_audit_logs', 'read', 'View system audit logs', true, 'active', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============ EMPLOYEE SERVICE ============
INSERT INTO permissions (code, resource, action, description, is_system_permission, status, created_at, updated_at) VALUES
('employee.create', 'employee', 'create', 'Create new employees', true, 'active', NOW(), NOW()),
('employee.read', 'employee', 'read', 'View all employee information', true, 'active', NOW(), NOW()),
('employee.read_own', 'employee', 'read_own', 'View own employee information', true, 'active', NOW(), NOW()),
('employee.read_department', 'employee', 'read_department', 'View employees in managed department', true, 'active', NOW(), NOW()),
('employee.update', 'employee', 'update', 'Update any employee information', true, 'active', NOW(), NOW()),
('employee.update_own', 'employee', 'update_own', 'Update own basic information', true, 'active', NOW(), NOW()),
('employee.delete', 'employee', 'delete', 'Delete employee records', true, 'active', NOW(), NOW()),
('employee.terminate', 'employee', 'terminate', 'Terminate employee contracts', true, 'active', NOW(), NOW()),
('employee.assign_department', 'employee', 'assign_department', 'Assign employees to departments', true, 'active', NOW(), NOW()),
('employee.assign_position', 'employee', 'assign_position', 'Assign employees to positions', true, 'active', NOW(), NOW()),
('employee.remove_department', 'employee', 'remove_department', 'Remove employees from departments', true, 'active', NOW(), NOW()),
('employee.remove_position', 'employee', 'remove_position', 'Remove employees from positions', true, 'active', NOW(), NOW()),
('employee.transfer_department', 'employee', 'transfer_department', 'Transfer employees between departments', true, 'active', NOW(), NOW()),

-- Onboarding Management
('employee.onboarding.read', 'employee_onboarding', 'read', 'View onboarding steps', true, 'active', NOW(), NOW()),
('employee.onboarding.update', 'employee_onboarding', 'update', 'Update onboarding step status', true, 'active', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============ DEPARTMENT SERVICE ============
INSERT INTO permissions (code, resource, action, description, is_system_permission, status, created_at, updated_at) VALUES
('department.create', 'department', 'create', 'Create new departments', true, 'active', NOW(), NOW()),
('department.read', 'department', 'read', 'View department information', true, 'active', NOW(), NOW()),
('department.update', 'department', 'update', 'Update department information', true, 'active', NOW(), NOW()),
('department.delete', 'department', 'delete', 'Delete departments', true, 'active', NOW(), NOW()),
('department.assign_manager', 'department', 'assign_manager', 'Assign manager to department', true, 'active', NOW(), NOW()),
('department.remove_manager', 'department', 'remove_manager', 'Remove department manager', true, 'active', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============ POSITION SERVICE ============
INSERT INTO permissions (code, resource, action, description, is_system_permission, status, created_at, updated_at) VALUES
('position.create', 'position', 'create', 'Create new positions', true, 'active', NOW(), NOW()),
('position.read', 'position', 'read', 'View position information', true, 'active', NOW(), NOW()),
('position.update', 'position', 'update', 'Update position information', true, 'active', NOW(), NOW()),
('position.delete', 'position', 'delete', 'Delete positions', true, 'active', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============ ATTENDANCE SERVICE ============
INSERT INTO permissions (code, resource, action, description, is_system_permission, status, created_at, updated_at) VALUES
('attendance.checkin', 'attendance', 'checkin', 'Check in attendance', true, 'active', NOW(), NOW()),
('attendance.checkout', 'attendance', 'checkout', 'Check out attendance', true, 'active', NOW(), NOW()),
('attendance.read', 'attendance', 'read', 'View all attendance records', true, 'active', NOW(), NOW()),
('attendance.read_own', 'attendance', 'read_own', 'View own attendance records', true, 'active', NOW(), NOW()),
('attendance.read_department', 'attendance', 'read_department', 'View department attendance records', true, 'active', NOW(), NOW()),
('attendance.update', 'attendance', 'update', 'Update attendance records', true, 'active', NOW(), NOW()),
('attendance.delete', 'attendance', 'delete', 'Delete attendance records', true, 'active', NOW(), NOW()),
('attendance.approve', 'attendance', 'approve', 'Approve attendance corrections', true, 'active', NOW(), NOW()),
('attendance.reject', 'attendance', 'reject', 'Reject attendance corrections', true, 'active', NOW(), NOW()),
('attendance.export', 'attendance', 'export', 'Export attendance reports', true, 'active', NOW(), NOW()),

-- Overtime Management
('overtime.create', 'overtime', 'create', 'Create overtime requests', true, 'active', NOW(), NOW()),
('overtime.read', 'overtime', 'read', 'View all overtime requests', true, 'active', NOW(), NOW()),
('overtime.read_own', 'overtime', 'read_own', 'View own overtime requests', true, 'active', NOW(), NOW()),
('overtime.read_detail', 'overtime', 'read_detail', 'View overtime request details', true, 'active', NOW(), NOW()),
('overtime.read_department', 'overtime', 'read_department', 'View department overtime requests', true, 'active', NOW(), NOW()),
('overtime.update', 'overtime', 'update', 'Update overtime requests', true, 'active', NOW(), NOW()),
('overtime.cancel', 'overtime', 'cancel', 'Cancel own overtime requests', true, 'active', NOW(), NOW()),
('overtime.approve', 'overtime', 'approve', 'Approve overtime requests', true, 'active', NOW(), NOW()),
('overtime.reject', 'overtime', 'reject', 'Reject overtime requests', true, 'active', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============ LEAVE SERVICE ============
INSERT INTO permissions (code, resource, action, description, is_system_permission, status, created_at, updated_at) VALUES
('leave.request.create', 'leave_request', 'create', 'Create leave requests', true, 'active', NOW(), NOW()),
('leave.request.read', 'leave_request', 'read', 'View all leave requests', true, 'active', NOW(), NOW()),
('leave.request.read_own', 'leave_request', 'read_own', 'View own leave requests', true, 'active', NOW(), NOW()),
('leave.request.read_department', 'leave_request', 'read_department', 'View department leave requests', true, 'active', NOW(), NOW()),
('leave.request.update', 'leave_request', 'update', 'Update leave requests', true, 'active', NOW(), NOW()),
('leave.request.cancel', 'leave_request', 'cancel', 'Cancel own leave requests', true, 'active', NOW(), NOW()),
('leave.request.approve', 'leave_request', 'approve', 'Approve leave requests', true, 'active', NOW(), NOW()),
('leave.request.reject', 'leave_request', 'reject', 'Reject leave requests', true, 'active', NOW(), NOW()),

-- Leave Balance Management
('leave.balance.read', 'leave_balance', 'read', 'View all leave balances', true, 'active', NOW(), NOW()),
('leave.balance.read_own', 'leave_balance', 'read_own', 'View own leave balance', true, 'active', NOW(), NOW()),
('leave.balance.update', 'leave_balance', 'update', 'Adjust employee leave balances', true, 'active', NOW(), NOW()),

-- Leave Type Management
('leave.type.read', 'leave_type', 'read', 'View leave types', true, 'active', NOW(), NOW()),
('leave.type.create', 'leave_type', 'create', 'Create new leave types', true, 'active', NOW(), NOW()),
('leave.type.update', 'leave_type', 'update', 'Update leave types', true, 'active', NOW(), NOW()),
('leave.type.delete', 'leave_type', 'delete', 'Delete leave types', true, 'active', NOW(), NOW()),

-- Holiday Management
('holiday.read', 'holiday', 'read', 'View company holidays', true, 'active', NOW(), NOW()),
('holiday.create', 'holiday', 'create', 'Create company holidays', true, 'active', NOW(), NOW()),
('holiday.update', 'holiday', 'update', 'Update company holidays', true, 'active', NOW(), NOW()),
('holiday.delete', 'holiday', 'delete', 'Delete company holidays', true, 'active', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============ NOTIFICATION SERVICE (STANDARDIZED) ============
INSERT INTO permissions (code, resource, action, description, is_system_permission, status, created_at, updated_at) VALUES
-- Notification Core
('notification.create', 'notification', 'create', 'Send/create notifications to users', true, 'active', NOW(), NOW()),
('notification.read', 'notification', 'read', 'View all notifications', true, 'active', NOW(), NOW()),
('notification.read_own', 'notification', 'read_own', 'View own notifications', true, 'active', NOW(), NOW()),
('notification.update_own', 'notification', 'update_own', 'Update own notification status (mark as read)', true, 'active', NOW(), NOW()),
('notification.delete_own', 'notification', 'delete_own', 'Delete own notifications', true, 'active', NOW(), NOW()),

-- Scheduled Notifications
('notification.schedule.create', 'notification_schedule', 'create', 'Create scheduled notifications', true, 'active', NOW(), NOW()),
('notification.schedule.read_own', 'notification_schedule', 'read_own', 'View own scheduled notifications', true, 'active', NOW(), NOW()),
('notification.schedule.update', 'notification_schedule', 'update', 'Update scheduled notifications', true, 'active', NOW(), NOW()),
('notification.schedule.delete', 'notification_schedule', 'delete', 'Delete scheduled notifications', true, 'active', NOW(), NOW()),

-- Device/Push Token Management
('notification.device.register', 'push_token', 'register', 'Register device push token', true, 'active', NOW(), NOW()),
('notification.device.unregister', 'push_token', 'unregister', 'Unregister/delete device push tokens', true, 'active', NOW(), NOW()),
('notification.device.read_own', 'push_token', 'read_own', 'View own registered devices', true, 'active', NOW(), NOW()),

-- Notification Preferences
('notification.preference.read_own', 'notification_preference', 'read_own', 'View own notification preferences', true, 'active', NOW(), NOW()),
('notification.preference.update', 'notification_preference', 'update', 'Update notification preferences', true, 'active', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============ REPORTING SERVICE ============
INSERT INTO permissions (code, resource, action, description, is_system_permission, status, created_at, updated_at) VALUES
('report.read', 'report', 'read', 'View and access reports', true, 'active', NOW(), NOW()),
('report.attendance.generate', 'report', 'generate_attendance', 'Generate attendance reports', true, 'active', NOW(), NOW()),
('report.leave.generate', 'report', 'generate_leave', 'Generate leave reports', true, 'active', NOW(), NOW()),
('report.overtime.generate', 'report', 'generate_overtime', 'Generate overtime reports', true, 'active', NOW(), NOW()),
('report.employee.generate', 'report', 'generate_employee', 'Generate employee reports', true, 'active', NOW(), NOW()),
('report.department.generate', 'report', 'generate_department', 'Generate department reports', true, 'active', NOW(), NOW()),
('report.export', 'report', 'export', 'Export reports to Excel/PDF', true, 'active', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================
-- 3. CLEAR EXISTING ROLE PERMISSIONS (SAFETY)
-- ============================================
-- Delete existing role_permissions to avoid conflicts
DELETE FROM role_permissions WHERE role_id IN (
  SELECT id FROM roles WHERE code IN ('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE')
);

-- ============================================
-- 4. ASSIGN PERMISSIONS TO ROLES
-- ============================================

-- ============ ADMIN ROLE (ALL PERMISSIONS) ============
-- CRITICAL FIX: Ensure ADMIN gets ALL permissions without conflicts
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 
  (SELECT id FROM roles WHERE code = 'ADMIN'),
  p.id,
  NOW()
FROM permissions p
WHERE p.status = 'active';

-- ============ HR_MANAGER ROLE ============
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 
  (SELECT id FROM roles WHERE code = 'HR_MANAGER'),
  p.id,
  NOW()
FROM permissions p
WHERE p.code IN (
  -- Auth: Limited account management
  'auth.account.read',
  'auth.account.read_own',
  'auth.account.update_own',
  'auth.account.change_password',
  'auth.role.read',
  'auth.permission.read',
  'auth.device.read_own',
  'auth.device.create',
  'auth.device.delete_own',
  
  -- Admin panel: Read only
  'admin.accounts.read',
  'admin.audit_logs.read',
  
  -- Employee: Full management
  'employee.create',
  'employee.read',
  'employee.read_own',
  'employee.update',
  'employee.update_own',
  'employee.terminate',
  'employee.assign_department',
  'employee.assign_position',
  'employee.remove_department',
  'employee.remove_position',
  'employee.transfer_department',
  'employee.onboarding.read',
  'employee.onboarding.update',
  
  -- Department: Full management
  'department.create',
  'department.read',
  'department.update',
  'department.delete',
  'department.assign_manager',
  'department.remove_manager',
  
  -- Position: Full management
  'position.create',
  'position.read',
  'position.update',
  'position.delete',
  
  -- Attendance: Full management
  'attendance.checkin',
  'attendance.checkout',
  'attendance.read',
  'attendance.read_own',
  'attendance.update',
  'attendance.delete',
  'attendance.approve',
  'attendance.reject',
  'attendance.export',
  
  -- Overtime: Full management
  'overtime.create',
  'overtime.read',
  'overtime.read_own',
  'overtime.read_detail',
  'overtime.update',
  'overtime.cancel',
  'overtime.approve',
  'overtime.reject',
  
  -- Leave: Full management
  'leave.request.create',
  'leave.request.read',
  'leave.request.read_own',
  'leave.request.update',
  'leave.request.cancel',
  'leave.request.approve',
  'leave.request.reject',
  'leave.balance.read',
  'leave.balance.read_own',
  'leave.balance.update',
  'leave.type.read',
  'leave.type.create',
  'leave.type.update',
  'leave.type.delete',
  'holiday.read',
  'holiday.create',
  'holiday.update',
  'holiday.delete',
  
  -- Notification: Full management
  'notification.create',
  'notification.read',
  'notification.read_own',
  'notification.update_own',
  'notification.delete_own',
  'notification.schedule.create',
  'notification.schedule.read_own',
  'notification.schedule.update',
  'notification.schedule.delete',
  'notification.device.register',
  'notification.device.unregister',
  'notification.device.read_own',
  'notification.preference.read_own',
  'notification.preference.update',
  
  -- Reporting: Full access
  'report.read',
  'report.attendance.generate',
  'report.leave.generate',
  'report.overtime.generate',
  'report.employee.generate',
  'report.department.generate',
  'report.export'
);

-- ============ DEPARTMENT_MANAGER ROLE ============
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 
  (SELECT id FROM roles WHERE code = 'DEPARTMENT_MANAGER'),
  p.id,
  NOW()
FROM permissions p
WHERE p.code IN (
  -- Auth: Own account only
  'auth.account.read_own',
  'auth.account.update_own',
  'auth.account.change_password',
  'auth.device.read_own',
  'auth.device.create',
  'auth.device.delete_own',
  
  -- Employee: Read all, manage own department
  'employee.read',
  'employee.read_own',
  'employee.read_department',
  'employee.update_own',
  'employee.assign_department',
  'employee.assign_position',
  'employee.onboarding.read',
  
  -- Department: Read only
  'department.read',
  
  -- Position: Read only
  'position.read',
  
  -- Attendance: Department management
  'attendance.checkin',
  'attendance.checkout',
  'attendance.read_department',
  'attendance.read_own',
  'attendance.approve',
  'attendance.reject',
  'attendance.export',
  
  -- Overtime: Department management
  'overtime.create',
  'overtime.read_department',
  'overtime.read_own',
  'overtime.read_detail',
  'overtime.update',
  'overtime.cancel',
  'overtime.approve',
  'overtime.reject',
  
  -- Leave: Department management
  'leave.request.create',
  'leave.request.read_department',
  'leave.request.read_own',
  'leave.request.update',
  'leave.request.cancel',
  'leave.request.approve',
  'leave.request.reject',
  'leave.balance.read_own',
  'leave.type.read',
  'holiday.read',
  
  -- Notification: Own only
  'notification.read_own',
  'notification.update_own',
  'notification.delete_own',
  'notification.device.register',
  'notification.device.unregister',
  'notification.device.read_own',
  'notification.preference.read_own',
  'notification.preference.update',
  
  -- Reporting: Department only
  'report.read',
  'report.attendance.generate',
  'report.leave.generate',
  'report.overtime.generate',
  'report.export'
);

-- ============ EMPLOYEE ROLE ============
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 
  (SELECT id FROM roles WHERE code = 'EMPLOYEE'),
  p.id,
  NOW()
FROM permissions p
WHERE p.code IN (
  -- Auth: Own account only
  'auth.account.read_own',
  'auth.account.update_own',
  'auth.account.change_password',
  'auth.device.read_own',
  'auth.device.create',
  'auth.device.delete_own',
  
  -- Employee: Own information only
  'employee.read_own',
  'employee.update_own',
  'employee.onboarding.read',
  
  -- Department: Read only
  'department.read',
  
  -- Position: Read only
  'position.read',
  
  -- Attendance: Own records only
  'attendance.checkin',
  'attendance.checkout',
  'attendance.read_own',
  
  -- Overtime: Own requests only
  'overtime.create',
  'overtime.read_own',
  'overtime.read_detail',
  'overtime.update',
  'overtime.cancel',
  
  -- Leave: Own requests only
  'leave.request.create',
  'leave.request.read_own',
  'leave.request.update',
  'leave.request.cancel',
  'leave.balance.read_own',
  'leave.type.read',
  'holiday.read',
  
  -- Notification: Own only
  'notification.read_own',
  'notification.update_own',
  'notification.delete_own',
  'notification.device.register',
  'notification.device.unregister',
  'notification.device.read_own',
  'notification.preference.read_own',
  'notification.preference.update'
);

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================
-- Check roles
SELECT 'ROLES' as section, id, code, name, level FROM roles ORDER BY level;

-- Check permission counts
SELECT 'TOTAL PERMISSIONS' as section, COUNT(*) as total FROM permissions WHERE status = 'active';

-- Check role permissions distribution
SELECT 
  'ROLE PERMISSIONS' as section,
  r.code as role,
  r.level,
  COUNT(rp.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.code, r.level
ORDER BY r.level;

-- CRITICAL: Verify ADMIN has ALL permissions
SELECT 
  'ADMIN CHECK' as section,
  CASE 
    WHEN COUNT(rp.id) = (SELECT COUNT(*) FROM permissions WHERE status = 'active')
    THEN '✅ ADMIN has all permissions'
    ELSE '❌ ADMIN missing permissions! Count: ' || COUNT(rp.id) || ' / ' || (SELECT COUNT(*) FROM permissions WHERE status = 'active')
  END as status
FROM role_permissions rp
WHERE rp.role_id = (SELECT id FROM roles WHERE code = 'ADMIN');

-- Show new permissions added
SELECT 
  'NEW PERMISSIONS' as section,
  code,
  resource,
  action,
  description
FROM permissions
WHERE code IN (
  'overtime.read_detail',
  'report.read',
  'admin.accounts.read',
  'admin.accounts.update',
  'admin.accounts.update_status',
  'admin.audit_logs.read',
  'notification.create',
  'notification.read_own',
  'notification.update_own',
  'notification.delete_own',
  'notification.schedule.create',
  'notification.schedule.read_own',
  'notification.schedule.update',
  'notification.schedule.delete',
  'notification.device.register',
  'notification.device.unregister',
  'notification.device.read_own',
  'notification.preference.update',
  'auth.device.delete_own'
)
ORDER BY code;
