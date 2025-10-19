import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

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

// Event Listeners
import { AttendanceEventListener } from '../presentation/event-listeners/attendance-event.listener';
import { LeaveEventListener } from '../presentation/event-listeners/leave-event.listener';
import { FaceVerificationEventListener } from '../presentation/event-listeners/face-verification-event.listener';
import { AuthEventListener } from '../presentation/event-listeners/auth-event.listener';
import { EmployeeEventListener } from '../presentation/event-listeners/employee-event.listener';

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

// Repositories
import { PostgresNotificationRepository } from '../infrastructure/persistence/postgres-notification.repository';
import { PostgresNotificationPreferenceRepository } from '../infrastructure/persistence/postgres-notification-preference.repository';
import { PostgresPushTokenRepository } from '../infrastructure/persistence/postgres-push-token.repository';
import { PushTokenRepositoryPort } from './ports/push-token.repository.port';

// Services - Real Implementations
import { FirebasePushNotificationService } from '../infrastructure/external-services/firebase-push-notification.service';
import { NodemailerEmailService } from '../infrastructure/external-services/nodemailer-email.service';
import { TwilioSmsService } from '../infrastructure/external-services/twilio-sms.service';
import { RabbitMQEventPublisher } from '../infrastructure/messaging/rabbitmq-event-publisher';

// Services - Mock Implementations
import { MockEmailService } from '../infrastructure/external-services/mock-email.service';
import { MockSmsService } from '../infrastructure/external-services/mock-sms.service';
import { MockPushService } from '../infrastructure/external-services/mock-push.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forFeature([
      NotificationSchema,
      NotificationPreferenceSchema,
      NotificationTemplateSchema,
      PushTokenSchema,
      ScheduledNotificationSchema,
    ]),
  ],
  controllers: [
    NotificationController,
    NotificationPreferenceController,
    PushTokenController,
    HealthController,
    // Event Listeners (Controllers với @EventPattern)
    AttendanceEventListener,
    LeaveEventListener,
    FaceVerificationEventListener,
    AuthEventListener,
    EmployeeEventListener,
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
      useClass: PostgresNotificationRepository, // TODO: Create template repository
    },

    // External Services - Environment-based selection
    {
      provide: PUSH_NOTIFICATION_SERVICE,
      useFactory: (configService: ConfigService, pushTokenRepo: PushTokenRepositoryPort) => {
        const useMock = configService.get('USE_MOCK_SERVICES') === 'fasle' || 
                       !configService.get('FIREBASE_PROJECT_ID');
        return useMock 
          ? new MockPushService() 
          : new FirebasePushNotificationService(configService, pushTokenRepo);
      },
      inject: [ConfigService, PUSH_TOKEN_REPOSITORY],
    },
    {
      provide: EMAIL_SERVICE,
      useFactory: (configService: ConfigService) => {
        const useMock = configService.get('USE_MOCK_SERVICES') === 'true' || 
                       !configService.get('SMTP_HOST');
        return useMock 
          ? new MockEmailService() 
          : new NodemailerEmailService(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: SMS_SERVICE,
      useFactory: (configService: ConfigService) => {
        const useMock = configService.get('USE_MOCK_SERVICES') === 'fasle' || 
                       !configService.get('TWILIO_ACCOUNT_SID');
        return useMock 
          ? new MockSmsService() 
          : new TwilioSmsService(configService);
      },
      inject: [ConfigService],
    },

    // Messaging
    {
      provide: EVENT_PUBLISHER,
      useClass: RabbitMQEventPublisher,
    },
  ],
  exports: [
    SendNotificationUseCase,
    GetUserNotificationsUseCase,
    SendNotificationFromTemplateUseCase,
  ],
})
export class NotificationModule {}
