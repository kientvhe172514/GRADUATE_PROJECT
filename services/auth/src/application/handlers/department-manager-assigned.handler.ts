import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../../domain/entities/account.entity';

export interface DepartmentManagerAssignedEvent {
  department_id: number;
  manager_id: number;
  updated_at: Date;
}

@Injectable()
export class DepartmentManagerAssignedHandler {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async handle(event: DepartmentManagerAssignedEvent): Promise<void> {
    console.log(
      `📬 Received department_manager_assigned event - department_id: ${event.department_id}, manager_id: ${event.manager_id}`,
    );

    // Find account by employee_id (manager_id is employee_id)
    const account = await this.accountRepository.findOne({
      where: { employee_id: event.manager_id },
    });

    if (!account) {
      console.warn(
        `⚠️ No account found for manager employee_id: ${event.manager_id}. Skipping manager assignment sync.`,
      );
      return;
    }

    // If account doesn't have DEPARTMENT_MANAGER role, upgrade it
    if (account.role_id !== 3 && account.role !== 'DEPARTMENT_MANAGER') {
      console.log(
        `🔄 Upgrading account to DEPARTMENT_MANAGER role for employee_id: ${event.manager_id}`,
      );

      account.role_id = 3;
      account.role = 'DEPARTMENT_MANAGER';
      await this.accountRepository.save(account);

      console.log(
        `✅ Account upgraded to DEPARTMENT_MANAGER for employee_id: ${event.manager_id}`,
      );
    }

    console.log(
      `✅ Department manager assignment logged for department_id: ${event.department_id}`,
    );

    // Note: Managed departments are fetched dynamically at login time
    // from Employee service via RPC call
  }
}
