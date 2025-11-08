import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class EmployeeEventListener {
  constructor() {}

  @EventPattern('employee.created')
  handleEmployeeCreated(@Payload() data: any): void {
    console.log('Attendance Service received: employee.created', data);
    // TODO: Create default work schedule assignment for new employee
  }

  @EventPattern('employee.terminated')
  handleEmployeeTerminated(@Payload() data: any): void {
    console.log('Attendance Service received: employee.terminated', data);
    // TODO: Handle employee termination
    // Finalize pending shifts, cancel future schedules
  }

  @EventPattern('employee.department-changed')
  handleEmployeeDepartmentChanged(@Payload() data: any): void {
    console.log('Attendance Service received: employee.department-changed', data);
    // TODO: Update department info in attendance records and shifts
  }

  @EventPattern('employee.work-schedule-changed')
  handleWorkScheduleChanged(@Payload() data: any): void {
    console.log('Attendance Service received: employee.work-schedule-changed', data);
    // TODO: Update employee work schedule
  }
}
