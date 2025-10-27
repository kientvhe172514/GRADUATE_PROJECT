export class CreateLeaveTypeDto {
  leave_type_code: string;
  leave_type_name: string;
  description?: string;
  is_paid: boolean;
  requires_approval: boolean;
  requires_document: boolean;
  deducts_from_balance: boolean;
  max_days_per_year?: number;
  max_consecutive_days?: number;
  min_notice_days: number;
  exclude_holidays: boolean;
  exclude_weekends: boolean;
  allow_carry_over: boolean;
  max_carry_over_days?: number;
  carry_over_expiry_months: number;
  is_prorated: boolean;
  proration_basis: string;
  is_accrued: boolean;
  accrual_rate?: number;
  accrual_start_month: number;
  color_hex: string;
  icon?: string;
  sort_order: number;
}

export class UpdateLeaveTypeDto {
  leave_type_name?: string;
  description?: string;
  is_paid?: boolean;
  requires_approval?: boolean;
  requires_document?: boolean;
  deducts_from_balance?: boolean;
  max_days_per_year?: number;
  max_consecutive_days?: number;
  min_notice_days?: number;
  exclude_holidays?: boolean;
  exclude_weekends?: boolean;
  allow_carry_over?: boolean;
  max_carry_over_days?: number;
  carry_over_expiry_months?: number;
  is_prorated?: boolean;
  proration_basis?: string;
  is_accrued?: boolean;
  accrual_rate?: number;
  accrual_start_month?: number;
  color_hex?: string;
  icon?: string;
  sort_order?: number;
  status?: string;
}
