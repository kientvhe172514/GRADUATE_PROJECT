import { AttendanceCheckRecordEntity } from '../entities/attendance-check-record.entity';

export class AttendanceAnomalyDetectedEvent {
  constructor(
    public readonly checkRecord: AttendanceCheckRecordEntity,
    public readonly anomalyType: string,
    public readonly severity: string,
  ) {}
}
