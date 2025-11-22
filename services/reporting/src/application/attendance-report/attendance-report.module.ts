import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AttendanceReportController } from '../../presentation/controllers/attendance-report.controller';
import { GetEmployeesAttendanceReportUseCase } from './use-cases/get-employees-attendance-report.use-case';
import { GetEmployeeAttendanceReportUseCase } from './use-cases/get-employee-attendance-report.use-case';

@Module({
  imports: [
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
  ],
  controllers: [AttendanceReportController],
  providers: [
    GetEmployeesAttendanceReportUseCase,
    GetEmployeeAttendanceReportUseCase,
  ],
  exports: [
    GetEmployeesAttendanceReportUseCase,
    GetEmployeeAttendanceReportUseCase,
  ],
})
export class AttendanceReportModule {}
