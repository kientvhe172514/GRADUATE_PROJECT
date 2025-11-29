import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { DepartmentManagerAssignedHandler } from '../../application/handlers/department-manager-assigned.handler';

@Controller()
export class DepartmentManagerAssignedListener {
  constructor(private readonly handler: DepartmentManagerAssignedHandler) {}

  @EventPattern('department_manager_assigned')
  async handleDepartmentManagerAssigned(event: any): Promise<void> {
    await this.handler.handle(event);
  }
}
