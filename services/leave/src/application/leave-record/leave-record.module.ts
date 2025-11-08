import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRecordSchema } from '../../infrastructure/persistence/typeorm/leave-record.schema';
import { LeaveTypeSchema } from '../../infrastructure/persistence/typeorm/leave-type.schema';
import { LeaveBalanceSchema } from '../../infrastructure/persistence/typeorm/leave-balance.schema';
import { PostgresLeaveRecordRepository } from '../../infrastructure/persistence/repositories/postgres-leave-record.repository';
import { PostgresLeaveTypeRepository } from '../../infrastructure/persistence/repositories/postgres-leave-type.repository';
import { PostgresLeaveBalanceRepository } from '../../infrastructure/persistence/repositories/postgres-leave-balance.repository';
import { LEAVE_RECORD_REPOSITORY, LEAVE_TYPE_REPOSITORY, LEAVE_BALANCE_REPOSITORY } from '../tokens';
import { LeaveRecordController } from '../../presentation/controllers/leave-record.controller';
import { CreateLeaveRequestUseCase } from './use-cases/create-leave-request.use-case';
import { ApproveLeaveUseCase } from './use-cases/approve-leave.use-case';
import { RejectLeaveUseCase } from './use-cases/reject-leave.use-case';
import { CancelLeaveUseCase } from './use-cases/cancel-leave.use-case';
import { GetLeaveRecordsUseCase } from './use-cases/get-leave-records.use-case';
import { GetLeaveRecordByIdUseCase } from './use-cases/get-leave-record-by-id.use-case';
import { UpdateLeaveRequestUseCase } from './use-cases/update-leave-request.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeaveRecordSchema,
      LeaveTypeSchema,
      LeaveBalanceSchema,
    ]),
  ],
  controllers: [LeaveRecordController],
  providers: [
    {
      provide: LEAVE_RECORD_REPOSITORY,
      useClass: PostgresLeaveRecordRepository,
    },
    {
      provide: LEAVE_TYPE_REPOSITORY,
      useClass: PostgresLeaveTypeRepository,
    },
    {
      provide: LEAVE_BALANCE_REPOSITORY,
      useClass: PostgresLeaveBalanceRepository,
    },
    CreateLeaveRequestUseCase,
    ApproveLeaveUseCase,
    RejectLeaveUseCase,
    CancelLeaveUseCase,
    GetLeaveRecordsUseCase,
    GetLeaveRecordByIdUseCase,
    UpdateLeaveRequestUseCase,
  ],
  exports: [
    LEAVE_RECORD_REPOSITORY,
    CreateLeaveRequestUseCase,
    ApproveLeaveUseCase,
    RejectLeaveUseCase,
    CancelLeaveUseCase,
    GetLeaveRecordsUseCase,
    GetLeaveRecordByIdUseCase,
    UpdateLeaveRequestUseCase,
  ],
})
export class LeaveRecordModule {}
