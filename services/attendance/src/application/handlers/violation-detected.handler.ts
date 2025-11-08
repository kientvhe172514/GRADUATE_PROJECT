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
    const violationId = event.violation.id ?? 0;
    const employeeId = event.violation.employee_id ?? 0;
    const shiftId = event.violation.shift_id ?? 0;
    const violationType = event.violation.violation_type ?? 'OTHER';
    const severity = event.violation.severity ?? 'LOW';
    const description = event.violation.description ?? '';
    const detectedAt = event.violation.detected_at ?? new Date();

    await this.eventPublisher.publish('attendance.violation-detected', {
      violationId,
      employeeId,
      shiftId,
      violationType,
      severity,
      description,
      detectedAt,
    });
  }
}
