import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../../domain/entities/account.entity';

export interface EmployeePositionRemovedEvent {
  employee_id: number;
  previous_position_id: number;
  previous_position_name: string;
  removed_at: Date;
}

@Injectable()
export class EmployeePositionRemovedHandler {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async handle(event: EmployeePositionRemovedEvent): Promise<void> {
    console.log(
      `📬 Received employee_position_removed event for employee_id: ${event.employee_id}`,
    );

    // Find account by employee_id
    const account = await this.accountRepository.findOne({
      where: { employee_id: event.employee_id },
    });

    if (!account) {
      console.warn(
        `⚠️ No account found for employee_id: ${event.employee_id}. Skipping position removal sync.`,
      );
      return;
    }

    // When position is removed, revert to default EMPLOYEE role
    if (account.role_id !== 4) {
      console.log(
        `🔄 Reverting account role from role_id=${account.role_id} to role_id=4 (EMPLOYEE) due to position removal`,
      );

      account.role_id = 4;
      account.role = 'EMPLOYEE';
      await this.accountRepository.save(account);

      console.log(
        `✅ Account role reverted to EMPLOYEE for employee_id: ${event.employee_id}`,
      );
    }
  }
}
