/**
 * Employee Service - Bulk Sync Publisher
 * 
 * This script emits employee.bulk-sync events to RabbitMQ
 * in batches to allow other services (like reporting) to sync employee data
 * 
 * Usage:
 *   - Add to employee service
 *   - Can be triggered manually or scheduled (e.g., daily at 2 AM)
 *   - Processes employees in configurable batch sizes
 */

import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class EmployeeBulkSyncPublisher {
  private readonly logger = new Logger(EmployeeBulkSyncPublisher.name);
  private readonly BATCH_SIZE = 100; // Process 100 employees per batch

  constructor(
    private readonly dataSource: DataSource,
    @Inject('RABBITMQ_CLIENT') // Your RabbitMQ client
    private readonly rabbitMQClient: ClientProxy,
  ) {}

  /**
   * Publish all employees in batches
   * Called when reporting service needs initial sync or recovery
   */
  async publishAllEmployees() {
    this.logger.log('🚀 Starting bulk employee sync...');

    try {
      // Count total employees
      const [{ count }] = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM employees',
      );
      const totalEmployees = parseInt(count);

      if (totalEmployees === 0) {
        this.logger.warn('⚠️ No employees to sync');
        return;
      }

      const totalBatches = Math.ceil(totalEmployees / this.BATCH_SIZE);
      this.logger.log(
        `📊 Total: ${totalEmployees} employees, ${totalBatches} batches (batch size: ${this.BATCH_SIZE})`,
      );

      // Process in batches
      for (let batch = 0; batch < totalBatches; batch++) {
        const offset = batch * this.BATCH_SIZE;
        
        // Fetch batch from database
        const employees = await this.dataSource.query(
          `SELECT 
            id, employee_code, full_name, email,
            department_id, position_name, status,
            d.name as department_name
          FROM employees e
          LEFT JOIN departments d ON e.department_id = d.id
          ORDER BY e.id
          LIMIT $1 OFFSET $2`,
          [this.BATCH_SIZE, offset],
        );

        // Emit batch event
        this.rabbitMQClient.emit('employee.bulk-sync', {
          employees: employees,
          batch_number: batch + 1,
          total_batches: totalBatches,
          batch_size: employees.length,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(
          `📤 Published batch ${batch + 1}/${totalBatches} (${employees.length} employees)`,
        );

        // Small delay between batches to avoid overwhelming the queue
        await this.delay(100);
      }

      this.logger.log(`✅ Bulk sync complete: ${totalEmployees} employees published`);
      
      return {
        success: true,
        total_employees: totalEmployees,
        total_batches: totalBatches,
        batch_size: this.BATCH_SIZE,
      };
    } catch (error) {
      this.logger.error('❌ Bulk sync failed:', error);
      throw error;
    }
  }

  /**
   * Listen for bulk sync requests from other services
   */
  async handleBulkSyncRequest(data: any) {
    this.logger.log(`📥 Received bulk sync request from: ${data.requester}`);
    await this.publishAllEmployees();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
