import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { AccountController } from '../presentation/controllers/account.controller';
import { EmployeeCreatedListener } from '../presentation/event-listeners/employee-created.listener';  // Add
import { CreateAccountUseCase } from './use-cases/create-account.use-case';
import { PostgresAccountRepository } from '../infrastructure/persistence/repositories/postgres-account.repository';
import { BcryptService } from '../infrastructure/services/bcrypt.service';
import { RabbitMQEventPublisher } from '../infrastructure/messaging/rabbitmq-event.publisher';
import { RabbitMQEventSubscriber } from '../infrastructure/messaging/rabbitmq-event.subscriber';
import { EmployeeCreatedHandler } from './handlers/employee-created.handler';
import { AccountSchema } from '../infrastructure/persistence/typeorm/account.schema';
import { ACCOUNT_REPOSITORY, HASHING_SERVICE, EVENT_PUBLISHER } from './tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountSchema]),
    ClientsModule.registerAsync([
      {
        name: 'EMPLOYEE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.getOrThrow<string>('RABBITMQ_URL') as string;
          const employeeQueue = configService.getOrThrow<string>('RABBITMQ_EMPLOYEE_QUEUE') as string;
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl] as string[],
              queue: employeeQueue,
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
  controllers: [AccountController, EmployeeCreatedListener],  // Add listener
  providers: [
    CreateAccountUseCase,
    EmployeeCreatedHandler,
    RabbitMQEventSubscriber,
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: PostgresAccountRepository,
    },
    {
      provide: HASHING_SERVICE,
      useClass: BcryptService,
    },
    {
      provide: EVENT_PUBLISHER,
      useClass: RabbitMQEventPublisher,
    },
  ],
})
export class AccountModule {}