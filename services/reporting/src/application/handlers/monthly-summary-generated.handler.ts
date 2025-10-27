import { Injectable, Inject } from '@nestjs/common';
import { EVENT_PUBLISHER } from '../tokens';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { MonthlySummaryGeneratedEvent } from '../../domain/events/monthly-summary-generated.event';

@Injectable()
export class MonthlySummaryGeneratedHandler {
  constructor(
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async handle(event: MonthlySummaryGeneratedEvent): Promise<void> {
    // Publish event for notification or other services
    this.eventPublisher.publish('reporting.monthly-summary-generated', {
      summaryId: event.summary.id,
      employeeId: event.summary.employee_id,
      year: event.summary.year,
      month: event.summary.month,
      totalWorkDays: event.summary.total_work_days,
      actualWorkDays: event.summary.actual_work_days,
      attendanceRate: event.summary.attendance_rate,
      generatedAt: event.summary.generated_at,
    });
  }
}
