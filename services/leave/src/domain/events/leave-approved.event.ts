import { LeaveRecordEntity } from '../entities/leave-record.entity';

export class LeaveApprovedEvent {
  constructor(
    public readonly leaveRecord: LeaveRecordEntity,
    public readonly approvedBy: number,
  ) {}
}
