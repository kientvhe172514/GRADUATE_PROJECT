import { Injectable, Inject } from '@nestjs/common';
import { EVENT_PUBLISHER } from '../tokens';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { LeaveApprovedEvent } from '../../domain/events/leave-approved.event';

@Injectable()
export class LeaveApprovedHandler {
  constructor(
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async handle(event: LeaveApprovedEvent): Promise<void> {
    // Publish event to notification service
    this.eventPublisher.publish('leave.approved', {
      leaveRecordId: event.leaveRecord.id,
      employeeId: event.leaveRecord.employee_id,
      employeeCode: event.leaveRecord.employee_code,
      leaveTypeId: event.leaveRecord.leave_type_id,
      startDate: event.leaveRecord.start_date,
      endDate: event.leaveRecord.end_date,
      totalLeaveDays: event.leaveRecord.total_leave_days,
      approvedBy: event.approvedBy,
      approvedAt: event.leaveRecord.approved_at,
    });
  }
}
