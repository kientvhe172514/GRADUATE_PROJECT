import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EmployeeShiftRepository } from '../../infrastructure/persistence/repositories/employee-shift.repository';

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
  ) {}

  async executeCheckIn(command: UpdateShiftOnCheckInCommand): Promise<void> {
    this.logger.log(
      `Updating shift ${command.shift_id} with check-in at ${command.check_in_time}`,
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
    this.logger.log(
      `Updating shift ${command.shift_id} with check-out at ${command.check_out_time}`,
    );

    const shift = await this.employeeShiftRepository.findById(command.shift_id);
    if (!shift) {
      throw new NotFoundException(`Shift ${command.shift_id} not found`);
    }

    if (!shift.check_in_time) {
      throw new Error('Cannot check-out without check-in');
    }

    await this.employeeShiftRepository.update(command.shift_id, {
      check_out_time: command.check_out_time,
      check_out_record_id: command.check_record_id,
      status: 'COMPLETED',
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

    this.logger.log(
      `✅ Shift ${command.shift_id} check-out completed. Work hours: ${actualWorkHours.toFixed(2)}`,
    );
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
