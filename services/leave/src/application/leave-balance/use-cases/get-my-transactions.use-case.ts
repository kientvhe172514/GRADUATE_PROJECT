import { Inject, Injectable } from '@nestjs/common';
import { ILeaveBalanceTransactionRepository } from '../../ports/leave-balance-transaction.repository.interface';
import { LEAVE_BALANCE_TRANSACTION_REPOSITORY } from '../../tokens';
import { GetMyTransactionsQueryDto } from '../dto/leave-balance.dto';

@Injectable()
export class GetMyTransactionsUseCase {
  constructor(
    @Inject(LEAVE_BALANCE_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ILeaveBalanceTransactionRepository,
  ) {}

  async execute(employeeId: number, query?: GetMyTransactionsQueryDto) {
    const filters = {
      year: query?.year,
      leave_type_id: query?.leave_type_id,
      transaction_type: query?.transaction_type,
      limit: query?.limit || 50, // default 50 latest transactions
    };

    return this.transactionRepository.findByEmployee(employeeId, filters);
  }
}
