import { Injectable, Inject } from '@nestjs/common';
import {
  CreateWorkScheduleDto,
  WorkScheduleDto,
} from '../../dtos/work-schedule.dto';
import { IWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { WORK_SCHEDULE_REPOSITORY } from '../../../application/tokens';
import { WorkSchedule } from '../../../domain/entities/work-schedule.entity';
import {
  BusinessException,
  ErrorCodes,
  ApiResponseDto,
} from '@graduate-project/shared-common';
import { JwtPayload } from '@graduate-project/shared-common';

@Injectable()
export class CreateWorkScheduleUseCase {
  constructor(
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: IWorkScheduleRepository,
  ) {}

  async execute(
    dto: CreateWorkScheduleDto,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<WorkScheduleDto>> {
    const existing = await this.workScheduleRepository.findByName(
      dto.schedule_name,
    );
    if (existing) {
      throw new BusinessException(
        ErrorCodes.SCHEDULE_NAME_ALREADY_EXISTS,
        'A work schedule with this name already exists.',
        409,
      );
    }

    const workSchedule = new WorkSchedule({
      ...dto,
      created_by: currentUser.sub,
      updated_by: currentUser.sub,
    });

    const savedSchedule = await this.workScheduleRepository.save(workSchedule);

    return ApiResponseDto.success(
      new WorkScheduleDto(savedSchedule),
      'Work schedule created successfully.',
      201,
    );
  }
}
