import { Inject, Injectable } from '@nestjs/common';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { LEAVE_BALANCE_REPOSITORY, LEAVE_TYPE_REPOSITORY } from '../../tokens';

@Injectable()
export class CarryOverUseCase {
  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly balances: ILeaveBalanceRepository,
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypes: ILeaveTypeRepository,
  ) {}

  async execute(year: number, employeeId?: number) {
    // For simplicity: if employeeId provided, process only that employee; else this is a cron job for all who have balances
    // This implementation relies on fetching balances for the given year per employee. For all employees scope would need a listing method.
    // Here we assume caller provides employeeId for targeted carry-over.
    if (!employeeId) {
      return [];
    }
    const balances = await this.balances.findByEmployeeAndYear(employeeId, year);
    const activeTypes = await this.leaveTypes.findActive();
    const typeById = new Map(activeTypes.map(t => [t.id, t]));
    const results: any[] = [];
    for (const b of balances) {
      const lt = typeById.get(b.leave_type_id);
      if (!lt || !lt.allow_carry_over) {
        continue;
      }
      const remaining = Number(b.remaining_days);
      const maxCarry = Number(lt.max_carry_over_days || 0);
      const carry = Math.max(0, Math.min(remaining, maxCarry));
      if (carry <= 0) {
        continue;
      }
      const nextYear = year + 1;
      const existingNext = await this.balances.findByEmployeeLeaveTypeAndYear(employeeId, b.leave_type_id, nextYear);
      if (existingNext) {
        const newCarried = Number(existingNext.carried_over_days) + carry;
        const newTotal = Number(existingNext.total_days);
        const newRemaining = Number(existingNext.remaining_days) + carry;
        await this.balances.update(existingNext.id, {
          carried_over_days: newCarried,
          remaining_days: newRemaining,
          total_days: newTotal,
        });
        results.push({ leave_type_id: b.leave_type_id, carried_over_days: newCarried, year: nextYear });
      } else {
        const created = await this.balances.create({
          employee_id: employeeId,
          leave_type_id: b.leave_type_id,
          year: nextYear,
          total_days: 0,
          used_days: 0,
          pending_days: 0,
          remaining_days: carry,
          carried_over_days: carry,
          adjusted_days: 0,
        });
        results.push(created);
      }
    }
    return results;
  }
}


