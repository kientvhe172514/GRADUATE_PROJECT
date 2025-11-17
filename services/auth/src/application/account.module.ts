import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RbacModule } from './rbac.module';

import { AccountController } from '../presentation/controllers/account.controller';
import { AdminController } from '../presentation/controllers/admin.controller';
import { VerifyController } from '../presentation/controllers/verify.controller';
import { JwtStrategy } from '../infrastructure/auth/jwt.strategy';
import { EmployeeCreatedListener } from '../presentation/event-listeners/employee-created.listener';  // Add
import { LoginUseCase } from './use-cases/login.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { ChangePasswordUseCase } from './use-cases/change-password.use-case';
import { ChangeTemporaryPasswordUseCase } from './use-cases/change-temporary-password.use-case';
import { GetAccountUseCase } from './use-cases/get-account.use-case';
import { ForgotPasswordUseCase } from './use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { UpdateAccountUseCase } from './use-cases/update-account.use-case';
import { ListAccountsUseCase } from './use-cases/admin/list-accounts.use-case';
import { GetAccountDetailUseCase } from './use-cases/admin/get-account-detail.use-case';
import { UpdateAccountStatusUseCase } from './use-cases/admin/update-account-status.use-case';
import { AdminUpdateAccountUseCase } from './use-cases/admin/update-account.use-case';
import { ListAuditLogsUseCase } from './use-cases/admin/list-audit-logs.use-case';
import { CreateDeviceSessionUseCase } from './use-cases/device/create-device-session.use-case';
import { LogDeviceActivityUseCase } from './use-cases/device/log-device-activity.use-case';
import { GetMyDevicesUseCase } from './use-cases/device/get-my-devices.use-case';
import { RevokeDeviceUseCase } from './use-cases/device/revoke-device.use-case';
import { GetDeviceActivitiesUseCase } from './use-cases/device/get-device-activities.use-case';
import { PostgresTemporaryPasswordsRepository } from '../infrastructure/persistence/repositories/postgres-temporary-passwords.repository';
import { TemporaryPasswordsSchema } from '../infrastructure/persistence/typeorm/temporary-passwords.schema';
import { PostgresRefreshTokensRepository } from '../infrastructure/persistence/repositories/postgres-refresh-tokens.repository';
import { PostgresAuditLogsRepository } from '../infrastructure/persistence/repositories/postgres-audit-logs.repository';
import { PostgresDeviceSessionRepository } from '../infrastructure/persistence/repositories/postgres-device-session.repository';
import { PostgresDeviceActivityLogRepository } from '../infrastructure/persistence/repositories/postgres-device-activity-log.repository';
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
import { DeviceSessionSchema } from '../infrastructure/persistence/typeorm/device-session.schema';
import { DeviceActivityLogSchema } from '../infrastructure/persistence/typeorm/device-activity-log.schema';
import { DeviceSecurityAlertSchema } from '../infrastructure/persistence/typeorm/device-security-alert.schema';
import { DeviceController } from '../presentation/controllers/device.controller';
import { 
  ACCOUNT_REPOSITORY, 
  HASHING_SERVICE, 
  EVENT_PUBLISHER, 
  AUDIT_LOGS_REPOSITORY, 
  JWT_SERVICE, 
  REFRESH_TOKENS_REPOSITORY, 
  TEMPORARY_PASSWORDS_REPOSITORY,
  DEVICE_SESSION_REPOSITORY,
  DEVICE_ACTIVITY_LOG_REPOSITORY,
} from './tokens';

@Module({
  imports: [
    // Prevent circular DI issues by using forwardRef when importing RbacModule
    forwardRef(() => RbacModule),
    TypeOrmModule.forFeature([
      AccountSchema,
      RefreshTokensSchema,
      AuditLogsSchema,
      TemporaryPasswordsSchema,
      DeviceSessionSchema,
      DeviceActivityLogSchema,
      DeviceSecurityAlertSchema,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'secretKey'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
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
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.getOrThrow<string>('RABBITMQ_URL') as string;
          const notificationQueue = configService.getOrThrow<string>('RABBITMQ_NOTIFICATION_QUEUE') as string;
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl] as string[],
              queue: notificationQueue,
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
  controllers: [
    AccountController, 
    AdminController, 
    VerifyController, 
    DeviceController,
    EmployeeCreatedListener,
  ],
  providers: [
    CreateAccountUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    UpdateAccountUseCase,
    ChangePasswordUseCase,
    ChangeTemporaryPasswordUseCase,
    GetAccountUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    ListAccountsUseCase,
    GetAccountDetailUseCase,
    UpdateAccountStatusUseCase,
    AdminUpdateAccountUseCase,
    ListAuditLogsUseCase,
    // Device management use cases
    CreateDeviceSessionUseCase,
    LogDeviceActivityUseCase,
    GetMyDevicesUseCase,
    RevokeDeviceUseCase,
    GetDeviceActivitiesUseCase,
    EmployeeCreatedHandler,
    RabbitMQEventSubscriber,
    JwtStrategy,
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
    {
      provide: DEVICE_SESSION_REPOSITORY,
      useClass: PostgresDeviceSessionRepository,
    },
    {
      provide: DEVICE_ACTIVITY_LOG_REPOSITORY,
      useClass: PostgresDeviceActivityLogRepository,
    },
  ],
  exports: [
    ACCOUNT_REPOSITORY,
  ],
})
export class AccountModule {}