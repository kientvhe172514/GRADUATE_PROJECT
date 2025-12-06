import { Injectable, Inject } from '@nestjs/common';
import { DeviceSession } from '../../../domain/entities/device-session.entity';
import { DeviceSessionRepositoryPort } from '../../ports/device-session.repository.port';
import { DEVICE_SESSION_REPOSITORY } from '../../tokens';
import { ApiResponseDto } from '@graduate-project/shared-common';

@Injectable()
export class GetAllDevicesUseCase {
  constructor(
    @Inject(DEVICE_SESSION_REPOSITORY)
    private deviceSessionRepo: DeviceSessionRepositoryPort,
  ) {}

  async execute(
    page: number = 1,
    limit: number = 10,
  ): Promise<
    ApiResponseDto<{
      data: DeviceSession[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    const result = await this.deviceSessionRepo.findAll(page, limit);
    return ApiResponseDto.success(
      {
        ...result,
        page,
        limit,
      },
      'All devices retrieved successfully',
    );
  }
}
