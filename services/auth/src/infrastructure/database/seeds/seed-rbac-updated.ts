import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

interface Permission {
  code: string;
  name: string;
  resource: string;
  action: string;
  scope?: string;
  description: string;
  is_system_permission: boolean;
}

interface Role {
  code: string;
  name: string;
  description: string;
  level: number;
  is_system_role: boolean;
  permissions: string[]; // permission codes
}

/**
 * UPDATED RBAC Seed Data
 * 
 * New Role Hierarchy (4 levels):
 * - Level 1: ADMIN (highest)
 * - Level 2: HR_MANAGER
 * - Level 3: DEPARTMENT_MANAGER
 * - Level 4: EMPLOYEE (lowest)
 */

const PERMISSIONS: Permission[] = [
  // ============================================
  // AUTH & ACCOUNT MANAGEMENT
  // ============================================
  {
    code: 'auth.login',
    name: 'Login',
    resource: 'auth',
    action: 'login',
    description: 'Login to system',
    is_system_permission: true,
  },
  {
    code: 'auth.logout',
    name: 'Logout',
    resource: 'auth',
    action: 'logout',
    description: 'Logout from system',
    is_system_permission: true,
  },
  {
    code: 'auth.refresh_token',
    name: 'Refresh Token',
    resource: 'auth',
    action: 'refresh',
    description: 'Refresh access token',
    is_system_permission: true,
  },
  {
    code: 'account.read.own',
    name: 'Read Own Account',
    resource: 'account',
    action: 'read',
    scope: 'own',
    description: 'View own account information',
    is_system_permission: false,
  },
  {
    code: 'account.read.all',
    name: 'Read All Accounts',
    resource: 'account',
    action: 'read',
    scope: 'all',
    description: 'View all account information',
    is_system_permission: false,
  },
  {
    code: 'account.update.own',
    name: 'Update Own Account',
    resource: 'account',
    action: 'update',
    scope: 'own',
    description: 'Update own account information',
    is_system_permission: false,
  },
  {
    code: 'account.update.all',
    name: 'Update All Accounts',
    resource: 'account',
    action: 'update',
    scope: 'all',
    description: 'Update any account information',
    is_system_permission: false,
  },
  {
    code: 'account.change_password',
    name: 'Change Password',
    resource: 'account',
    action: 'change_password',
    description: 'Change own password',
    is_system_permission: false,
  },

  // ============================================
  // ROLE & PERMISSION MANAGEMENT (RBAC)
  // ============================================
  {
    code: 'role:read',
    name: 'Read Roles',
    resource: 'role',
    action: 'read',
    description: 'View role information',
    is_system_permission: false,
  },
  {
    code: 'role:create',
    name: 'Create Role',
    resource: 'role',
    action: 'create',
    description: 'Create new roles',
    is_system_permission: false,
  },
  {
    code: 'role:update',
    name: 'Update Role',
    resource: 'role',
    action: 'update',
    description: 'Update role information',
    is_system_permission: false,
  },
  {
    code: 'role:delete',
    name: 'Delete Role',
    resource: 'role',
    action: 'delete',
    description: 'Delete roles',
    is_system_permission: false,
  },
  {
    code: 'role:assign-permissions',
    name: 'Assign Permissions to Role',
    resource: 'role',
    action: 'assign-permissions',
    description: 'Assign permissions to roles',
    is_system_permission: false,
  },
  {
    code: 'permission:read',
    name: 'Read Permissions',
    resource: 'permission',
    action: 'read',
    description: 'View permission information',
    is_system_permission: false,
  },
  {
    code: 'permission:create',
    name: 'Create Permission',
    resource: 'permission',
    action: 'create',
    description: 'Create new permissions',
    is_system_permission: false,
  },
  {
    code: 'permission:update',
    name: 'Update Permission',
    resource: 'permission',
    action: 'update',
    description: 'Update permission information',
    is_system_permission: false,
  },
  {
    code: 'permission:delete',
    name: 'Delete Permission',
    resource: 'permission',
    action: 'delete',
    description: 'Delete permissions',
    is_system_permission: false,
  },

  // ============================================
  // EMPLOYEE MANAGEMENT
  // ============================================
  {
    code: 'employee.create',
    name: 'Create Employee',
    resource: 'employee',
    action: 'create',
    description: 'Create new employee',
    is_system_permission: false,
  },
  {
    code: 'employee.read.own',
    name: 'Read Own Employee',
    resource: 'employee',
    action: 'read',
    scope: 'own',
    description: 'View own employee information',
    is_system_permission: false,
  },
  {
    code: 'employee.read.department',
    name: 'Read Department Employees',
    resource: 'employee',
    action: 'read',
    scope: 'department',
    description: 'View employees in own department',
    is_system_permission: false,
  },
  {
    code: 'employee.read.all',
    name: 'Read All Employees',
    resource: 'employee',
    action: 'read',
    scope: 'all',
    description: 'View all employee information',
    is_system_permission: false,
  },
  {
    code: 'employee.update.own',
    name: 'Update Own Employee',
    resource: 'employee',
    action: 'update',
    scope: 'own',
    description: 'Update own employee information',
    is_system_permission: false,
  },
  {
    code: 'employee.update.department',
    name: 'Update Department Employees',
    resource: 'employee',
    action: 'update',
    scope: 'department',
    description: 'Update employees in own department',
    is_system_permission: false,
  },
  {
    code: 'employee.update.all',
    name: 'Update All Employees',
    resource: 'employee',
    action: 'update',
    scope: 'all',
    description: 'Update any employee information',
    is_system_permission: false,
  },
  {
    code: 'employee.delete',
    name: 'Delete Employee',
    resource: 'employee',
    action: 'delete',
    description: 'Delete employee',
    is_system_permission: false,
  },
  {
    code: 'employee.export',
    name: 'Export Employees',
    resource: 'employee',
    action: 'export',
    description: 'Export employee data',
    is_system_permission: false,
  },

  // ============================================
  // DEPARTMENT & POSITION MANAGEMENT
  // ============================================
  {
    code: 'department.create',
    name: 'Create Department',
    resource: 'department',
    action: 'create',
    description: 'Create new department',
    is_system_permission: false,
  },
  {
    code: 'department.read',
    name: 'Read Department',
    resource: 'department',
    action: 'read',
    description: 'View department information',
    is_system_permission: false,
  },
  {
    code: 'department.update',
    name: 'Update Department',
    resource: 'department',
    action: 'update',
    description: 'Update department information',
    is_system_permission: false,
  },
  {
    code: 'department.delete',
    name: 'Delete Department',
    resource: 'department',
    action: 'delete',
    description: 'Delete department',
    is_system_permission: false,
  },
  {
    code: 'position.create',
    name: 'Create Position',
    resource: 'position',
    action: 'create',
    description: 'Create new position',
    is_system_permission: false,
  },
  {
    code: 'position.read',
    name: 'Read Position',
    resource: 'position',
    action: 'read',
    description: 'View position information',
    is_system_permission: false,
  },
  {
    code: 'position.update',
    name: 'Update Position',
    resource: 'position',
    action: 'update',
    description: 'Update position information',
    is_system_permission: false,
  },
  {
    code: 'position.delete',
    name: 'Delete Position',
    resource: 'position',
    action: 'delete',
    description: 'Delete position',
    is_system_permission: false,
  },

  // ============================================
  // ATTENDANCE MANAGEMENT
  // ============================================
  {
    code: 'attendance.create.own',
    name: 'Create Own Attendance',
    resource: 'attendance',
    action: 'create',
    scope: 'own',
    description: 'Check-in/Check-out own attendance',
    is_system_permission: false,
  },
  {
    code: 'attendance.read.own',
    name: 'Read Own Attendance',
    resource: 'attendance',
    action: 'read',
    scope: 'own',
    description: 'View own attendance records',
    is_system_permission: false,
  },
  {
    code: 'attendance.read.department',
    name: 'Read Department Attendance',
    resource: 'attendance',
    action: 'read',
    scope: 'department',
    description: 'View attendance records in own department',
    is_system_permission: false,
  },
  {
    code: 'attendance.read.all',
    name: 'Read All Attendance',
    resource: 'attendance',
    action: 'read',
    scope: 'all',
    description: 'View all attendance records',
    is_system_permission: false,
  },
  {
    code: 'attendance.update',
    name: 'Update Attendance',
    resource: 'attendance',
    action: 'update',
    description: 'Update attendance records',
    is_system_permission: false,
  },
  {
    code: 'attendance.approve',
    name: 'Approve Attendance',
    resource: 'attendance',
    action: 'approve',
    description: 'Approve attendance corrections',
    is_system_permission: false,
  },
  {
    code: 'attendance.export',
    name: 'Export Attendance',
    resource: 'attendance',
    action: 'export',
    description: 'Export attendance data',
    is_system_permission: false,
  },

  // ============================================
  // LEAVE MANAGEMENT
  // ============================================
  {
    code: 'leave.create.own',
    name: 'Create Own Leave',
    resource: 'leave',
    action: 'create',
    scope: 'own',
    description: 'Create own leave requests',
    is_system_permission: false,
  },
  {
    code: 'leave.read.own',
    name: 'Read Own Leave',
    resource: 'leave',
    action: 'read',
    scope: 'own',
    description: 'View own leave records',
    is_system_permission: false,
  },
  {
    code: 'leave.read.department',
    name: 'Read Department Leave',
    resource: 'leave',
    action: 'read',
    scope: 'department',
    description: 'View leave records in own department',
    is_system_permission: false,
  },
  {
    code: 'leave.read.all',
    name: 'Read All Leave',
    resource: 'leave',
    action: 'read',
    scope: 'all',
    description: 'View all leave records',
    is_system_permission: false,
  },
  {
    code: 'leave.approve.department',
    name: 'Approve Department Leave',
    resource: 'leave',
    action: 'approve',
    scope: 'department',
    description: 'Approve leave requests in own department',
    is_system_permission: false,
  },
  {
    code: 'leave.approve.all',
    name: 'Approve All Leave',
    resource: 'leave',
    action: 'approve',
    scope: 'all',
    description: 'Approve any leave requests',
    is_system_permission: false,
  },
  {
    code: 'leave.cancel.own',
    name: 'Cancel Own Leave',
    resource: 'leave',
    action: 'cancel',
    scope: 'own',
    description: 'Cancel own leave requests',
    is_system_permission: false,
  },
  {
    code: 'leave.cancel.all',
    name: 'Cancel All Leave',
    resource: 'leave',
    action: 'cancel',
    scope: 'all',
    description: 'Cancel any leave requests',
    is_system_permission: false,
  },

  // ============================================
  // REPORTING
  // ============================================
  {
    code: 'report.attendance.department',
    name: 'Department Attendance Report',
    resource: 'report',
    action: 'attendance',
    scope: 'department',
    description: 'View attendance reports for own department',
    is_system_permission: false,
  },
  {
    code: 'report.attendance.all',
    name: 'All Attendance Report',
    resource: 'report',
    action: 'attendance',
    scope: 'all',
    description: 'View attendance reports for all departments',
    is_system_permission: false,
  },
  {
    code: 'report.leave.department',
    name: 'Department Leave Report',
    resource: 'report',
    action: 'leave',
    scope: 'department',
    description: 'View leave reports for own department',
    is_system_permission: false,
  },
  {
    code: 'report.leave.all',
    name: 'All Leave Report',
    resource: 'report',
    action: 'leave',
    scope: 'all',
    description: 'View leave reports for all departments',
    is_system_permission: false,
  },
  {
    code: 'report.employee',
    name: 'Employee Report',
    resource: 'report',
    action: 'employee',
    description: 'View employee reports',
    is_system_permission: false,
  },
  {
    code: 'report.export',
    name: 'Export Reports',
    resource: 'report',
    action: 'export',
    description: 'Export report data',
    is_system_permission: false,
  },

  // ============================================
  // NOTIFICATION
  // ============================================
  {
    code: 'notification.read.own',
    name: 'Read Own Notifications',
    resource: 'notification',
    action: 'read',
    scope: 'own',
    description: 'View own notifications',
    is_system_permission: false,
  },
  {
    code: 'notification.send',
    name: 'Send Notifications',
    resource: 'notification',
    action: 'send',
    description: 'Send notifications to users',
    is_system_permission: false,
  },

  // ============================================
  // AUDIT LOGS
  // ============================================
  {
    code: 'audit.read',
    name: 'Read Audit Logs',
    resource: 'audit',
    action: 'read',
    description: 'View audit logs',
    is_system_permission: false,
  },
];

const ROLES: Role[] = [
  // ============================================
  // LEVEL 1: ADMIN (HIGHEST)
  // ============================================
  {
    code: 'ADMIN',
    name: 'System Administrator',
    description: 'Full system access with all permissions',
    level: 1,
    is_system_role: true,
    permissions: PERMISSIONS.map((p) => p.code), // ALL PERMISSIONS
  },

  // ============================================
  // LEVEL 2: HR_MANAGER
  // ============================================
  {
    code: 'HR_MANAGER',
    name: 'HR Manager',
    description: 'Human Resources Manager - Full employee and HR management',
    level: 2,
    is_system_role: true,
    permissions: [
      // Auth & Account
      'auth.login',
      'auth.logout',
      'auth.refresh_token',
      'account.read.all',
      'account.update.own',
      'account.change_password',
      
      // RBAC (Read only)
      'role:read',
      'permission:read',
      
      // Employee Management (Full)
      'employee.create',
      'employee.read.all',
      'employee.update.all',
      'employee.delete',
      'employee.export',
      
      // Department & Position
      'department.create',
      'department.read',
      'department.update',
      'department.delete',
      'position.create',
      'position.read',
      'position.update',
      'position.delete',
      
      // Attendance
      'attendance.create.own',
      'attendance.read.all',
      'attendance.update',
      'attendance.approve',
      'attendance.export',
      
      // Leave
      'leave.create.own',
      'leave.read.all',
      'leave.approve.all',
      'leave.cancel.all',
      
      // Reporting
      'report.attendance.all',
      'report.leave.all',
      'report.employee',
      'report.export',
      
      // Notification
      'notification.read.own',
      'notification.send',
      
      // Audit
      'audit.read',
    ],
  },

  // ============================================
  // LEVEL 3: DEPARTMENT_MANAGER
  // ============================================
  {
    code: 'DEPARTMENT_MANAGER',
    name: 'Department Manager',
    description: 'Department-level manager - Manage team members and operations',
    level: 3,
    is_system_role: true,
    permissions: [
      // Auth & Account
      'auth.login',
      'auth.logout',
      'auth.refresh_token',
      'account.read.own',
      'account.update.own',
      'account.change_password',
      
      // Employee (Department scope)
      'employee.read.own',
      'employee.read.department',
      'employee.update.own',
      
      // Department & Position (Read only)
      'department.read',
      'position.read',
      
      // Attendance
      'attendance.create.own',
      'attendance.read.own',
      'attendance.read.department',
      'attendance.approve',
      'attendance.export',
      
      // Leave
      'leave.create.own',
      'leave.read.own',
      'leave.read.department',
      'leave.approve.department',
      'leave.cancel.own',
      
      // Reporting
      'report.attendance.department',
      'report.leave.department',
      'report.export',
      
      // Notification
      'notification.read.own',
    ],
  },

  // ============================================
  // LEVEL 4: EMPLOYEE (LOWEST)
  // ============================================
  {
    code: 'EMPLOYEE',
    name: 'Employee',
    description: 'Regular employee - Basic self-service access',
    level: 4,
    is_system_role: true,
    permissions: [
      // Auth & Account
      'auth.login',
      'auth.logout',
      'auth.refresh_token',
      'account.read.own',
      'account.update.own',
      'account.change_password',
      
      // Employee (Own only)
      'employee.read.own',
      'employee.update.own',
      
      // Department & Position (Read only)
      'department.read',
      'position.read',
      
      // Attendance
      'attendance.create.own',
      'attendance.read.own',
      
      // Leave
      'leave.create.own',
      'leave.read.own',
      'leave.cancel.own',
      
      // Notification
      'notification.read.own',
    ],
  },
];

export async function seedRBAC(dataSource: DataSource) {
  console.log('🌱 Starting RBAC seed (Updated roles: ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE)...\n');

  try {
    // 1. Insert Permissions
    console.log('📋 Seeding permissions...');
    for (const permission of PERMISSIONS) {
      await dataSource.query(
        `
        INSERT INTO permissions (code, resource, action, scope, description, is_system_permission, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
        ON CONFLICT (code) DO NOTHING
      `,
        [
          permission.code,
          permission.resource,
          permission.action,
          permission.scope || null,
          permission.description,
          permission.is_system_permission,
        ],
      );
    }
    console.log(`✅ Inserted ${PERMISSIONS.length} permissions\n`);

    // 2. Insert Roles
    console.log('👥 Seeding roles...');
    for (const role of ROLES) {
      await dataSource.query(
        `
        INSERT INTO roles (code, name, description, level, is_system_role, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          level = EXCLUDED.level,
          is_system_role = EXCLUDED.is_system_role,
          updated_at = NOW()
      `,
        [role.code, role.name, role.description, role.level, role.is_system_role],
      );
    }
    console.log(`✅ Inserted/Updated ${ROLES.length} roles\n`);

    // 3. Assign Permissions to Roles
    console.log('🔗 Assigning permissions to roles...');
    for (const role of ROLES) {
      // Get role ID
      const roleResult = await dataSource.query('SELECT id FROM roles WHERE code = $1', [role.code]);
      const roleId = roleResult[0]?.id;

      if (!roleId) {
        console.error(`❌ Role ${role.code} not found`);
        continue;
      }

      // Delete existing role_permissions
      await dataSource.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

      // Insert new role_permissions
      for (const permissionCode of role.permissions) {
        const permResult = await dataSource.query('SELECT id FROM permissions WHERE code = $1', [permissionCode]);
        const permissionId = permResult[0]?.id;

        if (!permissionId) {
          console.warn(`⚠️  Permission ${permissionCode} not found for role ${role.code}`);
          continue;
        }

        await dataSource.query(
          'INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES ($1, $2, NOW())',
          [roleId, permissionId],
        );
      }

      console.log(`  ✓ Assigned ${role.permissions.length} permissions to ${role.code}`);
    }

    console.log('\n✅ RBAC seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`  - Permissions: ${PERMISSIONS.length}`);
    console.log(`  - Roles: ${ROLES.length}`);
    console.log('  - ADMIN: Full access (all permissions)');
    console.log('  - HR_MANAGER: HR & employee management');
    console.log('  - DEPARTMENT_MANAGER: Department-level management');
    console.log('  - EMPLOYEE: Basic self-service\n');
  } catch (error) {
    console.error('❌ Error seeding RBAC:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  const { DataSource } = require('typeorm');
  
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/auth_db',
    entities: [],
  });

  dataSource
    .initialize()
    .then(async () => {
      await seedRBAC(dataSource);
      await dataSource.destroy();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
