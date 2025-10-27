import { Injectable, Inject } from '@nestjs/common';
import { EVENT_PUBLISHER } from '../tokens';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { AttendanceCheckedEvent } from '../../domain/events/attendance-checked.event';

@Injectable()
export class AttendanceCheckedHandler {
  constructor(
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async handle(event: AttendanceCheckedEvent): Promise<void> {
    // Publish event to notification service and employee service
    this.eventPublisher.publish('attendance.checked', {
      recordId: event.checkRecord.id,
      employeeId: event.checkRecord.employee_id,
      employeeCode: event.checkRecord.employee_code,
      departmentId: event.checkRecord.department_id,
      checkType: event.checkRecord.check_type,
      checkTimestamp: event.checkRecord.check_timestamp,
      isValid: event.checkRecord.is_valid,
      beaconValidated: event.checkRecord.beacon_validated,
      gpsValidated: event.checkRecord.gps_validated,
      faceVerified: event.checkRecord.face_verified,
    });
  }
}
