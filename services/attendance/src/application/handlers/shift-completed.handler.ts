import { Injectable, Inject } from '@nestjs/common';
import { EVENT_PUBLISHER } from '../tokens';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { ShiftCompletedEvent } from '../../domain/events/shift-completed.event';

@Injectable()
export class ShiftCompletedHandler {
  constructor(
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async handle(event: ShiftCompletedEvent): Promise<void> {
    // Publish event to reporting service for timesheet sync
    this.eventPublisher.publish('attendance.shift-completed', {
      shiftId: event.shift.id,
      employeeId: event.shift.employee_id,
      employeeCode: event.shift.employee_code,
      departmentId: event.shift.department_id,
      shiftDate: event.shift.shift_date,
      workHours: event.shift.work_hours,
      overtimeHours: event.shift.overtime_hours,
      lateMinutes: event.shift.late_minutes,
      earlyLeaveMinutes: event.shift.early_leave_minutes,
      status: event.shift.status,
    });
  }
}
