import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRecordSchema } from '../../infrastructure/persistence/typeorm/leave-record.schema';
import { PostgresLeaveRecordRepository } from '../../infrastructure/persistence/repositories/postgres-leave-record.repository';
import { LEAVE_RECORD_REPOSITORY } from '../tokens';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveRecordSchema])],
  controllers: [],
  providers: [
    {
      provide: LEAVE_RECORD_REPOSITORY,
      useClass: PostgresLeaveRecordRepository,
    },
  ],
  exports: [LEAVE_RECORD_REPOSITORY],
})
export class LeaveRecordModule {}
