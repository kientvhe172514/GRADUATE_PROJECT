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

  async update(account: Account): Promise<Account> {
    const entity = AccountMapper.toPersistence(account);
    const saved = await this.repository.save(entity);
    return AccountMapper.toDomain(saved);
  }

  async findByEmployeeId(employeeId: number): Promise<Account | null> {
    const entity = await this.repository.findOne({ where: { employee_id: employeeId } as any });
    return entity ? AccountMapper.toDomain(entity) : null;
  }

  async updateStatus(id: number, status: string): Promise<Account> {
    await this.repository.update(id, { status });
    const updatedEntity = await this.repository.findOne({ where: { id } });
    if (!updatedEntity) {
      throw new Error('Account not found after update');
    }
    return AccountMapper.toDomain(updatedEntity);
  }

  async findWithPagination(criteria: any): Promise<{ accounts: Account[]; total: number }> {
    const queryBuilder = this.repository.createQueryBuilder('account');

    // Apply filters
    if (criteria.status) {
      queryBuilder.andWhere('account.status = :status', { status: criteria.status });
    }
    
    if (criteria.role) {
      queryBuilder.andWhere('account.role = :role', { role: criteria.role });
    }
    
    if (criteria.department_id) {
      queryBuilder.andWhere('account.department_id = :department_id', { department_id: criteria.department_id });
    }

    // Apply search
    if (criteria.search) {
      queryBuilder.andWhere(
        '(account.email ILIKE :search OR account.full_name ILIKE :search)',
        { search: `%${criteria.search}%` }
      );
    }

    // Apply sorting
    const sortBy = criteria.sortBy || 'created_at';
    const sortOrder = criteria.sortOrder || 'DESC';
    queryBuilder.orderBy(`account.${sortBy}`, sortOrder);

    // Apply pagination
    queryBuilder.skip(criteria.offset || 0).take(criteria.limit || 10);

    // Get total count
    const total = await queryBuilder.getCount();

    // Get accounts
    const entities = await queryBuilder.getMany();
    const accounts = entities.map(AccountMapper.toDomain);

    return { accounts, total };
  }
}