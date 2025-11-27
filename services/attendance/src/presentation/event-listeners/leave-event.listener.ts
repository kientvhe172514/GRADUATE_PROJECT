import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DataSource } from 'typeorm';

interface LeaveApprovedEvent {
  leave_request_id: number;
  employee_id: number;
  employee_code: string;
  leave_type: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  total_days: number;
  approved_by: number;
  approved_at: string;
}

interface LeaveCancelledEvent {
  leave_request_id: number;
  employee_id: number;
  employee_code: string;
  start_date: string;
  end_date: string;
  cancelled_by: number;
  cancelled_at: string;
}

@Controller()
export class LeaveEventListener {
  private readonly logger = new Logger(LeaveEventListener.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Handle leave.approved event from Leave Service
   * Mark all shifts in the leave period as ON_LEAVE
   */
  @EventPattern('leave.approved')
  async handleLeaveApproved(
    @Payload() data: LeaveApprovedEvent,
  ): Promise<void> {
    this.logger.log(
      `📩 Received leave.approved for employee ${data.employee_code} (${data.start_date} → ${data.end_date})`,
    );

    try {
      const result = await this.dataSource.query(
        `
        UPDATE employee_shifts
        SET 
          status = 'ON_LEAVE',
          notes = COALESCE(notes, '') || ' [Auto-marked ON_LEAVE due to approved leave request #' || $1 || ']',
          updated_at = NOW()
        WHERE 
          employee_id = $2
          AND shift_date >= $3::date
          AND shift_date <= $4::date
          AND shift_type = 'REGULAR'
          AND status IN ('SCHEDULED', 'ABSENT')
        RETURNING id
      `,
        [
          data.leave_request_id,
          data.employee_id,
          data.start_date,
          data.end_date,
        ],
      );

      this.logger.log(
        `✅ Marked ${result.length} shifts as ON_LEAVE for employee ${data.employee_code}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to mark shifts as ON_LEAVE for employee ${data.employee_code}:`,
        error,
      );
    }
  }

  /**
   * Handle leave.cancelled event from Leave Service
   * Revert shifts back to SCHEDULED (if not yet started) or keep existing status
   */
  @EventPattern('leave.cancelled')
  async handleLeaveCancelled(
    @Payload() data: LeaveCancelledEvent,
  ): Promise<void> {
    this.logger.log(
      `📩 Received leave.cancelled for employee ${data.employee_code} (${data.start_date} → ${data.end_date})`,
    );

    try {
      // Only revert shifts that are still ON_LEAVE and haven't started yet
      const result = await this.dataSource.query(
        `
        UPDATE employee_shifts
        SET 
          status = 'SCHEDULED',
          notes = COALESCE(notes, '') || ' [Reverted from ON_LEAVE due to leave cancellation at ' || NOW() || ']',
          updated_at = NOW()
        WHERE 
          employee_id = $1
          AND shift_date >= $2::date
          AND shift_date <= $3::date
          AND status = 'ON_LEAVE'
          AND check_in_time IS NULL
        RETURNING id
      `,
        [data.employee_id, data.start_date, data.end_date],
      );

      this.logger.log(
        `✅ Reverted ${result.length} shifts from ON_LEAVE to SCHEDULED for employee ${data.employee_code}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to revert ON_LEAVE shifts for employee ${data.employee_code}:`,
        error,
      );
    }
  }
}
