import { Inject, Injectable } from '@nestjs/common';
import { LEAVE_BALANCE_REPOSITORY, LEAVE_TYPE_REPOSITORY, EVENT_PUBLISHER } from '../../tokens';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { EventPublisherPort } from '../../ports/event.publisher.port';
import { InitializeLeaveBalanceDto } from '../dto/leave-balance.dto';
import { LeaveBalanceEntity } from '../../../domain/entities/leave-balance.entity';

@Injectable()
export class InitializeLeaveBalanceUseCase {
  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly leaveBalanceRepository: ILeaveBalanceRepository,
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(dto: InitializeLeaveBalanceDto): Promise<LeaveBalanceEntity[]> {
    const year = dto.year || new Date().getFullYear();
    const activeLeaveTypes = await this.leaveTypeRepository.findActive();

    const employmentStartDate = new Date(dto.employment_start_date);
    const yearStartDate = new Date(year, 0, 1);
    const joinDate = employmentStartDate > yearStartDate ? employmentStartDate : yearStartDate;

    const createdBalances: LeaveBalanceEntity[] = [];

    for (const leaveType of activeLeaveTypes) {
      // Check if balance already exists
      const existing = await this.leaveBalanceRepository.findByEmployeeLeaveTypeAndYear(
        dto.employee_id,
        leaveType.id,
        year
      );

      if (existing) {
        continue; // Skip if already initialized
      }

      let totalDays = leaveType.max_days_per_year || 0;

      // Apply proration if applicable
      if (leaveType.is_prorated && joinDate > yearStartDate) {
        totalDays = this.calculateProratedDays(
          totalDays,
          joinDate,
          year,
          leaveType.proration_basis
        );
      }

      const balance = await this.leaveBalanceRepository.create({
        employee_id: dto.employee_id,
        leave_type_id: leaveType.id,
        year,
        total_days: totalDays,
        used_days: 0,
        pending_days: 0,
        remaining_days: totalDays,
        carried_over_days: 0,
        adjusted_days: 0,
      });

      createdBalances.push(balance);

      // Publish event
      this.eventPublisher.publish('leave.balance-initialized', {
        employeeId: dto.employee_id,
        leaveTypeId: leaveType.id,
        year,
        totalDays,
      });
    }

    return createdBalances;
  }

  private calculateProratedDays(
    totalDays: number,
    joinDate: Date,
    year: number,
    prorationBasis: string
  ): number {
    const yearEnd = new Date(year, 11, 31);
    const remainingDays = Math.ceil((yearEnd.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

    if (prorationBasis === 'MONTHLY') {
      const remainingMonths = Math.ceil(remainingDays / 30);
      return Number(((totalDays / 12) * remainingMonths).toFixed(2));
    }

    // Daily proration
    return Number(((totalDays / 365) * remainingDays).toFixed(2));
  }
}
