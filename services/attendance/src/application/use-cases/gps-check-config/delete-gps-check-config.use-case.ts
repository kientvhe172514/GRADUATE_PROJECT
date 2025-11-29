import { Injectable, Inject } from '@nestjs/common';
import {
  IGpsCheckConfigurationRepository,
  GPS_CHECK_CONFIGURATION_REPOSITORY,
} from '../../ports/gps-check-configuration.repository.port';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
} from '@graduate-project/shared-common';

@Injectable()
export class DeleteGpsCheckConfigUseCase {
  constructor(
    @Inject(GPS_CHECK_CONFIGURATION_REPOSITORY)
    private readonly repository: IGpsCheckConfigurationRepository,
  ) {}

  async execute(id: number): Promise<ApiResponseDto<void>> {
    const config = await this.repository.findById(id);
    if (!config) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Configuration not found.',
        404,
      );
    }

    if (config.is_default) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        'Cannot delete default configuration. Set another config as default first.',
        400,
      );
    }

    await this.repository.delete(id);
    return ApiResponseDto.success(
      undefined,
      'Configuration deleted successfully.',
    );
  }
}
