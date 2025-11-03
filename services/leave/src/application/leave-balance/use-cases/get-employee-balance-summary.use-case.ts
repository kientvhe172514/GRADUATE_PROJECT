import { Inject, Injectable } from '@nestjs/common';
import { LEAVE_BALANCE_REPOSITORY, LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { LeaveBalanceSummaryDto } from '../dto/leave-balance.dto';

@Injectable()
export class GetEmployeeBalanceSummaryUseCase {
  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly leaveBalanceRepository: ILeaveBalanceRepository,
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(employeeId: number, year?: number): Promise<LeaveBalanceSummaryDto> {
    const queryYear = year || new Date().getFullYear();
    const balances = await this.leaveBalanceRepository.findByEmployeeAndYear(employeeId, queryYear);
    
    const leaveTypes = await this.leaveTypeRepository.findAll();
    const leaveTypeMap = new Map(leaveTypes.map(lt => [lt.id, lt]));

    const balancesWithTypes = balances.map(balance => {
      const leaveType = leaveTypeMap.get(balance.leave_type_id);
      return {
        leave_type_id: balance.leave_type_id,
        leave_type_name: leaveType?.leave_type_name || 'Unknown',
        leave_type_code: leaveType?.leave_type_code || 'UNKNOWN',
        total_days: Number(balance.total_days),
        used_days: Number(balance.used_days),
        pending_days: Number(balance.pending_days),
        remaining_days: Number(balance.remaining_days),
        carried_over_days: Number(balance.carried_over_days),
        adjusted_days: Number(balance.adjusted_days),
      };
    });

    const total_allocated = balancesWithTypes.reduce((sum, b) => sum + b.total_days, 0);
    const total_used = balancesWithTypes.reduce((sum, b) => sum + b.used_days, 0);
    const total_remaining = balancesWithTypes.reduce((sum, b) => sum + b.remaining_days, 0);

    return {
      employee_id: employeeId,
      year: queryYear,
      balances: balancesWithTypes,
      total_allocated,
      total_used,
      total_remaining,
    };
  }
}
