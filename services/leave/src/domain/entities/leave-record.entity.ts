export class LeaveRecordEntity {
  id: number;

  // Denormalized employee info
  employee_id: number;
  employee_code: string;
  department_id: number;

  leave_type_id: number;

  // Date range
  start_date: Date;
  end_date: Date;

  // Different day calculations
  total_calendar_days: number;
  total_working_days: number;
  total_leave_days: number;

  // Half-day support
  is_half_day_start: boolean;
  is_half_day_end: boolean;

  // Details
  reason: string;
  supporting_document_url?: string;

  // Approval workflow
  status: string;

  requested_at: Date;

  approval_level: number;
  current_approver_id?: number;

  approved_by?: number;
  approved_at?: Date;
  rejection_reason?: string;

  cancelled_at?: Date;
  cancellation_reason?: string;

  // Metadata
  metadata?: any;

  created_at: Date;
  updated_at: Date;

  constructor(data: Partial<LeaveRecordEntity>) {
    Object.assign(this, data);
  }
}
