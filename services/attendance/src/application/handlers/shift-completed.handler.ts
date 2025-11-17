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
    const props = event.shift.get_props();
    const employeeId = props.employee_id ?? 0;
    const employeeCode = props.employee_code ?? '';
    const departmentId = props.department_id ?? 0;
    const shiftDate = props.shift_date ?? new Date();
    const workHours = props.work_hours ?? 0;
    const overtimeHours = props.overtime_hours ?? 0;
    const lateMinutes = props.late_minutes ?? 0;
    const earlyLeaveMinutes = props.early_leave_minutes ?? 0;
    const status = props.status ?? 'COMPLETED';

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
