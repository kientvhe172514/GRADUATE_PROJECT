import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { AccountController } from '../presentation/controllers/account.controller';
import { EmployeeCreatedListener } from '../presentation/event-listeners/employee-created.listener';  // Add
import { LoginUseCase } from './use-cases/login.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { ChangePasswordUseCase } from './use-cases/change-password.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { PostgresTemporaryPasswordsRepository } from '../infrastructure/persistence/repositories/postgres-temporary-passwords.repository';
import { TemporaryPasswordsSchema } from '../infrastructure/persistence/typeorm/temporary-passwords.schema';
import { PostgresRefreshTokensRepository } from '../infrastructure/persistence/repositories/postgres-refresh-tokens.repository';
import { PostgresAuditLogsRepository } from '../infrastructure/persistence/repositories/postgres-audit-logs.repository';
import { RefreshTokensSchema } from '../infrastructure/persistence/typeorm/refresh-tokens.schema';
import { AuditLogsSchema } from '../infrastructure/persistence/typeorm/audit-logs.schema';
import { JwtServiceImpl } from '../infrastructure/services/jwt.service';
import { CreateAccountUseCase } from './use-cases/create-account.use-case';
import { PostgresAccountRepository } from '../infrastructure/persistence/repositories/postgres-account.repository';
import { BcryptService } from '../infrastructure/services/bcrypt.service';
import { RabbitMQEventPublisher } from '../infrastructure/messaging/rabbitmq-event.publisher';
import { RabbitMQEventSubscriber } from '../infrastructure/messaging/rabbitmq-event.subscriber';
import { EmployeeCreatedHandler } from './handlers/employee-created.handler';
import { AccountSchema } from '../infrastructure/persistence/typeorm/account.schema';
import { ACCOUNT_REPOSITORY, HASHING_SERVICE, EVENT_PUBLISHER, AUDIT_LOGS_REPOSITORY, JWT_SERVICE, REFRESH_TOKENS_REPOSITORY, TEMPORARY_PASSWORDS_REPOSITORY } from './tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountSchema, RefreshTokensSchema, AuditLogsSchema, TemporaryPasswordsSchema]),
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
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ChangePasswordUseCase,
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
    {
      provide: AUDIT_LOGS_REPOSITORY,
      useClass: PostgresAuditLogsRepository,
    },
    {
      provide: REFRESH_TOKENS_REPOSITORY,
      useClass: PostgresRefreshTokensRepository,
    },
    {
      provide: TEMPORARY_PASSWORDS_REPOSITORY,
      useClass: PostgresTemporaryPasswordsRepository,
    },
    {
      provide: JWT_SERVICE,
      useClass: JwtServiceImpl,
    },
  ],
})
export class AccountModule {}