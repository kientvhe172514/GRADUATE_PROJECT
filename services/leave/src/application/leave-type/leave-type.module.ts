import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveTypeSchema } from '../../infrastructure/persistence/typeorm/leave-type.schema';
import { PostgresLeaveTypeRepository } from '../../infrastructure/persistence/repositories/postgres-leave-type.repository';
import { RabbitMQEventPublisher } from '../../infrastructure/messaging/rabbitmq-event.publisher';
import { CreateLeaveTypeUseCase } from './use-cases/create-leave-type.use-case';
import { GetLeaveTypesUseCase } from './use-cases/get-leave-types.use-case';
import { GetLeaveTypeByIdUseCase } from './use-cases/get-leave-type-by-id.use-case';
import { UpdateLeaveTypeUseCase } from './use-cases/update-leave-type.use-case';
import { DeleteLeaveTypeUseCase } from './use-cases/delete-leave-type.use-case';
import { LeaveTypeController } from '../../presentation/controllers/leave-type.controller';
import { LEAVE_TYPE_REPOSITORY, EVENT_PUBLISHER } from '../tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveTypeSchema]),
  ],
  controllers: [LeaveTypeController],
  providers: [
    {
      provide: LEAVE_TYPE_REPOSITORY,
      useClass: PostgresLeaveTypeRepository,
    },
    {
      provide: EVENT_PUBLISHER,
      useClass: RabbitMQEventPublisher,
    },
    CreateLeaveTypeUseCase,
    GetLeaveTypesUseCase,
    GetLeaveTypeByIdUseCase,
    UpdateLeaveTypeUseCase,
    DeleteLeaveTypeUseCase,
  ],
  exports: [LEAVE_TYPE_REPOSITORY, EVENT_PUBLISHER],
})
export class LeaveTypeModule {}
