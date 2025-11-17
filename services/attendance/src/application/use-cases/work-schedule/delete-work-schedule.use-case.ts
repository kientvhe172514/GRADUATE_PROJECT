import { Injectable, Inject } from '@nestjs/common';
import { IWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { WORK_SCHEDULE_REPOSITORY } from '../../../application/tokens';
import { BusinessException, ErrorCodes, ApiResponseDto } from '@graduate-project/shared-common';
import { JwtPayload } from '@graduate-project/shared-common';

@Injectable()
export class DeleteWorkScheduleUseCase {
  constructor(
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: IWorkScheduleRepository,
  ) {}

  async execute(id: number, currentUser: JwtPayload): Promise<ApiResponseDto<void>> {
    const workSchedule = await this.workScheduleRepository.findById(id);
    if (!workSchedule) {
      throw new BusinessException(ErrorCodes.SCHEDULE_NOT_FOUND, 'Work schedule not found.', 404);
    }

    workSchedule.deactivate(currentUser.sub);

    await this.workScheduleRepository.save(workSchedule);

    return ApiResponseDto.success(undefined, 'Work schedule deactivated successfully.');
  }
}

