import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

interface Permission {
  code: string;
  name: string;
  resource: string;
  action: string;
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

const PERMISSIONS: Permission[] = [
  // Auth & Account Management
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
    code: 'account.read',
    name: 'Read Account',
    resource: 'account',
    action: 'read',
    description: 'View account information',
    is_system_permission: false,
  },
  {
    code: 'account.update',
    name: 'Update Account',
    resource: 'account',
    action: 'update',
    description: 'Update account information',
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

  // Admin Management
  {
    code: 'admin.accounts.read',
    name: 'Read All Accounts',
    resource: 'admin',
    action: 'read',
    description: 'View all user accounts (admin panel)',
    is_system_permission: false,
  },
  {
    code: 'admin.accounts.update',
    name: 'Update Account Status',
    resource: 'admin',
    action: 'update',
    description: 'Update account status (activate/deactivate)',
    is_system_permission: false,
  },
  {
    code: 'admin.audit-logs.read',
    name: 'Read Audit Logs',
    resource: 'admin',
    action: 'read',
    description: 'View system audit logs',
    is_system_permission: false,
  },

  // Employee Management
  {
    code: 'employee.create',
    name: 'Create Employee',
    resource: 'employee',
    action: 'create',
    description: 'Create new employee',
    is_system_permission: false,
  },
  {
    code: 'employee.read',
    name: 'Read Employee',
    resource: 'employee',
    action: 'read',
    description: 'View employee information',
    is_system_permission: false,
  },
  {
    code: 'employee.update',
    name: 'Update Employee',
    resource: 'employee',
    action: 'update',
    description: 'Update employee information',
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
    name: 'Export Employee',
    resource: 'employee',
    action: 'export',
    description: 'Export employee data',
    is_system_permission: false,
  },

  // Department Management
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

  // Position Management
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

  // Attendance Management
  {
    code: 'attendance.create',
    name: 'Create Attendance',
    resource: 'attendance',
    action: 'create',
    description: 'Create attendance record',
    is_system_permission: false,
  },
  {
    code: 'attendance.read',
    name: 'Read Attendance',
    resource: 'attendance',
    action: 'read',
    description: 'View attendance records',
    is_system_permission: false,
  },
  {
    code: 'attendance.read.own',
    name: 'Read Own Attendance',
    resource: 'attendance',
    action: 'read',
    description: 'View own attendance records',
    is_system_permission: false,
  },
  {
    code: 'attendance.read.department',
    name: 'Read Department Attendance',
    resource: 'attendance',
    action: 'read',
    description: 'View department attendance records',
    is_system_permission: false,
  },
  {
    code: 'attendance.update',
    name: 'Update Attendance',
    resource: 'attendance',
    action: 'update',
    description: 'Update attendance record',
    is_system_permission: false,
  },
  {
    code: 'attendance.delete',
    name: 'Delete Attendance',
    resource: 'attendance',
    action: 'delete',
    description: 'Delete attendance record',
    is_system_permission: false,
  },
  {
    code: 'attendance.approve',
    name: 'Approve Attendance',
    resource: 'attendance',
    action: 'approve',
    description: 'Approve attendance modifications',
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

  // Overtime Management
  {
    code: 'overtime.create',
    name: 'Create Overtime Request',
    resource: 'overtime',
    action: 'create',
    description: 'Create overtime request',
    is_system_permission: false,
  },
  {
    code: 'overtime.read',
    name: 'Read All Overtime Requests',
    resource: 'overtime',
    action: 'read',
    description: 'View all overtime requests',
    is_system_permission: false,
  },
  {
    code: 'overtime.read_own',
    name: 'Read Own Overtime Requests',
    resource: 'overtime',
    action: 'read',
    description: 'View own overtime requests',
    is_system_permission: false,
  },
  {
    code: 'overtime.read_detail',
    name: 'Read Overtime Request Detail',
    resource: 'overtime',
    action: 'read',
    description: 'View overtime request details',
    is_system_permission: false,
  },
  {
    code: 'overtime.update',
    name: 'Update Overtime Request',
    resource: 'overtime',
    action: 'update',
    description: 'Update overtime request before approval',
    is_system_permission: false,
  },
  {
    code: 'overtime.approve',
    name: 'Approve Overtime Request',
    resource: 'overtime',
    action: 'approve',
    description: 'Approve overtime requests',
    is_system_permission: false,
  },
  {
    code: 'overtime.reject',
    name: 'Reject Overtime Request',
    resource: 'overtime',
    action: 'reject',
    description: 'Reject overtime requests',
    is_system_permission: false,
  },
  {
    code: 'overtime.cancel',
    name: 'Cancel Overtime Request',
    resource: 'overtime',
    action: 'cancel',
    description: 'Cancel own overtime request',
    is_system_permission: false,
  },

  // Leave Management
  {
    code: 'leave.create',
    name: 'Create Leave',
    resource: 'leave',
    action: 'create',
    description: 'Submit leave request',
    is_system_permission: false,
  },
  {
    code: 'leave.read',
    name: 'Read Leave',
    resource: 'leave',
    action: 'read',
    description: 'View leave requests',
    is_system_permission: false,
  },
  {
    code: 'leave.read.own',
    name: 'Read Own Leave',
    resource: 'leave',
    action: 'read',
    description: 'View own leave requests',
    is_system_permission: false,
  },
  {
    code: 'leave.read.department',
    name: 'Read Department Leave',
    resource: 'leave',
    action: 'read',
    description: 'View department leave requests',
    is_system_permission: false,
  },
  {
    code: 'leave.update',
    name: 'Update Leave',
    resource: 'leave',
    action: 'update',
    description: 'Update leave request',
    is_system_permission: false,
  },
  {
    code: 'leave.delete',
    name: 'Delete Leave',
    resource: 'leave',
    action: 'delete',
    description: 'Delete leave request',
    is_system_permission: false,
  },
  {
    code: 'leave.approve',
    name: 'Approve Leave',
    resource: 'leave',
    action: 'approve',
    description: 'Approve/Reject leave requests',
    is_system_permission: false,
  },
  {
    code: 'leave.cancel',
    name: 'Cancel Leave',
    resource: 'leave',
    action: 'cancel',
    description: 'Cancel approved leave',
    is_system_permission: false,
  },

  // Face Recognition & Device Management
  {
    code: 'face.register',
    name: 'Register Face',
    resource: 'face',
    action: 'register',
    description: 'Register face for recognition',
    is_system_permission: false,
  },
  {
    code: 'face.update',
    name: 'Update Face',
    resource: 'face',
    action: 'update',
    description: 'Update face data',
    is_system_permission: false,
  },
  {
    code: 'face.delete',
    name: 'Delete Face',
    resource: 'face',
    action: 'delete',
    description: 'Delete face data',
    is_system_permission: false,
  },
  {
    code: 'device.create',
    name: 'Create Device',
    resource: 'device',
    action: 'create',
    description: 'Register new device',
    is_system_permission: false,
  },
  {
    code: 'device.read',
    name: 'Read Device',
    resource: 'device',
    action: 'read',
    description: 'View device information',
    is_system_permission: false,
  },
  {
    code: 'device.update',
    name: 'Update Device',
    resource: 'device',
    action: 'update',
    description: 'Update device information',
    is_system_permission: false,
  },
  {
    code: 'device.delete',
    name: 'Delete Device',
    resource: 'device',
    action: 'delete',
    description: 'Delete device',
    is_system_permission: false,
  },

  // Reporting
  {
    code: 'report.read',
    name: 'Read Reports',
    resource: 'report',
    action: 'read',
    description: 'View all reports',
    is_system_permission: false,
  },
  {
    code: 'report.attendance',
    name: 'Attendance Report',
    resource: 'report',
    action: 'view',
    description: 'View attendance reports',
    is_system_permission: false,
  },
  {
    code: 'report.leave',
    name: 'Leave Report',
    resource: 'report',
    action: 'view',
    description: 'View leave reports',
    is_system_permission: false,
  },
  {
    code: 'report.employee',
    name: 'Employee Report',
    resource: 'report',
    action: 'view',
    description: 'View employee reports',
    is_system_permission: false,
  },
  {
    code: 'report.department',
    name: 'Department Report',
    resource: 'report',
    action: 'view',
    description: 'View department reports',
    is_system_permission: false,
  },
  {
    code: 'report.export',
    name: 'Export Report',
    resource: 'report',
    action: 'export',
    description: 'Export reports',
    is_system_permission: false,
  },

  // Notification Management
  {
    code: 'notification.read',
    name: 'Read Notification',
    resource: 'notification',
    action: 'read',
    description: 'View notifications',
    is_system_permission: false,
  },
  {
    code: 'notification.update',
    name: 'Update Notification',
    resource: 'notification',
    action: 'update',
    description: 'Mark notification as read',
    is_system_permission: false,
  },
  {
    code: 'notification.send',
    name: 'Send Notification',
    resource: 'notification',
    action: 'send',
    description: 'Send notifications to users',
    is_system_permission: false,
  },

  // RBAC Management
  {
    code: 'role.create',
    name: 'Create Role',
    resource: 'role',
    action: 'create',
    description: 'Create new role',
    is_system_permission: false,
  },
  {
    code: 'role.read',
    name: 'Read Role',
    resource: 'role',
    action: 'read',
    description: 'View role information',
    is_system_permission: false,
  },
  {
    code: 'role.update',
    name: 'Update Role',
    resource: 'role',
    action: 'update',
    description: 'Update role information',
    is_system_permission: false,
  },
  {
    code: 'role.delete',
    name: 'Delete Role',
    resource: 'role',
    action: 'delete',
    description: 'Delete role',
    is_system_permission: false,
  },
  {
    code: 'role.assign_permissions',
    name: 'Assign Permissions',
    resource: 'role',
    action: 'assign',
    description: 'Assign permissions to role',
    is_system_permission: false,
  },
  {
    code: 'permission.create',
    name: 'Create Permission',
    resource: 'permission',
    action: 'create',
    description: 'Create new permission',
    is_system_permission: false,
  },
  {
    code: 'permission.read',
    name: 'Read Permission',
    resource: 'permission',
    action: 'read',
    description: 'View permission information',
    is_system_permission: false,
  },
  {
    code: 'permission.update',
    name: 'Update Permission',
    resource: 'permission',
    action: 'update',
    description: 'Update permission information',
    is_system_permission: false,
  },
  {
    code: 'permission.delete',
    name: 'Delete Permission',
    resource: 'permission',
    action: 'delete',
    description: 'Delete permission',
    is_system_permission: false,
  },

  // API Key Management
  {
    code: 'api_key.create',
    name: 'Create API Key',
    resource: 'api_key',
    action: 'create',
    description: 'Create new API key',
    is_system_permission: false,
  },
  {
    code: 'api_key.read',
    name: 'Read API Key',
    resource: 'api_key',
    action: 'read',
    description: 'View API key information',
    is_system_permission: false,
  },
  {
    code: 'api_key.update',
    name: 'Update API Key',
    resource: 'api_key',
    action: 'update',
    description: 'Update API key information',
    is_system_permission: false,
  },
  {
    code: 'api_key.delete',
    name: 'Delete API Key',
    resource: 'api_key',
    action: 'delete',
    description: 'Revoke API key',
    is_system_permission: false,
  },

  // Audit Logs
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
  {
    code: 'SUPER_ADMIN',
    name: 'Super Administrator',
    description: 'Full system access with all permissions',
    level: 1,
    is_system_role: true,
    permissions: PERMISSIONS.map((p) => p.code), // All permissions
  },
  {
    code: 'ADMIN',
    name: 'Administrator',
    description: 'System administrator with most permissions',
    level: 2,
    is_system_role: true,
    permissions: [
      // Admin Management
      'admin.accounts.read',
      'admin.accounts.update',
      'admin.audit-logs.read',
      // Employee Management
      'employee.create',
      'employee.read',
      'employee.update',
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
      'attendance.read',
      'attendance.update',
      'attendance.approve',
      'attendance.export',
      // Overtime
      'overtime.create',
      'overtime.read',
      'overtime.read_own',
      'overtime.read_detail',
      'overtime.update',
      'overtime.approve',
      'overtime.reject',
      'overtime.cancel',
      // Leave
      'leave.read',
      'leave.approve',
      'leave.cancel',
      // Face & Device
      'face.register',
      'face.update',
      'face.delete',
      'device.create',
      'device.read',
      'device.update',
      'device.delete',
      // Reporting
      'report.attendance',
      'report.leave',
      'report.employee',
      'report.department',
      'report.export',
      // Notification
      'notification.read',
      'notification.send',
      // Audit
      'audit.read',
    ],
  },
  {
    code: 'HR_MANAGER',
    name: 'HR Manager',
    description: 'Human Resources Manager',
    level: 3,
    is_system_role: true,
    permissions: [
      'employee.create',
      'employee.read',
      'employee.update',
      'employee.export',
      'department.read',
      'position.read',
      'attendance.read',
      'attendance.export',
      'overtime.read',
      'overtime.read_detail',
      'overtime.approve',
      'overtime.reject',
      'leave.read',
      'leave.approve',
      'face.register',
      'face.update',
      'device.read',
      'report.read',
      'report.attendance',
      'report.leave',
      'report.employee',
      'report.export',
      'notification.read',
      'notification.send',
    ],
  },
  {
    code: 'DEPARTMENT_MANAGER',
    name: 'Department Manager',
    description: 'Manager of a department',
    level: 4,
    is_system_role: true,
    permissions: [
      'employee.read',
      'department.read',
      'attendance.read.department',
      'attendance.approve',
      'overtime.read',
      'overtime.read_detail',
      'overtime.approve',
      'overtime.reject',
      'leave.read.department',
      'leave.approve',
      'report.read',
      'report.attendance',
      'report.leave',
      'report.employee',
      'notification.read',
    ],
  },
  {
    code: 'EMPLOYEE',
    name: 'Employee',
    description: 'Regular employee',
    level: 5,
    is_system_role: true,
    permissions: [
      'auth.login',
      'auth.logout',
      'auth.refresh_token',
      'account.read',
      'account.update',
      'account.change_password',
      'attendance.read.own',
      'attendance.create',
      'overtime.create',
      'overtime.read_own',
      'overtime.read_detail',
      'overtime.update',
      'overtime.cancel',
      'leave.create',
      'leave.read.own',
      'leave.update',
      'leave.delete',
      'face.register',
      'face.update',
      'notification.read',
      'notification.update',
    ],
  },
];

export async function seedRBAC(dataSource: DataSource) {
  console.log('🌱 Starting RBAC seeding...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Insert Permissions
    console.log('📝 Seeding permissions...');
    const permissionIds: Record<string, number> = {};

    for (const perm of PERMISSIONS) {
      const result = await queryRunner.query(
        `INSERT INTO permissions (code, resource, action, description, is_system_permission, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
         ON CONFLICT (code) DO UPDATE SET 
           description = EXCLUDED.description,
           updated_at = NOW()
         RETURNING id`,
        [
          perm.code,
          perm.resource,
          perm.action,
          perm.description,
          perm.is_system_permission,
        ],
      );
      permissionIds[perm.code] = result[0].id;
    }
    console.log(`✅ Seeded ${Object.keys(permissionIds).length} permissions`);

    // 2. Insert Roles
    console.log('👥 Seeding roles...');
    const roleIds: Record<string, number> = {};

    for (const role of ROLES) {
      const result = await queryRunner.query(
        `INSERT INTO roles (code, name, description, level, is_system_role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
         ON CONFLICT (code) DO UPDATE SET 
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           level = EXCLUDED.level,
           updated_at = NOW()
         RETURNING id`,
        [role.code, role.name, role.description, role.level, role.is_system_role],
      );
      roleIds[role.code] = result[0].id;
    }
    console.log(`✅ Seeded ${Object.keys(roleIds).length} roles`);

    // 3. Assign Permissions to Roles
    console.log('🔗 Assigning permissions to roles...');
    let assignmentCount = 0;

    for (const role of ROLES) {
      const roleId = roleIds[role.code];

      // Delete existing permissions for this role
      await queryRunner.query(`DELETE FROM role_permissions WHERE role_id = $1`, [
        roleId,
      ]);

      // Insert new permissions
      for (const permCode of role.permissions) {
        const permId = permissionIds[permCode];
        if (permId) {
          await queryRunner.query(
            `INSERT INTO role_permissions (role_id, permission_id, created_at)
             VALUES ($1, $2, NOW())`,
            [roleId, permId],
          );
          assignmentCount++;
        }
      }
    }
    console.log(`✅ Created ${assignmentCount} role-permission assignments`);

    // 4. Create Super Admin Account (if not exists)
    console.log('👤 Creating Super Admin account...');
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    await queryRunner.query(
      `INSERT INTO accounts (email, password_hash, role, status, created_at, updated_at)
       VALUES ($1, $2, 'SUPER_ADMIN', 'active', NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      ['admin@zentry.com', hashedPassword],
    );
    console.log(
      '✅ Super Admin account created (email: admin@zentry.com, password: Admin@123)',
    );

    await queryRunner.commitTransaction();
    console.log('🎉 RBAC seeding completed successfully!');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error seeding RBAC:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// Run seeding if executed directly
if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DataSource } = require('typeorm');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config();

  const DATABASE_URL =
    process.env.DATABASE_URL ||
    'postgresql://postgres:Qqanhkien@localhost:5432/IAM';

  const dataSource = new DataSource({
    type: 'postgres',
    url: DATABASE_URL,
    entities: [__dirname + '/../../persistence/typeorm/*.schema{.ts,.js}'],
    synchronize: false,
  });

  dataSource
    .initialize()
    .then(async () => {
      await seedRBAC(dataSource);
      await dataSource.destroy();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to run seeding:', error);
      process.exit(1);
    });
}
