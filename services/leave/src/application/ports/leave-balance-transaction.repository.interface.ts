import { LeaveBalanceTransactionEntity } from '../../domain/entities/leave-balance-transaction.entity';

export interface ILeaveBalanceTransactionRepository {
  create(tx: Partial<LeaveBalanceTransactionEntity>): Promise<LeaveBalanceTransactionEntity>;
  listByEmployeeAndYear(employeeId: number, year: number): Promise<LeaveBalanceTransactionEntity[]>;
  
  // New methods for filtering
  findByEmployee(employeeId: number, filters?: {
    year?: number;
    leave_type_id?: number;
    transaction_type?: string;
    limit?: number;
  }): Promise<LeaveBalanceTransactionEntity[]>;
  
  findByLeaveRecord(leaveRecordId: number): Promise<LeaveBalanceTransactionEntity[]>;
}


