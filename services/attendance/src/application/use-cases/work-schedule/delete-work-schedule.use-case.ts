import { Injectable, Inject } from '@nestjs/common';
import { IWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { WORK_SCHEDULE_REPOSITORY } from '../../tokens';
import {
  BusinessException,
  ErrorCodes,
  ApiResponseDto,
} from '@graduate-project/shared-common';
import { JwtPayload } from '@graduate-project/shared-common';
import { DataSource } from 'typeorm';

@Injectable()
export class DeleteWorkScheduleUseCase {
  constructor(
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: IWorkScheduleRepository,
    private readonly dataSource: DataSource,
  ) { }

  async execute(
    id: number,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<void>> {
    const workSchedule = await this.workScheduleRepository.findById(id);
    if (!workSchedule) {
      throw new BusinessException(
        ErrorCodes.SCHEDULE_NOT_FOUND,
        'Work schedule not found.',
        404,
      );
    }

    console.log(
      `🗑️ [DELETE] User ${currentUser.sub} is deleting work_schedule ${id} (${workSchedule.schedule_name})`,
    );

    // Use transaction to ensure data consistency
    await this.dataSource.transaction(async (manager) => {
      // 1. Delete all employee_work_schedule assignments for this work schedule
      const deleteAssignmentsResult = await manager
        .createQueryBuilder()
        .delete()
        .from('employee_work_schedules')
        .where('work_schedule_id = :scheduleId', { scheduleId: id })
        .execute();

      console.log(
        `🗑️ [DELETE] Deleted ${deleteAssignmentsResult.affected || 0} employee_work_schedule assignments for work_schedule_id: ${id}`,
      );

      // 2. DELETE the work schedule (HARD DELETE - not deactivate)
      const deleteScheduleResult = await manager
        .createQueryBuilder()
        .delete()
        .from('work_schedules')
        .where('id = :scheduleId', { scheduleId: id })
        .execute();

      console.log(
        `🗑️ [DELETE] Deleted work_schedule with id: ${id} (affected: ${deleteScheduleResult.affected || 0})`,
      );
    });

    return ApiResponseDto.success(
      undefined,
      'Work schedule and all employee assignments deleted successfully.',
    );
  }
}
