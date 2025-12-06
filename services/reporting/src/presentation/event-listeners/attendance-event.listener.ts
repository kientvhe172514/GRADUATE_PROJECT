import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DataSource } from 'typeorm';

@Controller()
export class AttendanceEventListener {
  private readonly logger = new Logger(AttendanceEventListener.name);

  constructor(private readonly dataSource: DataSource) {}

  @EventPattern('attendance.shift-completed')
  async handleShiftCompleted(@Payload() data: any) {
    this.logger.log(
      `📨 Received attendance.shift-completed event for shiftId=${data.shiftId}, employeeId=${data.employeeId}`,
    );

    try {
      // Update employee_shifts_cache with completed shift data
      const updateQuery = `
        UPDATE employee_shifts_cache
        SET
          employee_code = $1,
          department_id = $2,
          shift_type = $3,
          scheduled_start_time = $4,
          scheduled_end_time = $5,
          check_in_time = $6,
          check_out_time = $7,
          work_hours = $8,
          overtime_hours = $9,
          break_hours = $10,
          late_minutes = $11,
          early_leave_minutes = $12,
          status = $13,
          updated_at = NOW()
        WHERE id = $14
      `;

      await this.dataSource.query(updateQuery, [
        data.employeeCode,
        data.departmentId,
        data.shiftType,
        data.scheduledStartTime,
        data.scheduledEndTime,
        data.checkInTime,
        data.checkOutTime,
        data.workHours,
        data.overtimeHours,
        data.breakHours || 1,
        data.lateMinutes || 0,
        data.earlyLeaveMinutes || 0,
        data.status,
        data.shiftId,
      ]);

      this.logger.log(
        `✅ Updated employee_shifts_cache for shiftId=${data.shiftId}: workHours=${data.workHours}h, overtime=${data.overtimeHours}h, late=${data.lateMinutes}min`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to handle shift-completed event for shiftId=${data.shiftId}`,
        error.stack,
      );
      throw error;
    }
  }

  @EventPattern('attendance.checked')
  async handleAttendanceChecked(@Payload() data: any) {
    this.logger.log('Reporting Service received: attendance.checked', data);
    // TODO: Update real-time attendance status
  }

  @EventPattern('attendance.violation-detected')
  async handleViolationDetected(@Payload() data: any) {
    this.logger.log('Reporting Service received: attendance.violation-detected', data);
    // TODO: Track violations in reporting data
  }
}

