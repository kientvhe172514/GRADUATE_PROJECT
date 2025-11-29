import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';

/**
 * Processor to check for employees who haven't checked in after 10 minutes of their shift start time.
 *
 * HOW IT WORKS:
 * 1. Runs every 10 minutes (configurable via CRON expression)
 * 2. Finds shifts where:
 *    - Shift start time was EXACTLY 10-19 minutes ago (narrow window)
 *    - Employee hasn't checked in yet
 *    - Status is still SCHEDULED
 * 3. Sends ONE reminder per shift (only in the 10-minute window)
 *
 * EXAMPLE:
 * - Employee A has shift 13:00-17:00
 * - At 13:10, checks if A checked in → If NO → Send reminder
 * - At 13:20, 13:30, etc. → Skip (already past reminder window)
 *
 * IMPORTANT: Only sends reminder ONCE per shift (within 10-19 minutes after start)
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
   * Only sends reminder in narrow window (10-19 minutes after shift start)
   */
  @Cron(CronExpression.EVERY_10_MINUTES, {
    name: 'check-missing-attendance',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async checkMissingAttendance() {
    const startTime = new Date();
    this.logger.log('🔍 [CRON] Starting missing attendance check...');

    try {
      // Query employees in reminder window (10-19 minutes after shift start)
      const missingEmployees = await this.findEmployeesInReminderWindow();

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
            `❌ [CRON] Failed to send reminder to employee ${employee?.employee_id || 'unknown'}: ${String(
              (error as any)?.message || error,
            )}`,
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
   * Finds employees in reminder window (10-19 minutes after shift start)
   * This ensures reminder is sent ONLY ONCE per shift
   *
   * Logic:
   * 1. Shift start time was 10-19 minutes ago (narrow window)
   * 2. Status = SCHEDULED (not checked in yet)
   * 3. No check_in_time yet
   *
   * Example:
   * - Current time: 13:15
   * - Shift starts at 13:00
   * - Minutes elapsed: 15 → IN WINDOW (10-19) → Send reminder
   * - If current time is 13:25 → 25 minutes → OUT OF WINDOW → Skip
   */
  private async findEmployeesInReminderWindow(): Promise<any[]> {
    const query = `
      SELECT 
        es.id as shift_id,
        es.employee_id,
        es.employee_code,
        es.shift_date,
        es.scheduled_start_time,
        es.scheduled_end_time,
        (es.shift_date::text || ' ' || es.scheduled_start_time)::timestamp as shift_start_ts,
        EXTRACT(EPOCH FROM (NOW() + INTERVAL '7 hours' - (es.shift_date::text || ' ' || es.scheduled_start_time)::timestamp))/60 as minutes_since_start
      FROM employee_shifts es
      WHERE 
        es.shift_date = CURRENT_DATE
        AND es.status = 'SCHEDULED'
        AND es.check_in_time IS NULL
        AND es.shift_type = 'REGULAR'
        -- Only in reminder window: 10-19 minutes after shift start
        AND EXTRACT(EPOCH FROM (NOW() + INTERVAL '7 hours' - (es.shift_date::text || ' ' || es.scheduled_start_time)::timestamp))/60 BETWEEN 10 AND 19
      ORDER BY es.employee_id;
    `;

    return await this.dataSource.query(query);
  }

  /**
   * Sends push notification reminder to employee via Notification Service using RabbitMQ
   */
  private sendReminderNotification(employee: any): void {
    const notificationPayload = {
      recipientId: employee.employee_id,
      title: '⏰ Nhắc nhở Check-in',
      message: `Chào ${employee.employee_code}, bạn chưa check-in cho ca ${employee.scheduled_start_time}. Vui lòng check-in ngay để tránh bị tính vắng mặt!`,
      notificationType: 'ATTENDANCE_REMINDER',
      priority: 'HIGH',
      channels: ['PUSH', 'IN_APP'],
      metadata: {
        eventType: 'attendance.missing-check-in',
        shiftId: employee.shift_id,
        shiftStartTime: employee.scheduled_start_time,
        minutesSinceStart: Math.floor(employee.minutes_since_start),
      },
    };

    // Emit event to notification service via RabbitMQ
    this.notificationClient.emit('notification.send', notificationPayload);

    this.logger.log(
      `✅ [CRON] Sent reminder to ${employee.employee_code} (shift_id=${employee.shift_id}) - ${Math.floor(employee.minutes_since_start)} minutes since start`,
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

    const missingEmployees = await this.findEmployeesInReminderWindow();

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
