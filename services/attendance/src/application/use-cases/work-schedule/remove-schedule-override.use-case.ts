import { Injectable, Inject } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { IEmployeeWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { EMPLOYEE_WORK_SCHEDULE_REPOSITORY } from '../../tokens';

@Injectable()
export class RemoveScheduleOverrideUseCase {
  constructor(
    @Inject(EMPLOYEE_WORK_SCHEDULE_REPOSITORY)
    private readonly employeeWorkScheduleRepo: IEmployeeWorkScheduleRepository,
  ) {}

  async execute(assignmentId: number, overrideId: string): Promise<void> {
    const assignment = await this.employeeWorkScheduleRepo.findById(assignmentId);
    if (!assignment) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        `Assignment with id ${assignmentId} not found`,
        404,
      );
    }

    // Ensure override exists
    const found = assignment.schedule_overrides.find((o) => o.id === overrideId);
    if (!found) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        `Override with id ${overrideId} not found`,
        404,
      );
    }

    assignment.remove_schedule_override(overrideId);
    await this.employeeWorkScheduleRepo.save(assignment);
  }
}
