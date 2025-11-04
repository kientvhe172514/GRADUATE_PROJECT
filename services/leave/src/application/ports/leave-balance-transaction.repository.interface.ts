import { LeaveBalanceTransactionEntity } from '../../domain/entities/leave-balance-transaction.entity';

export interface ILeaveBalanceTransactionRepository {
  create(transaction: Partial<LeaveBalanceTransactionEntity>): Promise<LeaveBalanceTransactionEntity>;
  findByEmployeeAndYear(employeeId: number, year: number): Promise<LeaveBalanceTransactionEntity[]>;
  findByEmployeeLeaveTypeAndYear(
    employeeId: number,
    leaveTypeId: number,
    year: number
  ): Promise<LeaveBalanceTransactionEntity[]>;
}
