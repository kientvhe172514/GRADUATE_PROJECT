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

@Injectable()
export class AssignScheduleToEmployeesUseCase {
  private readonly logger = new Logger(AssignScheduleToEmployeesUseCase.name);

  constructor(
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: IWorkScheduleRepository,
    @Inject(EMPLOYEE_WORK_SCHEDULE_REPOSITORY)
    private readonly employeeWorkScheduleRepository: IEmployeeWorkScheduleRepository,
    private readonly shiftGeneratorService: ShiftGeneratorService,
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

    const assignments = dto.employee_ids.map((employeeId) => {
      return new EmployeeWorkSchedule({
        employee_id: employeeId,
        work_schedule_id: scheduleId,
        effective_from: new Date(dto.effective_from),
        effective_to: dto.effective_to ? new Date(dto.effective_to) : undefined,
        created_by: currentUser.sub,
      });
    });

    await this.employeeWorkScheduleRepository.saveMany(assignments);

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
      `🔄 Generating initial shifts for ${employeeIds.length} employees from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    );

    // Process each employee
    for (const employeeId of employeeIds) {
      try {
        await this.shiftGeneratorService.generateShiftsForEmployee(
          employeeId,
          startDate,
          endDate,
        );
      } catch (error) {
        this.logger.error(
          `Failed to generate shifts for employee ${employeeId}:`,
          error,
        );
        // Continue with other employees
      }
    }

    this.logger.log('✅ Initial shift generation completed');
  }
}
