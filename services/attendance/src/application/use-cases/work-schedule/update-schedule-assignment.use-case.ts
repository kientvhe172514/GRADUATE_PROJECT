import { Injectable, Inject, Logger } from '@nestjs/common';
import { IEmployeeWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { EMPLOYEE_WORK_SCHEDULE_REPOSITORY } from '../../tokens';
import {
  BusinessException,
  ApiResponseDto,
} from '@graduate-project/shared-common';
import { EmployeeShiftRepository } from '../../../infrastructure/repositories/employee-shift.repository';

export interface UpdateAssignmentDatesDto {
  effective_from?: string;
  effective_to?: string;
}

@Injectable()
export class UpdateScheduleAssignmentUseCase {
  private readonly logger = new Logger(UpdateScheduleAssignmentUseCase.name);

  constructor(
    @Inject(EMPLOYEE_WORK_SCHEDULE_REPOSITORY)
    private readonly employeeWorkScheduleRepository: IEmployeeWorkScheduleRepository,
    private readonly employeeShiftRepository: EmployeeShiftRepository,
  ) {}

  async execute(
    assignmentId: number,
    dto: UpdateAssignmentDatesDto,
  ): Promise<ApiResponseDto<void>> {
    this.logger.log(`📝 Updating schedule assignment ID: ${assignmentId}`);

    // Find assignment
    const assignment =
      await this.employeeWorkScheduleRepository.findById(assignmentId);
    if (!assignment) {
      throw new BusinessException(
        'ASSIGNMENT_NOT_FOUND',
        'Schedule assignment not found.',
        404,
      );
    }

    const props = assignment.toJSON();
    const oldEffectiveTo = props.effective_to;

    // Update dates
    if (dto.effective_from) {
      props.effective_from = new Date(dto.effective_from);
    }
    if (dto.effective_to) {
      props.effective_to = new Date(dto.effective_to);
    } else if (dto.effective_to === null) {
      props.effective_to = undefined;
    }

    // Validate dates
    if (props.effective_to && props.effective_to < props.effective_from) {
      throw new BusinessException(
        'INVALID_DATE_RANGE',
        'effective_to must be after effective_from.',
        400,
      );
    }

    this.logger.log(
      `📋 Updating assignment: Employee ${props.employee_id}, Schedule ${props.work_schedule_id}`,
    );
    this.logger.log(
      `   New dates: ${props.effective_from.toISOString().split('T')[0]} to ${props.effective_to?.toISOString().split('T')[0] || 'indefinite'}`,
    );

    // Update assignment
    await this.employeeWorkScheduleRepository.update(assignmentId, assignment);

    // If effective_to changed and is earlier, delete shifts after new end date
    let deletedShifts = 0;
    if (
      props.effective_to &&
      (!oldEffectiveTo || props.effective_to < oldEffectiveTo)
    ) {
      const nextDay = new Date(props.effective_to);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);

      deletedShifts =
        await this.employeeShiftRepository.deleteFutureShiftsByAssignment(
          props.employee_id,
          props.work_schedule_id,
          nextDay,
        );

      this.logger.log(
        `🗑️ Deleted ${deletedShifts} shifts after new effective_to date`,
      );
    }

    this.logger.log(`✅ Successfully updated assignment ID ${assignmentId}`);

    return ApiResponseDto.success(
      undefined,
      deletedShifts > 0
        ? `Assignment updated successfully. ${deletedShifts} future shifts deleted.`
        : 'Assignment updated successfully.',
    );
  }
}
