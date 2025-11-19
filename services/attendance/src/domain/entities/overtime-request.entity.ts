import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';

export enum OvertimeRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface OvertimeRequestProps {
  id?: number;
  employee_id: number;
  shift_id?: number;
  overtime_date: Date;
  start_time: Date;
  end_time: Date;
  estimated_hours: number;
  actual_hours?: number;
  reason: string;
  status?: OvertimeRequestStatus;
  requested_at?: Date;
  requested_by?: number;
  approved_by?: number;
  approved_at?: Date;
  rejection_reason?: string;
  created_at?: Date;
  created_by?: number;
  updated_at?: Date;
  updated_by?: number;
}

export class OvertimeRequest {
  readonly id: number;
  private props: OvertimeRequestProps;

  constructor(props: OvertimeRequestProps) {
    if (props.start_time >= props.end_time) {
      throw new BusinessException(
        ErrorCodes.INVALID_DATE_RANGE,
        'Start time must be before end time.',
        400,
      );
    }
    if (props.estimated_hours <= 0) {
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        'Estimated hours must be positive.',
        400,
      );
    }

    this.id = props.id ?? 0;
    this.props = {
      ...props,
      status: props.status || OvertimeRequestStatus.PENDING,
      requested_at: props.requested_at || new Date(),
    };
  }

  // Getters
  get employee_id(): number {
    return this.props.employee_id;
  }

  get status(): OvertimeRequestStatus {
    return this.props.status!;
  }

  // --- Business Logic ---

  public approve(approved_by: number): void {
    if (this.props.status !== OvertimeRequestStatus.PENDING) {
      throw new BusinessException(
        ErrorCodes.INVALID_STATE_TRANSITION,
        'Only pending requests can be approved.',
        409,
      );
    }
    this.props.status = OvertimeRequestStatus.APPROVED;
    this.props.approved_by = approved_by;
    this.props.approved_at = new Date();
    this.props.updated_by = approved_by;
    this.props.updated_at = new Date();
  }

  public reject(rejected_by: number, reason: string): void {
    if (this.props.status !== OvertimeRequestStatus.PENDING) {
      throw new BusinessException(
        ErrorCodes.INVALID_STATE_TRANSITION,
        'Only pending requests can be rejected.',
        409,
      );
    }
    if (!reason) {
      throw new BusinessException(
        ErrorCodes.REASON_REQUIRED,
        'Rejection reason is required.',
        400,
      );
    }
    this.props.status = OvertimeRequestStatus.REJECTED;
    this.props.rejection_reason = reason;
    this.props.approved_by = rejected_by; // Use same field to track who actioned it
    this.props.approved_at = new Date();
    this.props.updated_by = rejected_by;
    this.props.updated_at = new Date();
  }

  public update_details(
    data: { start_time?: Date; end_time?: Date; reason?: string },
    updated_by: number,
  ): void {
    if (this.props.status !== OvertimeRequestStatus.PENDING) {
      throw new BusinessException(
        ErrorCodes.INVALID_STATE_TRANSITION,
        'Can only update pending requests.',
        409,
      );
    }
    this.props = { ...this.props, ...data, updated_by, updated_at: new Date() };
  }

  public toJSON() {
    return { id: this.id, ...this.props };
  }
}
