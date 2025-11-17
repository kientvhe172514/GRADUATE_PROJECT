import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceEditLogSchema } from '../../infrastructure/persistence/typeorm/attendance-edit-log.schema';
import { AttendanceEditLogRepository } from '../../infrastructure/repositories/attendance-edit-log.repository';
import { AttendanceEditLogController } from '../../presentation/controllers/attendance-edit-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceEditLogSchema])],
  controllers: [AttendanceEditLogController],
  providers: [AttendanceEditLogRepository],
  exports: [AttendanceEditLogRepository],
})
export class AttendanceEditLogModule {}
