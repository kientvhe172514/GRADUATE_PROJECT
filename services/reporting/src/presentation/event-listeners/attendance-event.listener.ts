import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AttendanceEventListener {
  constructor() {}

  @EventPattern('attendance.shift-completed')
  async handleShiftCompleted(@Payload() data: any) {
    console.log('Reporting Service received: attendance.shift-completed', data);
    // TODO: Sync attendance data to timesheet_entries table
    // Create or update timesheet entry for the completed shift
  }

  @EventPattern('attendance.checked')
  async handleAttendanceChecked(@Payload() data: any) {
    console.log('Reporting Service received: attendance.checked', data);
    // TODO: Update real-time attendance status
  }

  @EventPattern('attendance.violation-detected')
  async handleViolationDetected(@Payload() data: any) {
    console.log('Reporting Service received: attendance.violation-detected', data);
    // TODO: Track violations in reporting data
  }
}
