import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DataSource } from 'typeorm';

/**
 * Employee Event Listener (Queue-based)
 * 
 * Consumes employee events from RabbitMQ queue
 * Maintains employees_cache table for fast reporting queries
 * 
 * This is a QUEUE-BASED approach (not RPC) to handle large data volumes
 * Events are processed asynchronously and in batches
 */
@Controller()
export class EmployeeEventListener {
  private readonly logger = new Logger(EmployeeEventListener.name);

  constructor(private readonly dataSource: DataSource) {}

  @EventPattern('employee.created')
  async handleEmployeeCreated(@Payload() data: any) {
    this.logger.log(`📥 Received: employee.created for ${data.employee_code}`);
    
    try {
      await this.dataSource.query(
        `INSERT INTO employees_cache (
          employee_id, employee_code, full_name, email, 
          department_id, department_name, position_name, status, 
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (employee_id) 
        DO UPDATE SET
          employee_code = EXCLUDED.employee_code,
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          department_id = EXCLUDED.department_id,
          department_name = EXCLUDED.department_name,
          position_name = EXCLUDED.position_name,
          status = EXCLUDED.status,
          updated_at = NOW()`,
        [
          data.id,
          data.employee_code,
          data.full_name,
          data.email,
          data.department_id,
          data.department_name || 'Unknown',
          data.position_name || 'Unknown',
          data.status || 'ACTIVE',
        ],
      );
      
      this.logger.log(`✅ Synced employee ${data.employee_code} to cache`);
    } catch (error) {
      this.logger.error(`❌ Failed to sync employee ${data.employee_code}:`, error);
    }
  }

  @EventPattern('employee.updated')
  async handleEmployeeUpdated(@Payload() data: any) {
    this.logger.log(`📥 Received: employee.updated for ${data.employee_code}`);
    
    try {
      await this.dataSource.query(
        `UPDATE employees_cache SET
          employee_code = $2,
          full_name = $3,
          email = $4,
          department_id = $5,
          department_name = $6,
          position_name = $7,
          status = $8,
          updated_at = NOW()
        WHERE employee_id = $1`,
        [
          data.id,
          data.employee_code,
          data.full_name,
          data.email,
          data.department_id,
          data.department_name || 'Unknown',
          data.position_name || 'Unknown',
          data.status || 'ACTIVE',
        ],
      );
      
      this.logger.log(`✅ Updated employee ${data.employee_code} in cache`);
    } catch (error) {
      this.logger.error(`❌ Failed to update employee ${data.employee_code}:`, error);
    }
  }

  @EventPattern('employee.terminated')
  async handleEmployeeTerminated(@Payload() data: any) {
    this.logger.log(`📥 Received: employee.terminated for ${data.employee_code}`);
    
    try {
      await this.dataSource.query(
        `UPDATE employees_cache SET
          status = 'TERMINATED',
          updated_at = NOW()
        WHERE employee_id = $1`,
        [data.id],
      );
      
      this.logger.log(`✅ Marked employee ${data.employee_code} as TERMINATED`);
    } catch (error) {
      this.logger.error(`❌ Failed to terminate employee ${data.employee_code}:`, error);
    }
  }

  @EventPattern('employee.department-changed')
  async handleEmployeeDepartmentChanged(@Payload() data: any) {
    this.logger.log(`📥 Received: employee.department-changed for employee ${data.employee_id}`);
    
    try {
      await this.dataSource.query(
        `UPDATE employees_cache SET
          department_id = $2,
          department_name = $3,
          updated_at = NOW()
        WHERE employee_id = $1`,
        [data.employee_id, data.new_department_id, data.new_department_name],
      );
      
      this.logger.log(`✅ Updated department for employee ${data.employee_id}`);
    } catch (error) {
      this.logger.error(`❌ Failed to update department for employee ${data.employee_id}:`, error);
    }
  }

  /**
   * Handle bulk employee sync (for initial load or recovery)
   * Processes employees in batches to handle large data volumes
   */
  @EventPattern('employee.bulk-sync')
  async handleBulkSync(@Payload() data: any) {
    const { employees = [], batch_number = 1, total_batches = 1 } = data;
    
    this.logger.log(
      `📦 Received: employee.bulk-sync - Batch ${batch_number}/${total_batches} (${employees.length} employees)`,
    );
    
    if (employees.length === 0) {
      this.logger.warn('⚠️ Received empty employee batch');
      return;
    }

    let synced = 0;
    let failed = 0;

    for (const employee of employees) {
      try {
        await this.dataSource.query(
          `INSERT INTO employees_cache (
            employee_id, employee_code, full_name, email,
            department_id, department_name, position_name, status,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          ON CONFLICT (employee_id) 
          DO UPDATE SET
            employee_code = EXCLUDED.employee_code,
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            department_id = EXCLUDED.department_id,
            department_name = EXCLUDED.department_name,
            position_name = EXCLUDED.position_name,
            status = EXCLUDED.status,
            updated_at = NOW()`,
          [
            employee.id || employee.employee_id,
            employee.employee_code,
            employee.full_name,
            employee.email || '',
            employee.department_id || null,
            employee.department_name || 'Unknown',
            employee.position_name || 'Unknown',
            employee.status || 'ACTIVE',
          ],
        );
        synced++;
      } catch (error) {
        this.logger.error(`❌ Failed to sync employee ${employee.employee_code}:`, error);
        failed++;
      }
    }

    this.logger.log(
      `✅ Bulk sync batch ${batch_number}/${total_batches} complete: ${synced} synced, ${failed} failed`,
    );
  }

  /**
   * Get cache statistics (for monitoring)
   */
  async getCacheStats() {
    const result = await this.dataSource.query(`
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_employees,
        COUNT(CASE WHEN status = 'TERMINATED' THEN 1 END) as terminated_employees,
        MIN(updated_at) as oldest_update,
        MAX(updated_at) as latest_update
      FROM employees_cache
    `);
    
    return result[0];
  }
}
