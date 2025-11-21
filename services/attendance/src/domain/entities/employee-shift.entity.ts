import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';

export enum ShiftStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_LEAVE = 'ON_LEAVE', // For integration with Leave Service
  ABSENT = 'ABSENT',
}

export enum ShiftType {
  REGULAR = 'REGULAR', // Ca làm việc thường
  OVERTIME = 'OVERTIME', // Ca làm thêm giờ
}

export interface EmployeeShiftProps {
  id?: number;
  employee_id: number;
  employee_code: string;
  department_id: number;
  shift_date: Date;
  work_schedule_id: number;
  shift_type?: ShiftType; // Phân biệt ca thường vs ca OT

  // Scheduled times are denormalized for performance
  scheduled_start_time: string; // 'HH:mm:ss'
  scheduled_end_time: string; // 'HH:mm:ss'

  // Actual check times
  check_in_time?: Date;
  check_in_record_id?: number;
  check_out_time?: Date;
  check_out_record_id?: number;

  // Calculated values
  work_hours?: number;
  overtime_hours?: number;
  break_hours?: number;
  late_minutes?: number;
  early_leave_minutes?: number;

  status?: ShiftStatus;
  is_manually_edited?: boolean;
  notes?: string;

  created_at?: Date;
  created_by?: number;
  updated_at?: Date;
  updated_by?: number;
}

export class EmployeeShift {
  readonly id: number;
  private props: EmployeeShiftProps;

  constructor(props: EmployeeShiftProps) {
    this.id = props.id ?? 0; // Ensure ID is always a number
    this.props = {
      ...props,
      status: props.status ?? ShiftStatus.SCHEDULED,
      shift_type: props.shift_type ?? ShiftType.REGULAR,
      work_hours: props.work_hours ?? 0,
      overtime_hours: props.overtime_hours ?? 0,
      break_hours: props.break_hours ?? 0,
      late_minutes: props.late_minutes ?? 0,
      early_leave_minutes: props.early_leave_minutes ?? 0,
      is_manually_edited: props.is_manually_edited ?? false,
    };
  }

  // --- Getters to access properties safely ---
  get_props(): Readonly<EmployeeShiftProps> {
    return this.props;
  }

  // --- Business Logic: State Transitions ---

  public check_in(check_in_time: Date, record_id: number): void {
    if (this.props.status !== ShiftStatus.SCHEDULED) {
      throw new BusinessException(
        ErrorCodes.SHIFT_ALREADY_STARTED,
        `Cannot check-in a shift with status: ${this.props.status}`,
        409,
      );
    }
    this.props.check_in_time = check_in_time;
    this.props.check_in_record_id = record_id;
    this.props.status = ShiftStatus.IN_PROGRESS;
  }

  public check_out(check_out_time: Date, record_id: number): void {
    if (this.props.status !== ShiftStatus.IN_PROGRESS) {
      throw new BusinessException(
        ErrorCodes.SHIFT_NOT_IN_PROGRESS,
        'Cannot check-out if shift is not in progress.',
        409,
      );
    }
    if (!this.props.check_in_time) {
      throw new BusinessException(
        ErrorCodes.CHECK_IN_MISSING,
        'Cannot check-out without a check-in record.',
        400,
      );
    }

    this.props.check_out_time = check_out_time;
    this.props.check_out_record_id = record_id;
    this.props.status = ShiftStatus.COMPLETED;
  }

  public mark_as_absent(updated_by: number): void {
    if (this.props.status === ShiftStatus.SCHEDULED) {
      this.props.status = ShiftStatus.ABSENT;
      this.props.updated_by = updated_by;
      this.props.updated_at = new Date();
    }
  }

  public mark_as_on_leave(updated_by: number): void {
    this.props.status = ShiftStatus.ON_LEAVE;
    this.props.updated_by = updated_by;
    this.props.updated_at = new Date();
  }

  // --- Business Logic: Data Updates ---

  public update_calculated_values(values: {
    work_hours: number;
    late_minutes: number;
    early_leave_minutes: number;
    overtime_hours: number;
  }): void {
    this.props.work_hours = values.work_hours;
    this.props.late_minutes = values.late_minutes;
    this.props.early_leave_minutes = values.early_leave_minutes;
    this.props.overtime_hours = values.overtime_hours;
  }

  public manual_edit(
    data: Partial<
      Pick<
        EmployeeShiftProps,
        'check_in_time' | 'check_out_time' | 'status' | 'notes'
      >
    >,
    updated_by: number,
  ): void {
    if (data.check_in_time !== undefined) {
      this.props.check_in_time = data.check_in_time;
    }
    if (data.check_out_time !== undefined) {
      this.props.check_out_time = data.check_out_time;
    }
    if (data.status !== undefined) {
      this.props.status = data.status;
    }
    if (data.notes !== undefined) {
      this.props.notes = data.notes;
    }

    this.props.is_manually_edited = true;
    this.props.updated_by = updated_by;
    this.props.updated_at = new Date();
  }

  public toJSON(): EmployeeShiftProps {
    return { ...this.props, id: this.id };
  }
}
