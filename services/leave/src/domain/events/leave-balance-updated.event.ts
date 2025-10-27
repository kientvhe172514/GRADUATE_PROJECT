import { LeaveBalanceEntity } from '../entities/leave-balance.entity';

export class LeaveBalanceUpdatedEvent {
  constructor(
    public readonly balance: LeaveBalanceEntity,
  ) {}
}
