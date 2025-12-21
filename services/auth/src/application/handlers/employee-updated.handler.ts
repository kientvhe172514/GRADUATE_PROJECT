import { Injectable, Inject, Logger } from '@nestjs/common';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { ACCOUNT_REPOSITORY } from '../tokens';
import { AccountStatus } from '../../domain/value-objects/account-status.vo';

export class EmployeeUpdatedEventDto {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  status?: string; // Employee status: ACTIVE, INACTIVE, TERMINATED, etc.
  termination_date?: Date;
  termination_reason?: string;
}

@Injectable()
export class EmployeeUpdatedHandler {
  private readonly logger = new Logger(EmployeeUpdatedHandler.name);

  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
  ) {}

  async handle(event: EmployeeUpdatedEventDto): Promise<void> {
    this.logger.log(
      `📬 Received employee_updated event for employee ${event.employee_code} (status: ${event.status})`,
    );

    try {
      // Find account by employee_id
      const account = await this.accountRepo.findByEmployeeId(event.id);

      if (!account) {
        this.logger.warn(
          `⚠️  Account not found for employee_id: ${event.id}. Skipping account update.`,
        );
        return;
      }

      // Check if employee status changed to INACTIVE or TERMINATED
      if (
        event.status === 'INACTIVE' ||
        event.status === 'TERMINATED' ||
        event.status === 'SUSPENDED'
      ) {
        // Deactivate account
        if (account.id) {
          await this.accountRepo.updateStatus(
            account.id,
            AccountStatus.INACTIVE,
          );

          this.logger.log(
            `✅ Account ${account.id} (${account.email}) deactivated due to employee status: ${event.status}`,
          );

          if (event.termination_reason) {
            this.logger.log(`   Reason: ${event.termination_reason}`);
          }
        }
      } else if (event.status === 'ACTIVE') {
        // Reactivate account if employee becomes active again
        if (account.status === AccountStatus.INACTIVE && account.id) {
          await this.accountRepo.updateStatus(account.id, AccountStatus.ACTIVE);

          this.logger.log(
            `✅ Account ${account.id} (${account.email}) reactivated due to employee status: ${event.status}`,
          );
        }
      }

      // Update full_name if changed
      if (event.full_name && event.full_name !== account.full_name) {
        account.full_name = event.full_name;
        await this.accountRepo.update(account);

        this.logger.log(
          `✅ Account ${account.id} full_name updated to: ${event.full_name}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Error handling employee_updated event for employee ${event.employee_code}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
