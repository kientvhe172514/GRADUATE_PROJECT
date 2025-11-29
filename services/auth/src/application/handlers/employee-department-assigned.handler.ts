import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../../domain/entities/account.entity';

export interface EmployeeDepartmentAssignedEvent {
  employee_id: number;
  department_id: number;
  department_name: string;
  assigned_at: Date;
}

@Injectable()
export class EmployeeDepartmentAssignedHandler {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async handle(event: EmployeeDepartmentAssignedEvent): Promise<void> {
    console.log(
      `📬 Received employee_department_assigned event for employee_id: ${event.employee_id}, department: ${event.department_name}`,
    );

    // Find account by employee_id
    const account = await this.accountRepository.findOne({
      where: { employee_id: event.employee_id },
    });

    if (!account) {
      console.warn(
        `⚠️ No account found for employee_id: ${event.employee_id}. Skipping department sync.`,
      );
      return;
    }

    console.log(
      `✅ Employee department assignment logged for employee_id: ${event.employee_id}`,
    );

    // Note: Managed departments are fetched dynamically at login time
    // from Employee service, so no need to store here
  }
}
