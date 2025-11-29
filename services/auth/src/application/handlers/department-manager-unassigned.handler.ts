import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../../domain/entities/account.entity';

export interface DepartmentManagerUnassignedEvent {
  department_id: number;
  previous_manager_id: number;
  updated_at: Date;
}

@Injectable()
export class DepartmentManagerUnassignedHandler {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async handle(event: DepartmentManagerUnassignedEvent): Promise<void> {
    console.log(
      `📬 Received department_manager_unassigned event - department_id: ${event.department_id}, previous_manager_id: ${event.previous_manager_id}`,
    );

    // Find account by employee_id (previous_manager_id is employee_id)
    const account = await this.accountRepository.findOne({
      where: { employee_id: event.previous_manager_id },
    });

    if (!account) {
      console.warn(
        `⚠️ No account found for previous manager employee_id: ${event.previous_manager_id}. Skipping manager unassignment sync.`,
      );
      return;
    }

    // Note: We should NOT automatically downgrade the role here
    // because the manager might still manage other departments
    // The role should be determined by:
    // 1. Their position's suggested_role
    // 2. Whether they still manage any other departments

    console.log(
      `✅ Department manager unassignment logged for department_id: ${event.department_id}`,
    );
    console.log(
      `ℹ️ Account role NOT automatically changed - should be managed via position assignment`,
    );

    // Note: If needed, you can add logic to check if this manager
    // still manages other departments, and only downgrade role if not
  }
}
