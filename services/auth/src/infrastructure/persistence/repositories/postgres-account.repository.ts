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
    // Join with roles table to get role_code
    const result = await this.repository.query(
      `
      SELECT a.*, r.code as role_code
      FROM accounts a
      LEFT JOIN roles r ON r.id = a.role_id
      WHERE a.email = $1
      `,
      [email],
    );
    
    if (!result || result.length === 0) return null;
    
    const entity = result[0];
    const account = AccountMapper.toDomain(entity);
    // Set role_code for JWT encoding
    account.role = entity.role_code;
    return account;
  }

  async findById(id: number): Promise<Account | null> {
    // Join with roles table to get role_code
    const result = await this.repository.query(
      `
      SELECT a.*, r.code as role_code
      FROM accounts a
      LEFT JOIN roles r ON r.id = a.role_id
      WHERE a.id = $1
      `,
      [id],
    );
    
    if (!result || result.length === 0) return null;
    
    const entity = result[0];
    const account = AccountMapper.toDomain(entity);
    // Set role_code for JWT encoding
    account.role = entity.role_code;
    return account;
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

  async setTemporaryPasswordFlag(id: number, isTemporary: boolean): Promise<void> {
    await this.repository.update(id, { is_temporary_password: isTemporary });
  }

  async update(account: Account): Promise<Account> {
    if (!account.id) {
      throw new Error('Cannot update account without id');
    }

    const entity = AccountMapper.toPersistence(account);
    await this.repository.save(entity);
    
    // Reload account from DB with role join to get role_code
    const updatedAccount = await this.findById(account.id);
    if (!updatedAccount) {
      throw new Error(`Account with id ${account.id} not found after update`);
    }
    
    return updatedAccount;
  }

  async findByEmployeeId(employeeId: number): Promise<Account | null> {
    // Join with roles table to get role_code
    const result = await this.repository.query(
      `
      SELECT a.*, r.code as role_code
      FROM accounts a
      LEFT JOIN roles r ON r.id = a.role_id
      WHERE a.employee_id = $1
      `,
      [employeeId],
    );
    
    if (!result || result.length === 0) return null;
    
    const entity = result[0];
    const account = AccountMapper.toDomain(entity);
    // Set role_code for JWT encoding
    account.role = entity.role_code;
    return account;
  }

  async updateStatus(id: number, status: string): Promise<Account> {
    await this.repository.update(id, { status });
    
    // Use findById to get role_code properly
    const account = await this.findById(id);
    if (!account) {
      throw new Error('Account not found after update');
    }
    return account;
  }

  async findWithPagination(criteria: any): Promise<{ accounts: Account[]; total: number }> {
    // Use raw query to join with roles table
    let whereConditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (criteria.status) {
      whereConditions.push(`a.status = $${paramIndex}`);
      params.push(criteria.status);
      paramIndex++;
    }
    
    if (criteria.role) {
      whereConditions.push(`r.code = $${paramIndex}`);
      params.push(criteria.role);
      paramIndex++;
    }
    
    if (criteria.department_id) {
      whereConditions.push(`a.department_id = $${paramIndex}`);
      params.push(criteria.department_id);
      paramIndex++;
    }

    if (criteria.search) {
      whereConditions.push(`(a.email ILIKE $${paramIndex} OR a.full_name ILIKE $${paramIndex})`);
      params.push(`%${criteria.search}%`);
      paramIndex++;
    }

    const sortBy = criteria.sortBy || 'created_at';
    const sortOrder = criteria.sortOrder || 'DESC';
    const offset = criteria.offset || 0;
    const limit = criteria.limit || 10;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM accounts a
      LEFT JOIN roles r ON r.id = a.role_id
      WHERE ${whereConditions.join(' AND ')}
    `;
    const countResult: any = await this.repository.query(countQuery, params);
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Get accounts with role_code
    const query = `
      SELECT a.*, r.code as role_code
      FROM accounts a
      LEFT JOIN roles r ON r.id = a.role_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY a.${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);
    
    const results: any = await this.repository.query(query, params);
    const accounts = results.map((entity: any) => {
      const account = AccountMapper.toDomain(entity);
      account.role = entity.role_code;
      return account;
    });

    return { accounts, total };
  }
}