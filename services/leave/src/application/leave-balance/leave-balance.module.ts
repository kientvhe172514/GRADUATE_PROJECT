import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveBalanceSchema } from '../../infrastructure/persistence/typeorm/leave-balance.schema';
import { PostgresLeaveBalanceRepository } from '../../infrastructure/persistence/repositories/postgres-leave-balance.repository';
import { LEAVE_BALANCE_REPOSITORY } from '../tokens';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveBalanceSchema])],
  controllers: [],
  providers: [
    {
      provide: LEAVE_BALANCE_REPOSITORY,
      useClass: PostgresLeaveBalanceRepository,
    },
  ],
  exports: [LEAVE_BALANCE_REPOSITORY],
})
export class LeaveBalanceModule {}
