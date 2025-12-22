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
    // Frontend sends datetime in Vietnam timezone: 2025-12-23T14:30:00+07:00
    // JavaScript will automatically convert to UTC internally
    const overtimeStart = parseDateTime(dto.start_time);
    const overtimeEnd = parseDateTime(dto.end_time);
    const overtimeDate = new Date(dto.overtime_date);

    console.log(`🕐 [OVERTIME] Request time: ${overtimeStart.toISOString()} - ${overtimeEnd.toISOString()}`);

    // Check if there's already a REGULAR shift on this date
    const existingShift = await this.shiftRepo.findRegularShiftByEmployeeAndDate(
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
          // Parse override times using the same UTC approach
          const overrideStart = parseDateTime(`${override.from_date}T${override.overtime_start_time}`);
          const overrideEnd = parseDateTime(`${override.from_date}T${override.overtime_end_time}`);

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

            // Create UTC Date objects for override schedule times
            const osStart = new Date(Date.UTC(
              overtimeDate.getUTCFullYear(),
              overtimeDate.getUTCMonth(),
              overtimeDate.getUTCDate(),
              osStartHour,
              osStartMin,
              0,
            ));
            
            let osEnd = new Date(Date.UTC(
              overtimeDate.getUTCFullYear(),
              overtimeDate.getUTCMonth(),
              overtimeDate.getUTCDate(),
              osEndHour,
              osEndMin,
              0,
            ));

            // If end_time is earlier than start_time -> overnight shift
            if (osEnd <= osStart) {
              osEnd = new Date(osEnd.getTime() + 24 * 60 * 60 * 1000);
            }

            console.log(`� [OVERTIME-TZ] Override Schedule VN: ${osStart.toISOString()} - ${osEnd.toISOString()}`);

            const hasOverlapWithOverrideSchedule =
              (overtimeStart >= osStart && overtimeStart < osEnd) ||
              (overtimeEnd > osStart && overtimeEnd <= osEnd) ||
              (overtimeStart <= osStart && overtimeEnd >= osEnd);

            console.log(`🔍 [OVERTIME] Has overlap with override: ${hasOverlapWithOverrideSchedule}`);

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
