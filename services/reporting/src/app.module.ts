import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TimesheetEntryModule } from './application/timesheet-entry/timesheet-entry.module';
import { MonthlySummaryModule } from './application/monthly-summary/monthly-summary.module';
import { ReportTemplateModule } from './application/report-template/report-template.module';
import { ExportBatchModule } from './application/export-batch/export-batch.module';
import { AttendanceEventListener } from './presentation/event-listeners/attendance-event.listener';
import { LeaveEventListener } from './presentation/event-listeners/leave-event.listener';
import { EmployeeEventListener } from './presentation/event-listeners/employee-event.listener';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [__dirname + '/infrastructure/persistence/typeorm/**/*.schema{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: 'ATTENDANCE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.getOrThrow<string>('RABBITMQ_URL') as string;
          const attendanceQueue = configService.getOrThrow<string>('RABBITMQ_ATTENDANCE_QUEUE') as string;
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl] as string[],
              queue: attendanceQueue,
              queueOptions: {
                durable: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
      {
        name: 'LEAVE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.getOrThrow<string>('RABBITMQ_URL') as string;
          const leaveQueue = configService.getOrThrow<string>('RABBITMQ_LEAVE_QUEUE') as string;
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl] as string[],
              queue: leaveQueue,
              queueOptions: {
                durable: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
    TimesheetEntryModule,
    MonthlySummaryModule,
    ReportTemplateModule,
    ExportBatchModule,
  ],
  controllers: [HealthController, AttendanceEventListener, LeaveEventListener, EmployeeEventListener],
})
export class AppModule {}
