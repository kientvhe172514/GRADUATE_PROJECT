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

    // Validate: Check if employees already have overlapping schedules
    this.logger.log(
      `🔍 Checking for existing schedules for ${dto.employee_ids.length} employees...`,
    );

    for (const employeeId of dto.employee_ids) {
      const existingAssignment =
        await this.employeeWorkScheduleRepository.findByEmployeeIdAndDate(
          employeeId,
          effectiveFromDate,
        );

      if (existingAssignment) {
        this.logger.warn(
          `⚠️ Employee ${employeeId} already has an active schedule (ID: ${existingAssignment.work_schedule_id}) for the specified date range`,
        );
        throw new BusinessException(
          'SCHEDULE_OVERLAP',
          `Employee ${employeeId} already has an active work schedule from ${existingAssignment.effective_from.toISOString().split('T')[0]} to ${existingAssignment.effective_to?.toISOString().split('T')[0] || 'indefinite'}. Please remove or adjust the existing schedule first.`,
          409,
        );
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
}
