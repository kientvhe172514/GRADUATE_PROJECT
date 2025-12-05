import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

/**
 * Reconciliation Cron Job to handle late check-ins after absent marking
 *
 * SCHEDULE: Every 30 minutes
 * PURPOSE: Find shifts that were marked ABSENT but employee checked in late
 *
 * LOGIC:
 * 1. Find shifts with status = ABSENT but have check_in_time (late check-in happened after marking)
 * 2. Revert status from ABSENT to IN_PROGRESS or COMPLETED (depending on check_out_time)
 * 3. Create audit log / edit log to track the change
 * 4. Update violation status to RESOLVED_LATE_CHECKIN
 *
 * WHY NEEDED:
 * - Employee may check in after the absent marker job ran
 * - We need to reconcile the system state to reflect actual attendance
 * - Provides audit trail for late arrivals vs true absences
 */
@Injectable()
export class AttendanceReconciliationProcessor {
  private readonly logger = new Logger(AttendanceReconciliationProcessor.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Runs every 30 minutes to reconcile late check-ins
   */
  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: 'attendance-reconciliation',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async reconcileLateCheckIns() {
    const startTime = Date.now();
    this.logger.log('🔄 [CRON] Starting attendance reconciliation...');

    try {
      // Step 1: Find shifts marked ABSENT but have check-in
      const shiftsToReconcile = await this.findShiftsToReconcile();

      if (shiftsToReconcile.length === 0) {
        this.logger.log('✅ [CRON] No shifts to reconcile');
        return;
      }

      this.logger.log(
        `📊 [CRON] Found ${shiftsToReconcile.length} shifts to reconcile`,
      );

      // Step 2: Update shift statuses
      let reconciledCount = 0;
      for (const shift of shiftsToReconcile) {
        try {
          await this.reconcileShift(shift);
          reconciledCount++;
        } catch (error) {
          this.logger.error(
            `❌ Failed to reconcile shift ${shift.shift_id}:`,
            error,
          );
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      this.logger.log(
        `✅ [CRON] Reconciliation completed in ${duration}s. Reconciled: ${reconciledCount}/${shiftsToReconcile.length}`,
      );
    } catch (error) {
      this.logger.error('❌ [CRON] Error in reconciliation:', error);
    }
  }

  /**
   * Find shifts that were marked ABSENT but have check_in_time
   * This happens when employee checks in after the absent marker ran
   */
  private async findShiftsToReconcile(): Promise<any[]> {
    // Look at last 7 days to catch any late reconciliations
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const query = `
      SELECT 
        es.id as shift_id,
        es.employee_id,
        es.employee_code,
        es.shift_date,
        es.check_in_time,
        es.check_out_time,
        es.status as current_status,
        ws.schedule_name
      FROM employee_shifts es
      INNER JOIN work_schedules ws ON es.work_schedule_id = ws.id
      WHERE 
        es.status = 'ABSENT'
        AND es.check_in_time IS NOT NULL
        AND es.shift_date >= $1
      ORDER BY es.shift_date DESC, es.check_in_time DESC
    `;

    return await this.dataSource.query(query, [sevenDaysAgo]);
  }

  /**
   * Reconcile a single shift: update status and create audit log
   */
  private async reconcileShift(shift: any): Promise<void> {
    // Determine new status based on check_out_time
    const newStatus = shift.check_out_time ? 'COMPLETED' : 'IN_PROGRESS';

    await this.dataSource.query(
      `
      UPDATE employee_shifts
      SET 
        status = $1::VARCHAR,
        notes = COALESCE(notes, '') || ' [Reconciled from ABSENT to ' || $1::VARCHAR || ' due to late check-in at ' || NOW() || ']',
        updated_at = NOW()
      WHERE id = $2
    `,
      [newStatus, shift.shift_id],
    );

    // Update violation status if exists
    await this.dataSource.query(
      `
      UPDATE violations
      SET 
        resolution_notes = 'Employee checked in late at ' || $1 || '. System auto-reconciled from ABSENT.',
        resolved_at = NOW(),
        resolved = true
      WHERE 
        shift_id = $2
        AND violation_type = 'ABSENT'
        AND resolved = false
    `,
      [shift.check_in_time, shift.shift_id],
    );

    // Create audit log entry
    await this.dataSource.query(
      `
      INSERT INTO attendance_edit_logs (
        shift_id,
        employee_id,
        editor_id,
        editor_name,
        field_changed,
        old_value,
        new_value,
        reason,
        edit_type,
        created_at
      ) VALUES (
        $1, $2, 0, 'SYSTEM_RECONCILIATION',
        'status', 'ABSENT', $3,
        'Auto-reconciliation: Late check-in detected after absent marking',
        'AUTO_RECONCILIATION',
        NOW()
      )
      ON CONFLICT DO NOTHING
    `,
      [shift.shift_id, shift.employee_id, newStatus],
    );

    this.logger.log(
      `✅ Reconciled shift ${shift.shift_id} for employee ${shift.employee_code}: ABSENT → ${newStatus}`,
    );
  }

  /**
   * Manual trigger for testing
   */
  async triggerManually(): Promise<{
    reconciled: number;
    shifts: any[];
  }> {
    this.logger.log('🔧 [MANUAL] Manually triggered reconciliation');

    const shiftsToReconcile = await this.findShiftsToReconcile();
    let reconciledCount = 0;

    for (const shift of shiftsToReconcile) {
      try {
        await this.reconcileShift(shift);
        reconciledCount++;
      } catch (error) {
        this.logger.error(
          `Failed to reconcile shift ${shift.shift_id}:`,
          error,
        );
      }
    }

    return {
      reconciled: reconciledCount,
      shifts: shiftsToReconcile,
    };
  }
}
