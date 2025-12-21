import { Injectable, Inject, Logger } from '@nestjs/common';
import { AssignWorkScheduleDto } from '../../dtos/work-schedule.dto';
import {
  IWorkScheduleRepository,
  IEmployeeWorkScheduleRepository,
} from '../../ports/work-schedule.repository.port';
import {
  WORK_SCHEDULE_REPOSITORY,
  EMPLOYEE_WORK_SCHEDULE_REPOSITORY,
} from '../../../application/tokens';
import {
  BusinessException,
  ErrorCodes,
  ApiResponseDto,
} from '@graduate-project/shared-common';
import { JwtPayload } from '@graduate-project/shared-common';
import { EmployeeWorkSchedule } from '../../../domain/entities/employee-work-schedule.entity';
import { ShiftGeneratorService } from '../../services/shift-generator.service';
import { EmployeeServiceClient } from '../../../infrastructure/external-services/employee-service.client';
import { IEventPublisher } from '../../ports/event-publisher.port';

@Injectable()
export class AssignScheduleToEmployeesUseCase {
  private readonly logger = new Logger(AssignScheduleToEmployeesUseCase.name);

  constructor(
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: IWorkScheduleRepository,
    @Inject(EMPLOYEE_WORK_SCHEDULE_REPOSITORY)
    private readonly employeeWorkScheduleRepository: IEmployeeWorkScheduleRepository,
    private readonly shiftGeneratorService: ShiftGeneratorService,
    private readonly employeeServiceClient: EmployeeServiceClient,
    @Inject('IEventPublisher')
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    scheduleId: number,
    dto: AssignWorkScheduleDto,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<void>> {
    const workSchedule = await this.workScheduleRepository.findById(scheduleId);
    if (!workSchedule) {
      throw new BusinessException(
        ErrorCodes.SCHEDULE_NOT_FOUND,
        'Work schedule not found.',
        404,
      );
    }

    // Validate effective_from date
    const effectiveFromDate = new Date(dto.effective_from);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (effectiveFromDate < today) {
      throw new BusinessException(
        'INVALID_EFFECTIVE_DATE',
        `effective_from (${dto.effective_from}) cannot be in the past. Please use today or a future date.`,
        400,
      );
    }

    // Validate: Check if employees already have overlapping schedules (time-based)
    this.logger.log(
      `🔍 Checking for time conflicts for ${dto.employee_ids.length} employees...`,
    );

    const newScheduleProps = workSchedule.toJSON();
    const newStartTime = newScheduleProps.start_time;
    const newEndTime = newScheduleProps.end_time;

    for (const employeeId of dto.employee_ids) {
      // Get all active assignments for this employee in the date range
      const existingAssignments =
        await this.employeeWorkScheduleRepository.findAssignmentsByEmployeeId(
          employeeId,
        );

      // Filter to only assignments that overlap with new date range
      const overlappingAssignments = existingAssignments.filter(
        (assignment) => {
          // Handle both domain entity and plain object
          const assignProps = typeof (assignment as any).toJSON === 'function'
            ? (assignment as any).toJSON()
            : assignment;
          const assignStart = assignProps.effective_from;
          const assignEnd = assignProps.effective_to;
          const newStart = effectiveFromDate;
          const newEnd = dto.effective_to ? new Date(dto.effective_to) : null;

          // Check date range overlap
          if (assignEnd && assignEnd < newStart) return false; // Assignment ends before new starts
          if (newEnd && assignStart > newEnd) return false; // Assignment starts after new ends
          return true; // Date ranges overlap
        },
      );

      // For each overlapping assignment, check if work hours conflict
      for (const existing of overlappingAssignments) {
        // Handle both domain entity and plain object
        const existingProps = typeof (existing as any).toJSON === 'function'
          ? (existing as any).toJSON()
          : existing;
        // Allow assigning the same schedule again if time ranges do not overlap.
        // We only block when time ranges overlap regardless of schedule id.

        const existingSchedule = await this.workScheduleRepository.findById(
          existingProps.work_schedule_id,
        );

        if (existingSchedule) {
          const existingProps = existingSchedule.toJSON();
          const existingStartTime = existingProps.start_time;
          const existingEndTime = existingProps.end_time;

          // Check time overlap (if both schedules have fixed times)
          if (
            newStartTime &&
            newEndTime &&
            existingStartTime &&
            existingEndTime
          ) {
            const hasTimeOverlap = this.checkTimeOverlap(
              newStartTime,
              newEndTime,
              existingStartTime,
              existingEndTime,
            );

            if (hasTimeOverlap) {
              this.logger.warn(
                `⚠️ Employee ${employeeId} has time conflict: Existing schedule ${existingProps.schedule_name} (${existingStartTime}-${existingEndTime}) overlaps with new schedule ${newScheduleProps.schedule_name} (${newStartTime}-${newEndTime})`,
              );
              throw new BusinessException(
                'SCHEDULE_TIME_CONFLICT',
                `Employee ${employeeId} already has a schedule "${existingProps.schedule_name}" (${existingStartTime}-${existingEndTime}) that conflicts with the new schedule "${newScheduleProps.schedule_name}" (${newStartTime}-${newEndTime}). Please adjust the time ranges or remove the existing schedule.`,
                409,
              );
            } else {
              this.logger.log(
                `✅ Employee ${employeeId}: Time ranges don't conflict - ${existingStartTime}-${existingEndTime} vs ${newStartTime}-${newEndTime}`,
              );
            }
          }
        }
      }
    }

    // Create assignments (no need to fetch employee info here - it's just a link)
    const assignments = dto.employee_ids.map((employeeId) => {
      return new EmployeeWorkSchedule({
        employee_id: employeeId,
        work_schedule_id: scheduleId,
        effective_from: new Date(dto.effective_from),
        effective_to: dto.effective_to ? new Date(dto.effective_to) : undefined,
        created_by: currentUser.sub,
      });
    });

    this.logger.log(
      `💾 Saving ${assignments.length} schedule assignments for employees: ${dto.employee_ids.join(', ')}`,
    );

    const savedAssignments =
      await this.employeeWorkScheduleRepository.saveMany(assignments);

    this.logger.log(
      `✅ Successfully saved ${savedAssignments.length} schedule assignments`,
    );

    // Publish shift assigned event for each employee
    for (const employeeId of dto.employee_ids) {
      try {
        await this.eventPublisher.publish({
          pattern: 'shift.assigned',
          data: {
            employeeId,
            scheduleId: workSchedule.id,
            scheduleName: workSchedule.schedule_name,
            effectiveFrom: dto.effective_from,
            effectiveTo: dto.effective_to,
            startTime: workSchedule.start_time,
            endTime: workSchedule.end_time,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        this.logger.error(`Failed to publish shift.assigned event for employee ${employeeId}:`, error);
      }
    }

    // Async: Generate shifts for first 7 days after assignment
    // This runs in background so assignment response is fast
    this.generateInitialShifts(
      dto.employee_ids,
      new Date(dto.effective_from),
      dto.effective_to ? new Date(dto.effective_to) : undefined,
    ).catch((error) => {
      this.logger.error(
        'Failed to generate initial shifts after assignment:',
        error,
      );
      // Don't throw - assignment already succeeded
    });

    return ApiResponseDto.success(
      undefined,
      'Work schedule assigned to employees successfully. Shifts are being generated.',
    );
  }

  /**
   * Generate shifts for first 7 days after assignment
   * Runs asynchronously to not block the assignment response
   */
  private async generateInitialShifts(
    employeeIds: number[],
    effectiveFrom: Date,
    effectiveTo?: Date,
  ): Promise<void> {
    const startDate = new Date(effectiveFrom);
    startDate.setHours(0, 0, 0, 0);

    // Generate for 7 days or until effectiveTo (whichever is sooner)
    let endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // +6 = 7 days total
    endDate.setHours(23, 59, 59, 999);

    if (effectiveTo && effectiveTo < endDate) {
      endDate = new Date(effectiveTo);
      endDate.setHours(23, 59, 59, 999);
    }

    this.logger.log(
      `🔄 Generating initial shifts for ${employeeIds.length} employees (IDs: ${employeeIds.join(', ')}) from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    );

    // Process each employee
    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const employeeId of employeeIds) {
      try {
        this.logger.log(`🔄 Generating shifts for employee ${employeeId}...`);
        const result =
          await this.shiftGeneratorService.generateShiftsForEmployee(
            employeeId,
            startDate,
            endDate,
          );
        this.logger.log(
          `✅ Employee ${employeeId}: Created ${result.shiftsCreated}, Skipped ${result.shiftsSkipped}, Errors ${result.errors.length}`,
        );
        totalCreated += result.shiftsCreated;
        totalSkipped += result.shiftsSkipped;
        totalErrors += result.errors.length;

        if (result.errors.length > 0) {
          this.logger.error(
            `❌ Errors for employee ${employeeId}:`,
            result.errors,
          );
        }
      } catch (error) {
        totalErrors++;
        this.logger.error(
          `❌ Failed to generate shifts for employee ${employeeId}:`,
          error instanceof Error ? error.message : error,
        );
        this.logger.error(
          'Stack trace:',
          error instanceof Error ? error.stack : '',
        );
        // Continue with other employees
      }
    }

    this.logger.log(
      `✅ Initial shift generation completed. Total: Created=${totalCreated}, Skipped=${totalSkipped}, Errors=${totalErrors}`,
    );
  }

  /**
   * Check if two time ranges overlap
   * @param start1 Start time 1 (HH:mm:ss format)
   * @param end1 End time 1 (HH:mm:ss format)
   * @param start2 Start time 2 (HH:mm:ss format)
   * @param end2 End time 2 (HH:mm:ss format)
   * @returns true if times overlap, false otherwise
   */
  private checkTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    // Convert time strings to minutes for easy comparison
    const toMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start1Min = toMinutes(start1);
    const end1Min = toMinutes(end1);
    const start2Min = toMinutes(start2);
    const end2Min = toMinutes(end2);

    // Check overlap: ranges overlap if start1 < end2 AND start2 < end1
    return start1Min < end2Min && start2Min < end1Min;
  }
}
