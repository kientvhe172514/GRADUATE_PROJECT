import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkScheduleSchema } from '../../infrastructure/persistence/typeorm/work-schedule.schema';
import { EmployeeWorkScheduleSchema } from '../../infrastructure/persistence/typeorm/employee-work-schedule.schema';
import { EmployeeShiftSchema } from '../../infrastructure/persistence/typeorm/employee-shift.schema';
import { WorkScheduleController } from '../../presentation/controllers/work-schedule.controller';
import { CreateWorkScheduleUseCase } from '../use-cases/work-schedule/create-work-schedule.use-case';
import { UpdateWorkScheduleUseCase } from '../use-cases/work-schedule/update-work-schedule.use-case';
import { ListWorkSchedulesUseCase } from '../use-cases/work-schedule/list-work-schedules.use-case';
import { GetWorkScheduleByIdUseCase } from '../use-cases/work-schedule/get-work-schedule-by-id.use-case';
import { DeleteWorkScheduleUseCase } from '../use-cases/work-schedule/delete-work-schedule.use-case';
import { AssignScheduleToEmployeesUseCase } from '../use-cases/work-schedule/assign-schedule-to-employees.use-case';
import { RemoveScheduleAssignmentUseCase } from '../use-cases/work-schedule/remove-schedule-assignment.use-case';
import { UpdateScheduleAssignmentUseCase } from '../use-cases/work-schedule/update-schedule-assignment.use-case';
import { DeleteEmployeeShiftUseCase } from '../use-cases/work-schedule/delete-employee-shift.use-case';
import { AddScheduleOverrideUseCase } from '../use-cases/work-schedule/add-schedule-override.use-case';
import { ListScheduleOverridesUseCase } from '../use-cases/work-schedule/list-schedule-overrides.use-case';
import { RemoveScheduleOverrideUseCase } from '../use-cases/work-schedule/remove-schedule-override.use-case';
import { ProcessScheduleOverridesUseCase } from '../use-cases/work-schedule/process-schedule-overrides.use-case';
import {
  TypeOrmWorkScheduleRepository,
  TypeOrmEmployeeWorkScheduleRepository,
} from '../../infrastructure/repositories/typeorm-work-schedule.repository';
import {
  WORK_SCHEDULE_REPOSITORY,
  EMPLOYEE_WORK_SCHEDULE_REPOSITORY,
} from '../tokens';
import { ShiftGeneratorService } from '../services/shift-generator.service';
import { ProcessOnLeaveOverrideService } from '../services/process-on-leave-override.service';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';
import { GpsCheckConfigModule } from '../gps-check-config/gps-check-config.module';
import { EmployeeServiceClient } from '../../infrastructure/external-services/employee-service.client';
import { HolidayServiceClient } from '../../infrastructure/external-services/holiday-service.client';
import { HolidayEventListener } from '../listeners/holiday-event.listener';
import { LeaveApprovedEventListener } from '../listeners/leave-approved-event.listener';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMqEventPublisher } from '../../infrastructure/messaging/rabbit-mq-event-publisher';
import { IEventPublisher } from '../ports/event-publisher.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkScheduleSchema,
      EmployeeWorkScheduleSchema,
      EmployeeShiftSchema,
    ]),
    GpsCheckConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'EMPLOYEE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')!],
            queue: configService.get<string>('RABBITMQ_EMPLOYEE_QUEUE')!,
            queueOptions: { durable: true },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'LEAVE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')!],
            queue: configService.get<string>('RABBITMQ_LEAVE_QUEUE')!,
            queueOptions: { durable: true },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')!],
            queue: configService.get<string>('RABBITMQ_NOTIFICATION_QUEUE')!,
            queueOptions: { durable: true },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [WorkScheduleController],
  providers: [
    // Use Cases
    CreateWorkScheduleUseCase,
    UpdateWorkScheduleUseCase,
    ListWorkSchedulesUseCase,
    GetWorkScheduleByIdUseCase,
    DeleteWorkScheduleUseCase,
    AssignScheduleToEmployeesUseCase,
    RemoveScheduleAssignmentUseCase,
    UpdateScheduleAssignmentUseCase,
    DeleteEmployeeShiftUseCase,
    AddScheduleOverrideUseCase,
    ListScheduleOverridesUseCase,
    RemoveScheduleOverrideUseCase,
    ProcessScheduleOverridesUseCase,

    // Services
    ShiftGeneratorService,
    ProcessOnLeaveOverrideService,
    EmployeeShiftRepository,
    EmployeeServiceClient,
    HolidayServiceClient,

    // Listeners
    HolidayEventListener,
    LeaveApprovedEventListener,

    // Event Publisher
    {
      provide: 'IEventPublisher',
      useClass: RabbitMqEventPublisher,
    },

    // Repositories
    {
      provide: WORK_SCHEDULE_REPOSITORY,
      useClass: TypeOrmWorkScheduleRepository,
    },
    {
      provide: EMPLOYEE_WORK_SCHEDULE_REPOSITORY,
      useClass: TypeOrmEmployeeWorkScheduleRepository,
    },
  ],
  exports: [
    WORK_SCHEDULE_REPOSITORY,
    EMPLOYEE_WORK_SCHEDULE_REPOSITORY,
    ShiftGeneratorService,
  ],
})
export class WorkScheduleModule { }
