import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { EmployeeUpdatedHandler } from '../../application/handlers/employee-updated.handler';

@Controller()
export class EmployeeUpdatedListener {
  constructor(private readonly handler: EmployeeUpdatedHandler) {}

  @EventPattern('employee_updated')
  async handleEmployeeUpdated(event: any): Promise<void> {
    await this.handler.handle(event);
  }
}
