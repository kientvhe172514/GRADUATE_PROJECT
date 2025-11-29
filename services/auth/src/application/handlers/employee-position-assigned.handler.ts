import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from '../../domain/entities/account.entity';

export interface EmployeePositionAssignedEvent {
  employee_id: number;
  position_id: number;
  position_name: string;
  suggested_role?: string; // Role code from position
  assigned_at: Date;
}

@Injectable()
export class EmployeePositionAssignedHandler {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async handle(event: EmployeePositionAssignedEvent): Promise<void> {
    console.log(
      `📬 Received employee_position_assigned event for employee_id: ${event.employee_id}, position: ${event.position_name}`,
    );

    // Find account by employee_id
    const account = await this.accountRepository.findOne({
      where: { employee_id: event.employee_id },
    });

    if (!account) {
      console.warn(
        `⚠️ No account found for employee_id: ${event.employee_id}. Skipping position sync.`,
      );
      return;
    }

    // If position has suggested_role, update account role
    if (event.suggested_role) {
      // Map suggested_role to role_id
      const roleMap: Record<string, number> = {
        ADMIN: 1,
        HR_MANAGER: 2,
        DEPARTMENT_MANAGER: 3,
        EMPLOYEE: 4,
      };

      const newRoleId = roleMap[event.suggested_role];
      if (newRoleId && newRoleId !== account.role_id) {
        console.log(
          `🔄 Updating account role from role_id=${account.role_id} to role_id=${newRoleId} (${event.suggested_role})`,
        );

        account.role_id = newRoleId;
        account.role = event.suggested_role;
        await this.accountRepository.save(account);

        console.log(
          `✅ Account role updated for employee_id: ${event.employee_id}`,
        );
      }
    }
  }
}
