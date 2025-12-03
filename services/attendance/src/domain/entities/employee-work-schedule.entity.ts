import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';

export enum ScheduleOverrideType {
  SCHEDULE_CHANGE = 'SCHEDULE_CHANGE',
  OVERTIME = 'OVERTIME',
}

export enum ScheduleOverrideStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface ScheduleOverride {
  id: string;
  type: ScheduleOverrideType;
  from_date: string;
  to_date?: string;
  override_work_schedule_id?: number;
  overtime_start_time?: string;
  overtime_end_time?: string;
  reason: string;
  created_by: number;
  created_at: string;
  status: ScheduleOverrideStatus;
  shift_created: boolean;
  processed_at?: string;
  error_message?: string;
}

export interface EmployeeWorkScheduleProps {
  id?: number;
  employee_id: number;
  work_schedule_id: number;
  effective_from: Date;
  effective_to?: Date;
  created_at?: Date;
  created_by?: number;
  schedule_overrides?: ScheduleOverride[];
}

export class EmployeeWorkSchedule {
  readonly id: number;
  private props: EmployeeWorkScheduleProps;

  constructor(props: EmployeeWorkScheduleProps) {
    if (
      !props.employee_id ||
      !props.work_schedule_id ||
      !props.effective_from
    ) {
      throw new BusinessException(
        ErrorCodes.MISSING_REQUIRED_FIELDS,
        'Employee ID, Work Schedule ID, and Effective From date are required.',
        400,
      );
    }

    if (props.effective_to && props.effective_from > props.effective_to) {
      throw new BusinessException(
        ErrorCodes.INVALID_DATE_RANGE,
        'Effective From date cannot be after Effective To date.',
        400,
      );
    }

    this.id = props.id ?? 0;
    this.props = props;
  }

  get employee_id(): number {
    return this.props.employee_id;
  }

  get work_schedule_id(): number {
    return this.props.work_schedule_id;
  }

  get effective_from(): Date {
    return this.props.effective_from;
  }

  get effective_to(): Date | undefined {
    return this.props.effective_to;
  }

  get schedule_overrides(): ScheduleOverride[] {
    return this.props.schedule_overrides ?? [];
  }

  // --- Business Logic ---

  public is_active_on(date: Date): boolean {
    const from = new Date(this.props.effective_from);
    from.setHours(0, 0, 0, 0);

    if (from > date) {
      return false;
    }

    if (this.props.effective_to) {
      const to = new Date(this.props.effective_to);
      to.setHours(23, 59, 59, 999);
      if (to < date) {
        return false;
      }
    }

    return true;
  }

  public end_assignment(effective_to: Date): void {
    if (effective_to < this.props.effective_from) {
      throw new BusinessException(
        ErrorCodes.INVALID_DATE_RANGE,
        'End date cannot be before the start date.',
        400,
      );
    }
    this.props.effective_to = effective_to;
  }

  /**
   * Add a schedule override (either schedule change or overtime)
   */
  public add_schedule_override(
    override: Omit<
      ScheduleOverride,
      'id' | 'created_at' | 'status' | 'shift_created'
    >,
  ): void {
    if (!this.props.schedule_overrides) {
      this.props.schedule_overrides = [];
    }

    const newOverride: ScheduleOverride = {
      ...override,
      id: this.generate_uuid(),
      created_at: new Date().toISOString(),
      status: ScheduleOverrideStatus.PENDING,
      shift_created: false,
    };

    this.props.schedule_overrides.push(newOverride);
  }

  /**
   * Update override status
   */
  public update_override_status(
    override_id: string,
    status: ScheduleOverrideStatus,
    error_message?: string,
  ): void {
    const override = this.props.schedule_overrides?.find(
      (o) => o.id === override_id,
    );
    if (!override) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        `Override with id ${override_id} not found`,
        404,
      );
    }

    override.status = status;
    if (
      status === ScheduleOverrideStatus.COMPLETED ||
      status === ScheduleOverrideStatus.FAILED
    ) {
      override.processed_at = new Date().toISOString();
    }
    if (error_message) {
      override.error_message = error_message;
    }
  }

  /**
   * Mark override as shift created
   */
  public mark_override_shift_created(override_id: string): void {
    const override = this.props.schedule_overrides?.find(
      (o) => o.id === override_id,
    );
    if (!override) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        `Override with id ${override_id} not found`,
        404,
      );
    }

    override.shift_created = true;
  }

  /**
   * Remove a schedule override
   */
  public remove_schedule_override(override_id: string): void {
    if (!this.props.schedule_overrides) {
      return;
    }

    const index = this.props.schedule_overrides.findIndex(
      (o) => o.id === override_id,
    );
    if (index === -1) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        `Override with id ${override_id} not found`,
        404,
      );
    }

    this.props.schedule_overrides.splice(index, 1);
  }

  /**
   * Get pending overrides for a specific date
   */
  public get_pending_overrides_for_date(date: string): ScheduleOverride[] {
    if (!this.props.schedule_overrides) {
      return [];
    }

    return this.props.schedule_overrides.filter(
      (override) =>
        override.status === ScheduleOverrideStatus.PENDING &&
        override.from_date <= date &&
        (!override.to_date || override.to_date >= date),
    );
  }

  /**
   * Simple UUID generator
   */
  private generate_uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  public toJSON() {
    return { id: this.id, ...this.props };
  }
}
