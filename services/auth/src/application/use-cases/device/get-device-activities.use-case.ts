import { Injectable, Inject } from '@nestjs/common';
import { DeviceActivityLog } from '../../../domain/entities/device-activity-log.entity';
import { DeviceActivityLogRepositoryPort } from '../../ports/device-activity-log.repository.port';
import { DEVICE_ACTIVITY_LOG_REPOSITORY } from '../../tokens';
import { ApiResponseDto } from '@graduate-project/shared-common';

@Injectable()
export class GetDeviceActivitiesUseCase {
  constructor(
    @Inject(DEVICE_ACTIVITY_LOG_REPOSITORY)
    private activityLogRepo: DeviceActivityLogRepositoryPort,
  ) {}

  async execute(
    accountId: number,
    limit?: number,
  ): Promise<ApiResponseDto<DeviceActivityLog[]>> {
    const activities = await this.activityLogRepo.findByAccountId(
      accountId,
      limit,
    );
    return ApiResponseDto.success(
      activities,
      'Activities retrieved successfully',
    );
  }
}
