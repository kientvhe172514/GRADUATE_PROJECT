import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

/**
 * End-of-Day Cron Job to automatically mark employees as ABSENT
 *
 * SCHEDULE: Every day at 23:00 (11 PM)
 * PURPOSE: Mark employees who didn't check in as ABSENT
 *
 * LOGIC:
 * 1. Find all shifts with status = 'SCHEDULED' (not checked in)
 * 2. Check if shift end time + grace period (1 hour) has passed
 * 3. Mark shift as ABSENT
 * 4. Create attendance violation record
 * 5. Send notification to employee and manager
 *
 * GRACE PERIOD: 1 hour after shift end time
 * Example: Shift 08:00-17:00 → Grace until 18:00
 *
 * WHY 23:00?
 * - Gives employees full day + grace period to check in
 * - Runs after business hours (no interference)
 * - Allows HR to review next morning
 */
@Injectable()
export class EndOfDayAbsentMarkerProcessor {
  private readonly logger = new Logger(EndOfDayAbsentMarkerProcessor.name);
  private readonly GRACE_PERIOD_HOURS: number;

  constructor(
    private readonly dataSource: DataSource,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {
    this.GRACE_PERIOD_HOURS = Number(
      this.configService.get<number>('ABSENT_GRACE_PERIOD_HOURS') || 1,
    );
    this.logger.log(
      `⚙️ Absent marker grace period: ${this.GRACE_PERIOD_HOURS} hour(s)`,
    );
  }

  /**
   * Runs hourly to mark shifts as ABSENT when their scheduled end time + grace period has passed.
   * Running hourly (instead of fixed 23:00) ensures we correctly handle night shifts that end after midnight.
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'end-of-day-absent-marker',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async markAbsentShifts() {
    const startTime = Date.now();
    this.logger.log('🔍 [CRON] Starting end-of-day absent marking...');

    try {
      // Step 1: Find shifts that should be marked as absent
      const shiftsToMark = await this.findShiftsToMarkAbsent();

      if (shiftsToMark.length === 0) {
        this.logger.log('✅ [CRON] No shifts to mark as absent today');
        return;
      }

      this.logger.log(
        `📊 [CRON] Found ${shiftsToMark.length} shifts to mark as ABSENT`,
      );

      // Step 2: Update shifts to ABSENT status
      const updated = await this.updateShiftsToAbsent(
        shiftsToMark.map((s) => s.shift_id),
      );

      // Step 3: Create violation records
      const violations = await this.createViolationRecords(shiftsToMark);

      // Step 4: Send notifications
      let notificationsSent = 0;
      for (const shift of shiftsToMark) {
        try {
          this.sendAbsentNotification(shift);
          notificationsSent++;
        } catch (error) {
          this.logger.error(
            `❌ Failed to send notification for shift ${shift.shift_id}:`,
            error,
          );
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      this.logger.log(
        `✅ [CRON] Absent marking completed in ${duration}s. ` +
          `Marked: ${updated}, Violations: ${violations}, Notifications: ${notificationsSent}`,
      );
    } catch (error) {
      this.logger.error('❌ [CRON] Error in absent marking:', error);
    }
  }

  /**
   * Find shifts that should be marked as ABSENT
   *
   * Criteria:
   * 1. status = 'SCHEDULED' (not checked in)
   * 2. shift_date = today OR earlier
   * 3. shift end time + grace period has passed
   * 4. shift_type = 'REGULAR' (không tính OT)
   */
  private async findShiftsToMarkAbsent(): Promise<any[]> {
    const now = new Date();
    // To correctly handle overnight shifts (e.g., 22:00 -> 06:00 next day) we compute the
    // actual shift end timestamp as follows:
    // - If scheduled_end_time <= scheduled_start_time => end time is next day
    // - Else end time is on the same shift_date
    // We then add the grace period and compare with NOW() to determine whether the
    // shift should be marked absent.

    // Limit search to recent shifts to avoid full table scan (last 2 days)
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const query = `
      SELECT 
        es.id as shift_id,
        es.employee_id,
        es.employee_code,
        es.department_id,
        es.shift_date,
        es.scheduled_start_time,
        es.scheduled_end_time,
        ws.schedule_name,
        -- compute shift_end_timestamp respecting overnight shifts
        CASE
          WHEN es.scheduled_end_time <= es.scheduled_start_time
            THEN (CONCAT((es.shift_date + INTERVAL '1 day')::text, ' ', es.scheduled_end_time::text)::timestamp)
          ELSE (CONCAT(es.shift_date::text, ' ', es.scheduled_end_time::text)::timestamp)
        END as shift_end_timestamp
      FROM employee_shifts es
      INNER JOIN work_schedules ws ON es.work_schedule_id = ws.id
      WHERE 
        es.status = 'SCHEDULED'
        AND es.shift_type = 'REGULAR'
        -- restrict to recent shifts to keep query efficient
        AND es.shift_date >= $1
        -- exclude shifts that are marked ON_LEAVE (approved leave)
        -- shift end + grace period has passed
        AND (
          CASE
            WHEN es.scheduled_end_time <= es.scheduled_start_time
              THEN (CONCAT((es.shift_date + INTERVAL '1 day')::text, ' ', es.scheduled_end_time::text)::timestamp)
            ELSE (CONCAT(es.shift_date::text, ' ', es.scheduled_end_time::text)::timestamp)
          END
          + INTERVAL '${this.GRACE_PERIOD_HOURS} hours'
        ) < NOW()
        -- do not mark manually edited shifts
        AND (es.is_manually_edited IS NULL OR es.is_manually_edited = false)
      ORDER BY shift_end_timestamp, es.employee_code
    `;

    return await this.dataSource.query(query, [twoDaysAgo]);
  }

  /**
   * Update shifts to ABSENT status
   */
  private async updateShiftsToAbsent(shiftIds: number[]): Promise<number> {
    if (shiftIds.length === 0) return 0;

    const result = await this.dataSource.query(
      `
      UPDATE employee_shifts
      SET 
        status = 'ABSENT',
        updated_at = NOW()
      WHERE id = ANY($1::int[])
      RETURNING id
    `,
      [shiftIds],
    );

    return result.length;
  }

  /**
   * Create violation records for absent employees
   */
  private async createViolationRecords(shifts: any[]): Promise<number> {
    if (shifts.length === 0) return 0;

    const values = shifts
      .map(
        (s) =>
          `(${s.employee_id}, '${s.employee_code}', ${s.department_id}, ` +
          `${s.shift_id}, '${s.shift_date.toISOString().split('T')[0]}', ` +
          `'ABSENT', 'Không điểm danh trong ngày làm việc', 'UNRESOLVED', NOW())`,
      )
      .join(',\n');

    const query = `
      INSERT INTO attendance_violations (
        employee_id, employee_code, department_id, shift_id, violation_date,
        violation_type, description, status, created_at
      )
      VALUES ${values}
      ON CONFLICT (shift_id, violation_type) DO NOTHING
      RETURNING id
    `;

    try {
      const result = await this.dataSource.query(query);
      return result.length;
    } catch (error) {
      this.logger.error('❌ Error creating violation records:', error);
      return 0;
    }
  }

  /**
   * Send notification to employee about absent status
   */
  private sendAbsentNotification(shift: any): void {
    const notificationPayload = {
      recipientId: shift.employee_id,
      title: '⚠️ Cảnh báo vắng mặt',
      message: `Bạn đã bị đánh dấu vắng mặt cho ca làm việc ngày ${shift.shift_date.toISOString().split('T')[0]} (${shift.schedule_name}). Vui lòng liên hệ HR để giải trình.`,
      notificationType: 'ATTENDANCE_VIOLATION',
      priority: 'HIGH',
      channels: ['PUSH', 'IN_APP', 'EMAIL'],
      metadata: {
        eventType: 'attendance.absent-marked',
        shiftId: shift.shift_id,
        shiftDate: shift.shift_date,
        scheduleName: shift.schedule_name,
      },
    };

    this.notificationClient.emit('notification.send', notificationPayload);

    this.logger.log(
      `📤 Sent absent notification to employee ${shift.employee_code} for shift on ${shift.shift_date.toISOString().split('T')[0]}`,
    );
  }

  /**
   * Manual trigger for testing
   */
  async triggerManually(): Promise<{
    marked: number;
    violations: number;
    shifts: any[];
  }> {
    this.logger.log('🔧 [MANUAL] Manually triggered absent marking');

    const shiftsToMark = await this.findShiftsToMarkAbsent();
    const marked = await this.updateShiftsToAbsent(
      shiftsToMark.map((s) => s.shift_id),
    );
    const violations = await this.createViolationRecords(shiftsToMark);

    return {
      marked,
      violations,
      shifts: shiftsToMark,
    };
  }
}
