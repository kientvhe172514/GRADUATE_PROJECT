import { Injectable, Inject } from '@nestjs/common';
import { DeviceSession } from '../../../domain/entities/device-session.entity';
import { DeviceSessionRepositoryPort } from '../../ports/device-session.repository.port';
import { DEVICE_SESSION_REPOSITORY } from '../../tokens';
import { ApiResponseDto } from '@graduate-project/shared-common';

@Injectable()
export class GetMyDevicesUseCase {
  constructor(
    @Inject(DEVICE_SESSION_REPOSITORY)
    private deviceSessionRepo: DeviceSessionRepositoryPort,
  ) {}

  async execute(accountId: number): Promise<ApiResponseDto<DeviceSession[]>> {
    const devices = await this.deviceSessionRepo.findByAccountId(accountId);
    return ApiResponseDto.success(devices, 'Devices retrieved successfully');
  }
}
