import { LeaveRecordEntity } from '../entities/leave-record.entity';

export class LeaveRequestedEvent {
  constructor(
    public readonly leaveRecord: LeaveRecordEntity,
  ) {}
}
