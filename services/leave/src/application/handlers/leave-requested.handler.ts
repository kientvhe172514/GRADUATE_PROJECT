import { Injectable, Inject } from '@nestjs/common';
import { EVENT_PUBLISHER } from '../tokens';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { LeaveRequestedEvent } from '../../domain/events/leave-requested.event';

@Injectable()
export class LeaveRequestedHandler {
  constructor(
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async handle(event: LeaveRequestedEvent): Promise<void> {
    // Publish event to notification service
    this.eventPublisher.publish('leave.requested', {
      leaveRecordId: event.leaveRecord.id,
      employeeId: event.leaveRecord.employee_id,
      employeeCode: event.leaveRecord.employee_code,
      leaveTypeId: event.leaveRecord.leave_type_id,
      startDate: event.leaveRecord.start_date,
      endDate: event.leaveRecord.end_date,
      totalLeaveDays: event.leaveRecord.total_leave_days,
      reason: event.leaveRecord.reason,
      status: event.leaveRecord.status,
      requestedAt: event.leaveRecord.requested_at,
    });
  }
}
