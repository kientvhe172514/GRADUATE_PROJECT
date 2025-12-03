import { Injectable, Inject } from '@nestjs/common';
import { IEmployeeWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { ScheduleOverrideDto } from '../../dtos/schedule-override.dto';
import { EMPLOYEE_WORK_SCHEDULE_REPOSITORY } from '../../tokens';

@Injectable()
export class ListScheduleOverridesUseCase {
  constructor(
    @Inject(EMPLOYEE_WORK_SCHEDULE_REPOSITORY)
    private readonly employeeWorkScheduleRepo: IEmployeeWorkScheduleRepository,
  ) {}

  /**
   * List all overrides for a given assignment id
   */
  async execute(assignmentId: number): Promise<ScheduleOverrideDto[]> {
    const assignment = await this.employeeWorkScheduleRepo.findById(assignmentId);
    if (!assignment) return [];

    // Map domain ScheduleOverride objects to DTO
    return assignment.schedule_overrides.map((o) => ({
      id: o.id,
      type: o.type,
      from_date: o.from_date,
      to_date: o.to_date,
      override_work_schedule_id: o.override_work_schedule_id,
      overtime_start_time: o.overtime_start_time,
      overtime_end_time: o.overtime_end_time,
      reason: o.reason,
      created_by: o.created_by,
      created_at: o.created_at,
      status: o.status,
      shift_created: o.shift_created,
      processed_at: o.processed_at,
      error_message: o.error_message,
    }));
  }
}
