import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class LeaveEventListener {
  constructor() {}

  @EventPattern('leave.approved')
  handleLeaveApproved(@Payload() data: any): void {
    console.log('Attendance Service received: leave.approved', data);
    // TODO: Mark shifts as ON_LEAVE for the approved leave period
    // Update shift status for dates in the leave range
  }

  @EventPattern('leave.cancelled')
  handleLeaveCancelled(@Payload() data: any): void {
    console.log('Attendance Service received: leave.cancelled', data);
    // TODO: Revert shifts back to SCHEDULED status
  }
}
