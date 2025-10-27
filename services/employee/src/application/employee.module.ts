import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmployeeController } from '../presentation/controllers/employee.controller';
import { PositionController } from '../presentation/controllers/position.controller';
import { AccountCreatedListener } from '../presentation/event-listeners/account-created.listener';  // Add
import { CreateEmployeeUseCase } from './use-cases/create-employee.use-case';
import { GetEmployeeDetailUseCase } from './use-cases/get-employee-detail.use-case';
import { UpdateEmployeeUseCase } from './use-cases/update-employee.use-case';
import { AssignRoleUseCase } from './use-cases/assign-role.use-case';
import { GetAllPositionsUseCase } from './use-cases/get-all-positions.use-case';
import { GetPositionByIdUseCase } from './use-cases/get-position-by-id.use-case';
import { CreatePositionUseCase } from './use-cases/create-position.use-case';
import { UpdatePositionUseCase } from './use-cases/update-position.use-case';
import { DeletePositionUseCase } from './use-cases/delete-position.use-case';
import { PostgresEmployeeRepository } from '../infrastructure/persistence/repositories/postgres-employee.repository';
import { PostgresPositionRepository } from '../infrastructure/persistence/repositories/postgres-position.repository';
import { RabbitMQEventPublisher } from '../infrastructure/messaging/rabbitmq-event.publisher';
import { RabbitMQEventSubscriber } from '../infrastructure/messaging/rabbitmq-event.subscriber';  
import { AccountCreatedHandler } from './handlers/account-created.handler';
import { EmployeeSchema } from '../infrastructure/persistence/typeorm/employee.schema';
import { PositionSchema } from '../infrastructure/persistence/typeorm/position.schema';
import { DepartmentSchema } from '../infrastructure/persistence/typeorm/department.schema';
import { EmployeeOnboardingStepSchema } from '../infrastructure/persistence/typeorm/employee-onboarding-step.schema';
import { EMPLOYEE_REPOSITORY, POSITION_REPOSITORY, EVENT_PUBLISHER, DEPARTMENT_REPOSITORY, ONBOARDING_STEP_REPOSITORY } from './tokens';
import { DepartmentController } from '../presentation/controllers/department.controller';
import { GetEmployeesUseCase } from './use-cases/get-employees.use-case';
import { TerminateEmployeeUseCase } from './use-cases/terminate-employee.use-case';
import { GetOnboardingStepsUseCase } from './use-cases/get-onboarding-steps.use-case';
import { UpdateOnboardingStepUseCase } from './use-cases/update-onboarding-step.use-case';
import { CreateDepartmentUseCase } from './use-cases/create-department.use-case';
import { UpdateDepartmentUseCase } from './use-cases/update-department.use-case';
import { GetDepartmentDetailUseCase } from './use-cases/get-department-detail.use-case';
import { PostgresDepartmentRepository } from '../infrastructure/persistence/repositories/postgres-department.repository';
import { PostgresOnboardingStepRepository } from '../infrastructure/persistence/repositories/postgres-onboarding-step.repository';
import { DeleteDepartmentUseCase } from './use-cases/delete-department.use-case';
import { GetDepartmentsUseCase } from './use-cases/get-departments.use-case';

@Module({
  imports: [
  TypeOrmModule.forFeature([EmployeeSchema, PositionSchema, DepartmentSchema, EmployeeOnboardingStepSchema]),
    ClientsModule.registerAsync([
      {
        name: 'IAM_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')!],
            queue: configService.get<string>('RABBITMQ_IAM_QUEUE')!,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [EmployeeController, DepartmentController, PositionController, AccountCreatedListener],  
  providers: [
    // Use cases
    CreateEmployeeUseCase,
    GetEmployeeDetailUseCase,
    UpdateEmployeeUseCase,
    GetEmployeesUseCase,
    TerminateEmployeeUseCase,
    GetOnboardingStepsUseCase,
    UpdateOnboardingStepUseCase,
    CreateDepartmentUseCase,
    UpdateDepartmentUseCase,
    GetDepartmentDetailUseCase,
    GetDepartmentsUseCase,
    DeleteDepartmentUseCase,
    GetAllPositionsUseCase,
    GetPositionByIdUseCase,
    CreatePositionUseCase,
    UpdatePositionUseCase,
    DeletePositionUseCase,
    AccountCreatedHandler,

    // Infrastructure
    RabbitMQEventSubscriber,
    
    // Repository providers
    {
      provide: EMPLOYEE_REPOSITORY,
      useClass: PostgresEmployeeRepository,
    },
    {
      provide: DEPARTMENT_REPOSITORY,
      useClass: PostgresDepartmentRepository,
    },
    {
      provide: ONBOARDING_STEP_REPOSITORY,
      useClass: PostgresOnboardingStepRepository,
    },
    {
      provide: POSITION_REPOSITORY,
      useClass: PostgresPositionRepository,
    },
    {
      provide: EVENT_PUBLISHER,
      useClass: RabbitMQEventPublisher,
    },
  ],
})
export class EmployeeModule {}