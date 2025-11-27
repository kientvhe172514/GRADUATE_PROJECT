import { Injectable, Inject } from '@nestjs/common';
import {
  IGpsCheckConfigurationRepository,
  GPS_CHECK_CONFIGURATION_REPOSITORY,
} from '../../ports/gps-check-configuration.repository.port';
import {
  GpsCheckConfiguration,
  ShiftTypeApplicability,
  CheckStrategy,
} from '../../../domain/entities/gps-check-configuration.entity';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
  JwtPayload,
} from '@graduate-project/shared-common';

export interface CreateGpsCheckConfigCommand {
  config_name: string;
  description?: string;
  shift_type: ShiftTypeApplicability;
  check_strategy: CheckStrategy;
  check_interval_hours: number;
  min_checks_per_shift: number;
  max_checks_per_shift: number;
  enable_random_timing: boolean;
  random_offset_minutes: number;
  min_shift_duration_hours: number;
  default_checks_count: number;
  priority?: number;
  is_default?: boolean;
}

@Injectable()
export class CreateGpsCheckConfigUseCase {
  constructor(
    @Inject(GPS_CHECK_CONFIGURATION_REPOSITORY)
    private readonly repository: IGpsCheckConfigurationRepository,
  ) {}

  async execute(
    command: CreateGpsCheckConfigCommand,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<GpsCheckConfiguration>> {
    // Check if config name already exists
    const existing = await this.repository.findByName(command.config_name);
    if (existing) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        `Configuration with name '${command.config_name}' already exists.`,
        409,
      );
    }

    // Create domain entity
    const config = new GpsCheckConfiguration({
      ...command,
      priority: command.priority ?? 0,
      is_default: command.is_default ?? false,
      is_active: true,
      created_by: currentUser.sub,
    });

    // Save to database
    const saved = await this.repository.save(config);

    // If set as default, unset other defaults
    if (command.is_default) {
      await this.repository.setAsDefault(saved.id, command.shift_type);
    }

    return ApiResponseDto.success(
      saved,
      'GPS check configuration created successfully.',
    );
  }
}
