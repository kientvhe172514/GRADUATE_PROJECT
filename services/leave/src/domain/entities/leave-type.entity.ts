export class LeaveTypeEntity {
  id: number;
  leave_type_code: string;
  leave_type_name: string;
  description?: string;

  // Basic rules
  is_paid: boolean;
  requires_approval: boolean;
  requires_document: boolean;

  // Balance rules
  deducts_from_balance: boolean;
  max_days_per_year?: number;
  max_consecutive_days?: number;
  min_notice_days: number;

  // Holiday handling
  exclude_holidays: boolean;
  exclude_weekends: boolean;

  // Carry over
  allow_carry_over: boolean;
  max_carry_over_days?: number;
  carry_over_expiry_months: number;

  // Proration
  is_prorated: boolean;
  proration_basis: string;

  // Accrual
  is_accrued: boolean;
  accrual_rate?: number;
  accrual_start_month: number;

  // Display
  color_hex: string;
  icon?: string;
  sort_order: number;

  status: string;
  created_at: Date;
  updated_at: Date;

  constructor(data: Partial<LeaveTypeEntity>) {
    Object.assign(this, data);
  }
}
