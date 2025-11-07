import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { ILeaveBalanceTransactionRepository } from '../../ports/leave-balance-transaction.repository.interface';
import { LEAVE_BALANCE_REPOSITORY, LEAVE_BALANCE_TRANSACTION_REPOSITORY } from '../../tokens';

@Injectable()
export class AdjustLeaveBalanceUseCase {
  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly balances: ILeaveBalanceRepository,
    @Inject(LEAVE_BALANCE_TRANSACTION_REPOSITORY)
    private readonly transactions: ILeaveBalanceTransactionRepository,
  ) {}

  async execute(employeeId: number, leaveTypeId: number, year: number, adjustment: number, description?: string, createdBy?: number) {
    const balance = await this.balances.findByEmployeeLeaveTypeAndYear(employeeId, leaveTypeId, year);
    if (!balance) {
      throw new NotFoundException('Leave balance not found');
    }
    const before = Number(balance.remaining_days);
    const newAdjusted = Number(balance.adjusted_days) + Number(adjustment);
    const after = before + Number(adjustment);

    await this.balances.update(balance.id, {
      adjusted_days: newAdjusted,
      remaining_days: after,
    });

    await this.transactions.create({
      employee_id: employeeId,
      leave_type_id: leaveTypeId,
      year,
      transaction_type: 'ADJUSTMENT',
      amount: Number(adjustment),
      balance_before: before,
      balance_after: after,
      description,
      created_by: createdBy,
    });

    return { ...balance, adjusted_days: newAdjusted, remaining_days: after };
  }
}


