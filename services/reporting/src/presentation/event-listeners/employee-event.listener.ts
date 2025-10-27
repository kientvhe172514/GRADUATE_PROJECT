import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class EmployeeEventListener {
  constructor() {}

  @EventPattern('employee.created')
  async handleEmployeeCreated(@Payload() data: any) {
    console.log('Reporting Service received: employee.created', data);
    // TODO: Initialize reporting data for new employee
  }

  @EventPattern('employee.terminated')
  async handleEmployeeTerminated(@Payload() data: any) {
    console.log('Reporting Service received: employee.terminated', data);
    // TODO: Generate final reports for terminated employee
  }

  @EventPattern('employee.department-changed')
  async handleEmployeeDepartmentChanged(@Payload() data: any) {
    console.log('Reporting Service received: employee.department-changed', data);
    // TODO: Update department info in reporting data
  }
}
