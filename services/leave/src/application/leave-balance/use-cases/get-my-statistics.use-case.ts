import { Inject, Injectable } from '@nestjs/common';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { ILeaveBalanceTransactionRepository } from '../../ports/leave-balance-transaction.repository.interface';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import {
  LEAVE_BALANCE_REPOSITORY,
  LEAVE_BALANCE_TRANSACTION_REPOSITORY,
  LEAVE_TYPE_REPOSITORY,
} from '../../tokens';
import {
  LeaveBalanceStatisticsResponseDto,
  LeaveBalanceByTypeDto,
  LeaveBalanceTransactionResponseDto,
} from '../dto/leave-balance.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class GetMyStatisticsUseCase {
  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly balanceRepository: ILeaveBalanceRepository,
    @Inject(LEAVE_BALANCE_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ILeaveBalanceTransactionRepository,
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(
    employeeId: number,
    year?: number,
  ): Promise<LeaveBalanceStatisticsResponseDto> {
    const targetYear = year ?? new Date().getFullYear();

    // 1. Get all balances for this employee in the year
    const balances = await this.balanceRepository.findByEmployeeAndYear(
      employeeId,
      targetYear,
    );

    // 2. Get all leave types
    const leaveTypes = await this.leaveTypeRepository.findAll();
    const leaveTypeMap = new Map(leaveTypes.map((lt) => [lt.id, lt]));

    // 3. Calculate overall statistics
    let totalEntitled = 0;
    let totalUsed = 0;
    let totalPending = 0;
    let totalRemaining = 0;
    let totalCarriedOver = 0;
    let totalAdjusted = 0;

    const byType: LeaveBalanceByTypeDto[] = [];

    for (const balance of balances) {
      const leaveType = leaveTypeMap.get(Number(balance.leave_type_id));
      if (!leaveType) continue;

      const entitled = Number(balance.total_days);
      const used = Number(balance.used_days);
      const pending = Number(balance.pending_days);
      const remaining = Number(balance.remaining_days);
      const carriedOver = Number(balance.carried_over_days);
      const adjusted = Number(balance.adjusted_days);

      totalEntitled += entitled;
      totalUsed += used;
      totalPending += pending;
      totalRemaining += remaining;
      totalCarriedOver += carriedOver;
      totalAdjusted += adjusted;

      byType.push({
        leave_type_id: Number(balance.leave_type_id),
        leave_type_name: leaveType.leave_type_name,
        leave_type_code: leaveType.leave_type_code,
        entitled,
        used,
        pending,
        remaining,
        carried_over: carriedOver,
        adjusted,
      });
    }

    // 4. Calculate usage rate
    const usageRate = totalEntitled > 0 ? (totalUsed / totalEntitled) * 100 : 0;

    // 5. Get recent transactions (last 10)
    const recentTransactionsEntities =
      await this.transactionRepository.findByEmployee(employeeId, {
        year: targetYear,
        limit: 10,
      });

    const recentTransactions = plainToInstance(
      LeaveBalanceTransactionResponseDto,
      recentTransactionsEntities,
    );

    // 6. Build statistics response
    const statistics: LeaveBalanceStatisticsResponseDto = {
      employee_id: employeeId,
      year: targetYear,
      total_entitled: totalEntitled,
      total_used: totalUsed,
      total_pending: totalPending,
      total_remaining: totalRemaining,
      total_carried_over: totalCarriedOver,
      total_adjusted: totalAdjusted,
      usage_rate: Math.round(usageRate * 100) / 100, // round to 2 decimal places
      by_type: byType,
      recent_transactions: recentTransactions,
    };

    return statistics;
  }
}
