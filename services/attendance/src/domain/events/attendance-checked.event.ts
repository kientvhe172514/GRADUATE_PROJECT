import { AttendanceCheckRecordEntity } from '../entities/attendance-check-record.entity';

export class AttendanceCheckedEvent {
  constructor(public readonly checkRecord: AttendanceCheckRecordEntity) {}
}
