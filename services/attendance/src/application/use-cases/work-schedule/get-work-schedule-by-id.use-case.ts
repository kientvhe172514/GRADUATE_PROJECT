import { Injectable, Inject } from '@nestjs/common';
import { WorkScheduleDto } from '../../dtos/work-schedule.dto';
import { IWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { WORK_SCHEDULE_REPOSITORY } from '../../../application/tokens';
import {
  BusinessException,
  ErrorCodes,
  ApiResponseDto,
} from '@graduate-project/shared-common';

@Injectable()
export class GetWorkScheduleByIdUseCase {
  constructor(
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: IWorkScheduleRepository,
  ) {}

  async execute(id: number): Promise<ApiResponseDto<WorkScheduleDto>> {
    const workSchedule = await this.workScheduleRepository.findById(id);
    if (!workSchedule) {
      throw new BusinessException(
        ErrorCodes.SCHEDULE_NOT_FOUND,
        'Work schedule not found.',
        404,
      );
    }

    return ApiResponseDto.success(
      new WorkScheduleDto(workSchedule),
      'Work schedule retrieved successfully.',
    );
  }
}
