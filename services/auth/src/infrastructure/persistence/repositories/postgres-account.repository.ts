import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountSchema } from '../typeorm/account.schema';
import { AccountRepositoryPort } from '../../../application/ports/account.repository.port';
import { Account } from '../../../domain/entities/account.entity';
import { AccountEntity } from '../entities/account.entity';
import { AccountMapper } from '../mappers/account.mapper';

@Injectable()
export class PostgresAccountRepository implements AccountRepositoryPort {
  constructor(
    @InjectRepository(AccountSchema)
    private repository: Repository<AccountEntity>,
  ) {}

  async create(account: Account): Promise<Account> {
    const entity = AccountMapper.toPersistence(account);
    const savedEntity = await this.repository.save(entity);
    return AccountMapper.toDomain(savedEntity);
  }

  async findByEmail(email: string): Promise<Account | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? AccountMapper.toDomain(entity) : null;
  }

  async findById(id: number): Promise<Account | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? AccountMapper.toDomain(entity) : null;
  }

  async updateLastLogin(id: number, ip: string): Promise<void> {
    await this.repository.update(id, { 
      last_login_at: new Date(), 
      last_login_ip: ip 
    });
  }

  async incrementFailedLoginAttempts(id: number): Promise<void> {
    await this.repository.increment({ id }, 'failed_login_attempts', 1);
  }

  async resetFailedLoginAttempts(id: number): Promise<void> {
    await this.repository.update(id, { 
      failed_login_attempts: 0
    });
    // Use raw SQL to set locked_until to null
    await this.repository.query('UPDATE accounts SET locked_until = NULL WHERE id = $1', [id]);
  }

  async lockAccount(id: number, lockedUntil: Date): Promise<void> {
    await this.repository.update(id, { 
      locked_until: lockedUntil,
      failed_login_attempts: 5 
    });
  }

  async unlockAccount(id: number): Promise<void> {
    await this.repository.update(id, { 
      failed_login_attempts: 0
    });
    // Use raw SQL to set locked_until to null
    await this.repository.query('UPDATE accounts SET locked_until = NULL WHERE id = $1', [id]);
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await this.repository.update(id, { password_hash: passwordHash });
  }
}