import { Injectable, Inject } from '@nestjs/common';
import { EVENT_PUBLISHER } from '../tokens';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { TimesheetSyncedEvent } from '../../domain/events/timesheet-synced.event';

@Injectable()
export class TimesheetSyncedHandler {
  constructor(
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async handle(event: TimesheetSyncedEvent): Promise<void> {
    // Publish event for analytics or other services
    this.eventPublisher.publish('reporting.timesheet-synced', {
      entryId: event.entry.id,
      employeeId: event.entry.employee_id,
      employeeCode: event.entry.employee_code,
      departmentId: event.entry.department_id,
      entryDate: event.entry.entry_date,
      workHours: event.entry.work_hours,
      syncedAt: event.entry.synced_at,
    });
  }
}
