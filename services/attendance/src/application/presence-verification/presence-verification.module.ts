import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Schemas
import { PresenceVerificationRoundSchema } from '../../infrastructure/persistence/typeorm/presence-verification-round.schema';
import { GpsAnomalySchema } from '../../infrastructure/persistence/typeorm/gps-anomaly.schema';
import { EmployeeShiftSchema } from '../../infrastructure/persistence/typeorm/employee-shift.schema';

// Repositories
import { PostgresPresenceVerificationRepository } from '../../infrastructure/repositories/postgres-presence-verification.repository';
import { PostgresGpsAnomalyRepository } from '../../infrastructure/repositories/postgres-gps-anomaly.repository';
import { EmployeeShiftRepositoryAdapter } from '../../infrastructure/repositories/employee-shift-repository.adapter';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';

// Messaging
import { RabbitMQEventPublisher } from '../../infrastructure/messaging/rabbitmq-event-publisher';

// Use Cases
import { CapturePresenceVerificationUseCase } from './use-cases/capture-presence-verification.use-case';
import { GetVerificationScheduleUseCase } from './use-cases/get-verification-schedule.use-case';
import { ScheduleVerificationRemindersUseCase } from './use-cases/schedule-verification-reminders.use-case';

// Controllers
import { PresenceVerificationController } from '../../presentation/controllers/presence-verification.controller';

/**
 * Presence Verification Module
 *
 * Implements GPS-based presence verification system using Clean Architecture
 *
 * Features:
 * - GPS location capture during shifts (3 rounds per shift)
 * - Automatic anomaly detection (teleportation, spoofing, out of range)
 * - Scheduled reminders via cron job (every 5 minutes)
 * - Event-driven communication with other services
 *
 * Clean Architecture Layers:
 * - Domain: Entities (PresenceVerificationRound, GpsAnomaly) + Events
 * - Application: Use Cases + DTOs + Repository Ports
 * - Infrastructure: TypeORM Schemas + Postgres Repositories + RabbitMQ
 * - Presentation: REST Controllers
 */
@Module({
  imports: [
    // TypeORM entities
    TypeOrmModule.forFeature([
      PresenceVerificationRoundSchema,
      GpsAnomalySchema,
      EmployeeShiftSchema,
    ]),

    // Schedule module for cron jobs
    ScheduleModule.forRoot(),

    // RabbitMQ client for events
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: configService.getOrThrow<string>(
              'RABBITMQ_ATTENDANCE_QUEUE',
            ),
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      // ✅ Add NOTIFICATION_SERVICE for sending reminders
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: configService.getOrThrow<string>(
              'RABBITMQ_NOTIFICATION_QUEUE',
            ),
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],

  providers: [
    // Existing repository
    EmployeeShiftRepository,

    // Repositories (Infrastructure → Application Port)
    {
      provide: 'IPresenceVerificationRepository',
      useClass: PostgresPresenceVerificationRepository,
    },
    {
      provide: 'IGpsAnomalyRepository',
      useClass: PostgresGpsAnomalyRepository,
    },
    {
      provide: 'IEmployeeShiftRepository',
      useClass: EmployeeShiftRepositoryAdapter,
    },

    // Event Publisher (Infrastructure → Application Port)
    {
      provide: 'IEventPublisher',
      useClass: RabbitMQEventPublisher,
    },

    // Use Cases (Application Layer)
    CapturePresenceVerificationUseCase,
    GetVerificationScheduleUseCase,
    ScheduleVerificationRemindersUseCase,
  ],

  controllers: [PresenceVerificationController],

  exports: [
    CapturePresenceVerificationUseCase,
    GetVerificationScheduleUseCase,
    ScheduleVerificationRemindersUseCase,
  ],
})
export class PresenceVerificationModule {}
