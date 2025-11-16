import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveBalanceSchema } from '../../infrastructure/persistence/typeorm/leave-balance.schema';
import { LeaveBalanceTransactionSchema } from '../../infrastructure/persistence/typeorm/leave-balance-transaction.schema';
import { LeaveTypeSchema } from '../../infrastructure/persistence/typeorm/leave-type.schema';
import { PostgresLeaveBalanceRepository } from '../../infrastructure/persistence/repositories/postgres-leave-balance.repository';
import { PostgresLeaveBalanceTransactionRepository } from '../../infrastructure/persistence/repositories/postgres-leave-balance-transaction.repository';
import { PostgresLeaveTypeRepository } from '../../infrastructure/persistence/repositories/postgres-leave-type.repository';
import { LEAVE_BALANCE_REPOSITORY, LEAVE_BALANCE_TRANSACTION_REPOSITORY, LEAVE_TYPE_REPOSITORY } from '../tokens';
import { LeaveBalanceController } from '../../presentation/controllers/leave-balance.controller';
import { GetEmployeeBalancesUseCase } from './use-cases/get-employee-balances.use-case';
import { GetEmployeeBalanceSummaryUseCase } from './use-cases/get-employee-balance-summary.use-case';
import { InitializeEmployeeBalancesUseCase } from './use-cases/initialize-employee-balances.use-case';
import { AdjustLeaveBalanceUseCase } from './use-cases/adjust-leave-balance.use-case';
import { CarryOverUseCase } from './use-cases/carry-over.use-case';
import { ListExpiringCarryOverUseCase } from './use-cases/list-expiring-carry-over.use-case';
import { GetMyTransactionsUseCase } from './use-cases/get-my-transactions.use-case';
import { GetMyStatisticsUseCase } from './use-cases/get-my-statistics.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveBalanceSchema, LeaveBalanceTransactionSchema, LeaveTypeSchema])],
  controllers: [LeaveBalanceController],
  providers: [
    { provide: LEAVE_BALANCE_REPOSITORY, useClass: PostgresLeaveBalanceRepository },
    { provide: LEAVE_BALANCE_TRANSACTION_REPOSITORY, useClass: PostgresLeaveBalanceTransactionRepository },
    { provide: LEAVE_TYPE_REPOSITORY, useClass: PostgresLeaveTypeRepository },
    GetEmployeeBalancesUseCase,
    GetEmployeeBalanceSummaryUseCase,
    InitializeEmployeeBalancesUseCase,
    AdjustLeaveBalanceUseCase,
    CarryOverUseCase,
    ListExpiringCarryOverUseCase,
    GetMyTransactionsUseCase,
    GetMyStatisticsUseCase,
  ],
  exports: [LEAVE_BALANCE_REPOSITORY, LEAVE_BALANCE_TRANSACTION_REPOSITORY, LEAVE_TYPE_REPOSITORY],
})
export class LeaveBalanceModule {}
