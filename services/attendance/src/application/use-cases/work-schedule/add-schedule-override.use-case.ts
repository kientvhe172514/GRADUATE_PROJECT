import { Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { IEmployeeWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { IWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { AddScheduleOverrideDto, ScheduleOverrideType } from '../../dtos/schedule-override.dto';

@Injectable()
export class AddScheduleOverrideUseCase {
  constructor(
    private readonly employeeWorkScheduleRepo: IEmployeeWorkScheduleRepository,
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
    }

    // Add the override to the assignment
    assignment.add_schedule_override({
      type: dto.type,
      from_date: dto.from_date,
      to_date: dto.to_date,
      override_work_schedule_id: dto.override_work_schedule_id,
      overtime_start_time: dto.overtime_start_time,
      overtime_end_time: dto.overtime_end_time,
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

    // Load the work_schedule to check for time overlap
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

    // Check if overtime overlaps with regular work hours
    const regularStartTime = workSchedule.start_time;
    const regularEndTime = workSchedule.end_time;
    const overtimeStart = dto.overtime_start_time;
    const overtimeEnd = dto.overtime_end_time;

    // Only perform overlap check if the regular schedule has defined times
    if (regularStartTime && regularEndTime) {
      if (
        this.timeRangesOverlap(
          regularStartTime,
          regularEndTime,
          overtimeStart,
          overtimeEnd,
        )
      ) {
        throw new BusinessException(
          ErrorCodes.INVALID_INPUT,
          `Overtime hours (${overtimeStart} - ${overtimeEnd}) cannot overlap with regular work schedule hours (${regularStartTime} - ${regularEndTime})`,
          400,
        );
      }
    }

    // Validate overtime time range
    if (overtimeStart >= overtimeEnd) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        'overtime_start_time must be before overtime_end_time',
        400,
      );
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
}
