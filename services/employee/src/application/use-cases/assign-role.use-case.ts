import { Injectable, Inject } from '@nestjs/common';
import { EMPLOYEE_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { EmployeeNotFoundException } from '../../domain/exceptions/employee-not-found.exception';

@Injectable()
export class AssignRoleUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  /**
   * Publish a role assignment event so that IAM/account service can react and update the account role.
   * This service does not directly update roles in other services; it publishes an event with the payload.
   */
  async execute(employeeId: number, role: string, assignedBy?: number) {
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException(employeeId);

    const payload = {
      employee_id: employeeId,
      account_id: employee.account_id,
      role,
      assigned_by: assignedBy,
      assigned_at: new Date(),
    };

    // event name chosen as 'employee_role_assigned' - consumers (IAM) should subscribe to this
    this.eventPublisher.publish('employee_role_assigned', payload);

    return payload;
  }
}
