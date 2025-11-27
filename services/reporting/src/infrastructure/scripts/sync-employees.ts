import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

/**
 * Script to perform initial sync of employee data from Employee Service
 * Run this after creating employees_cache table
 * 
 * Usage:
 *   npm run sync:employees
 */
async function syncEmployees() {
  console.log('🚀 Starting employee sync...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  try {
    // Get Employee Service client (if exists)
    let employeeClient: ClientProxy;
    try {
      employeeClient = app.get('EMPLOYEE_SERVICE');
    } catch (error) {
      console.warn('⚠️ EMPLOYEE_SERVICE not configured. Please configure RabbitMQ connection.');
      console.log('💡 Employees will be synced automatically via events: employee.created, employee.updated');
      await app.close();
      return;
    }

    // Connect to Employee Service
    await employeeClient.connect();
    console.log('✅ Connected to Employee Service');

    // Fetch all active employees
    console.log('📥 Fetching employees from Employee Service...');
    const employees = await firstValueFrom(
      employeeClient.send('employee.get-all', { status: 'ACTIVE' })
    );

    console.log(`📊 Found ${employees?.length || 0} employees`);

    if (!employees || employees.length === 0) {
      console.log('✅ No employees to sync');
      await employeeClient.close();
      await app.close();
      return;
    }

    // Clear existing cache
    await dataSource.query('DELETE FROM employees_cache');
    console.log('🗑️ Cleared existing cache');

    // Insert employees
    let synced = 0;
    for (const emp of employees) {
      try {
        await dataSource.query(
          `INSERT INTO employees_cache (
            employee_id, employee_code, full_name, email,
            department_id, department_name, position_name, status,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          ON CONFLICT (employee_id) DO NOTHING`,
          [
            emp.id,
            emp.employee_code,
            emp.full_name,
            emp.email,
            emp.department_id,
            emp.department_name || 'Unknown',
            emp.position_name || 'Unknown',
            emp.status || 'ACTIVE',
          ],
        );
        synced++;
        
        if (synced % 10 === 0) {
          console.log(`📝 Synced ${synced}/${employees.length} employees...`);
        }
      } catch (error) {
        console.error(`❌ Failed to sync employee ${emp.employee_code}:`, error);
      }
    }

    console.log(`✅ Successfully synced ${synced} employees to cache`);

    await employeeClient.close();
  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await app.close();
  }
}

syncEmployees()
  .then(() => {
    console.log('✨ Sync completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Sync error:', error);
    process.exit(1);
  });
