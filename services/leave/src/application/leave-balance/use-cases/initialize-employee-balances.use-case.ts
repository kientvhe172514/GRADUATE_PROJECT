import { Inject, Injectable } from '@nestjs/common';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { LEAVE_BALANCE_REPOSITORY, LEAVE_TYPE_REPOSITORY } from '../../tokens';

@Injectable()
export class InitializeEmployeeBalancesUseCase {
  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly balances: ILeaveBalanceRepository,
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypes: ILeaveTypeRepository,
  ) {}

  async execute(employeeId: number, year: number) {
    const activeTypes = await this.leaveTypes.findActive();
    const results = [] as any[];
    for (const lt of activeTypes) {
      const exists = await this.balances.findByEmployeeLeaveTypeAndYear(employeeId, lt.id, year);
      if (exists) {
        results.push(exists);
        continue;
      }

      // 🎯 ACCRUAL MODE: Nếu leave type có is_accrued = true, khởi tạo = 0
      // Sẽ tính từng tháng qua scheduler (monthly cron job)
      const isAccrued = lt.is_accrued && (lt.accrual_rate || 0) > 0;
      const initialDays = isAccrued ? 0 : Number(lt.max_days_per_year || 0);

      const created = await this.balances.create({
        employee_id: employeeId,
        leave_type_id: lt.id,
        year,
        total_days: initialDays,          // 0 nếu accrual, 12 nếu full allocation
        used_days: 0,
        pending_days: 0,
        remaining_days: initialDays,      // 0 nếu accrual, 12 nếu full allocation
        carried_over_days: 0,
        adjusted_days: 0,
      });
      results.push(created);
    }
    return results;
  }
}


