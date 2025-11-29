import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { DepartmentManagerUnassignedHandler } from '../../application/handlers/department-manager-unassigned.handler';

@Controller()
export class DepartmentManagerUnassignedListener {
  constructor(private readonly handler: DepartmentManagerUnassignedHandler) {}

  @EventPattern('department_manager_unassigned')
  async handleDepartmentManagerUnassigned(event: any): Promise<void> {
    await this.handler.handle(event);
  }
}
