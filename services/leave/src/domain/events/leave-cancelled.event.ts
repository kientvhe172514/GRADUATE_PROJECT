import { LeaveRecordEntity } from '../entities/leave-record.entity';

export class LeaveCancelledEvent {
  constructor(
    public readonly leaveRecord: LeaveRecordEntity,
    public readonly reason?: string,
  ) {}
}
