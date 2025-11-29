import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { EmployeeDepartmentAssignedHandler } from '../../application/handlers/employee-department-assigned.handler';

@Controller()
export class EmployeeDepartmentAssignedListener {
  constructor(private readonly handler: EmployeeDepartmentAssignedHandler) {}

  @EventPattern('employee_department_assigned')
  async handleEmployeeDepartmentAssigned(event: any): Promise<void> {
    await this.handler.handle(event);
  }
}
