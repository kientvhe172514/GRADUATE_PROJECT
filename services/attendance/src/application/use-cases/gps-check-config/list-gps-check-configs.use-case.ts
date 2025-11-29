import { Injectable, Inject } from '@nestjs/common';
import {
  IGpsCheckConfigurationRepository,
  GPS_CHECK_CONFIGURATION_REPOSITORY,
} from '../../ports/gps-check-configuration.repository.port';
import { GpsCheckConfiguration } from '../../../domain/entities/gps-check-configuration.entity';
import { ApiResponseDto } from '@graduate-project/shared-common';

@Injectable()
export class ListGpsCheckConfigsUseCase {
  constructor(
    @Inject(GPS_CHECK_CONFIGURATION_REPOSITORY)
    private readonly repository: IGpsCheckConfigurationRepository,
  ) {}

  async execute(
    activeOnly: boolean = false,
  ): Promise<ApiResponseDto<GpsCheckConfiguration[]>> {
    const configs = activeOnly
      ? await this.repository.findAllActive()
      : await this.repository.findAll();

    return ApiResponseDto.success(
      configs,
      'Configurations retrieved successfully.',
    );
  }
}
