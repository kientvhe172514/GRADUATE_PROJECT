import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { EmployeeCreatedHandler } from '../../application/handlers/employee-created.handler';

@Controller()
export class EmployeeCreatedListener {
  constructor(private readonly handler: EmployeeCreatedHandler) {}

  @EventPattern('employee_created')
  async handleEmployeeCreated(event: any): Promise<void> {
    await this.handler.handle(event);
  }
}