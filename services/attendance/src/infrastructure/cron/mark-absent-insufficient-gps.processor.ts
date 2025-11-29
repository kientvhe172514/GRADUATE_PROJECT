import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

/**
 * Cron Job: Mark ABSENT for Insufficient GPS Verification
 *
 * SCHEDULE: Every day at 11:30 PM (30 minutes before midnight)
 * PURPOSE: Mark shifts as ABSENT if GPS verification percentage is below threshold
 *
 * LOGIC:
 * 1. Find all IN_PROGRESS shifts today that require GPS verification
 * 2. Calculate actual verification percentage:
 *    - presence_verification_rounds_completed / presence_verification_rounds_required
 * 3. Compare with min_gps_verification_percentage from gps_check_configurations
 * 4. If below threshold → Mark ABSENT with detailed reason
 * 5. Create violation record for tracking
 *
 * WHY NEEDED:
 * - Ensure employees maintain physical presence during shift
 * - Detect fraudulent check-ins (face recognition passed but never at office)
 * - Provide clear audit trail for attendance violations
 */
@Injectable()
export class MarkAbsentInsufficientGpsProcessor {
  private readonly logger = new Logger(
    MarkAbsentInsufficientGpsProcessor.name,
  );

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Runs every day at 11:30 PM to mark absent for insufficient GPS verification
   * Runs before midnight to catch same-day shifts
   */
  @Cron('30 23 * * *', {
    name: 'mark-absent-insufficient-gps',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async markAbsentForInsufficientGps() {
    const startTime = Date.now();
    this.logger.log(
      '🔍 [CRON] Starting GPS verification check for today...',
    );

    try {
      // Find shifts with insufficient GPS verification
      const shiftsToMark = await this.findShiftsWithInsufficientGps();

      if (shiftsToMark.length === 0) {
        this.logger.log(
          '✅ [CRON] All shifts have sufficient GPS verification',
        );
        return;
      }

      this.logger.log(
        `📊 [CRON] Found ${shiftsToMark.length} shifts with insufficient GPS verification`,
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
      this.logger.error('❌ [CRON] Error in GPS verification check:', error);
    }
  }

  /**
   * Find shifts with insufficient GPS verification percentage
   *
   * Logic:
   * - Shift date = today
   * - Status = IN_PROGRESS (checked in but not completed yet)
   * - presence_verification_required = true
   * - Calculate actual percentage = (rounds_completed / rounds_required) * 100
   * - Compare with min_gps_verification_percentage from config
   * - Also check shifts that are SCHEDULED but past their scheduled end time (no check-in at all)
   */
  private async findShiftsWithInsufficientGps(): Promise<any[]> {
    const query = `
      WITH shift_with_config AS (
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
          es.presence_verification_rounds_required,
          COALESCE(es.presence_verification_rounds_completed, 0) as rounds_completed,
          gcc.min_gps_verification_percentage,
          -- Calculate actual verification percentage
          CASE 
            WHEN es.presence_verification_rounds_required > 0 
            THEN (COALESCE(es.presence_verification_rounds_completed, 0)::decimal / es.presence_verification_rounds_required::decimal * 100)
            ELSE 100.0
          END as actual_percentage,
          -- Calculate how many rounds short
          GREATEST(0, es.presence_verification_rounds_required - COALESCE(es.presence_verification_rounds_completed, 0)) as rounds_short
        FROM employee_shifts es
        LEFT JOIN gps_check_configurations gcc 
          ON (es.shift_type = gcc.shift_type OR gcc.shift_type = 'ALL')
          AND gcc.is_active = true
          AND gcc.is_default = true
        WHERE 
          es.shift_date = CURRENT_DATE
          AND es.presence_verification_required = true
          AND es.status IN ('IN_PROGRESS', 'SCHEDULED')
      )
      SELECT *
      FROM shift_with_config
      WHERE 
        -- Case 1: Checked in but insufficient GPS verification
        (status = 'IN_PROGRESS' 
         AND actual_percentage < COALESCE(min_gps_verification_percentage, 60.0))
        OR
        -- Case 2: Never checked in and shift time has passed
        (status = 'SCHEDULED' 
         AND (shift_date::text || ' ' || scheduled_end_time)::timestamp < NOW() + INTERVAL '7 hours')
      ORDER BY employee_id;
    `;

    return await this.dataSource.query(query);
  }

  /**
   * Mark a single shift as ABSENT with detailed reason
   */
  private async markShiftAbsent(shift: any): Promise<void> {
    const reason =
      shift.status === 'SCHEDULED'
        ? `No check-in detected for entire shift (${shift.scheduled_start_time}-${shift.scheduled_end_time})`
        : `Insufficient GPS verification: ${shift.rounds_completed}/${shift.presence_verification_rounds_required} rounds (${shift.actual_percentage.toFixed(1)}%). Required: ${shift.min_gps_verification_percentage}%`;

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
    const violationType =
      shift.status === 'SCHEDULED'
        ? 'MISSING_CHECK_IN'
        : 'INSUFFICIENT_GPS_VERIFICATION';

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
        $1, $2, $3, 'HIGH',
        $4,
        NOW(),
        'UNRESOLVED',
        NOW()
      )
      ON CONFLICT (shift_id, violation_type) DO NOTHING
    `,
      [shift.shift_id, shift.employee_id, violationType, reason],
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
    this.logger.log('🔧 [MANUAL] Manually triggered GPS verification check');

    const shiftsToMark = await this.findShiftsWithInsufficientGps();
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
