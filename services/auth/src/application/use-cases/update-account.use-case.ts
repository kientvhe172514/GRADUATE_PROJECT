import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Account } from '../../domain/entities/account.entity';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { ACCOUNT_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { AccountUpdatedEventDto } from '../dto/account-updated.event.dto';

export interface UpdateAccountDto {
  email?: string;
  role?: string;
  status?: string;
  employee_id?: number;
  employee_code?: string;
  full_name?: string;
  department_id?: number;
  department_name?: string;
  position_id?: number;
  position_name?: string;
  external_ids?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class UpdateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepository: AccountRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private eventPublisher: EventPublisherPort,
  ) {}

  async execute(id: number, dto: UpdateAccountDto): Promise<Account> {
    const existingAccount = await this.accountRepository.findById(id);
    if (!existingAccount) {
      throw new NotFoundException('Account not found');
    }

    // Check for duplicate email if email is being updated
    if (dto.email && dto.email !== existingAccount.email) {
      const emailExists = await this.accountRepository.findByEmail(dto.email);
      if (emailExists) {
        throw new Error('Account email already exists');
      }
    }

    // Update account data
    Object.assign(existingAccount, dto);
    existingAccount.updated_at = new Date();
    existingAccount.sync_version = (existingAccount.sync_version || 1) + 1;

    const updatedAccount = await this.accountRepository.update(existingAccount);

    // Publish event
    const eventDto = new AccountUpdatedEventDto(updatedAccount);
    this.eventPublisher.publish('account_updated', eventDto);

    return updatedAccount;
  }
}
