import { Injectable, Inject } from '@nestjs/common';
import {
  IGpsCheckConfigurationRepository,
  GPS_CHECK_CONFIGURATION_REPOSITORY,
} from '../../ports/gps-check-configuration.repository.port';
import { GpsCheckConfiguration } from '../../../domain/entities/gps-check-configuration.entity';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
} from '@graduate-project/shared-common';

@Injectable()
export class GetGpsCheckConfigUseCase {
  constructor(
    @Inject(GPS_CHECK_CONFIGURATION_REPOSITORY)
    private readonly repository: IGpsCheckConfigurationRepository,
  ) {}

  async execute(id: number): Promise<ApiResponseDto<GpsCheckConfiguration>> {
    const config = await this.repository.findById(id);
    if (!config) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Configuration not found.',
        404,
      );
    }

    return ApiResponseDto.success(
      config,
      'Configuration retrieved successfully.',
    );
  }
}
