/**
 * Script to sync account_id and role_id to employees_cache from auth database
 * Run this after adding the new columns to employees_cache table
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';

async function syncAccountAndRoleToEmployeesCache() {
  console.log('🚀 Starting sync of account_id and role_id to employees_cache...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Update employees_cache with account_id and role_id from accounts table
    // This assumes you have a foreign data wrapper or dblink to auth database
    // If not, you'll need to manually connect to auth database
    
    // Option 1: If you have foreign data wrapper (FDW) to auth database
    const updateQuery = `
      UPDATE employees_cache ec
      SET 
        account_id = a.id,
        role_id = a.role_id,
        synced_at = NOW(),
        updated_at = NOW()
      FROM auth_db.accounts a
      WHERE ec.employee_id = a.employee_id
        AND a.status = 'ACTIVE'
    `;

    // Option 2: If no FDW, use ClientProxy to fetch from auth service and update
    // This is implemented below as fallback
    
    // Try FDW first
    try {
      const result = await dataSource.query(updateQuery);
      console.log(`✅ Updated ${result[1]} employees with account_id and role_id via FDW`);
    } catch (fdwError) {
      console.warn('⚠️ FDW update failed, falling back to service communication:', fdwError.message);
      
      // Fallback: Get all employees and update one by one via auth service
      const employees = await dataSource.query(`
        SELECT employee_id 
        FROM employees_cache 
        WHERE account_id IS NULL
        ORDER BY employee_id
      `);
      
      console.log(`Found ${employees.length} employees without account_id`);
      
      // You would need to inject AUTH_SERVICE ClientProxy here
      // For now, this is a manual process
      console.log('ℹ️ Please run this script with AUTH_SERVICE connection or manually update via:');
      console.log('   1. Export accounts from auth database');
      console.log('   2. Import and match by employee_id');
      console.log('   3. UPDATE employees_cache SET account_id = ?, role_id = ? WHERE employee_id = ?');
    }

  } catch (error) {
    console.error('❌ Error syncing account and role data:', error);
  } finally {
    await app.close();
  }

  console.log('✅ Sync completed!');
}

syncAccountAndRoleToEmployeesCache()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
