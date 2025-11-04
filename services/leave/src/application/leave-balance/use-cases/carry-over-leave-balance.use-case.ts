import { Inject, Injectable } from '@nestjs/common';
import { LEAVE_BALANCE_REPOSITORY, LEAVE_TYPE_REPOSITORY, LEAVE_BALANCE_TRANSACTION_REPOSITORY, EVENT_PUBLISHER } from '../../tokens';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { ILeaveBalanceTransactionRepository } from '../../ports/leave-balance-transaction.repository.interface';
import { EventPublisherPort } from '../../ports/event.publisher.port';
import { CarryOverLeaveBalanceDto } from '../dto/leave-balance.dto';

@Injectable()
export class CarryOverLeaveBalanceUseCase {
  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly leaveBalanceRepository: ILeaveBalanceRepository,
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
    @Inject(LEAVE_BALANCE_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ILeaveBalanceTransactionRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(dto: CarryOverLeaveBalanceDto) {
    const leaveTypes = await this.leaveTypeRepository.findActive();
    const carryOverTypes = leaveTypes.filter(lt => lt.allow_carry_over);

    const results: Array<{
      employeeId: number;
      leaveTypeId: number;
      carryOverDays: number;
      message: string;
    }> = [];

    for (const leaveType of carryOverTypes) {
      if (dto.employee_id) {
        // Carry over for specific employee
        const result = await this.carryOverForEmployee(
          dto.employee_id,
          leaveType.id,
          dto.from_year,
          dto.to_year,
          leaveType.max_carry_over_days || 0
        );
        results.push(result);
      } else {
        // TODO: Carry over for all employees (cron job)
        // This would typically be handled by a scheduler service
        throw new Error('Bulk carry-over not implemented. Use employee_id for individual carry-over.');
      }
    }

    return results;
  }

  private async carryOverForEmployee(
    employeeId: number,
    leaveTypeId: number,
    fromYear: number,
    toYear: number,
    maxCarryOverDays: number
  ) {
    const previousBalance = await this.leaveBalanceRepository.findByEmployeeLeaveTypeAndYear(
      employeeId,
      leaveTypeId,
      fromYear
    );

    if (!previousBalance) {
      throw new Error(`No balance found for employee ${employeeId} in year ${fromYear}`);
    }

    const remainingDays = Number(previousBalance.remaining_days);
    const carryOverDays = Math.min(remainingDays, maxCarryOverDays);

    if (carryOverDays <= 0) {
      return { employeeId, leaveTypeId, carryOverDays: 0, message: 'No days to carry over' };
    }

    // Get or create next year's balance
    let nextYearBalance = await this.leaveBalanceRepository.findByEmployeeLeaveTypeAndYear(
      employeeId,
      leaveTypeId,
      toYear
    );

    if (!nextYearBalance) {
      // Initialize balance for next year if it doesn't exist
      const leaveType = await this.leaveTypeRepository.findById(leaveTypeId);
      nextYearBalance = await this.leaveBalanceRepository.create({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        year: toYear,
        total_days: leaveType?.max_days_per_year || 0,
        used_days: 0,
        pending_days: 0,
        remaining_days: leaveType?.max_days_per_year || 0,
        carried_over_days: 0,
        adjusted_days: 0,
      });
    }

    const balanceBefore = Number(nextYearBalance.remaining_days);
    const newCarriedOverDays = Number(nextYearBalance.carried_over_days) + carryOverDays;
    const newTotalDays = Number(nextYearBalance.total_days) + carryOverDays;
    const newRemainingDays = balanceBefore + carryOverDays;

    // Update next year's balance
    await this.leaveBalanceRepository.update(nextYearBalance.id, {
      carried_over_days: newCarriedOverDays,
      total_days: newTotalDays,
      remaining_days: newRemainingDays,
    });

    // Create transaction
    await this.transactionRepository.create({
      employee_id: employeeId,
      leave_type_id: leaveTypeId,
      year: toYear,
      transaction_type: 'CARRY_OVER',
      amount: carryOverDays,
      balance_before: balanceBefore,
      balance_after: newRemainingDays,
      reference_type: 'CARRY_OVER',
      reference_id: previousBalance.id,
      description: `Carried over from ${fromYear}`,
    });

    // Publish event
    this.eventPublisher.publish('leave.balance-carried-over', {
      employeeId,
      leaveTypeId,
      fromYear,
      toYear,
      carryOverDays,
    });

    return { employeeId, leaveTypeId, carryOverDays, message: 'Carry over successful' };
  }
}
