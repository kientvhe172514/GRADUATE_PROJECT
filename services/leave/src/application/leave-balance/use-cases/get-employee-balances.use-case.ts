import { Inject, Injectable } from '@nestjs/common';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { LEAVE_BALANCE_REPOSITORY } from '../../tokens';

@Injectable()
export class GetEmployeeBalancesUseCase {
  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly balances: ILeaveBalanceRepository,
  ) {}

  async execute(employeeId: number, year: number) {
    return this.balances.findByEmployeeAndYear(employeeId, year);
  }
}


