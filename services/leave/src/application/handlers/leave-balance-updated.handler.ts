import { Injectable, Inject } from '@nestjs/common';
import { EVENT_PUBLISHER } from '../tokens';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { LeaveBalanceUpdatedEvent } from '../../domain/events/leave-balance-updated.event';

@Injectable()
export class LeaveBalanceUpdatedHandler {
  constructor(
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async handle(event: LeaveBalanceUpdatedEvent): Promise<void> {
    // Publish event to employee service for sync
    this.eventPublisher.publish('leave.balance-updated', {
      employeeId: event.balance.employee_id,
      leaveTypeId: event.balance.leave_type_id,
      year: event.balance.year,
      totalDays: event.balance.total_days,
      usedDays: event.balance.used_days,
      remainingDays: event.balance.remaining_days,
      updatedAt: event.balance.updated_at,
    });
  }
}
