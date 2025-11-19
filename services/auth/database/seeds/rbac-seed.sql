-- ============================================
-- RBAC SEED DATA FOR GRADUATE PROJECT
-- ============================================
-- This script seeds roles, permissions, and role_permissions tables
-- 4 Roles: ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE
-- ============================================

-- ============================================
-- 1. INSERT ROLES
-- ============================================
INSERT INTO roles (code, name, description, level, is_system_role, status, created_at, updated_at) VALUES
('ADMIN', 'Administrator', 'Full system access with all permissions', 1, true, 'active', NOW(), NOW()),
('HR_MANAGER', 'HR Manager', 'Manages employees, departments, positions, and HR operations', 2, true, 'active', NOW(), NOW()),
('DEPARTMENT_MANAGER', 'Department Manager', 'Manages department employees and operations', 3, true, 'active', NOW(), NOW()),
('EMPLOYEE', 'Employee', 'Basic employee access to view own information and submit requests', 4, true, 'active', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. INSERT PERMISSIONS
-- ============================================

-- ============ AUTH SERVICE ============
INSERT INTO permissions (code, resource, action, description, is_system_permission, status, created_at, updated_at) VALUES
-- Account Management
('auth.account.create', 'account', 'create', 'Create new user accounts', true, 'active', NOW(), NOW()),
('auth.account.read', 'account', 'read', 'View account details', true, 'active', NOW(), NOW()),
('auth.account.read_own', 'account', 'read_own', 'View own account details', true, 'active', NOW(), NOW()),
('auth.account.update', 'account', 'update', 'Update account information', true, 'active', NOW(), NOW()),
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
('auth.device.read', 'device', 'read', 'View registered devices', true, 'active', NOW(), NOW()),
('auth.device.read_own', 'device', 'read_own', 'View own registered devices', true, 'active', NOW(), NOW()),
('auth.device.create', 'device', 'create', 'Register new device', true, 'active', NOW(), NOW()),
('auth.device.delete', 'device', 'delete', 'Delete registered devices', true, 'active', NOW(), NOW()),

-- ============ EMPLOYEE SERVICE ============
-- Employee Management
('employee.create', 'employee', 'create', 'Create new employees', true, 'active', NOW(), NOW()),
('employee.read', 'employee', 'read', 'View all employee information', true, 'active', NOW(), NOW()),
('employee.read_own', 'employee', 'read_own', 'View own employee information', true, 'active', NOW(), NOW()),
('employee.read_department', 'employee', 'read_department', 'View employees in managed department', true, 'active', NOW(), NOW()),
('employee.update', 'employee', 'update', 'Update employee information', true, 'active', NOW(), NOW()),
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
ON CONFLICT (code) DO NOTHING;

-- ============ DEPARTMENT SERVICE ============
INSERT INTO permissions (code, resource, action, description, is_system_permission, status, created_at, updated_at) VALUES
('department.create', 'department', 'create', 'Create new departments', true, 'active', NOW(), NOW()),
('department.read', 'department', 'read', 'View department information', true, 'active', NOW(), NOW()),
('department.update', 'department', 'update', 'Update department information', true, 'active', NOW(), NOW()),
('department.delete', 'department', 'delete', 'Delete departments', true, 'active', NOW(), NOW()),
('department.assign_manager', 'department', 'assign_manager', 'Assign manager to department', true, 'active', NOW(), NOW()),
('department.remove_manager', 'department', 'remove_manager', 'Remove department manager', true, 'active', NOW(), NOW()),

-- ============ POSITION SERVICE ============
('position.create', 'position', 'create', 'Create new positions', true, 'active', NOW(), NOW()),
('position.read', 'position', 'read', 'View position information', true, 'active', NOW(), NOW()),
('position.update', 'position', 'update', 'Update position information', true, 'active', NOW(), NOW()),
('position.delete', 'position', 'delete', 'Delete positions', true, 'active', NOW(), NOW()),

-- ============ ATTENDANCE SERVICE ============
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
('overtime.read_department', 'overtime', 'read_department', 'View department overtime requests', true, 'active', NOW(), NOW()),
('overtime.update', 'overtime', 'update', 'Update overtime requests', true, 'active', NOW(), NOW()),
('overtime.cancel', 'overtime', 'cancel', 'Cancel own overtime requests', true, 'active', NOW(), NOW()),
('overtime.approve', 'overtime', 'approve', 'Approve overtime requests', true, 'active', NOW(), NOW()),
('overtime.reject', 'overtime', 'reject', 'Reject overtime requests', true, 'active', NOW(), NOW()),

-- ============ LEAVE SERVICE ============
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
('holiday.delete', 'holiday', 'delete', 'Delete company holidays', true, 'active', NOW(), NOW()),

-- ============ NOTIFICATION SERVICE ============
('notification.read', 'notification', 'read', 'View all notifications', true, 'active', NOW(), NOW()),
('notification.read_own', 'notification', 'read_own', 'View own notifications', true, 'active', NOW(), NOW()),
('notification.send', 'notification', 'send', 'Send notifications to users', true, 'active', NOW(), NOW()),
('notification.create_scheduled', 'notification', 'create_scheduled', 'Create scheduled notifications', true, 'active', NOW(), NOW()),
('notification.update_scheduled', 'notification', 'update_scheduled', 'Update scheduled notifications', true, 'active', NOW(), NOW()),
('notification.delete_scheduled', 'notification', 'delete_scheduled', 'Delete scheduled notifications', true, 'active', NOW(), NOW()),

-- Push Token Management
('notification.push_token.register', 'push_token', 'register', 'Register device push token', true, 'active', NOW(), NOW()),
('notification.push_token.read_own', 'push_token', 'read_own', 'View own push tokens', true, 'active', NOW(), NOW()),
('notification.push_token.delete_own', 'push_token', 'delete_own', 'Delete own push tokens', true, 'active', NOW(), NOW()),

-- Notification Preferences
('notification.preference.read_own', 'notification_preference', 'read_own', 'View own notification preferences', true, 'active', NOW(), NOW()),
('notification.preference.update_own', 'notification_preference', 'update_own', 'Update own notification preferences', true, 'active', NOW(), NOW()),

-- ============ REPORTING SERVICE ============
('report.attendance.generate', 'report', 'generate_attendance', 'Generate attendance reports', true, 'active', NOW(), NOW()),
('report.leave.generate', 'report', 'generate_leave', 'Generate leave reports', true, 'active', NOW(), NOW()),
('report.overtime.generate', 'report', 'generate_overtime', 'Generate overtime reports', true, 'active', NOW(), NOW()),
('report.employee.generate', 'report', 'generate_employee', 'Generate employee reports', true, 'active', NOW(), NOW()),
('report.department.generate', 'report', 'generate_department', 'Generate department reports', true, 'active', NOW(), NOW()),
('report.export', 'report', 'export', 'Export reports to Excel/PDF', true, 'active', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 3. ASSIGN PERMISSIONS TO ROLES
-- ============================================

-- ============ ADMIN ROLE ============
-- ADMIN has ALL permissions
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 
  (SELECT id FROM roles WHERE code = 'ADMIN'),
  p.id,
  NOW()
FROM permissions p
ON CONFLICT DO NOTHING;

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
  'auth.device.delete',
  
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
  'notification.read',
  'notification.read_own',
  'notification.send',
  'notification.create_scheduled',
  'notification.update_scheduled',
  'notification.delete_scheduled',
  'notification.push_token.register',
  'notification.push_token.read_own',
  'notification.push_token.delete_own',
  'notification.preference.read_own',
  'notification.preference.update_own',
  
  -- Reporting: Full access
  'report.attendance.generate',
  'report.leave.generate',
  'report.overtime.generate',
  'report.employee.generate',
  'report.department.generate',
  'report.export'
)
ON CONFLICT DO NOTHING;

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
  'auth.device.delete',
  
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
  'notification.push_token.register',
  'notification.push_token.read_own',
  'notification.push_token.delete_own',
  'notification.preference.read_own',
  'notification.preference.update_own',
  
  -- Reporting: Department only
  'report.attendance.generate',
  'report.leave.generate',
  'report.overtime.generate',
  'report.export'
)
ON CONFLICT DO NOTHING;

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
  'auth.device.delete',
  
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
  'notification.push_token.register',
  'notification.push_token.read_own',
  'notification.push_token.delete_own',
  'notification.preference.read_own',
  'notification.preference.update_own'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. VERIFICATION QUERIES
-- ============================================
-- Uncomment to verify the seed data

-- SELECT 'ROLES' as section, * FROM roles ORDER BY id;
-- SELECT 'PERMISSIONS COUNT' as section, COUNT(*) as total FROM permissions;
-- SELECT 'ROLE_PERMISSIONS COUNT' as section, r.code, COUNT(rp.id) as permission_count
-- FROM roles r
-- LEFT JOIN role_permissions rp ON r.id = rp.role_id
-- GROUP BY r.id, r.code
-- ORDER BY r.id;
