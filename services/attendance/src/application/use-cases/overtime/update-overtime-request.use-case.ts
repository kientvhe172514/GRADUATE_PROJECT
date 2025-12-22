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
 * Parse datetime string - Keep as UTC for comparison
 * Frontend sends: "2025-12-22T02:36:00.000Z" (UTC time to compare with shifts)
 * Backend extracts: 02:36 and creates UTC Date object
 * All comparisons happen in UTC timezone
 */
function parseDateTime(dateTimeStr: string): Date {
  // Extract time parts from ISO string
  const match = dateTimeStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) {
    throw new Error(`Invalid datetime format: ${dateTimeStr}`);
  }
  
  const [, year, month, day, hour, minute, second] = match;
  // Create UTC Date object (use Date.UTC)
  return new Date(
    Date.UTC(
      parseInt(year),
      parseInt(month) - 1, // JavaScript months are 0-indexed
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second),
    )
  );
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
        ? parseDateTime(dto.start_time)
        : request.start_time;
      const newEndTime = dto.end_time
        ? parseDateTime(dto.end_time)
        : request.end_time;
      // TypeORM returns DATE column as string "YYYY-MM-DD", convert to Date object
      const overtimeDate =
        typeof request.overtime_date === 'string'
          ? new Date(request.overtime_date)
          : request.overtime_date;

      console.log(`🕐 [UPDATE-OVERTIME] Request time: ${newStartTime.toISOString()} - ${newEndTime.toISOString()}`);
      console.log(`📅 [UPDATE-OVERTIME] overtimeDate from DB: ${request.overtime_date}, parsed: ${overtimeDate.toISOString()}, local: ${overtimeDate.toString()}`);

      // Check if there's already a REGULAR shift on this date
      const existingShift =
        await this.shiftRepo.findRegularShiftByEmployeeAndDate(
          currentUser.employee_id!,
          overtimeDate,
        );

      if (existingShift) {
        // Parse scheduled shift times and create UTC Date objects for comparison
        const [startHour, startMin] = existingShift.scheduled_start_time
          .split(':')
          .map(Number);
        const [endHour, endMin] = existingShift.scheduled_end_time
          .split(':')
          .map(Number);

        // Create UTC Date objects for shift times (same date as overtime)
        const shiftStart = new Date(
          Date.UTC(
            overtimeDate.getUTCFullYear(),
            overtimeDate.getUTCMonth(),
            overtimeDate.getUTCDate(),
            startHour,
            startMin,
            0,
          ),
        );
        const shiftEnd = new Date(
          Date.UTC(
            overtimeDate.getUTCFullYear(),
            overtimeDate.getUTCMonth(),
            overtimeDate.getUTCDate(),
            endHour,
            endMin,
            0,
          ),
        );

        console.log(`⏰ [UPDATE-OVERTIME] Shift check - shiftStart: ${shiftStart.toISOString()}, shiftEnd: ${shiftEnd.toISOString()}`);
        console.log(`⏰ [UPDATE-OVERTIME] Overtime - newStartTime: ${newStartTime.toISOString()}, newEndTime: ${newEndTime.toISOString()}`);

        // Check if overtime time overlaps with regular shift
        const hasOverlap =
          (newStartTime >= shiftStart && newStartTime < shiftEnd) ||
          (newEndTime > shiftStart && newEndTime <= shiftEnd) ||
          (newStartTime <= shiftStart && newEndTime >= shiftEnd);

        console.log(`⏰ [UPDATE-OVERTIME] hasOverlap: ${hasOverlap}`);

        if (hasOverlap) {
          throw new BusinessException(
            ErrorCodes.INVALID_INPUT,
            `Overtime time overlaps with your regular shift (${existingShift.scheduled_start_time} - ${existingShift.scheduled_end_time}). Please choose a different time.`,
            400,
          );
        }
      }

      // Check ALL assigned work schedules for this date (employee can have multiple schedules)
      const workSchedules =
        await this.employeeWorkScheduleRepo.findAllByEmployeeIdAndDate(
          currentUser.employee_id!,
          overtimeDate,
        );

      console.log(`🔍 [UPDATE-OVERTIME] Found ${workSchedules.length} active work schedule(s) for date ${overtimeDate.toISOString().split('T')[0]}`);

      // Check overlap with each assigned work schedule
      for (const workSchedule of workSchedules) {
        console.log(`🔍 [UPDATE-OVERTIME] Checking work_schedule ID: ${workSchedule.work_schedule_id}`);
        
        if ((workSchedule as any).work_schedule) {
          const ws = (workSchedule as any).work_schedule;
          console.log(`🔍 [UPDATE-OVERTIME] Schedule: ${ws.schedule_name} (${ws.start_time} - ${ws.end_time})`);
          
          if (ws.start_time && ws.end_time) {
            const [wsStartHour, wsStartMin] = ws.start_time.split(':').map(Number);
            const [wsEndHour, wsEndMin] = ws.end_time.split(':').map(Number);

            // Both work schedule times and overtime times are in VN timezone (UTC+7)
            // Compare them directly without timezone conversion
            const wsStart = new Date(
              Date.UTC(
                overtimeDate.getUTCFullYear(),
                overtimeDate.getUTCMonth(),
                overtimeDate.getUTCDate(),
                wsStartHour,
                wsStartMin,
                0,
              ),
            );

            let wsEnd = new Date(
              Date.UTC(
                overtimeDate.getUTCFullYear(),
                overtimeDate.getUTCMonth(),
                overtimeDate.getUTCDate(),
                wsEndHour,
                wsEndMin,
                0,
              ),
            );

            // If end_time is earlier than start_time -> overnight shift
            if (wsEnd <= wsStart) {
              wsEnd = new Date(wsEnd.getTime() + 24 * 60 * 60 * 1000);
            }

            const hasOverlapWithAssignedSchedule =
              (newStartTime >= wsStart && newStartTime < wsEnd) ||
              (newEndTime > wsStart && newEndTime <= wsEnd) ||
              (newStartTime <= wsStart && newEndTime >= wsEnd);

            console.log(`🔍 [UPDATE-OVERTIME] Overlap check: ${hasOverlapWithAssignedSchedule}`);

            if (hasOverlapWithAssignedSchedule) {
              throw new BusinessException(
                ErrorCodes.INVALID_INPUT,
                `Overtime time overlaps with your assigned work schedule "${ws.schedule_name}" (${ws.start_time} - ${ws.end_time}). Please choose a different time.`,
                400,
              );
            }
          }
        }
      }

      // Check schedule_overrides in any of the work schedules
      for (const workSchedule of workSchedules) {
        const overrides = Array.isArray(workSchedule.schedule_overrides)
          ? workSchedule.schedule_overrides
          : [];

        // Convert overtimeDate to YYYY-MM-DD string for comparison
        const dateStr = overtimeDate.toISOString().split('T')[0];
        const conflictOverride = overrides.find((override: any) => {
          // Check if override is for this date
          if (override.from_date !== dateStr) return false;

          // Only check OVERTIME type overrides (ignore SCHEDULE_CHANGE, ON_LEAVE)
          if (
            override.type === 'OVERTIME' &&
            override.overtime_start_time &&
            override.overtime_end_time
          ) {
            // Parse override times using the same UTC approach
            const overrideStart = parseDateTime(
              `${override.from_date}T${override.overtime_start_time}`,
            );
            const overrideEnd = parseDateTime(
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

    // Parse datetime with timezone support
    // Frontend sends: "2025-12-22T13:20:00.000Z" (ignore Z, treat as VN time 13:20)
    // parseDateTime creates: Date(2025,11,22,13,20) = 13:20 VN local time
    // PostgreSQL timestamptz stores: 13:20 VN → 06:20 UTC (auto convert)
    // When reading: 06:20 UTC → 13:20 VN (auto convert back)
    const updateData: any = {};

    if (dto.start_time) {
      updateData.start_time = parseDateTime(dto.start_time);
    }
    if (dto.end_time) {
      updateData.end_time = parseDateTime(dto.end_time);
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
