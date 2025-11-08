import { LeaveBalanceTransactionEntity } from '../../domain/entities/leave-balance-transaction.entity';

export interface ILeaveBalanceTransactionRepository {
  create(tx: Partial<LeaveBalanceTransactionEntity>): Promise<LeaveBalanceTransactionEntity>;
  listByEmployeeAndYear(employeeId: number, year: number): Promise<LeaveBalanceTransactionEntity[]>;
}


