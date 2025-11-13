import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { DeviceSessionRepositoryPort } from '../../ports/device-session.repository.port';
import { DEVICE_SESSION_REPOSITORY } from '../../tokens';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { DeviceStatus } from '../../../domain/entities/device-session.entity';

@Injectable()
export class RevokeDeviceUseCase {
  constructor(
    @Inject(DEVICE_SESSION_REPOSITORY)
    private deviceSessionRepo: DeviceSessionRepositoryPort,
  ) {}

  async execute(
    deviceId: number,
    accountId: number,
    revokedBy: number,
    reason?: string,
  ): Promise<ApiResponseDto<{ message: string }>> {
    const device = await this.deviceSessionRepo.findById(deviceId);

    if (!device) {
      throw new ForbiddenException('Device not found');
    }

    if (device.account_id !== accountId) {
      throw new ForbiddenException(
        'You do not have permission to revoke this device',
      );
    }

    device.status = DeviceStatus.REVOKED;
    device.revoked_at = new Date();
    device.revoked_by = revokedBy;
    device.revoke_reason = reason || 'Revoked by user';
    device.updated_at = new Date();

    await this.deviceSessionRepo.update(deviceId, device);

    return ApiResponseDto.success(
      { message: 'Device revoked successfully' },
      'Device revoked successfully',
    );
  }
}
