import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class EmployeeEventListener {
  constructor() {}

  @EventPattern('employee.created')
  async handleEmployeeCreated(@Payload() data: any) {
    console.log('Leave Service received: employee.created', data);
    // TODO: Initialize leave balances for new employee
    // Create default leave balances based on leave types and employment start date
  }

  @EventPattern('employee.terminated')
  async handleEmployeeTerminated(@Payload() data: any) {
    console.log('Leave Service received: employee.terminated', data);
    // TODO: Handle employee termination
    // Cancel pending leave requests, finalize balances
  }

  @EventPattern('employee.department-changed')
  async handleEmployeeDepartmentChanged(@Payload() data: any) {
    console.log('Leave Service received: employee.department-changed', data);
    // TODO: Update department info in leave records
  }
}
