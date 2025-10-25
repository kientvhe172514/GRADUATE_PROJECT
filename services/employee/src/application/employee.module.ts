import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmployeeController } from '../presentation/controllers/employee.controller';
import { PositionController } from '../presentation/controllers/position.controller';
import { AccountCreatedListener } from '../presentation/event-listeners/account-created.listener';  // Add
import { CreateEmployeeUseCase } from './use-cases/create-employee.use-case';
import { GetEmployeeDetailUseCase } from './use-cases/get-employee-detail.use-case';
import { UpdateEmployeeUseCase } from './use-cases/update-employee.use-case';
import { AssignRoleUseCase } from './use-cases/assign-role.use-case';
import { GetAllPositionsUseCase } from './use-cases/get-all-positions.use-case';
import { GetPositionByIdUseCase } from './use-cases/get-position-by-id.use-case';
import { CreatePositionUseCase } from './use-cases/create-position.use-case';
import { UpdatePositionUseCase } from './use-cases/update-position.use-case';
import { DeletePositionUseCase } from './use-cases/delete-position.use-case';
import { PostgresEmployeeRepository } from '../infrastructure/persistence/repositories/postgres-employee.repository';
import { PostgresPositionRepository } from '../infrastructure/persistence/repositories/postgres-position.repository';
import { RabbitMQEventPublisher } from '../infrastructure/messaging/rabbitmq-event.publisher';
import { RabbitMQEventSubscriber } from '../infrastructure/messaging/rabbitmq-event.subscriber';  
import { AccountCreatedHandler } from './handlers/account-created.handler';
import { EmployeeSchema } from '../infrastructure/persistence/typeorm/employee.schema';
import { PositionSchema } from '../infrastructure/persistence/typeorm/position.schema';
import { EMPLOYEE_REPOSITORY, POSITION_REPOSITORY, EVENT_PUBLISHER } from './tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeSchema, PositionSchema]),
    ClientsModule.registerAsync([
      {
        name: 'IAM_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.get<string>('RABBITMQ_URL')!;
          const iamQueue = configService.get<string>('RABBITMQ_IAM_QUEUE')!;
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl],
              queue: iamQueue,
              queueOptions: {
                durable: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [EmployeeController, PositionController, AccountCreatedListener],  
  providers: [
    CreateEmployeeUseCase,
    GetEmployeeDetailUseCase,
    UpdateEmployeeUseCase,
  AssignRoleUseCase,
    GetAllPositionsUseCase,
    GetPositionByIdUseCase,
    CreatePositionUseCase,
    UpdatePositionUseCase,
    DeletePositionUseCase,
    AccountCreatedHandler,
    RabbitMQEventSubscriber,  
    {
      provide: EMPLOYEE_REPOSITORY,
      useClass: PostgresEmployeeRepository,
    },
    {
      provide: POSITION_REPOSITORY,
      useClass: PostgresPositionRepository,
    },
    {
      provide: EVENT_PUBLISHER,
      useClass: RabbitMQEventPublisher,
    },
  ],
})
export class EmployeeModule {}