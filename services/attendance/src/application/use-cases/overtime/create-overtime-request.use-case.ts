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
 * Convert date string to Vietnam timezone (UTC+7)
 * If the string has no timezone info, assume it's Vietnam time
 */
function toVietnamTime(dateStr: string): Date {
  // If already has timezone (+07:00, Z, etc.), parse normally
  if (dateStr.includes('+') || dateStr.includes('Z')) {
    return new Date(dateStr);
  }
  // No timezone -> assume Vietnam time (UTC+7)
  // If it's a date-only string (YYYY-MM-DD), parse as-is (no timezone append)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00+07:00');
  }
  // If it has time but no timezone (YYYY-MM-DDTHH:mm:ss), add +07:00
  if (dateStr.includes('T')) {
    return new Date(dateStr + '+07:00');
  }
  // Fallback: parse as-is
  return new Date(dateStr);
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
    const overtimeStart = toVietnamTime(dto.start_time);
    const overtimeEnd = toVietnamTime(dto.end_time);
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

    // Convert date strings to Vietnam timezone
    // If frontend sends string without timezone, we assume it's VN time (UTC+7)
    // NOTE: overtime_date is DATE type in DB (no time), so just parse as Date object
    const request = await this.overtimeRepo.createRequest({
      employee_id: currentUser.employee_id!,
      overtime_date: new Date(dto.overtime_date), // DATE type - no timezone needed
      start_time: toVietnamTime(dto.start_time),   // TIMESTAMPTZ type
      end_time: toVietnamTime(dto.end_time),       // TIMESTAMPTZ type
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
