import { Inject, Injectable } from '@nestjs/common';
import { LEAVE_BALANCE_REPOSITORY, LEAVE_BALANCE_TRANSACTION_REPOSITORY, EVENT_PUBLISHER } from '../../tokens';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { ILeaveBalanceTransactionRepository } from '../../ports/leave-balance-transaction.repository.interface';
import { EventPublisherPort } from '../../ports/event.publisher.port';
import { AdjustLeaveBalanceDto } from '../dto/leave-balance.dto';

@Injectable()
export class AdjustLeaveBalanceUseCase {
  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly leaveBalanceRepository: ILeaveBalanceRepository,
    @Inject(LEAVE_BALANCE_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ILeaveBalanceTransactionRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(dto: AdjustLeaveBalanceDto) {
    const balance = await this.leaveBalanceRepository.findByEmployeeLeaveTypeAndYear(
      dto.employee_id,
      dto.leave_type_id,
      dto.year
    );

    if (!balance) {
      throw new Error('Leave balance not found');
    }

    const balanceBefore = Number(balance.remaining_days);
    const newAdjustedDays = Number(balance.adjusted_days) + Number(dto.adjustment_days);
    const newTotalDays = Number(balance.total_days) + Number(dto.adjustment_days);
    const newRemainingDays = balanceBefore + Number(dto.adjustment_days);

    // Update balance
    const updatedBalance = await this.leaveBalanceRepository.update(balance.id, {
      adjusted_days: newAdjustedDays,
      total_days: newTotalDays,
      remaining_days: newRemainingDays,
    });

    // Create transaction record
    await this.transactionRepository.create({
      employee_id: dto.employee_id,
      leave_type_id: dto.leave_type_id,
      year: dto.year,
      transaction_type: dto.adjustment_days > 0 ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_DEDUCT',
      amount: Math.abs(dto.adjustment_days),
      balance_before: balanceBefore,
      balance_after: newRemainingDays,
      reference_type: 'MANUAL_ADJUSTMENT',
      description: dto.reason,
      created_by: dto.adjusted_by,
    });

    // Publish event
    this.eventPublisher.publish('leave.balance-adjusted', {
      employeeId: dto.employee_id,
      leaveTypeId: dto.leave_type_id,
      year: dto.year,
      adjustmentDays: dto.adjustment_days,
      newRemainingDays,
      adjustedBy: dto.adjusted_by,
    });

    return updatedBalance;
  }
}
