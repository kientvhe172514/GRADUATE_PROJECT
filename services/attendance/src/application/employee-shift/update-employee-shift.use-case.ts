import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';
import { OvertimeRequestRepository } from '../../infrastructure/repositories/overtime-request.repository';
import { DataSource } from 'typeorm';

export interface UpdateShiftOnCheckInCommand {
  shift_id: number;
  check_in_time: Date;
  check_record_id: number;
}

export interface UpdateShiftOnCheckOutCommand {
  shift_id: number;
  check_out_time: Date;
  check_record_id: number;
}

@Injectable()
export class UpdateEmployeeShiftUseCase {
  private readonly logger = new Logger(UpdateEmployeeShiftUseCase.name);

  constructor(
    private readonly employeeShiftRepository: EmployeeShiftRepository,
    private readonly overtimeRequestRepository: OvertimeRequestRepository,
    private readonly dataSource: DataSource,
  ) {}

  async executeCheckIn(command: UpdateShiftOnCheckInCommand): Promise<void> {
    // Format time for logging without converting to UTC
    const checkInTimeVN = new Date(command.check_in_time.getTime());
    const timeStr = checkInTimeVN.toLocaleString('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    this.logger.log(
      `Updating shift ${command.shift_id} with check-in at ${timeStr} (VN Time)`,
    );

    const shift = await this.employeeShiftRepository.findById(command.shift_id);
    if (!shift) {
      throw new NotFoundException(`Shift ${command.shift_id} not found`);
    }

    await this.employeeShiftRepository.update(command.shift_id, {
      check_in_time: command.check_in_time,
      check_in_record_id: command.check_record_id,
      status: 'IN_PROGRESS',
    });

    // Calculate late minutes
    const scheduledStart = this.parseTimeString(
      shift.scheduled_start_time,
      command.check_in_time,
    );
    const lateMinutes = Math.max(
      0,
      Math.floor(
        (command.check_in_time.getTime() - scheduledStart.getTime()) / 60000,
      ),
    );

    if (lateMinutes > 0) {
      await this.employeeShiftRepository.update(command.shift_id, {
        late_minutes: lateMinutes,
      });
      this.logger.warn(
        `Employee ${shift.employee_code} is late by ${lateMinutes} minutes`,
      );
    }

    this.logger.log(`✅ Shift ${command.shift_id} check-in completed`);
  }

  async executeCheckOut(command: UpdateShiftOnCheckOutCommand): Promise<void> {
    // Format time for logging without converting to UTC
    const checkOutTimeVN = new Date(command.check_out_time.getTime());
    const timeStr = checkOutTimeVN.toLocaleString('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    this.logger.log(
      `Updating shift ${command.shift_id} with check-out at ${timeStr} (VN Time)`,
    );

    const shift = await this.employeeShiftRepository.findById(command.shift_id);
    if (!shift) {
      throw new NotFoundException(`Shift ${command.shift_id} not found`);
    }

    if (!shift.check_in_time) {
      throw new Error('Cannot check-out without check-in');
    }

    // ⚠️ DON'T set status to COMPLETED here
    // Will be set ONLY after GPS validation passes in process-face-verification-result
    await this.employeeShiftRepository.update(command.shift_id, {
      check_out_time: command.check_out_time,
      check_out_record_id: command.check_record_id,
      // status will be updated after GPS validation
    });

    // Calculate work hours
    const workMilliseconds =
      command.check_out_time.getTime() - shift.check_in_time.getTime();
    const workHours = workMilliseconds / (1000 * 60 * 60);
    const breakHours = shift.break_hours || 1; // Default 1 hour lunch break
    const actualWorkHours = Math.max(0, workHours - breakHours);

    // Calculate early leave
    const scheduledEnd = this.parseTimeString(
      shift.scheduled_end_time,
      command.check_out_time,
    );
    const earlyLeaveMinutes = Math.max(
      0,
      Math.floor(
        (scheduledEnd.getTime() - command.check_out_time.getTime()) / 60000,
      ),
    );

    // Calculate overtime (if worked beyond scheduled end)
    const overtimeMinutes = Math.max(
      0,
      Math.floor(
        (command.check_out_time.getTime() - scheduledEnd.getTime()) / 60000,
      ),
    );
    const overtimeHours = overtimeMinutes / 60;

    await this.employeeShiftRepository.update(command.shift_id, {
      work_hours: Math.round(actualWorkHours * 100) / 100,
      overtime_hours: Math.round(overtimeHours * 100) / 100,
      early_leave_minutes: earlyLeaveMinutes,
    });

    if (earlyLeaveMinutes > 0) {
      this.logger.warn(
        `Employee ${shift.employee_code} left early by ${earlyLeaveMinutes} minutes`,
      );
    }

    if (overtimeHours > 0) {
      this.logger.log(
        `Employee ${shift.employee_code} worked overtime: ${overtimeHours.toFixed(2)} hours`,
      );
    }

    // If this is an OVERTIME shift, update the related overtime_request.actual_hours
    if (shift.shift_type === 'OVERTIME') {
      await this.updateOvertimeRequestActualHours(
        command.shift_id,
        actualWorkHours,
      );
    }

    // 🔍 CHECK ROUNDS AND UPDATE STATUS AFTER CHECKOUT
    await this.checkRoundsAndUpdateStatus(command.shift_id, shift);

    this.logger.log(
      `✅ Shift ${command.shift_id} check-out completed. Work hours: ${actualWorkHours.toFixed(2)}`,
    );
  }

  /**
   * Check if employee completed required GPS rounds and update shift status
   * Called immediately after checkout
   */
  private async checkRoundsAndUpdateStatus(
    shiftId: number,
    shift: any,
  ): Promise<void> {
    try {
      // Query presence_verification_rounds to count completed rounds
      const roundsQuery = await this.dataSource.query(
        `
        SELECT 
          COUNT(*) as total_rounds,
          SUM(CASE WHEN validation_result = 'VALID' THEN 1 ELSE 0 END) as valid_rounds
        FROM presence_verification_rounds
        WHERE shift_id = $1
        `,
        [shiftId],
      );

      const roundsCompleted = parseInt(roundsQuery[0]?.total_rounds || '0');
      const validRounds = parseInt(roundsQuery[0]?.valid_rounds || '0');
      const roundsRequired = shift.presence_verification_rounds_required || 0;

      this.logger.log(
        `📊 Rounds check for shift ${shiftId}: completed=${roundsCompleted}, required=${roundsRequired}, valid=${validRounds}`,
      );

      // Determine shift status based on rounds
      if (roundsRequired === 0) {
        // No rounds required → COMPLETED
        await this.employeeShiftRepository.update(shiftId, {
          status: 'COMPLETED',
        });
        this.logger.log(
          `✅ Shift ${shiftId} marked COMPLETED (no rounds required)`,
        );
      } else if (roundsCompleted >= roundsRequired) {
        // Check if valid rounds percentage is acceptable (>= 80%)
        const validPercentage =
          roundsCompleted > 0 ? (validRounds / roundsCompleted) * 100 : 0;

        if (validPercentage >= 80) {
          await this.employeeShiftRepository.update(shiftId, {
            status: 'COMPLETED',
          });
          this.logger.log(
            `✅ Shift ${shiftId} marked COMPLETED (${roundsCompleted}/${roundsRequired} rounds, ${validPercentage.toFixed(1)}% valid)`,
          );
        } else {
          await this.employeeShiftRepository.update(shiftId, {
            status: 'ABSENT',
            notes: `Vắng mặt: Tỷ lệ GPS verification hợp lệ thấp (${validPercentage.toFixed(1)}%). Đã hoàn thành: ${validRounds}/${roundsCompleted} rounds hợp lệ.`,
          });
          this.logger.warn(
            `⚠️ Shift ${shiftId} marked ABSENT (low valid percentage: ${validPercentage.toFixed(1)}%)`,
          );
        }
      } else {
        // Insufficient rounds → ABSENT
        await this.employeeShiftRepository.update(shiftId, {
          status: 'ABSENT',
          notes: `Vắng mặt: Không đủ số lần GPS verification. Đã hoàn thành: ${roundsCompleted}/${roundsRequired} rounds. Nhân viên có thể đã rời khỏi văn phòng trước khi hoàn thành ca làm việc.`,
        });
        this.logger.warn(
          `❌ Shift ${shiftId} marked ABSENT (insufficient rounds: ${roundsCompleted}/${roundsRequired})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to check rounds and update status for shift ${shiftId}`,
        error,
      );
      // Don't throw error, allow checkout to complete
    }
  }

  /**
   * Update actual_hours in overtime_request when OT shift is completed
   */
  private async updateOvertimeRequestActualHours(
    shiftId: number,
    actualHours: number,
  ): Promise<void> {
    try {
      // Find overtime_request by ot_shift_id
      const otRequest = await this.overtimeRequestRepository.findOne({
        where: { ot_shift_id: shiftId },
      });

      if (otRequest) {
        await this.overtimeRequestRepository.updateActualHours(
          otRequest.id,
          actualHours,
        );
        this.logger.log(
          `✅ Updated overtime_request ${otRequest.id} with actual_hours=${actualHours.toFixed(2)}`,
        );
      } else {
        this.logger.warn(
          `No overtime_request found for ot_shift_id=${shiftId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update overtime_request actual_hours for shift ${shiftId}`,
        error,
      );
    }
  }

  /**
   * Parse time string (HH:MM) and combine with date
   */
  private parseTimeString(timeStr: string, referenceDate: Date): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(referenceDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }
}
