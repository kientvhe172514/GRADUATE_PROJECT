import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmployeeController } from '../presentation/controllers/employee.controller';
import { AccountCreatedListener } from '../presentation/event-listeners/account-created.listener';  // Add
import { CreateEmployeeUseCase } from './use-cases/create-employee.use-case';
import { PostgresEmployeeRepository } from '../infrastructure/persistence/repositories/postgres-employee.repository';
import { RabbitMQEventPublisher } from '../infrastructure/messaging/rabbitmq-event.publisher';
import { RabbitMQEventSubscriber } from '../infrastructure/messaging/rabbitmq-event.subscriber';  
import { AccountCreatedHandler } from './handlers/account-created.handler';
import { EmployeeSchema } from '../infrastructure/persistence/typeorm/employee.schema';
import { EMPLOYEE_REPOSITORY, EVENT_PUBLISHER } from './tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeSchema]),
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
  controllers: [EmployeeController, AccountCreatedListener],  
  providers: [
    CreateEmployeeUseCase,
    AccountCreatedHandler,
    RabbitMQEventSubscriber,  
    {
      provide: EMPLOYEE_REPOSITORY,
      useClass: PostgresEmployeeRepository,
    },
    {
      provide: EVENT_PUBLISHER,
      useClass: RabbitMQEventPublisher,
    },
  ],
})
export class EmployeeModule {}