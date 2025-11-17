import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeShiftSchema } from '../../infrastructure/persistence/typeorm/employee-shift.schema';
import { ViolationSchema } from '../../infrastructure/persistence/typeorm/violation.schema';
import { OvertimeRequestSchema } from '../../infrastructure/persistence/typeorm/overtime-request.schema';
import { ReportController } from '../../presentation/controllers/report.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeShiftSchema,
      ViolationSchema,
      OvertimeRequestSchema,
    ]),
  ],
  controllers: [ReportController],
  providers: [],
  exports: [],
})
export class ReportModule {}
