import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';

export interface EmployeeWorkScheduleProps {
  id?: number;
  employee_id: number;
  work_schedule_id: number;
  effective_from: Date;
  effective_to?: Date;
  created_at?: Date;
  created_by?: number;
}

export class EmployeeWorkSchedule {
  readonly id: number;
  private props: EmployeeWorkScheduleProps;

  constructor(props: EmployeeWorkScheduleProps) {
    if (!props.employee_id || !props.work_schedule_id || !props.effective_from) {
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

  public toJSON() {
    return { id: this.id, ...this.props };
  }
}

