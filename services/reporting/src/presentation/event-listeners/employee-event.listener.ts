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

  @EventPattern('employee_created')
  async handleEmployeeCreated(@Payload() data: any) {
    this.logger.log(`📥 Received: employee_created for ${data.employee_code}`);
    
    try {
      // Fetch department and position names if IDs are provided
      let departmentName = null;
      let positionName = null;

      if (data.department_id) {
        const deptResult = await this.dataSource.query(
          `SELECT department_name FROM departments_cache WHERE department_id = $1 LIMIT 1`,
          [data.department_id],
        );
        departmentName = deptResult[0]?.department_name || null;
      }

      if (data.position_id) {
        const posResult = await this.dataSource.query(
          `SELECT position_name FROM positions_cache WHERE position_id = $1 LIMIT 1`,
          [data.position_id],
        );
        positionName = posResult[0]?.position_name || null;
      }

      await this.dataSource.query(
        `INSERT INTO employees_cache (
          employee_id, employee_code, full_name, email, 
          department_id, department_name, position_id, position_name, 
          join_date, status, synced_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())
        ON CONFLICT (employee_id) 
        DO UPDATE SET
          employee_code = EXCLUDED.employee_code,
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          department_id = EXCLUDED.department_id,
          department_name = EXCLUDED.department_name,
          position_id = EXCLUDED.position_id,
          position_name = EXCLUDED.position_name,
          join_date = EXCLUDED.join_date,
          status = EXCLUDED.status,
          synced_at = NOW(),
          updated_at = NOW()`,
        [
          data.id,
          data.employee_code,
          data.full_name,
          data.email,
          data.department_id || null,
          departmentName,
          data.position_id || null,
          positionName,
          data.hire_date,
          data.status || 'ACTIVE',
        ],
      );
      
      this.logger.log(`✅ Synced employee ${data.employee_code} to cache`);
    } catch (error) {
      this.logger.error(`❌ Failed to sync employee ${data.employee_code}:`, error);
    }
  }

  @EventPattern('employee_updated')
  async handleEmployeeUpdated(@Payload() data: any) {
    this.logger.log(`📥 Received: employee_updated for employee_id=${data.employee_id}`);
    
    try {
      // Fetch department and position names if IDs are provided
      let departmentName = null;
      let positionName = null;

      if (data.department_id) {
        const deptResult = await this.dataSource.query(
          `SELECT department_name FROM departments_cache WHERE department_id = $1 LIMIT 1`,
          [data.department_id],
        );
        departmentName = deptResult[0]?.department_name || null;
      }

      if (data.position_id) {
        const posResult = await this.dataSource.query(
          `SELECT position_name FROM positions_cache WHERE position_id = $1 LIMIT 1`,
          [data.position_id],
        );
        positionName = posResult[0]?.position_name || null;
      }

      await this.dataSource.query(
        `UPDATE employees_cache SET
          employee_code = $2,
          full_name = $3,
          email = $4,
          department_id = $5,
          department_name = $6,
          position_id = $7,
          position_name = $8,
          join_date = $9,
          status = $10,
          synced_at = NOW(),
          updated_at = NOW()
        WHERE employee_id = $1`,
        [
          data.employee_id,
          data.employee_code,
          data.full_name,
          data.email,
          data.department_id || null,
          departmentName,
          data.position_id || null,
          positionName,
          data.hire_date,
          data.status || 'ACTIVE',
        ],
      );
      
      this.logger.log(`✅ Updated employee ${data.employee_code} in cache`);
    } catch (error) {
      this.logger.error(`❌ Failed to update employee ${data.employee_code}:`, error);
    }
  }

  @EventPattern('employee_terminated')
  async handleEmployeeTerminated(@Payload() data: any) {
    this.logger.log(`📥 Received: employee_terminated for ${data.employee_code}`);
    
    try {
      await this.dataSource.query(
        `UPDATE employees_cache SET
          status = 'TERMINATED',
          synced_at = NOW(),
          updated_at = NOW()
        WHERE employee_id = $1`,
        [data.id],
      );
      
      this.logger.log(`✅ Marked employee ${data.employee_code} as TERMINATED`);
    } catch (error) {
      this.logger.error(`❌ Failed to terminate employee ${data.employee_code}:`, error);
    }
  }

  @EventPattern('employee_department_assigned')
  async handleEmployeeDepartmentAssigned(@Payload() data: any) {
    this.logger.log(`📥 Received: employee_department_assigned for employee_id=${data.employee_id}`);
    
    try {
      // Fetch department name
      let departmentName = null;
      if (data.to_department_id) {
        const deptResult = await this.dataSource.query(
          `SELECT department_name FROM departments_cache WHERE department_id = $1 LIMIT 1`,
          [data.to_department_id],
        );
        departmentName = deptResult[0]?.department_name || null;
      }

      await this.dataSource.query(
        `UPDATE employees_cache SET
          department_id = $2,
          department_name = $3,
          synced_at = NOW(),
          updated_at = NOW()
        WHERE employee_id = $1`,
        [data.employee_id, data.to_department_id, departmentName],
      );
      
      this.logger.log(`✅ Updated department for employee ${data.employee_id}`);
    } catch (error) {
      this.logger.error(`❌ Failed to update department for employee ${data.employee_id}:`, error);
    }
  }

  @EventPattern('employee_position_assigned')
  async handleEmployeePositionAssigned(@Payload() data: any) {
    this.logger.log(`📥 Received: employee_position_assigned for employee_id=${data.employee_id}`);
    
    try {
      // Fetch position name
      let positionName = null;
      if (data.to_position_id) {
        const posResult = await this.dataSource.query(
          `SELECT position_name FROM positions_cache WHERE position_id = $1 LIMIT 1`,
          [data.to_position_id],
        );
        positionName = posResult[0]?.position_name || null;
      }

      await this.dataSource.query(
        `UPDATE employees_cache SET
          position_id = $2,
          position_name = $3,
          synced_at = NOW(),
          updated_at = NOW()
        WHERE employee_id = $1`,
        [data.employee_id, data.to_position_id, positionName],
      );
      
      this.logger.log(`✅ Updated position for employee ${data.employee_id}`);
    } catch (error) {
      this.logger.error(`❌ Failed to update position for employee ${data.employee_id}:`, error);
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
        // Fetch department and position names if IDs exist
        let departmentName = null;
        let positionName = null;

        if (employee.department_id) {
          const deptResult = await this.dataSource.query(
            `SELECT department_name FROM departments_cache WHERE department_id = $1 LIMIT 1`,
            [employee.department_id],
          );
          departmentName = deptResult[0]?.department_name || null;
        }

        if (employee.position_id) {
          const posResult = await this.dataSource.query(
            `SELECT position_name FROM positions_cache WHERE position_id = $1 LIMIT 1`,
            [employee.position_id],
          );
          positionName = posResult[0]?.position_name || null;
        }

        await this.dataSource.query(
          `INSERT INTO employees_cache (
            employee_id, employee_code, full_name, email,
            department_id, department_name, position_id, position_name,
            join_date, status, synced_at, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())
          ON CONFLICT (employee_id) 
          DO UPDATE SET
            employee_code = EXCLUDED.employee_code,
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            department_id = EXCLUDED.department_id,
            department_name = EXCLUDED.department_name,
            position_id = EXCLUDED.position_id,
            position_name = EXCLUDED.position_name,
            join_date = EXCLUDED.join_date,
            status = EXCLUDED.status,
            synced_at = NOW(),
            updated_at = NOW()`,
          [
            employee.id || employee.employee_id,
            employee.employee_code,
            employee.full_name,
            employee.email || '',
            employee.department_id || null,
            departmentName,
            employee.position_id || null,
            positionName,
            employee.hire_date || employee.join_date,
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
   * Handle account created event from auth service
   * Updates employee cache with account_id and role_id
   */
  @EventPattern('account_created')
  async handleAccountCreated(@Payload() data: any) {
    this.logger.log(`📥 Received: account_created for employee_id=${data.employee_id}`);
    
    try {
      await this.dataSource.query(
        `UPDATE employees_cache SET
          account_id = $2,
          role_id = $3,
          synced_at = NOW(),
          updated_at = NOW()
        WHERE employee_id = $1`,
        [data.employee_id, data.id, data.role_id],
      );
      
      this.logger.log(`✅ Updated account_id and role_id for employee ${data.employee_id}`);
    } catch (error) {
      this.logger.error(`❌ Failed to update account for employee ${data.employee_id}:`, error);
    }
  }

  /**
   * Handle account updated event from auth service
   * Updates employee cache with role_id changes
   */
  @EventPattern('account_updated')
  async handleAccountUpdated(@Payload() data: any) {
    this.logger.log(`📥 Received: account_updated for employee_id=${data.employee_id}`);
    
    try {
      await this.dataSource.query(
        `UPDATE employees_cache SET
          role_id = $2,
          synced_at = NOW(),
          updated_at = NOW()
        WHERE employee_id = $1`,
        [data.employee_id, data.role_id],
      );
      
      this.logger.log(`✅ Updated role_id for employee ${data.employee_id}`);
    } catch (error) {
      this.logger.error(`❌ Failed to update role for employee ${data.employee_id}:`, error);
    }
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
