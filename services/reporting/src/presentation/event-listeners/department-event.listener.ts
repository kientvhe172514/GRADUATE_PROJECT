import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DataSource } from 'typeorm';

/**
 * Department Event Listener
 * 
 * Listens to department events from Employee Service
 * Maintains departments_cache for fast lookups
 * 
 * Note: Departments are NOT deleted, only deactivated
 * This is important for historical reporting
 */
@Controller()
export class DepartmentEventListener {
  private readonly logger = new Logger(DepartmentEventListener.name);

  constructor(private readonly dataSource: DataSource) {}

  @EventPattern('department_created')
  async handleDepartmentCreated(@Payload() data: any) {
    this.logger.log(
      `📥 Received: department_created for ${data.department_name}`,
    );

    try {
      // DepartmentCreatedEventDto uses 'id' field (not 'department_id')
      const departmentId = data.id;
      const departmentName = data.department_name;
      const departmentCode = data.department_code;
      const managerId = data.manager_id || null;
      const parentDepartmentId = data.parent_department_id || null;
      const status = data.status || 'ACTIVE';

      await this.dataSource.query(
        `INSERT INTO departments_cache (
          department_id, department_name, department_code, 
          manager_id, parent_department_id, status, 
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (department_id) 
        DO UPDATE SET
          department_name = EXCLUDED.department_name,
          department_code = EXCLUDED.department_code,
          manager_id = EXCLUDED.manager_id,
          parent_department_id = EXCLUDED.parent_department_id,
          status = EXCLUDED.status,
          updated_at = NOW()`,
        [
          departmentId,
          departmentName,
          departmentCode,
          managerId,
          parentDepartmentId,
          status,
        ],
      );

      this.logger.log(
        `✅ Synced department ${departmentName} (ID: ${departmentId}) to cache`,
      );

      // Also update employees_cache if employees are in this department
      await this.dataSource.query(
        `UPDATE employees_cache 
         SET department_name = $1, updated_at = NOW()
         WHERE department_id = $2`,
        [departmentName, departmentId],
      );
      this.logger.log(
        `✅ Updated department_name in employees_cache for department_id=${departmentId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to sync department ${data.department_name}:`,
        error,
      );
    }
  }

  @EventPattern('department_updated')
  async handleDepartmentUpdated(@Payload() data: any) {
    // Employee service publishes DepartmentUpdatedEventDto
    // DTO uses 'department_id' field (transformed from entity's 'id')
    const departmentId = data.department_id;
    this.logger.log(
      `📥 Received: department_updated for department_id=${departmentId}`,
    );

    try {
      const departmentName = data.department_name;
      const departmentCode = data.department_code;
      const managerId = data.manager_id || null;
      const parentDepartmentId = data.parent_department_id || null;
      const status = data.status || 'ACTIVE';

      await this.dataSource.query(
        `UPDATE departments_cache SET
          department_name = $2,
          department_code = $3,
          manager_id = $4,
          parent_department_id = $5,
          status = $6,
          updated_at = NOW()
        WHERE department_id = $1`,
        [
          departmentId,
          departmentName,
          departmentCode,
          managerId,
          parentDepartmentId,
          status,
        ],
      );

      this.logger.log(
        `✅ Updated department ${departmentId} in cache (status: ${status})`,
      );

      // Cascade update to employees_cache
      await this.dataSource.query(
        `UPDATE employees_cache 
         SET department_name = $1, updated_at = NOW()
         WHERE department_id = $2`,
        [departmentName, departmentId],
      );
      this.logger.log(`✅ Cascaded department name update to employees_cache`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to update department ${departmentId}:`,
        error,
      );
    }
  }

  @EventPattern('department_deleted')
  async handleDepartmentDeleted(@Payload() data: any) {
    this.logger.log(
      `📥 Received: department_deleted for department_id=${data.id}`,
    );

    try {
      // Mark as INACTIVE but DO NOT DELETE for historical reports
      await this.dataSource.query(
        `UPDATE departments_cache SET
          status = 'INACTIVE',
          updated_at = NOW()
        WHERE department_id = $1`,
        [data.id],
      );

      this.logger.log(`✅ Marked department ${data.id} as INACTIVE`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to mark deleted department ${data.id}:`,
        error,
      );
    }
  }

  @EventPattern('department_manager_assigned')
  async handleDepartmentManagerAssigned(@Payload() data: any) {
    this.logger.log(
      `📥 Received: department_manager_assigned for department_id=${data.department_id}`,
    );

    try {
      await this.dataSource.query(
        `UPDATE departments_cache SET
          manager_id = $2,
          updated_at = NOW()
        WHERE department_id = $1`,
        [data.department_id, data.manager_id],
      );

      this.logger.log(
        `✅ Updated manager for department ${data.department_id}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to update manager for department ${data.department_id}:`,
        error,
      );
    }
  }
}
