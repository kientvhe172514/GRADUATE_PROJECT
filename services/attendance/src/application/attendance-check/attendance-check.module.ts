import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AttendanceCheckController } from '../../presentation/controllers/attendance-check.controller';
import { AttendanceCheckRecordSchema } from '../../infrastructure/persistence/typeorm/attendance-check-record.schema';
import { EmployeeShiftSchema } from '../../infrastructure/persistence/typeorm/employee-shift.schema';
import { BeaconSchema } from '../../infrastructure/persistence/typeorm/beacon.schema';
import { AttendanceCheckRepository } from '../../infrastructure/persistence/repositories/attendance-check.repository';
import { EmployeeShiftRepository } from '../../infrastructure/persistence/repositories/employee-shift.repository';
import { BeaconRepository } from '../../infrastructure/persistence/repositories/beacon.repository';
import { ValidateBeaconUseCase } from './validate-beacon.use-case';
import { ValidateGpsUseCase } from './validate-gps.use-case';
import { RequestFaceVerificationUseCase } from './request-face-verification.use-case';
import { ProcessFaceVerificationResultUseCase } from './process-face-verification-result.use-case';
import { UpdateEmployeeShiftUseCase } from '../employee-shift/update-employee-shift.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceCheckRecordSchema,
      EmployeeShiftSchema,
      BeaconSchema,
    ]),
    ConfigModule,
  ],
  controllers: [AttendanceCheckController],
  providers: [
    // Repositories
    AttendanceCheckRepository,
    EmployeeShiftRepository,
    BeaconRepository,
    // Use Cases
    ValidateBeaconUseCase,
    ValidateGpsUseCase,
    UpdateEmployeeShiftUseCase,
    RequestFaceVerificationUseCase,
    ProcessFaceVerificationResultUseCase,
  ],
  exports: [
    AttendanceCheckRepository,
    EmployeeShiftRepository,
    BeaconRepository,
    ValidateBeaconUseCase,
    ValidateGpsUseCase,
    UpdateEmployeeShiftUseCase,
    RequestFaceVerificationUseCase,
    ProcessFaceVerificationResultUseCase,
  ],
})
export class AttendanceCheckModule {}
