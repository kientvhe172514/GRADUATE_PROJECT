import { Injectable, Inject } from '@nestjs/common';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { EMPLOYEE_REPOSITORY } from '../tokens';

export interface AccountCreatedEvent {
  account_id: number;
  employee_id: number;
  temp_password?: string;
}

@Injectable()
export class AccountCreatedHandler {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: EmployeeRepositoryPort,
  ) {}

  async handle(event: AccountCreatedEvent): Promise<void> {
    await this.employeeRepository.updateAccountId(event.employee_id, event.account_id);
    await this.employeeRepository.updateOnboardingStatus(event.employee_id, 'ACCOUNT_CREATED');
  }
}