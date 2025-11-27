import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { HeaderBasedPermissionGuard } from '@graduate-project/shared-common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { CheckMissingAttendanceProcessor } from './infrastructure/cron/check-missing-attendance.processor';
import { ScheduledGpsCheckProcessor } from './infrastructure/cron/scheduled-gps-check.processor';
import { WeeklyShiftGeneratorProcessor } from './infrastructure/cron/weekly-shift-generator.processor';
import { EndOfDayAbsentMarkerProcessor } from './infrastructure/cron/end-of-day-absent-marker.processor';
import { AttendanceReconciliationProcessor } from './infrastructure/cron/attendance-reconciliation.processor';
import { WorkScheduleModule } from './application/work-schedule/work-schedule.module';
import { BeaconModule } from './application/beacon/beacon.module';
import { AttendanceCheckModule } from './application/attendance-check/attendance-check.module';
import { EmployeeShiftModule } from './application/employee-shift/employee-shift.module';
import { ViolationModule } from './application/violation/violation.module';
import { PresenceVerificationModule } from './application/presence-verification/presence-verification.module';
import { OvertimeModule } from './application/overtime/overtime.module';
import { AttendanceEditLogModule } from './application/edit-log/edit-log.module';
import { ReportModule } from './application/report/report.module';
import { GpsCheckConfigModule } from './application/gps-check-config/gps-check-config.module';
import { EmployeeEventListener } from './presentation/event-listeners/employee-event.listener';
import { LeaveEventListener } from './presentation/event-listeners/leave-event.listener';
import { FaceVerificationResultConsumer } from './presentation/consumers/face-verification-result.consumer';
import { HealthController } from './health.controller';
import { GpsController } from './presentation/controllers/gps.controller';
import { CronTestController } from './presentation/controllers/cron-test.controller';
import { GpsCheckConfigController } from './presentation/controllers/gps-check-config.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your_secret_key_here'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [
          __dirname +
            '/infrastructure/persistence/typeorm/**/*.schema{.ts,.js}',
        ],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: 'EMPLOYEE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.getOrThrow<string>('RABBITMQ_URL');
          const employeeQueue = configService.getOrThrow<string>(
            'RABBITMQ_EMPLOYEE_QUEUE',
          );
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
          const rabbitmqUrl = configService.getOrThrow<string>('RABBITMQ_URL');
          const notificationQueue = configService.getOrThrow<string>(
            'RABBITMQ_NOTIFICATION_QUEUE',
          );
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
      {
        name: 'FACE_RECOGNITION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.getOrThrow<string>('RABBITMQ_URL');
          const faceRecognitionQueue =
            configService.get<string>('RABBITMQ_FACE_RECOGNITION_QUEUE') ||
            'face_recognition_queue';
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl] as string[],
              queue: faceRecognitionQueue,
              queueOptions: {
                durable: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
    WorkScheduleModule,
    BeaconModule,
    AttendanceCheckModule,
    EmployeeShiftModule,
    ViolationModule,
    PresenceVerificationModule,
    OvertimeModule,
    AttendanceEditLogModule,
    ReportModule,
    GpsCheckConfigModule,
  ],
  controllers: [
    HealthController,
    GpsController,
    CronTestController,
    GpsCheckConfigController,
    EmployeeEventListener,
    LeaveEventListener,
    FaceVerificationResultConsumer,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, jwtService: JwtService) => {
        return new HeaderBasedPermissionGuard(reflector, jwtService);
      },
      inject: [Reflector, JwtService],
    },
    CheckMissingAttendanceProcessor,
    ScheduledGpsCheckProcessor,
    WeeklyShiftGeneratorProcessor,
    EndOfDayAbsentMarkerProcessor,
    AttendanceReconciliationProcessor,
  ],
})
export class AppModule {}
