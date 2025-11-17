import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkScheduleSchema, EmployeeWorkScheduleSchema } from '../../infrastructure/persistence/typeorm/work-schedule.schema';
import { WorkScheduleController } from '../../presentation/controllers/work-schedule.controller';
import { CreateWorkScheduleUseCase } from '../use-cases/work-schedule/create-work-schedule.use-case';
import { UpdateWorkScheduleUseCase } from '../use-cases/work-schedule/update-work-schedule.use-case';
import { ListWorkSchedulesUseCase } from '../use-cases/work-schedule/list-work-schedules.use-case';
import { GetWorkScheduleByIdUseCase } from '../use-cases/work-schedule/get-work-schedule-by-id.use-case';
import { DeleteWorkScheduleUseCase } from '../use-cases/work-schedule/delete-work-schedule.use-case';
import { AssignScheduleToEmployeesUseCase } from '../use-cases/work-schedule/assign-schedule-to-employees.use-case';
import { TypeOrmWorkScheduleRepository, TypeOrmEmployeeWorkScheduleRepository } from '../../infrastructure/repositories/typeorm-work-schedule.repository';
import { WORK_SCHEDULE_REPOSITORY, EMPLOYEE_WORK_SCHEDULE_REPOSITORY } from '../../application/tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkScheduleSchema, EmployeeWorkScheduleSchema]),
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
})
export class WorkScheduleModule {}
