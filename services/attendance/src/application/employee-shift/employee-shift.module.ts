import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmployeeShiftSchema } from '../../infrastructure/persistence/typeorm/employee-shift.schema';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';
import { EmployeeShiftRepositoryAdapter } from '../../infrastructure/repositories/employee-shift-repository.adapter';
import { EMPLOYEE_SHIFT_REPOSITORY } from '../tokens';
import { GetEmployeeShiftsUseCase } from '../use-cases/employee-shift/get-employee-shifts.use-case';
import { GetShiftByIdUseCase } from '../use-cases/employee-shift/get-shift-by-id.use-case';
import { ManualEditShiftUseCase } from '../use-cases/employee-shift/manual-edit-shift.use-case';
import { GetEmployeeShiftCalendarUseCase } from '../use-cases/employee-shift/get-employee-shift-calendar.use-case';
import { EmployeeShiftController } from '../../presentation/controllers/employee-shift.controller';
import { AttendanceEditLogModule } from '../edit-log/edit-log.module';
import { WorkScheduleModule } from '../work-schedule/work-schedule.module';
import { EmployeeServiceClient } from '../../infrastructure/external-services/employee-service.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeShiftSchema]),
    AttendanceEditLogModule,
    WorkScheduleModule,
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
  controllers: [EmployeeShiftController],
  providers: [
    EmployeeShiftRepository,
    EmployeeShiftRepositoryAdapter,
    {
      provide: EMPLOYEE_SHIFT_REPOSITORY,
      useExisting: EmployeeShiftRepositoryAdapter,
    },
    GetEmployeeShiftsUseCase,
    GetShiftByIdUseCase,
    ManualEditShiftUseCase,
    GetEmployeeShiftCalendarUseCase,
    EmployeeServiceClient,
  ],
  exports: [],
})
export class EmployeeShiftModule {}
