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
import { UpdateOvertimeRequestDto } from '../../dtos/overtime-request.dto';

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
export class UpdateOvertimeRequestUseCase {
  constructor(
    private readonly overtimeRepo: OvertimeRequestRepository,
    private readonly shiftRepo: EmployeeShiftRepository,
    private readonly employeeWorkScheduleRepo: TypeOrmEmployeeWorkScheduleRepository,
  ) {}

  async execute(
    id: number,
    dto: UpdateOvertimeRequestDto,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<any>> {
    const request = await this.overtimeRepo.findOne({ where: { id } });

    if (!request) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Overtime request not found',
        404,
      );
    }

    // Debug log - check sub values
    console.log('[UpdateOvertimeRequest] Debug sub check:', {
      request_requested_by: request.requested_by,
      request_requested_by_type: typeof request.requested_by,
      currentUser_sub: currentUser.sub,
      currentUser_sub_type: typeof currentUser.sub,
      sub_strict_equal: request.requested_by === currentUser.sub,
      sub_loose_equal: request.requested_by == currentUser.sub,
    });

    // Actual check uses employee_id
    console.log('[UpdateOvertimeRequest] Permission check:', {
      request_employee_id: request.employee_id,
      request_employee_id_type: typeof request.employee_id,
      currentUser_employee_id: currentUser.employee_id,
      currentUser_employee_id_type: typeof currentUser.employee_id,
      strict_equal: request.employee_id === currentUser.employee_id,
      loose_equal: request.employee_id == currentUser.employee_id,
    });

    if (request.employee_id != currentUser.employee_id) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_DENIED,
        'You can only update your own requests.',
        403,
      );
    }

    if (request.status !== 'PENDING') {
      throw new BusinessException(
        ErrorCodes.INVALID_STATE_TRANSITION,
        'Cannot update request that is already approved/rejected.',
        400,
      );
    }

    // If updating time, validate against shifts and overrides
    if (dto.start_time || dto.end_time) {
      // Use new times if provided, otherwise use existing times
      const newStartTime = dto.start_time
        ? toVietnamTime(dto.start_time)
        : request.start_time;
      const newEndTime = dto.end_time
        ? toVietnamTime(dto.end_time)
        : request.end_time;
      const overtimeDate = request.overtime_date;

      // Check if there's already a REGULAR shift on this date
      const existingShift =
        await this.shiftRepo.findRegularShiftByEmployeeAndDate(
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
          (newStartTime >= shiftStart && newStartTime < shiftEnd) ||
          (newEndTime > shiftStart && newEndTime <= shiftEnd) ||
          (newStartTime <= shiftStart && newEndTime >= shiftEnd);

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

        const dateStr = new Date(overtimeDate).toISOString().split('T')[0];
        const conflictOverride = overrides.find((override: any) => {
          // Check if override is for this date
          if (override.from_date !== dateStr) return false;

          // Only check OVERTIME type overrides (ignore SCHEDULE_CHANGE, ON_LEAVE)
          if (
            override.type === 'OVERTIME' &&
            override.overtime_start_time &&
            override.overtime_end_time
          ) {
            const overrideStart = new Date(
              `${override.from_date}T${override.overtime_start_time}`,
            );
            const overrideEnd = new Date(
              `${override.from_date}T${override.overtime_end_time}`,
            );

            return (
              (newStartTime >= overrideStart && newStartTime < overrideEnd) ||
              (newEndTime > overrideStart && newEndTime <= overrideEnd) ||
              (newStartTime <= overrideStart && newEndTime >= overrideEnd)
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
    }

    // Convert date strings to Vietnam timezone
    // If frontend sends string without timezone, we assume it's VN time (UTC+7)
    const updateData: any = {};

    if (dto.start_time) {
      updateData.start_time = toVietnamTime(dto.start_time);
    }
    if (dto.end_time) {
      updateData.end_time = toVietnamTime(dto.end_time);
    }
    if (dto.estimated_hours !== undefined) {
      updateData.estimated_hours = dto.estimated_hours;
    }
    if (dto.reason) {
      updateData.reason = dto.reason;
    }

    const updated = await this.overtimeRepo.updateRequest(id, updateData);

    if (!updated) {
      throw new BusinessException(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to update overtime request.',
        500,
      );
    }

    return ApiResponseDto.success(
      updated,
      'Overtime request updated successfully',
    );
  }
}
