import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Account } from '../../domain/entities/account.entity';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { ACCOUNT_REPOSITORY } from '../tokens';

@Injectable()
export class GetAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepository: AccountRepositoryPort,
  ) {}

  async execute(id: number): Promise<Account> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async executeByEmail(email: string): Promise<Account> {
    const account = await this.accountRepository.findByEmail(email);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async executeByEmployeeId(employeeId: number): Promise<Account> {
    const account = await this.accountRepository.findByEmployeeId(employeeId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }
}
