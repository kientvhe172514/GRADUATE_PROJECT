import { LeaveRecordEntity } from '../entities/leave-record.entity';

export class LeaveRejectedEvent {
  constructor(
    public readonly leaveRecord: LeaveRecordEntity,
    public readonly rejectedBy: number,
    public readonly reason: string,
  ) {}
}
