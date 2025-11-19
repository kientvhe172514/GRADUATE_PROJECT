import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';

export enum ScheduleType {
  FIXED = 'FIXED',
  FLEXIBLE = 'FLEXIBLE',
  SHIFT_BASED = 'SHIFT_BASED',
}

export enum ScheduleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface WorkScheduleProps {
  id?: number;
  schedule_name: string;
  schedule_type: ScheduleType;
  work_days?: string; // e.g., '1,2,3,4,5'
  start_time?: string; // e.g., '08:00:00'
  end_time?: string; // e.g., '17:00:00'
  break_duration_minutes?: number;
  late_tolerance_minutes?: number;
  early_leave_tolerance_minutes?: number;
  status?: ScheduleStatus;
  created_at?: Date;
  created_by?: number;
  updated_at?: Date;
  updated_by?: number;
}

export class WorkSchedule {
  readonly id: number;
  private props: WorkScheduleProps;

  constructor(props: WorkScheduleProps) {
    // Validate required fields for FIXED schedule type
    if (props.schedule_type === ScheduleType.FIXED) {
      if (!props.start_time || !props.end_time || !props.work_days) {
        throw new BusinessException(
          ErrorCodes.INVALID_SCHEDULE_CONFIG,
          'Fixed schedules require start time, end time, and work days.',
          400,
        );
      }
    }

    this.id = props.id ?? 0;
    this.props = {
      ...props,
      status: props.status || ScheduleStatus.ACTIVE,
      break_duration_minutes: props.break_duration_minutes ?? 60,
      late_tolerance_minutes: props.late_tolerance_minutes ?? 15,
      early_leave_tolerance_minutes: props.early_leave_tolerance_minutes ?? 15,
    };
  }

  // Getter methods to access properties safely
  get schedule_name(): string {
    return this.props.schedule_name;
  }

  get schedule_type(): ScheduleType {
    return this.props.schedule_type;
  }

  get work_days(): string | undefined {
    return this.props.work_days;
  }

  get start_time(): string | undefined {
    return this.props.start_time;
  }

  get end_time(): string | undefined {
    return this.props.end_time;
  }

  get break_duration_minutes(): number {
    return this.props.break_duration_minutes!;
  }

  get late_tolerance_minutes(): number {
    return this.props.late_tolerance_minutes!;
  }

  get early_leave_tolerance_minutes(): number {
    return this.props.early_leave_tolerance_minutes!;
  }

  get status(): ScheduleStatus {
    return this.props.status!;
  }

  // --- Business Logic ---

  public update(
    updateProps: Partial<WorkScheduleProps>,
    updated_by: number,
  ): void {
    this.props = {
      ...this.props,
      ...updateProps,
      updated_by,
      updated_at: new Date(),
    };
    this.validate();
  }

  public activate(updated_by: number): void {
    if (this.props.status === ScheduleStatus.ACTIVE) {
      throw new BusinessException(
        ErrorCodes.SCHEDULE_ALREADY_ACTIVE,
        'Schedule is already active.',
        409,
      );
    }
    this.props.status = ScheduleStatus.ACTIVE;
    this.props.updated_by = updated_by;
    this.props.updated_at = new Date();
  }

  public deactivate(updated_by: number): void {
    if (this.props.status === ScheduleStatus.INACTIVE) {
      throw new BusinessException(
        ErrorCodes.SCHEDULE_ALREADY_INACTIVE,
        'Schedule is already inactive.',
        409,
      );
    }
    this.props.status = ScheduleStatus.INACTIVE;
    this.props.updated_by = updated_by;
    this.props.updated_at = new Date();
  }

  private validate(): void {
    if (!this.props.schedule_name) {
      throw new BusinessException(
        ErrorCodes.SCHEDULE_NAME_REQUIRED,
        'Schedule name is required.',
        400,
      );
    }
  }

  public toJSON() {
    return { id: this.id, ...this.props };
  }
}
