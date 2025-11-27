import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';

export enum CheckStrategy {
  INTERVAL_BASED = 'INTERVAL_BASED', // Check every X hours
  FIXED_COUNT = 'FIXED_COUNT', // Fixed number of checks per shift
  DURATION_BASED = 'DURATION_BASED', // Calculate based on shift duration
  RANDOM = 'RANDOM', // Completely random within shift
}

export enum ShiftTypeApplicability {
  REGULAR = 'REGULAR',
  OVERTIME = 'OVERTIME',
  ALL = 'ALL',
}

export interface GpsCheckConfigurationProps {
  id?: number;
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
  is_active: boolean;
  is_default: boolean;
  priority: number;
  created_at?: Date;
  created_by?: number;
  updated_at?: Date;
  updated_by?: number;
}

export class GpsCheckConfiguration {
  readonly id: number;
  private props: GpsCheckConfigurationProps;

  constructor(props: GpsCheckConfigurationProps) {
    this.validate(props);
    this.id = props.id ?? 0;
    this.props = {
      ...props,
      is_active: props.is_active ?? true,
      is_default: props.is_default ?? false,
      priority: props.priority ?? 0,
      enable_random_timing: props.enable_random_timing ?? true,
    };
  }

  private validate(props: GpsCheckConfigurationProps): void {
    if (!props.config_name || props.config_name.trim().length === 0) {
      throw new BusinessException(
        ErrorCodes.MISSING_REQUIRED_FIELDS,
        'Configuration name is required.',
        400,
      );
    }

    if (props.check_interval_hours <= 0) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        'Check interval must be positive.',
        400,
      );
    }

    if (props.min_checks_per_shift < 0 || props.max_checks_per_shift < 0) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        'Check counts must be non-negative.',
        400,
      );
    }

    if (props.min_checks_per_shift > props.max_checks_per_shift) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        'Minimum checks cannot exceed maximum checks.',
        400,
      );
    }

    if (props.min_shift_duration_hours < 0) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        'Minimum shift duration must be non-negative.',
        400,
      );
    }

    if (props.random_offset_minutes < 0) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        'Random offset must be non-negative.',
        400,
      );
    }
  }

  // Getters
  get config_name(): string {
    return this.props.config_name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get shift_type(): ShiftTypeApplicability {
    return this.props.shift_type;
  }

  get check_strategy(): CheckStrategy {
    return this.props.check_strategy;
  }

  get check_interval_hours(): number {
    return this.props.check_interval_hours;
  }

  get min_checks_per_shift(): number {
    return this.props.min_checks_per_shift;
  }

  get max_checks_per_shift(): number {
    return this.props.max_checks_per_shift;
  }

  get enable_random_timing(): boolean {
    return this.props.enable_random_timing;
  }

  get random_offset_minutes(): number {
    return this.props.random_offset_minutes;
  }

  get min_shift_duration_hours(): number {
    return this.props.min_shift_duration_hours;
  }

  get default_checks_count(): number {
    return this.props.default_checks_count;
  }

  get is_active(): boolean {
    return this.props.is_active;
  }

  get is_default(): boolean {
    return this.props.is_default;
  }

  get priority(): number {
    return this.props.priority;
  }

  // Business Logic

  /**
   * Calculate required GPS checks based on shift duration
   */
  public calculateRequiredChecks(shiftDurationHours: number): number {
    if (shiftDurationHours < this.props.min_shift_duration_hours) {
      return 0; // No checks required for very short shifts
    }

    switch (this.props.check_strategy) {
      case CheckStrategy.FIXED_COUNT:
        return this.props.default_checks_count;

      case CheckStrategy.DURATION_BASED:
      case CheckStrategy.INTERVAL_BASED:
        const calculated = Math.floor(
          shiftDurationHours / this.props.check_interval_hours,
        );
        return Math.min(
          Math.max(calculated, this.props.min_checks_per_shift),
          this.props.max_checks_per_shift,
        );

      case CheckStrategy.RANDOM:
        // Random between min and max
        return (
          this.props.min_checks_per_shift +
          Math.floor(
            Math.random() *
              (this.props.max_checks_per_shift -
                this.props.min_checks_per_shift +
                1),
          )
        );

      default:
        return this.props.default_checks_count;
    }
  }

  /**
   * Generate random check times within shift duration
   */
  public generateCheckTimes(
    shiftDate: Date,
    startTime: string, // HH:MM:SS format
    endTime: string, // HH:MM:SS format
  ): Date[] {
    const shiftStart = this.parseDateTime(shiftDate, startTime);
    const shiftEnd = this.parseDateTime(shiftDate, endTime);
    const shiftDurationMs = shiftEnd.getTime() - shiftStart.getTime();
    const shiftDurationHours = shiftDurationMs / (1000 * 60 * 60);

    const checksRequired = this.calculateRequiredChecks(shiftDurationHours);

    if (checksRequired === 0) {
      return [];
    }

    const checkTimes: Date[] = [];
    const intervalMs = shiftDurationMs / (checksRequired + 1); // +1 to avoid checking at very start/end

    for (let i = 1; i <= checksRequired; i++) {
      let checkTime = new Date(shiftStart.getTime() + intervalMs * i);

      // Add random offset if enabled
      if (this.props.enable_random_timing) {
        const randomOffsetMs =
          (Math.random() * 2 - 1) *
          this.props.random_offset_minutes *
          60 *
          1000;
        checkTime = new Date(checkTime.getTime() + randomOffsetMs);

        // Ensure check time is within shift boundaries
        checkTime = new Date(
          Math.max(
            shiftStart.getTime() + 10 * 60 * 1000, // At least 10 min after start
            Math.min(
              checkTime.getTime(),
              shiftEnd.getTime() - 10 * 60 * 1000, // At least 10 min before end
            ),
          ),
        );
      }

      checkTimes.push(checkTime);
    }

    return checkTimes.sort((a, b) => a.getTime() - b.getTime());
  }

  private parseDateTime(date: Date, timeString: string): Date {
    const [hours, minutes, seconds = 0] = timeString
      .split(':')
      .map((s) => Number(s));
    const result = new Date(date);
    result.setHours(hours, minutes, seconds, 0);
    return result;
  }

  /**
   * Update configuration
   */
  public update(
    updates: Partial<GpsCheckConfigurationProps>,
    updated_by: number,
  ): void {
    const newProps = { ...this.props, ...updates, updated_by };
    this.validate(newProps);
    this.props = newProps;
    this.props.updated_at = new Date();
  }

  /**
   * Activate/Deactivate configuration
   */
  public setActive(isActive: boolean): void {
    this.props.is_active = isActive;
    this.props.updated_at = new Date();
  }

  /**
   * Set as default configuration
   */
  public setDefault(isDefault: boolean): void {
    this.props.is_default = isDefault;
    this.props.updated_at = new Date();
  }

  public toJSON() {
    return {
      id: this.id,
      ...this.props,
    };
  }
}
