import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveBalanceSchema } from '../../infrastructure/persistence/typeorm/leave-balance.schema';
import { LeaveBalanceTransactionSchema } from '../../infrastructure/persistence/typeorm/leave-balance-transaction.schema';
import { LeaveTypeSchema } from '../../infrastructure/persistence/typeorm/leave-type.schema';
import { PostgresLeaveBalanceRepository } from '../../infrastructure/persistence/repositories/postgres-leave-balance.repository';
import { PostgresLeaveBalanceTransactionRepository } from '../../infrastructure/persistence/repositories/postgres-leave-balance-transaction.repository';
import { PostgresLeaveTypeRepository } from '../../infrastructure/persistence/repositories/postgres-leave-type.repository';
import { GetEmployeeBalanceUseCase } from './use-cases/get-employee-balance.use-case';
import { GetEmployeeBalanceSummaryUseCase } from './use-cases/get-employee-balance-summary.use-case';
import { InitializeLeaveBalanceUseCase } from './use-cases/initialize-leave-balance.use-case';
import { AdjustLeaveBalanceUseCase } from './use-cases/adjust-leave-balance.use-case';
import { CarryOverLeaveBalanceUseCase } from './use-cases/carry-over-leave-balance.use-case';
import { LeaveBalanceController } from '../../presentation/controllers/leave-balance.controller';
import {
  LEAVE_BALANCE_REPOSITORY,
  LEAVE_BALANCE_TRANSACTION_REPOSITORY,
  LEAVE_TYPE_REPOSITORY,
} from '../tokens';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeaveBalanceSchema,
      LeaveBalanceTransactionSchema,
      LeaveTypeSchema,
    ]),
    SharedModule,
  ],
  controllers: [LeaveBalanceController],
  providers: [
    {
      provide: LEAVE_BALANCE_REPOSITORY,
      useClass: PostgresLeaveBalanceRepository,
    },
    {
      provide: LEAVE_BALANCE_TRANSACTION_REPOSITORY,
      useClass: PostgresLeaveBalanceTransactionRepository,
    },
    {
      provide: LEAVE_TYPE_REPOSITORY,
      useClass: PostgresLeaveTypeRepository,
    },
    GetEmployeeBalanceUseCase,
    GetEmployeeBalanceSummaryUseCase,
    InitializeLeaveBalanceUseCase,
    AdjustLeaveBalanceUseCase,
    CarryOverLeaveBalanceUseCase,
  ],
  exports: [
    LEAVE_BALANCE_REPOSITORY,
    LEAVE_BALANCE_TRANSACTION_REPOSITORY,
  ],
})
export class LeaveBalanceModule {}
