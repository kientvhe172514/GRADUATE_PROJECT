/**
 * Script to sync roles from auth database to roles_cache
 * Run this after creating roles_cache table
 * 
 * Usage:
 *   npm run sync:roles
 * 
 * Or manually:
 *   ts-node src/infrastructure/scripts/sync-roles.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';

async function syncRoles() {
  console.log('🚀 Starting roles sync to roles_cache...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Method 1: If you have FDW (Foreign Data Wrapper) to auth database
    try {
      const syncQuery = `
        INSERT INTO roles_cache (role_id, code, name, level, status, synced_at, created_at, updated_at)
        SELECT 
          id as role_id,
          code,
          name,
          level,
          status,
          NOW() as synced_at,
          NOW() as created_at,
          NOW() as updated_at
        FROM auth_db.roles
        WHERE status = 'ACTIVE'
        ON CONFLICT (role_id) DO UPDATE SET
          code = EXCLUDED.code,
          name = EXCLUDED.name,
          level = EXCLUDED.level,
          status = EXCLUDED.status,
          synced_at = NOW(),
          updated_at = NOW()
      `;

      const result = await dataSource.query(syncQuery);
      console.log(`✅ Synced ${result[1] || 0} roles via FDW`);
    } catch (fdwError) {
      console.warn('⚠️ FDW not available, using manual insert...');
      
      // Method 2: Manual insert with actual roles data from auth DB
      const roles = [
        { id: 1, code: 'ADMIN', name: 'Administrator', description: 'Full system access with all permissions', level: 1, is_system_role: true },
        { id: 2, code: 'HR_MANAGER', name: 'HR Manager', description: 'Manages employees, departments, positions, and HR operations', level: 2, is_system_role: true },
        { id: 3, code: 'DEPARTMENT_MANAGER', name: 'Department Manager', description: 'Manages department employees and operations', level: 3, is_system_role: true },
        { id: 4, code: 'EMPLOYEE', name: 'Employee', description: 'Basic employee access to view own information and submit requests', level: 4, is_system_role: true },
        { id: 5, code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Full system access with all permissions', level: 1, is_system_role: true },
      ];

      for (const role of roles) {
        await dataSource.query(
          `INSERT INTO roles_cache (role_id, code, name, description, level, is_system_role, status, synced_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', NOW(), NOW(), NOW())
           ON CONFLICT (role_id) DO UPDATE SET
             code = EXCLUDED.code,
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             level = EXCLUDED.level,
             is_system_role = EXCLUDED.is_system_role,
             synced_at = NOW(),
             updated_at = NOW()`,
          [role.id, role.code, role.name, role.description, role.level, role.is_system_role],
        );
      }

      console.log(`✅ Manually inserted ${roles.length} roles`);
      
      // Method 2: Manual insert (you need to get data from auth DB first)
      console.log(`
📋 Please run this in auth database to export roles:

SELECT id, code, name, level, status 
FROM roles 
WHERE status = 'ACTIVE' 
ORDER BY level;

Then manually INSERT into roles_cache:

INSERT INTO roles_cache (role_id, code, name, level, status)
VALUES 
  (1, 'SUPER_ADMIN', 'Super Administrator', 1, 'ACTIVE'),
  (2, 'ADMIN', 'Administrator', 2, 'ACTIVE'),
  (3, 'MANAGER', 'Manager', 3, 'ACTIVE'),
  (4, 'HR', 'Human Resources', 4, 'ACTIVE'),
  (5, 'EMPLOYEE', 'Employee', 5, 'ACTIVE')
ON CONFLICT (role_id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  level = EXCLUDED.level,
  status = EXCLUDED.status,
  synced_at = NOW(),
  updated_at = NOW();
      `);
    }

    // Verify sync
    const roles = await dataSource.query(
      'SELECT role_id, code, name, status FROM roles_cache ORDER BY level',
    );
    
    console.log('\n✅ Current roles in roles_cache:');
    console.table(roles);

  } catch (error) {
    console.error('❌ Error syncing roles:', error);
  } finally {
    await app.close();
  }
}

syncRoles()
  .then(() => {
    console.log('\n✅ Roles sync completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
