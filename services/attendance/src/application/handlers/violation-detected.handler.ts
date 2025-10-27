import { Injectable, Inject } from '@nestjs/common';
import { EVENT_PUBLISHER } from '../tokens';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { ViolationDetectedEvent } from '../../domain/events/violation-detected.event';

@Injectable()
export class ViolationDetectedHandler {
  constructor(
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async handle(event: ViolationDetectedEvent): Promise<void> {
    // Publish event to notification service for alerts
    this.eventPublisher.publish('attendance.violation-detected', {
      violationId: event.violation.id,
      employeeId: event.violation.employee_id,
      shiftId: event.violation.shift_id,
      violationType: event.violation.violation_type,
      severity: event.violation.severity,
      description: event.violation.description,
      detectedAt: event.violation.detected_at,
    });
  }
}
