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
    const recordId = event.checkRecord.id ?? 0;
    const employeeId = event.checkRecord.employee_id ?? 0;
    const employeeCode = event.checkRecord.employee_code ?? '';
    const departmentId = event.checkRecord.department_id ?? 0;
    const checkType = event.checkRecord.check_type ?? 'CHECK_IN';
    const checkTimestamp = event.checkRecord.check_timestamp ?? new Date();
    const isValid = event.checkRecord.is_valid ?? false;
    const beaconValidated = event.checkRecord.beacon_validated ?? false;
    const gpsValidated = event.checkRecord.gps_validated ?? false;
    const faceVerified = event.checkRecord.face_verified ?? false;

    await this.eventPublisher.publish('attendance.checked', {
      recordId,
      employeeId,
      employeeCode,
      departmentId,
      checkType,
      checkTimestamp,
      isValid,
      beaconValidated,
      gpsValidated,
      faceVerified,
    });
  }
}
