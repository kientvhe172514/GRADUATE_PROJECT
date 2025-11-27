import { GpsCheckConfiguration } from '../../domain/entities/gps-check-configuration.entity';

export const GPS_CHECK_CONFIGURATION_REPOSITORY =
  'GPS_CHECK_CONFIGURATION_REPOSITORY';

export interface IGpsCheckConfigurationRepository {
  /**
   * Find configuration by ID
   */
  findById(id: number): Promise<GpsCheckConfiguration | null>;

  /**
   * Find configuration by name
   */
  findByName(name: string): Promise<GpsCheckConfiguration | null>;

  /**
   * Get all active configurations
   */
  findAllActive(): Promise<GpsCheckConfiguration[]>;

  /**
   * Get all configurations (active and inactive)
   */
  findAll(): Promise<GpsCheckConfiguration[]>;

  /**
   * Get default configuration for a shift type
   */
  findDefaultForShiftType(
    shiftType: 'REGULAR' | 'OVERTIME' | 'ALL',
  ): Promise<GpsCheckConfiguration | null>;

  /**
   * Get best matching configuration for a shift
   */
  findBestMatchForShift(
    shiftType: 'REGULAR' | 'OVERTIME',
    shiftDurationHours: number,
  ): Promise<GpsCheckConfiguration | null>;

  /**
   * Create new configuration
   */
  save(config: GpsCheckConfiguration): Promise<GpsCheckConfiguration>;

  /**
   * Update existing configuration
   */
  update(config: GpsCheckConfiguration): Promise<GpsCheckConfiguration>;

  /**
   * Delete configuration
   */
  delete(id: number): Promise<boolean>;

  /**
   * Set as default (unset other defaults for same shift_type)
   */
  setAsDefault(id: number, shiftType: string): Promise<boolean>;

  /**
   * Count active configurations
   */
  countActive(): Promise<number>;
}
