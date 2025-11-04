import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveTypeSchema } from '../../infrastructure/persistence/typeorm/leave-type.schema';
import { PostgresLeaveTypeRepository } from '../../infrastructure/persistence/repositories/postgres-leave-type.repository';
import { CreateLeaveTypeUseCase } from './use-cases/create-leave-type.use-case';
import { GetLeaveTypesUseCase } from './use-cases/get-leave-types.use-case';
import { UpdateLeaveTypeUseCase } from './use-cases/update-leave-type.use-case';
import { LeaveTypeController } from '../../presentation/controllers/leave-type.controller';
import { LEAVE_TYPE_REPOSITORY } from '../tokens';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveTypeSchema]),
    SharedModule,
  ],
  controllers: [LeaveTypeController],
  providers: [
    {
      provide: LEAVE_TYPE_REPOSITORY,
      useClass: PostgresLeaveTypeRepository,
    },
    CreateLeaveTypeUseCase,
    GetLeaveTypesUseCase,
    UpdateLeaveTypeUseCase,
  ],
  exports: [LEAVE_TYPE_REPOSITORY],
})
export class LeaveTypeModule {}
