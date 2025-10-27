import { LeaveBalanceEntity } from '../../domain/entities/leave-balance.entity';

export interface ILeaveBalanceRepository {
  findByEmployeeAndYear(employeeId: number, year: number): Promise<LeaveBalanceEntity[]>;
  findByEmployeeLeaveTypeAndYear(employeeId: number, leaveTypeId: number, year: number): Promise<LeaveBalanceEntity | null>;
  create(balance: Partial<LeaveBalanceEntity>): Promise<LeaveBalanceEntity>;
  update(id: number, balance: Partial<LeaveBalanceEntity>): Promise<LeaveBalanceEntity>;
  updateBalance(id: number, usedDays: number, pendingDays: number, remainingDays: number): Promise<void>;
}
