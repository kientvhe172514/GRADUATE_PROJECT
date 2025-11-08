import { Inject, Injectable } from '@nestjs/common';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { LEAVE_BALANCE_REPOSITORY, LEAVE_TYPE_REPOSITORY } from '../../tokens';

@Injectable()
export class ListExpiringCarryOverUseCase {
  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly balances: ILeaveBalanceRepository,
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypes: ILeaveTypeRepository,
  ) {}

  async execute(year: number) {
    // naive: fetch per employee requires index we don't have (all employees). For now this returns for a single year across balances by scanning per leave type usage must be added in repository for efficiency.
    // We will approximate: caller provides employeeId in real usage. Here we return [] to keep surface, but the endpoint will focus on business usage later.
    return [];
  }
}


