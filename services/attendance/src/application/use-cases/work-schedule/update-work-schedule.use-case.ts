import { Injectable, Inject } from '@nestjs/common';
import {
  UpdateWorkScheduleDto,
  WorkScheduleDto,
} from '../../dtos/work-schedule.dto';
import { IWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { WORK_SCHEDULE_REPOSITORY } from '../../../application/tokens';
import {
  BusinessException,
  ErrorCodes,
  ApiResponseDto,
} from '@graduate-project/shared-common';
import { JwtPayload } from '@graduate-project/shared-common';

@Injectable()
export class UpdateWorkScheduleUseCase {
  constructor(
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: IWorkScheduleRepository,
  ) {}

  async execute(
    id: number,
    dto: UpdateWorkScheduleDto,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<WorkScheduleDto>> {
    const workSchedule = await this.workScheduleRepository.findById(id);
    if (!workSchedule) {
      throw new BusinessException(
        ErrorCodes.SCHEDULE_NOT_FOUND,
        'Work schedule not found.',
        404,
      );
    }

    // Check for name collision if name is being changed
    if (dto.schedule_name && dto.schedule_name !== workSchedule.schedule_name) {
      const existing = await this.workScheduleRepository.findByName(
        dto.schedule_name,
      );
      if (existing && existing.id !== id) {
        throw new BusinessException(
          ErrorCodes.SCHEDULE_NAME_ALREADY_EXISTS,
          'A work schedule with this name already exists.',
          409,
        );
      }
    }

    workSchedule.update(dto, currentUser.sub);

    const updatedSchedule =
      await this.workScheduleRepository.save(workSchedule);

    return ApiResponseDto.success(
      new WorkScheduleDto(updatedSchedule),
      'Work schedule updated successfully.',
    );
  }
}
