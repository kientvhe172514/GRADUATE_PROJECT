import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OvertimeRequestSchema } from '../../infrastructure/persistence/typeorm/overtime-request.schema';
import { EmployeeShiftSchema } from '../../infrastructure/persistence/typeorm/employee-shift.schema';
import { OvertimeRequestRepository } from '../../infrastructure/repositories/overtime-request.repository';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';
import { OvertimeRequestController } from '../../presentation/controllers/overtime-request.controller';
import { CreateOvertimeRequestUseCase } from '../use-cases/overtime/create-overtime-request.use-case';
import { GetMyOvertimeRequestsUseCase } from '../use-cases/overtime/get-my-overtime-requests.use-case';
import { ListOvertimeRequestsUseCase } from '../use-cases/overtime/list-overtime-requests.use-case';
import { GetPendingOvertimeRequestsUseCase } from '../use-cases/overtime/get-pending-overtime-requests.use-case';
import { GetOvertimeRequestByIdUseCase } from '../use-cases/overtime/get-overtime-request-by-id.use-case';
import { UpdateOvertimeRequestUseCase } from '../use-cases/overtime/update-overtime-request.use-case';
import { ApproveOvertimeRequestUseCase } from '../use-cases/overtime/approve-overtime-request.use-case';
import { RejectOvertimeRequestUseCase } from '../use-cases/overtime/reject-overtime-request.use-case';
import { CancelOvertimeRequestUseCase } from '../use-cases/overtime/cancel-overtime-request.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([OvertimeRequestSchema, EmployeeShiftSchema]),
    ClientsModule.registerAsync([
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
              urls: [rabbitmqUrl],
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
              urls: [rabbitmqUrl],
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
  controllers: [OvertimeRequestController],
  providers: [
    OvertimeRequestRepository,
    EmployeeShiftRepository,
    CreateOvertimeRequestUseCase,
    GetMyOvertimeRequestsUseCase,
    ListOvertimeRequestsUseCase,
    GetPendingOvertimeRequestsUseCase,
    GetOvertimeRequestByIdUseCase,
    UpdateOvertimeRequestUseCase,
    ApproveOvertimeRequestUseCase,
    RejectOvertimeRequestUseCase,
    CancelOvertimeRequestUseCase,
  ],
  exports: [OvertimeRequestRepository],
})
export class OvertimeModule {}
