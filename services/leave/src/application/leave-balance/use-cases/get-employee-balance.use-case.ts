import { Inject, Injectable } from '@nestjs/common';
import { LEAVE_BALANCE_REPOSITORY } from '../../tokens';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';

@Injectable()
export class GetEmployeeBalanceUseCase {
  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly leaveBalanceRepository: ILeaveBalanceRepository,
  ) {}

  async execute(employeeId: number, year?: number) {
    const queryYear = year || new Date().getFullYear();
    return this.leaveBalanceRepository.findByEmployeeAndYear(employeeId, queryYear);
  }
}
