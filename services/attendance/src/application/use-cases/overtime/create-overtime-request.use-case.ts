import { Injectable } from '@nestjs/common';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
  JwtPayload,
} from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';
import { EmployeeShiftRepository } from '../../../infrastructure/repositories/employee-shift.repository';
import { TypeOrmEmployeeWorkScheduleRepository } from '../../../infrastructure/repositories/typeorm-work-schedule.repository';
import { CreateOvertimeRequestDto } from '../../dtos/overtime-request.dto';

/**
 * Parse datetime string with timezone support
 * FE should send ISO8601 with timezone: 2025-11-17T09:38:00.000Z
 * If no timezone, assume Vietnam time (UTC+7)
 */
function parseDateTime(dateTimeStr: string): Date {
  // If already has timezone (+07:00, Z, etc.), parse normally
  if (dateTimeStr.includes('+') || dateTimeStr.includes('Z')) {
    return new Date(dateTimeStr);
  }
  // No timezone -> assume Vietnam time (UTC+7)
  // Add +07:00 to the string
  if (dateTimeStr.includes('T')) {
    return new Date(dateTimeStr + '+07:00');
  }
  // Fallback: parse as-is
  return new Date(dateTimeStr);
}

@Injectable()
export class CreateOvertimeRequestUseCase {
  constructor(
    private readonly overtimeRepo: OvertimeRequestRepository,
    private readonly shiftRepo: EmployeeShiftRepository,
    private readonly employeeWorkScheduleRepo: TypeOrmEmployeeWorkScheduleRepository,
  ) {}

  async execute(
    dto: CreateOvertimeRequestDto,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<any>> {
    // Optional: prevent too many pending OT requests for same date
    const pendingCount = await this.overtimeRepo.countPendingByEmployee(
      currentUser.employee_id!,
    );
    if (pendingCount > 20) {
      throw new BusinessException(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'Too many pending overtime requests.',
        429,
      );
    }

    // Parse times to check for conflicts
    // FE should send ISO8601 with timezone: 2025-11-17T09:38:00.000Z
    const overtimeStart = parseDateTime(dto.start_time);
    const overtimeEnd = parseDateTime(dto.end_time);
    const overtimeDate = new Date(dto.overtime_date);

    // Check if there's already a REGULAR shift on this date
    const existingShift = await this.shiftRepo.findRegularShiftByEmployeeAndDate(
      currentUser.employee_id!,
      overtimeDate,
    );

    if (existingShift) {
      // Parse scheduled shift times
      const [startHour, startMin] = existingShift.scheduled_start_time
        .split(':')
        .map(Number);
      const [endHour, endMin] = existingShift.scheduled_end_time
        .split(':')
        .map(Number);

      const shiftStart = new Date(overtimeDate);
      shiftStart.setHours(startHour, startMin, 0, 0);
      const shiftEnd = new Date(overtimeDate);
      shiftEnd.setHours(endHour, endMin, 0, 0);

      // Check if overtime time overlaps with regular shift
      const hasOverlap =
        (overtimeStart >= shiftStart && overtimeStart < shiftEnd) ||
        (overtimeEnd > shiftStart && overtimeEnd <= shiftEnd) ||
        (overtimeStart <= shiftStart && overtimeEnd >= shiftEnd);

      if (hasOverlap) {
        throw new BusinessException(
          ErrorCodes.INVALID_INPUT,
          `Overtime time overlaps with your regular shift (${existingShift.scheduled_start_time} - ${existingShift.scheduled_end_time}). Please choose a different time.`,
          400,
        );
      }
    }

    // Check schedule_overrides in employee_work_schedules
    const workSchedule =
      await this.employeeWorkScheduleRepo.findByEmployeeIdAndDate(
        currentUser.employee_id!,
        overtimeDate,
      );

    if (workSchedule && workSchedule.schedule_overrides) {
      const overrides = Array.isArray(workSchedule.schedule_overrides)
        ? workSchedule.schedule_overrides
        : [];

      const dateStr = overtimeDate.toISOString().split('T')[0];
      const conflictOverride = overrides.find((override: any) => {
        // Check if override is for this date
        if (override.from_date !== dateStr) return false;

        // Only check OVERTIME type overrides (ignore SCHEDULE_CHANGE, ON_LEAVE)
        if (override.type === 'OVERTIME' && override.overtime_start_time && override.overtime_end_time) {
          const overrideStart = new Date(`${override.from_date}T${override.overtime_start_time}`);
          const overrideEnd = new Date(`${override.from_date}T${override.overtime_end_time}`);

          return (
            (overtimeStart >= overrideStart && overtimeStart < overrideEnd) ||
            (overtimeEnd > overrideStart && overtimeEnd <= overrideEnd) ||
            (overtimeStart <= overrideStart && overtimeEnd >= overrideEnd)
          );
        }

        return false;
      });

      if (conflictOverride) {
        throw new BusinessException(
          ErrorCodes.INVALID_INPUT,
          `Overtime time conflicts with another overtime request on ${conflictOverride.from_date}. Please check your work schedule.`,
          400,
        );
      }
    }

    // Parse datetime with timezone support
    // FE should send ISO8601 with timezone: 2025-11-17T09:38:00.000Z
    // NOTE: overtime_date is DATE type in DB (no time), so just parse as Date object
    const request = await this.overtimeRepo.createRequest({
      employee_id: currentUser.employee_id!,
      overtime_date: new Date(dto.overtime_date), // DATE type - no timezone needed
      start_time: parseDateTime(dto.start_time), // TIMESTAMPTZ type
      end_time: parseDateTime(dto.end_time), // TIMESTAMPTZ type
      estimated_hours: dto.estimated_hours,
      reason: dto.reason,
      requested_by: currentUser.sub,
    });

    return ApiResponseDto.success(
      request,
      'Overtime request submitted successfully',
      201,
    );
  }
}
