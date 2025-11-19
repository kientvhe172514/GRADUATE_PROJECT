import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeShiftSchema } from '../../infrastructure/persistence/typeorm/employee-shift.schema';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';
import { EmployeeShiftRepositoryAdapter } from '../../infrastructure/repositories/employee-shift-repository.adapter';
import { EMPLOYEE_SHIFT_REPOSITORY } from '../tokens';
import { GetEmployeeShiftsUseCase } from '../use-cases/employee-shift/get-employee-shifts.use-case';
import { GetShiftByIdUseCase } from '../use-cases/employee-shift/get-shift-by-id.use-case';
import { ManualEditShiftUseCase } from '../use-cases/employee-shift/manual-edit-shift.use-case';
import { EmployeeShiftController } from '../../presentation/controllers/employee-shift.controller';
import { AttendanceEditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeShiftSchema]),
    AttendanceEditLogModule,
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
  ],
  exports: [],
})
export class EmployeeShiftModule {}
