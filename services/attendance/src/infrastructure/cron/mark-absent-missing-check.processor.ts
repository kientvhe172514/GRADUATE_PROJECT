import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Cron Job: Mark ABSENT for Missing Check-In or Check-Out
 *
 * SCHEDULE: Every day at 11:45 PM (15 minutes before midnight)
 * PURPOSE: Mark shifts as ABSENT if employee never checked in or checked out
 *
 * LOGIC:
 * 1. Find SCHEDULED shifts where shift end time has passed (no check-in at all)
 * 2. Find IN_PROGRESS shifts where shift end time + grace period has passed (checked in but never checked out)
 * 3. Mark both cases as ABSENT with appropriate reason
 * 4. Create violation records
 *
 * GRACE PERIOD:
 * - Check-in grace period: From .env (default 15 minutes after shift start)
 * - Check-out grace period: From .env (default 15 minutes after shift end)
 *
 * WHY NEEDED:
 * - Detect no-shows (never checked in)
 * - Detect incomplete attendance (checked in but left without checking out)
 * - Ensure data integrity for payroll and reporting
 */
@Injectable()
export class MarkAbsentMissingCheckProcessor {
  private readonly logger = new Logger(MarkAbsentMissingCheckProcessor.name);
  private readonly checkOutGracePeriodMinutes: number;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.checkOutGracePeriodMinutes = Number(
      this.configService.get<number>('CHECK_OUT_GRACE_PERIOD_MINUTES') || 15,
    );
  }

  /**
   * Runs every day at 11:45 PM to mark absent for missing check-in/out
   */
  @Cron('45 23 * * *', {
    name: 'mark-absent-missing-check',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async markAbsentForMissingCheck() {
    const startTime = Date.now();
    this.logger.log(
      '🔍 [CRON] Starting missing check-in/out detection for today...',
    );

    try {
      // Find shifts with missing check-in or check-out
      const shiftsToMark = await this.findShiftsWithMissingCheck();

      if (shiftsToMark.length === 0) {
        this.logger.log('✅ [CRON] All shifts have valid check-in/out');
        return;
      }

      this.logger.log(
        `📊 [CRON] Found ${shiftsToMark.length} shifts with missing check-in/out`,
      );

      // Mark each shift as ABSENT
      let markedCount = 0;
      for (const shift of shiftsToMark) {
        try {
          await this.markShiftAbsent(shift);
          markedCount++;
        } catch (error) {
          this.logger.error(
            `❌ Failed to mark shift ${shift.shift_id} as ABSENT:`,
            error,
          );
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      this.logger.log(
        `✅ [CRON] Completed in ${duration}s. Marked ${markedCount}/${shiftsToMark.length} shifts as ABSENT`,
      );
    } catch (error) {
      this.logger.error(
        '❌ [CRON] Error in missing check detection:',
        error,
      );
    }
  }

  /**
   * Find shifts with missing check-in or check-out
   *
   * Case 1: SCHEDULED status but shift end time has passed (never checked in)
   * Case 2: IN_PROGRESS status but shift end time + grace period has passed (never checked out)
   */
  private async findShiftsWithMissingCheck(): Promise<any[]> {
    const query = `
      WITH calculated_shifts AS (
        SELECT 
          es.id as shift_id,
          es.employee_id,
          es.employee_code,
          es.shift_date,
          es.shift_type,
          es.scheduled_start_time,
          es.scheduled_end_time,
          es.check_in_time,
          es.check_out_time,
          es.status,
          -- Calculate shift end timestamp
          CASE 
            WHEN es.scheduled_end_time::time < es.scheduled_start_time::time 
            THEN (es.shift_date + INTERVAL '1 day')::date::text || ' ' || es.scheduled_end_time
            ELSE es.shift_date::text || ' ' || es.scheduled_end_time
          END::timestamp as shift_end_ts
        FROM employee_shifts es
        WHERE 
          es.shift_date = CURRENT_DATE
          AND es.status IN ('SCHEDULED', 'IN_PROGRESS')
          AND es.shift_type = 'REGULAR'
      )
      SELECT 
        *,
        -- Determine violation type
        CASE 
          WHEN status = 'SCHEDULED' THEN 'MISSING_CHECK_IN'
          WHEN status = 'IN_PROGRESS' THEN 'MISSING_CHECK_OUT'
        END as violation_type
      FROM calculated_shifts
      WHERE 
        -- Case 1: Never checked in and shift end time has passed
        (status = 'SCHEDULED' 
         AND shift_end_ts < (NOW() + INTERVAL '7 hours'))
        OR
        -- Case 2: Checked in but never checked out (grace period expired)
        (status = 'IN_PROGRESS' 
         AND check_in_time IS NOT NULL 
         AND check_out_time IS NULL
         AND shift_end_ts + INTERVAL '${this.checkOutGracePeriodMinutes} minutes' < (NOW() + INTERVAL '7 hours'))
      ORDER BY employee_id;
    `;

    return await this.dataSource.query(query);
  }

  /**
   * Mark a single shift as ABSENT with detailed reason
   */
  private async markShiftAbsent(shift: any): Promise<void> {
    const reason =
      shift.violation_type === 'MISSING_CHECK_IN'
        ? `No check-in detected. Shift scheduled: ${shift.scheduled_start_time}-${shift.scheduled_end_time}`
        : `Checked in at ${new Date(shift.check_in_time).toLocaleTimeString('vi-VN')}, but never checked out. Shift ended: ${shift.scheduled_end_time}`;

    // Update shift status to ABSENT
    await this.dataSource.query(
      `
      UPDATE employee_shifts
      SET 
        status = 'ABSENT',
        notes = COALESCE(notes, '') || ' [AUTO-MARKED ABSENT: ' || $1 || ']',
        updated_at = NOW()
      WHERE id = $2
    `,
      [reason, shift.shift_id],
    );

    // Create violation record
    await this.dataSource.query(
      `
      INSERT INTO attendance_violations (
        shift_id,
        employee_id,
        violation_type,
        severity,
        description,
        detected_at,
        status,
        created_at
      ) VALUES (
        $1, $2, $3, 
        CASE WHEN $3 = 'MISSING_CHECK_IN' THEN 'CRITICAL' ELSE 'HIGH' END,
        $4,
        NOW(),
        'UNRESOLVED',
        NOW()
      )
      ON CONFLICT (shift_id, violation_type) DO NOTHING
    `,
      [shift.shift_id, shift.employee_id, shift.violation_type, reason],
    );

    this.logger.log(
      `✅ Marked shift ${shift.shift_id} (employee ${shift.employee_code}) as ABSENT: ${reason}`,
    );
  }

  /**
   * Manual trigger for testing
   */
  async triggerManually(): Promise<{
    marked: number;
    shifts: any[];
  }> {
    this.logger.log('🔧 [MANUAL] Manually triggered missing check detection');

    const shiftsToMark = await this.findShiftsWithMissingCheck();
    let markedCount = 0;

    for (const shift of shiftsToMark) {
      try {
        await this.markShiftAbsent(shift);
        markedCount++;
      } catch (error) {
        this.logger.error(
          `Failed to mark shift ${shift.shift_id} as ABSENT:`,
          error,
        );
      }
    }

    return {
      marked: markedCount,
      shifts: shiftsToMark,
    };
  }
}
