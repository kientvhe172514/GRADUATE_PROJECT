import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';

// Schemas
import { NotificationSchema } from '../infrastructure/persistence/typeorm/schemas/notification.schema';
import { NotificationPreferenceSchema } from '../infrastructure/persistence/typeorm/schemas/notification-preference.schema';
import { NotificationTemplateSchema } from '../infrastructure/persistence/typeorm/schemas/notification-template.schema';
import { PushTokenSchema } from '../infrastructure/persistence/typeorm/schemas/push-token.schema';
import { ScheduledNotificationSchema } from '../infrastructure/persistence/typeorm/schemas/scheduled-notification.schema';

// Controllers
import { NotificationController } from '../presentation/controllers/notification.controller';
import { NotificationPreferenceController } from '../presentation/controllers/notification-preference.controller';
import { PushTokenController } from '../presentation/controllers/push-token.controller';
import { HealthController } from '../presentation/controllers/health.controller';
import { ScheduledNotificationController } from '../presentation/controllers/scheduled-notification.controller';

// Cron Processors
import { ScheduledNotificationProcessor } from '../infrastructure/cron/scheduled-notification.processor';

// Event Listeners
import { AttendanceEventListener } from '../presentation/event-listeners/attendance-event.listener';
import { LeaveEventListener } from '../presentation/event-listeners/leave-event.listener';
import { FaceVerificationEventListener } from '../presentation/event-listeners/face-verification-event.listener';
import { AuthEventListener } from '../presentation/event-listeners/auth-event.listener';
import { EmployeeEventListener } from '../presentation/event-listeners/employee-event.listener';
import { DeviceSessionCreatedListener } from '../presentation/event-listeners/device-session-created.listener';

// Use Cases
import {
  SendNotificationUseCase,
  NOTIFICATION_REPOSITORY,
  NOTIFICATION_PREFERENCE_REPOSITORY,
  PUSH_NOTIFICATION_SERVICE,
  EMAIL_SERVICE,
  SMS_SERVICE,
  EVENT_PUBLISHER,
} from './use-cases/send-notification.use-case';
import { GetUserNotificationsUseCase } from './use-cases/get-user-notifications.use-case';
import { MarkNotificationAsReadUseCase } from './use-cases/mark-notification-as-read.use-case';
import { MarkAllNotificationsAsReadUseCase } from './use-cases/mark-all-notifications-as-read.use-case';
import { UpdateNotificationPreferenceUseCase } from './use-cases/update-notification-preference.use-case';
import { GetNotificationPreferencesUseCase } from './use-cases/get-notification-preferences.use-case';
import {
  RegisterPushTokenUseCase,
  PUSH_TOKEN_REPOSITORY,
} from './use-cases/register-push-token.use-case';
import { UnregisterPushTokenUseCase } from './use-cases/unregister-push-token.use-case';
import {
  SendNotificationFromTemplateUseCase,
  NOTIFICATION_TEMPLATE_REPOSITORY,
} from './use-cases/send-notification-from-template.use-case';
import { GetMyNotificationStatisticsUseCase } from './use-cases/get-my-notification-statistics.use-case';
import { GetUnreadCountUseCase } from './use-cases/get-unread-count.use-case';
import { SendBulkNotificationUseCase } from './use-cases/send-bulk-notification.use-case';
import { BulkMarkAsReadUseCase } from './use-cases/bulk-mark-as-read.use-case';
import { DeleteMyReadNotificationsUseCase } from './use-cases/delete-my-read-notifications.use-case';
import { CreateScheduledNotificationUseCase } from './use-cases/create-scheduled-notification.use-case';
import { UpdateScheduledNotificationUseCase } from './use-cases/update-scheduled-notification.use-case';
import { CancelScheduledNotificationUseCase } from './use-cases/cancel-scheduled-notification.use-case';
import { GetScheduledNotificationsUseCase } from './use-cases/get-scheduled-notifications.use-case';
import { ProcessScheduledNotificationsUseCase } from './use-cases/process-scheduled-notifications.use-case';

// Repositories
import { PostgresNotificationRepository } from '../infrastructure/persistence/postgres-notification.repository';
import { PostgresNotificationPreferenceRepository } from '../infrastructure/persistence/postgres-notification-preference.repository';
import { PostgresPushTokenRepository } from '../infrastructure/persistence/postgres-push-token.repository';
import { PostgresScheduledNotificationRepository } from '../infrastructure/persistence/postgres-scheduled-notification.repository';
import { PostgresNotificationTemplateRepository } from '../infrastructure/persistence/postgres-notification-template.repository';
import { PushTokenRepositoryPort } from './ports/push-token.repository.port';
import { SCHEDULED_NOTIFICATION_REPOSITORY } from './ports/scheduled-notification.repository.port';

// Services - Real Implementations
import { FirebasePushNotificationService } from '../infrastructure/external-services/firebase-push-notification.service';
import { NodemailerEmailService } from '../infrastructure/external-services/nodemailer-email.service';
import { TwilioSmsService } from '../infrastructure/external-services/twilio-sms.service';
import { RabbitMQEventPublisher } from '../infrastructure/messaging/rabbitmq-event-publisher';

// Services - Mock Implementations
import { MockEmailService } from '../infrastructure/external-services/mock-email.service';
import { MockSmsService } from '../infrastructure/external-services/mock-sms.service';
import { MockPushService } from '../infrastructure/external-services/mock-push.service';

// External Service Clients
import { EmployeeServiceClient } from '../infrastructure/external-services/employee-service.client';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      NotificationSchema,
      NotificationPreferenceSchema,
      NotificationTemplateSchema,
      PushTokenSchema,
      ScheduledNotificationSchema,
    ]),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: 'auth_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [
    NotificationController,
    NotificationPreferenceController,
    PushTokenController,
    HealthController,
    ScheduledNotificationController,
    // Event Listeners (Controllers với @EventPattern)
    AttendanceEventListener,
    LeaveEventListener,
    FaceVerificationEventListener,
    AuthEventListener,
    EmployeeEventListener,
    DeviceSessionCreatedListener,
  ],
  providers: [
    // Use Cases
    SendNotificationUseCase,
    GetUserNotificationsUseCase,
    MarkNotificationAsReadUseCase,
    MarkAllNotificationsAsReadUseCase,
    UpdateNotificationPreferenceUseCase,
    GetNotificationPreferencesUseCase,
    RegisterPushTokenUseCase,
    UnregisterPushTokenUseCase,
    SendNotificationFromTemplateUseCase,
    GetMyNotificationStatisticsUseCase,
    GetUnreadCountUseCase,
    SendBulkNotificationUseCase,
    BulkMarkAsReadUseCase,
    DeleteMyReadNotificationsUseCase,
    CreateScheduledNotificationUseCase,
    UpdateScheduledNotificationUseCase,
    CancelScheduledNotificationUseCase,
    GetScheduledNotificationsUseCase,
    ProcessScheduledNotificationsUseCase,

    // Cron Processors
    ScheduledNotificationProcessor,

    // Repositories
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PostgresNotificationRepository,
    },
    {
      provide: NOTIFICATION_PREFERENCE_REPOSITORY,
      useClass: PostgresNotificationPreferenceRepository,
    },
    {
      provide: PUSH_TOKEN_REPOSITORY,
      useClass: PostgresPushTokenRepository,
    },
    {
      provide: NOTIFICATION_TEMPLATE_REPOSITORY,
      useClass: PostgresNotificationTemplateRepository,
    },
    {
      provide: SCHEDULED_NOTIFICATION_REPOSITORY,
      useClass: PostgresScheduledNotificationRepository,
    },

    // External Services - Environment-based selection
    {
      provide: PUSH_NOTIFICATION_SERVICE,
      useFactory: (configService: ConfigService, pushTokenRepo: PushTokenRepositoryPort) => {
        // Use mock if explicitly enabled OR if Firebase credentials are missing
        const useMock = configService.get('USE_MOCK_SERVICES') === 'true' || 
                       !configService.get('FIREBASE_PROJECT_ID') ||
                       !configService.get('FIREBASE_PRIVATE_KEY') ||
                       !configService.get('FIREBASE_CLIENT_EMAIL');
        
        if (useMock) {
          console.log('🔔 [PUSH] Using MockPushService (Firebase not configured)');
          return new MockPushService();
        } else {
          console.log('🔥 [PUSH] Using FirebasePushNotificationService');
          return new FirebasePushNotificationService(configService, pushTokenRepo);
        }
      },
      inject: [ConfigService, PUSH_TOKEN_REPOSITORY],
    },
    {
      provide: EMAIL_SERVICE,
      useFactory: (configService: ConfigService) => {
        const useMock = !configService.get('SMTP_HOST') ||
                       !configService.get('SMTP_PASSWORD');
        return useMock 
          ? new MockEmailService() 
          : new NodemailerEmailService(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: SMS_SERVICE,
      useFactory: (configService: ConfigService) => {
        // Use mock if explicitly enabled OR if Twilio credentials are missing
        const useMock = configService.get('USE_MOCK_SERVICES') === 'true' || 
                       !configService.get('TWILIO_ACCOUNT_SID') ||
                       !configService.get('TWILIO_AUTH_TOKEN');
        
        if (useMock) {
          console.log('📱 [SMS] Using MockSmsService (Twilio not configured)');
          return new MockSmsService();
        } else {
          console.log('📱 [SMS] Using TwilioSmsService');
          return new TwilioSmsService(configService);
        }
      },
      inject: [ConfigService],
    },

    // Messaging
    {
      provide: EVENT_PUBLISHER,
      useClass: RabbitMQEventPublisher,
    },

    // External Service Clients
    EmployeeServiceClient,
  ],
  exports: [
    SendNotificationUseCase,
    GetUserNotificationsUseCase,
    SendNotificationFromTemplateUseCase,
  ],
})
export class NotificationModule {}
