export class LeaveBalanceTransactionEntity {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;

  transaction_type: string;

  amount: number;
  balance_before: number;
  balance_after: number;

  // Reference
  reference_type?: string;
  reference_id?: number;

  description?: string;

  created_by?: number;
  created_at: Date;

  constructor(data: Partial<LeaveBalanceTransactionEntity>) {
    Object.assign(this, data);
  }
}
