import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { EmployeePositionAssignedHandler } from '../../application/handlers/employee-position-assigned.handler';

@Controller()
export class EmployeePositionAssignedListener {
  constructor(private readonly handler: EmployeePositionAssignedHandler) {}

  @EventPattern('employee_position_assigned')
  async handleEmployeePositionAssigned(event: any): Promise<void> {
    await this.handler.handle(event);
  }
}
