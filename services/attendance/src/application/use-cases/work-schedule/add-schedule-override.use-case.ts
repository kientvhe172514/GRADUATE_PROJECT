import { Injectable, Inject } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { IEmployeeWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { IWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { AddScheduleOverrideDto, ScheduleOverrideType } from '../../dtos/schedule-override.dto';
import {
  EMPLOYEE_WORK_SCHEDULE_REPOSITORY,
  WORK_SCHEDULE_REPOSITORY,
} from '../../tokens';

@Injectable()
export class AddScheduleOverrideUseCase {
  constructor(
    @Inject(EMPLOYEE_WORK_SCHEDULE_REPOSITORY)
    private readonly employeeWorkScheduleRepo: IEmployeeWorkScheduleRepository,
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepo: IWorkScheduleRepository,
  ) {}

  async execute(
    assignmentId: number,
    dto: AddScheduleOverrideDto,
    userId: number,
  ): Promise<void> {
    // Find the assignment
    const assignment = await this.employeeWorkScheduleRepo.findById(assignmentId);
    if (!assignment) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        `Assignment with id ${assignmentId} not found`,
        404,
      );
    }

    // Validate based on override type
    if (dto.type === ScheduleOverrideType.SCHEDULE_CHANGE) {
      await this.validateScheduleChange(dto);
    } else if (dto.type === ScheduleOverrideType.OVERTIME) {
      await this.validateOvertime(assignment, dto);
    } else if (dto.type === ScheduleOverrideType.ON_LEAVE) {
      await this.validateOnLeave(dto);
    }

    // Add the override to the assignment
    assignment.add_schedule_override({
      type: dto.type,
      from_date: dto.from_date,
      to_date: dto.to_date,
      override_work_schedule_id: dto.override_work_schedule_id,
      overtime_start_time: dto.overtime_start_time,
      overtime_end_time: dto.overtime_end_time,
      leave_request_id: (dto as any).leave_request_id,
      reason: dto.reason,
      created_by: userId,
    });

    // Save the assignment
    await this.employeeWorkScheduleRepo.save(assignment);
  }

  private async validateScheduleChange(dto: AddScheduleOverrideDto): Promise<void> {
    // Ensure required fields are present
    if (!dto.override_work_schedule_id) {
      throw new BusinessException(
        ErrorCodes.MISSING_REQUIRED_FIELDS,
        'override_work_schedule_id is required for SCHEDULE_CHANGE',
        400,
      );
    }

    if (!dto.to_date) {
      throw new BusinessException(
        ErrorCodes.MISSING_REQUIRED_FIELDS,
        'to_date is required for SCHEDULE_CHANGE',
        400,
      );
    }

    // Check if the new work schedule exists
    const newWorkSchedule = await this.workScheduleRepo.findById(
      dto.override_work_schedule_id,
    );
    if (!newWorkSchedule) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        `Work schedule with id ${dto.override_work_schedule_id} not found`,
        404,
      );
    }

    // Validate date range
    if (dto.from_date > dto.to_date) {
      throw new BusinessException(
        ErrorCodes.INVALID_DATE_RANGE,
        'from_date cannot be after to_date',
        400,
      );
    }
  }

  private async validateOvertime(
    assignment: any,
    dto: AddScheduleOverrideDto,
  ): Promise<void> {
    // Ensure required fields are present
    if (!dto.overtime_start_time || !dto.overtime_end_time) {
      throw new BusinessException(
        ErrorCodes.MISSING_REQUIRED_FIELDS,
        'overtime_start_time and overtime_end_time are required for OVERTIME',
        400,
      );
    }

    // For overtime, to_date should be null (single day only)
    if (dto.to_date) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        'OVERTIME cannot span multiple days. Set to_date to null.',
        400,
      );
    }

    // Validate overtime time range
    const overtimeStart = dto.overtime_start_time;
    const overtimeEnd = dto.overtime_end_time;
    
    if (overtimeStart >= overtimeEnd) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        'overtime_start_time must be before overtime_end_time',
        400,
      );
    }

    // Check for existing overrides on the same date
    const existingOverrides = assignment.schedule_overrides || [];
    const sameDateOverrides = existingOverrides.filter((override: any) => {
      const overrideFromDate = new Date(override.from_date).toISOString().split('T')[0];
      const dtoFromDate = new Date(dto.from_date).toISOString().split('T')[0];
      return overrideFromDate === dtoFromDate && override.status !== 'FAILED';
    });

    // Check for time conflicts with existing overrides
    for (const existingOverride of sameDateOverrides) {
      if (existingOverride.type === ScheduleOverrideType.OVERTIME) {
        // Check if overtime hours overlap with another overtime
        if (
          this.timeRangesOverlap(
            existingOverride.overtime_start_time,
            existingOverride.overtime_end_time,
            overtimeStart,
            overtimeEnd,
          )
        ) {
          throw new BusinessException(
            ErrorCodes.INVALID_INPUT,
            `Overtime hours (${overtimeStart} - ${overtimeEnd}) overlap with existing overtime (${existingOverride.overtime_start_time} - ${existingOverride.overtime_end_time})`,
            400,
          );
        }
      } else if (existingOverride.type === ScheduleOverrideType.SCHEDULE_CHANGE) {
        // If there's a schedule change override, load that schedule to check times
        const overrideSchedule = await this.workScheduleRepo.findById(
          existingOverride.override_work_schedule_id,
        );
        if (overrideSchedule?.start_time && overrideSchedule?.end_time) {
          if (
            this.timeRangesOverlap(
              overrideSchedule.start_time,
              overrideSchedule.end_time,
              overtimeStart,
              overtimeEnd,
            )
          ) {
            throw new BusinessException(
              ErrorCodes.INVALID_INPUT,
              `Overtime hours (${overtimeStart} - ${overtimeEnd}) overlap with schedule change override (${overrideSchedule.start_time} - ${overrideSchedule.end_time})`,
              400,
            );
          }
        }
      }
    }

    // Load the CURRENT work_schedule to check for time overlap
    const workSchedule = await this.workScheduleRepo.findById(
      assignment.work_schedule_id,
    );
    if (!workSchedule) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        'Work schedule not found for this assignment',
        404,
      );
    }

    // Check if there's a schedule change for this date
    const scheduleChangeForDate = sameDateOverrides.find(
      (o: any) => o.type === ScheduleOverrideType.SCHEDULE_CHANGE,
    );

    let activeStartTime: string | undefined;
    let activeEndTime: string | undefined;

    if (scheduleChangeForDate) {
      // Use the override schedule times
      const overrideSchedule = await this.workScheduleRepo.findById(
        scheduleChangeForDate.override_work_schedule_id,
      );
      activeStartTime = overrideSchedule?.start_time;
      activeEndTime = overrideSchedule?.end_time;
    } else {
      // Use regular schedule times
      activeStartTime = workSchedule.start_time;
      activeEndTime = workSchedule.end_time;
    }

    // Check if overtime overlaps with active work hours
    if (activeStartTime && activeEndTime) {
      if (
        this.timeRangesOverlap(
          activeStartTime,
          activeEndTime,
          overtimeStart,
          overtimeEnd,
        )
      ) {
        throw new BusinessException(
          ErrorCodes.INVALID_INPUT,
          `Overtime hours (${overtimeStart} - ${overtimeEnd}) cannot overlap with work schedule hours (${activeStartTime} - ${activeEndTime})`,
          400,
        );
      }
    }
  }

  /**
   * Check if two time ranges overlap
   * Time format: HH:mm (e.g., "09:00", "18:00")
   */
  private timeRangesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    // Convert time strings to minutes from midnight for easier comparison
    const toMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);

    // Check for overlap: ranges overlap if one starts before the other ends
    return s1 < e2 && s2 < e1;
  }

  private async validateOnLeave(dto: AddScheduleOverrideDto): Promise<void> {
    // Ensure required fields are present
    if (!(dto as any).leave_request_id) {
      throw new BusinessException(
        ErrorCodes.MISSING_REQUIRED_FIELDS,
        'leave_request_id is required for ON_LEAVE',
        400,
      );
    }

    // Ensure to_date is provided for leave (can span multiple days)
    if (!dto.to_date) {
      throw new BusinessException(
        ErrorCodes.MISSING_REQUIRED_FIELDS,
        'to_date is required for ON_LEAVE',
        400,
      );
    }

    // Validate date range
    if (dto.from_date > dto.to_date) {
      throw new BusinessException(
        ErrorCodes.INVALID_DATE_RANGE,
        'from_date cannot be after to_date',
        400,
      );
    }
  }
}
