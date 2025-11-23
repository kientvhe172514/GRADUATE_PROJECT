import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DashboardController } from '../../presentation/controllers/dashboard.controller';
import { GetHighlightReportUseCase } from './use-cases/get-highlight-report.use-case';
import { GetHighlightDetailUseCase } from './use-cases/get-highlight-detail.use-case';
import { GetHRDashboardUseCase } from './use-cases/get-hr-dashboard.use-case';
import { GetAdminDashboardUseCase } from './use-cases/get-admin-dashboard.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Add schemas if needed
    ]),
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
  controllers: [DashboardController],
  providers: [
    GetHighlightReportUseCase,
    GetHighlightDetailUseCase,
    GetHRDashboardUseCase,
    GetAdminDashboardUseCase,
  ],
  exports: [
    GetHighlightReportUseCase,
    GetHighlightDetailUseCase,
    GetHRDashboardUseCase,
    GetAdminDashboardUseCase,
  ],
})
export class DashboardModule {}
