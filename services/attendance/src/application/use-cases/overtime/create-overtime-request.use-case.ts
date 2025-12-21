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

    // Check ALL assigned work schedules for this date (employee can have multiple schedules)
    const workSchedules =
      await this.employeeWorkScheduleRepo.findAllByEmployeeIdAndDate(
        currentUser.employee_id!,
        overtimeDate,
      );

    console.log(`🔍 [OVERTIME] Found ${workSchedules.length} active work schedule(s) for date ${overtimeDate.toISOString().split('T')[0]}`);

    // Check overlap with each assigned work schedule
    for (const workSchedule of workSchedules) {
      console.log(`🔍 [OVERTIME] Checking work_schedule ID: ${workSchedule.work_schedule_id}`);
      
      if ((workSchedule as any).work_schedule) {
        const ws = (workSchedule as any).work_schedule;
        console.log(`🔍 [OVERTIME] Schedule: ${ws.schedule_name} (${ws.start_time} - ${ws.end_time})`);
        
        if (ws.start_time && ws.end_time) {
          const [wsStartHour, wsStartMin] = ws.start_time.split(':').map(Number);
          const [wsEndHour, wsEndMin] = ws.end_time.split(':').map(Number);

          const wsStart = new Date(overtimeDate);
          wsStart.setHours(wsStartHour, wsStartMin, 0, 0);
          let wsEnd = new Date(overtimeDate);
          wsEnd.setHours(wsEndHour, wsEndMin, 0, 0);

          // If end_time is earlier than start_time -> overnight shift
          if (wsEnd <= wsStart) {
            wsEnd = new Date(wsEnd.getTime() + 24 * 60 * 60 * 1000);
          }

          const hasOverlapWithAssignedSchedule =
            (overtimeStart >= wsStart && overtimeStart < wsEnd) ||
            (overtimeEnd > wsStart && overtimeEnd <= wsEnd) ||
            (overtimeStart <= wsStart && overtimeEnd >= wsEnd);

          console.log(`🔍 [OVERTIME] Overlap check: ${hasOverlapWithAssignedSchedule} (OT: ${overtimeStart.toISOString()} - ${overtimeEnd.toISOString()} vs Schedule: ${wsStart.toISOString()} - ${wsEnd.toISOString()})`);

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

      const dateStr = overtimeDate.toISOString().split('T')[0];
      
      console.log(`🔍 [OVERTIME] Checking ${overrides.length} override(s) for date ${dateStr}`);
      
      for (const override of overrides) {
        console.log(`🔍 [OVERTIME] Override: type=${override.type}, from_date=${override.from_date}, to_date=${override.to_date}`);
        
        // Check if override date range includes the overtime date
        const overrideFromDate = override.from_date; // "2025-12-23"
        const overrideToDate = override.to_date || override.from_date; // "2025-12-23"
        
        // Check if overtime date is within override date range
        if (dateStr < overrideFromDate || dateStr > overrideToDate) {
          console.log(`🔍 [OVERTIME] Override date range (${overrideFromDate} - ${overrideToDate}) does not include ${dateStr}, skipping`);
          continue;
        }
        
        console.log(`🔍 [OVERTIME] Override date range matches! Checking overlap...`);

        // Check OVERTIME type overrides
        if (override.type === 'OVERTIME' && override.overtime_start_time && override.overtime_end_time) {
          const overrideStart = new Date(`${override.from_date}T${override.overtime_start_time}`);
          const overrideEnd = new Date(`${override.from_date}T${override.overtime_end_time}`);

          const hasOverlap = (
            (overtimeStart >= overrideStart && overtimeStart < overrideEnd) ||
            (overtimeEnd > overrideStart && overtimeEnd <= overrideEnd) ||
            (overtimeStart <= overrideStart && overtimeEnd >= overrideEnd)
          );

          if (hasOverlap) {
            throw new BusinessException(
              ErrorCodes.INVALID_INPUT,
              `Overtime time conflicts with another overtime on ${override.from_date} (${override.overtime_start_time} - ${override.overtime_end_time}). Please check your work schedule.`,
              400,
            );
          }
        }

        // Check SCHEDULE_CHANGE type overrides (temporary schedule change)
        if (override.type === 'SCHEDULE_CHANGE' && override.override_work_schedule_id) {
          console.log(`🔍 [OVERTIME] SCHEDULE_CHANGE detected, fetching override_work_schedule_id: ${override.override_work_schedule_id}`);
          
          // Need to fetch the override schedule details to check time overlap
          const overrideSchedule = await this.employeeWorkScheduleRepo.findWorkScheduleById(
            override.override_work_schedule_id,
          );

          console.log(`🔍 [OVERTIME] Override schedule fetched: ${overrideSchedule ? `${overrideSchedule.schedule_name} (${overrideSchedule.start_time} - ${overrideSchedule.end_time})` : 'NOT FOUND'}`);

          if (overrideSchedule && overrideSchedule.start_time && overrideSchedule.end_time) {
            const [osStartHour, osStartMin] = overrideSchedule.start_time.split(':').map(Number);
            const [osEndHour, osEndMin] = overrideSchedule.end_time.split(':').map(Number);

            const osStart = new Date(overtimeDate);
            osStart.setHours(osStartHour, osStartMin, 0, 0);
            let osEnd = new Date(overtimeDate);
            osEnd.setHours(osEndHour, osEndMin, 0, 0);

            // If end_time is earlier than start_time -> overnight shift
            if (osEnd <= osStart) {
              osEnd = new Date(osEnd.getTime() + 24 * 60 * 60 * 1000);
            }

            console.log(`🔍 [OVERTIME] Checking overlap: OT (${overtimeStart.toISOString()} - ${overtimeEnd.toISOString()}) vs Override Schedule (${osStart.toISOString()} - ${osEnd.toISOString()})`);

            const hasOverlapWithOverrideSchedule = (
              (overtimeStart >= osStart && overtimeStart < osEnd) ||
              (overtimeEnd > osStart && overtimeEnd <= osEnd) ||
              (overtimeStart <= osStart && overtimeEnd >= osEnd)
            );

            console.log(`🔍 [OVERTIME] Has overlap: ${hasOverlapWithOverrideSchedule}`);

            if (hasOverlapWithOverrideSchedule) {
              throw new BusinessException(
                ErrorCodes.INVALID_INPUT,
                `Overtime time overlaps with your temporary schedule change "${overrideSchedule.schedule_name}" (${overrideSchedule.start_time} - ${overrideSchedule.end_time}) on ${override.from_date}. Please choose a different time.`,
                400,
              );
            }
          }
        }
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
