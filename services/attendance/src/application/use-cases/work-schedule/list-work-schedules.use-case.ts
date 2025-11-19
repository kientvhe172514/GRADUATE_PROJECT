import { Injectable, Inject } from '@nestjs/common';
import {
  ListWorkScheduleDto,
  WorkScheduleDto,
} from '../../dtos/work-schedule.dto';
import { IWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { WORK_SCHEDULE_REPOSITORY } from '../../../application/tokens';
import { ApiResponseDto } from '@graduate-project/shared-common';

@Injectable()
export class ListWorkSchedulesUseCase {
  constructor(
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: IWorkScheduleRepository,
  ) {}

  async execute(
    dto: ListWorkScheduleDto,
  ): Promise<ApiResponseDto<{ data: WorkScheduleDto[]; total: number }>> {
    const { data, total } = await this.workScheduleRepository.findAll(dto);

    return ApiResponseDto.success(
      {
        data: data.map((schedule) => new WorkScheduleDto(schedule)),
        total,
      },
      'Work schedules retrieved successfully.',
    );
  }
}
