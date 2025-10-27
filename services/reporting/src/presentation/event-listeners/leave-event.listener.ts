import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class LeaveEventListener {
  constructor() {}

  @EventPattern('leave.approved')
  async handleLeaveApproved(@Payload() data: any) {
    console.log('Reporting Service received: leave.approved', data);
    // TODO: Update timesheet entries with leave data
    // Mark affected dates as leave in timesheet
  }

  @EventPattern('leave.requested')
  async handleLeaveRequested(@Payload() data: any) {
    console.log('Reporting Service received: leave.requested', data);
    // TODO: Track pending leave requests in reports
  }

  @EventPattern('leave.balance-updated')
  async handleLeaveBalanceUpdated(@Payload() data: any) {
    console.log('Reporting Service received: leave.balance-updated', data);
    // TODO: Sync leave balance data for reporting
  }
}
