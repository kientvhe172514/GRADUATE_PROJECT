import { Inject, Injectable } from '@nestjs/common';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { LEAVE_BALANCE_REPOSITORY } from '../../tokens';

@Injectable()
export class GetEmployeeBalanceSummaryUseCase {
  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly balances: ILeaveBalanceRepository,
  ) {}

  async execute(employeeId: number, year: number) {
    const list = await this.balances.findByEmployeeAndYear(employeeId, year);
    const summary = {
      employee_id: employeeId,
      year,
      total_entitled_days: 0,
      total_used_days: 0,
      total_pending_days: 0,
      total_remaining_days: 0,
      total_carried_over_days: 0,
      total_adjusted_days: 0,
    };
    for (const b of list) {
      summary.total_entitled_days += Number(b.total_days);
      summary.total_used_days += Number(b.used_days);
      summary.total_pending_days += Number(b.pending_days);
      summary.total_remaining_days += Number(b.remaining_days);
      summary.total_carried_over_days += Number(b.carried_over_days);
      summary.total_adjusted_days += Number(b.adjusted_days);
    }
    return summary;
  }
}


