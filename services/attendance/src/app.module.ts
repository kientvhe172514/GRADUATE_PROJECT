import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WorkScheduleModule } from './application/work-schedule/work-schedule.module';
import { BeaconModule } from './application/beacon/beacon.module';
// import { AttendanceCheckModule } from './application/attendance-check/attendance-check.module';
// import { EmployeeShiftModule } from './application/employee-shift/employee-shift.module';
import { ViolationModule } from './application/violation/violation.module';
// import { PresenceVerificationModule } from './application/presence-verification/presence-verification.module';
import { OvertimeModule } from './application/overtime/overtime.module';
import { AttendanceEditLogModule } from './application/edit-log/edit-log.module';
import { ReportModule } from './application/report/report.module';
import { EmployeeEventListener } from './presentation/event-listeners/employee-event.listener';
import { LeaveEventListener } from './presentation/event-listeners/leave-event.listener';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    // AttendanceCheckModule, // TODO: Has dependencies on presence-verification
    // EmployeeShiftModule, // TODO: Check dependencies
    ViolationModule,
    // PresenceVerificationModule, // TODO: Fix fromDomain/toDomain in schemas
    OvertimeModule,
    AttendanceEditLogModule,
    ReportModule,
  ],
  controllers: [HealthController, EmployeeEventListener, LeaveEventListener],
})
export class AppModule {}
