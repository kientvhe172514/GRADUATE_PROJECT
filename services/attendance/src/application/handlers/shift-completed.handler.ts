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
    const shiftId = event.shift.id ?? 0;
    const employeeId = event.shift.employee_id ?? 0;
    const employeeCode = event.shift.employee_code ?? '';
    const departmentId = event.shift.department_id ?? 0;
    const shiftDate = event.shift.shift_date ?? new Date();
    const workHours = event.shift.work_hours ?? 0;
    const overtimeHours = event.shift.overtime_hours ?? 0;
    const lateMinutes = event.shift.late_minutes ?? 0;
    const earlyLeaveMinutes = event.shift.early_leave_minutes ?? 0;
    const status = event.shift.status ?? 'COMPLETED';

    await this.eventPublisher.publish('attendance.shift-completed', {
      shiftId,
      employeeId,
      employeeCode,
      departmentId,
      shiftDate,
      workHours,
      overtimeHours,
      lateMinutes,
      earlyLeaveMinutes,
      status,
    });
  }
}
