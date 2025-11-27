import { Injectable, Inject } from '@nestjs/common';
import {
  IGpsCheckConfigurationRepository,
  GPS_CHECK_CONFIGURATION_REPOSITORY,
} from '../../ports/gps-check-configuration.repository.port';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
  JwtPayload,
} from '@graduate-project/shared-common';

@Injectable()
export class UpdateGpsCheckConfigUseCase {
  constructor(
    @Inject(GPS_CHECK_CONFIGURATION_REPOSITORY)
    private readonly repository: IGpsCheckConfigurationRepository,
  ) {}

  async execute(
    id: number,
    updates: any,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<any>> {
    const config = await this.repository.findById(id);
    if (!config) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Configuration not found.',
        404,
      );
    }

    config.update(updates, currentUser.sub);
    const updated = await this.repository.update(config);

    // Handle default flag
    if (updates.is_default === true) {
      await this.repository.setAsDefault(id, config.shift_type);
    }

    return ApiResponseDto.success(updated, 'Configuration updated successfully.');
  }
}
