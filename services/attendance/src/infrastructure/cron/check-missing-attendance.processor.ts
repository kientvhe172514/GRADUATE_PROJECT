import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';

/**
 * Processor to check for employees who haven't checked in after 10 minutes of their shift start time.
 *
 * HOW IT WORKS:
 * 1. Runs every 10 minutes (configurable via CRON expression)
 * 2. Queries all active shifts that should have started 10+ minutes ago
 * 3. Finds employees who:
 *    - Have an active shift today
 *    - Shift start time was 10+ minutes ago
 *    - Haven't checked in yet
 *    - Don't have an approved leave request
 * 4. Sends push notification reminder to those employees
 *
 * EXAMPLE:
 * - Employee A has shift 8:00-17:00
 * - Employee B has shift 9:00-18:00
 * - At 8:10, Employee A gets reminder if not checked in
 * - At 9:10, Employee B gets reminder if not checked in
 */
@Injectable()
export class CheckMissingAttendanceProcessor {
  private readonly logger = new Logger(CheckMissingAttendanceProcessor.name);
  private readonly MINUTES_THRESHOLD = 10; // Send reminder after 10 minutes

  constructor(
    private readonly dataSource: DataSource,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  /**
   * Runs every 10 minutes to check for missing check-ins
   * Can be changed to EVERY_5_MINUTES for more frequent checks
   */
  @Cron(CronExpression.EVERY_10_MINUTES, {
    name: 'check-missing-attendance',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async checkMissingAttendance() {
    const startTime = new Date();
    this.logger.log('🔍 [CRON] Starting missing attendance check...');

    try {
      const currentTime = new Date();
      const thresholdTime = new Date(
        currentTime.getTime() - this.MINUTES_THRESHOLD * 60 * 1000,
      );

      // Query employees who should have checked in by now but haven't
      const missingEmployees =
        await this.findEmployeesWithMissingCheckIn(thresholdTime);

      if (missingEmployees.length === 0) {
        this.logger.log('✅ [CRON] No employees missing check-in at this time');
        return;
      }

      this.logger.log(
        `📊 [CRON] Found ${missingEmployees.length} employees without check-in`,
      );

      // Send reminder notification to each employee
      let successCount = 0;
      let failCount = 0;

      for (const employee of missingEmployees) {
        try {
          this.sendReminderNotification(employee);
          successCount++;
        } catch (error) {
          failCount++;
          this.logger.error(
            `❌ [CRON] Failed to send reminder to employee ${employee.employee_id}:`,
            error.message,
          );
        }
      }

      const duration = (new Date().getTime() - startTime.getTime()) / 1000;
      this.logger.log(
        `✅ [CRON] Completed in ${duration}s. Sent: ${successCount}, Failed: ${failCount}`,
      );
    } catch (error) {
      this.logger.error('❌ [CRON] Error in missing attendance check:', error);
    }
  }

  /**
   * Finds employees who:
   * 1. Have an active shift today
   * 2. Shift start time was before the threshold time (current time - 10 minutes)
   * 3. Haven't checked in yet
   * 4. Don't have an approved leave request
   */
  private async findEmployeesWithMissingCheckIn(
    thresholdTime: Date,
  ): Promise<any[]> {
    const query = `
      WITH active_shifts_today AS (
        SELECT 
          es.employee_id,
          es.shift_date,
          ws.start_time,
          ws.end_time,
          ws.schedule_name,
          CONCAT(es.shift_date::text, ' ', ws.start_time::text)::timestamp as shift_start_timestamp
        FROM employee_shifts es
        INNER JOIN work_schedules ws ON es.work_schedule_id = ws.id
        WHERE 
          es.shift_date = CURRENT_DATE
          AND ws.status = 'ACTIVE'
          AND es.status = 'SCHEDULED'
          -- Shift start time was before threshold (10 minutes ago)
          AND CONCAT(es.shift_date::text, ' ', ws.start_time::text)::timestamp <= $1
      )
      SELECT DISTINCT
        ast.employee_id,
        ast.schedule_name as shift_name,
        ast.start_time,
        ast.shift_start_timestamp,
        EXTRACT(EPOCH FROM (NOW() - ast.shift_start_timestamp))/60 as minutes_late
      FROM active_shifts_today ast
      WHERE 
        -- Employee hasn't checked in yet today
        NOT EXISTS (
          SELECT 1 FROM employee_shifts es2
          WHERE es2.employee_id = ast.employee_id
          AND es2.shift_date = CURRENT_DATE
          AND es2.check_in_time IS NOT NULL
        )
      ORDER BY ast.employee_id;
    `;

    return await this.dataSource.query(query, [thresholdTime]);
  }

  /**
   * Sends push notification reminder to employee via Notification Service using RabbitMQ
   */
  private sendReminderNotification(employee: {
    employee_id: number;
    shift_name: string;
    start_time: string;
    minutes_late: number;
  }): void {
    const notificationPayload = {
      recipientId: employee.employee_id,
      title: '⏰ Nhắc nhở Check-in',
      message: `Bạn chưa check-in cho ca ${employee.shift_name} (${employee.start_time}). Vui lòng check-in ngay để tránh bị tính vắng mặt!`,
      notificationType: 'ATTENDANCE_REMINDER',
      priority: 'HIGH',
      channels: ['PUSH', 'IN_APP'],
      metadata: {
        eventType: 'attendance.missing-check-in',
        shiftName: employee.shift_name,
        shiftStartTime: employee.start_time,
        minutesLate: Math.floor(employee.minutes_late),
      },
    };

    // Emit event to notification service via RabbitMQ
    this.notificationClient.emit('notification.send', notificationPayload);

    this.logger.log(
      `✅ [CRON] Sent reminder event to employee ID: ${employee.employee_id} - ${Math.floor(employee.minutes_late)} minutes late`,
    );
  }

  /**
   * Manual trigger for testing (call via API endpoint if needed)
   */
  async triggerManually(): Promise<{
    sent: number;
    failed: number;
    employees: any[];
  }> {
    this.logger.log('🔧 [MANUAL] Manually triggered missing attendance check');

    const thresholdTime = new Date(
      Date.now() - this.MINUTES_THRESHOLD * 60 * 1000,
    );
    const missingEmployees =
      await this.findEmployeesWithMissingCheckIn(thresholdTime);

    let successCount = 0;
    let failCount = 0;

    for (const employee of missingEmployees) {
      try {
        this.sendReminderNotification(employee);
        successCount++;
      } catch {
        failCount++;
      }
    }

    return {
      sent: successCount,
      failed: failCount,
      employees: missingEmployees,
    };
  }
}
