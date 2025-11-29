import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { EmployeePositionRemovedHandler } from '../../application/handlers/employee-position-removed.handler';

@Controller()
export class EmployeePositionRemovedListener {
  constructor(private readonly handler: EmployeePositionRemovedHandler) {}

  @EventPattern('employee_position_removed')
  async handleEmployeePositionRemoved(event: any): Promise<void> {
    await this.handler.handle(event);
  }
}
