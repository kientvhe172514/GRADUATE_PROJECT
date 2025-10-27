export class LeaveBalanceEntity {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;

  total_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
  carried_over_days: number;
  adjusted_days: number;

  created_at: Date;
  updated_at: Date;

  constructor(data: Partial<LeaveBalanceEntity>) {
    Object.assign(this, data);
  }
}
