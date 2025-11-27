import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IGpsCheckConfigurationRepository,
  GPS_CHECK_CONFIGURATION_REPOSITORY,
} from '../../application/ports/gps-check-configuration.repository.port';

@Injectable()
export class GpsCheckCalculatorService {
  private readonly logger = new Logger(GpsCheckCalculatorService.name);

  constructor(
    @Inject(GPS_CHECK_CONFIGURATION_REPOSITORY)
    private readonly configRepository: IGpsCheckConfigurationRepository,
  ) {}

  /**
   * Calculate required GPS checks for a shift based on configuration
   */
  async calculateRequiredChecks(
    shiftType: 'REGULAR' | 'OVERTIME',
    startTime: string, // HH:MM:SS
    endTime: string, // HH:MM:SS
  ): Promise<number> {
    try {
      // Calculate shift duration in hours
      const duration = this.calculateShiftDuration(startTime, endTime);

      // Get best matching configuration
      const config = await this.configRepository.findBestMatchForShift(
        shiftType,
        duration,
      );

      if (!config) {
        // Fallback to default if no config found
        this.logger.warn(
          `No GPS check config found for ${shiftType} shift (${duration}h). Using default: 3 checks`,
        );
        return duration >= 4 ? 3 : 2;
      }

      const required = config.calculateRequiredChecks(duration);
      this.logger.log(
        `GPS checks required for ${shiftType} shift (${duration}h): ${required} (using config: ${config.config_name})`,
      );

      return required;
    } catch (error) {
      this.logger.error('Error calculating GPS checks:', error);
      // Fallback to safe default
      return 3;
    }
  }

  /**
   * Calculate shift duration in hours
   */
  private calculateShiftDuration(startTime: string, endTime: string): number {
    const [startHours, startMinutes, startSeconds = 0] = startTime
      .split(':')
      .map(Number);
    const [endHours, endMinutes, endSeconds = 0] = endTime
      .split(':')
      .map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes + startSeconds / 60;
    let endTotalMinutes = endHours * 60 + endMinutes + endSeconds / 60;

    // Handle overnight shifts
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60;
    }

    const durationMinutes = endTotalMinutes - startTotalMinutes;
    return durationMinutes / 60;
  }

  /**
   * Generate random GPS check times for a shift
   */
  async generateCheckTimes(
    shiftType: 'REGULAR' | 'OVERTIME',
    shiftDate: Date,
    startTime: string,
    endTime: string,
  ): Promise<Date[]> {
    try {
      const duration = this.calculateShiftDuration(startTime, endTime);
      const config = await this.configRepository.findBestMatchForShift(
        shiftType,
        duration,
      );

      if (!config) {
        this.logger.warn(
          `No GPS check config found for ${shiftType} shift. Cannot generate check times.`,
        );
        return [];
      }

      return config.generateCheckTimes(shiftDate, startTime, endTime);
    } catch (error) {
      this.logger.error('Error generating GPS check times:', error);
      return [];
    }
  }
}
