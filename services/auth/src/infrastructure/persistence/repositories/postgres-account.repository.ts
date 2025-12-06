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
      last_login_ip: ip,
    });
  }

  async incrementFailedLoginAttempts(id: number): Promise<void> {
    await this.repository.increment({ id }, 'failed_login_attempts', 1);
  }

  async resetFailedLoginAttempts(id: number): Promise<void> {
    await this.repository.update(id, {
      failed_login_attempts: 0,
    });
    // Use raw SQL to set locked_until to null
    await this.repository.query(
      'UPDATE accounts SET locked_until = NULL WHERE id = $1',
      [id],
    );
  }

  async lockAccount(id: number, lockedUntil: Date): Promise<void> {
    await this.repository.update(id, {
      locked_until: lockedUntil,
      failed_login_attempts: 5,
    });
  }

  async unlockAccount(id: number): Promise<void> {
    await this.repository.update(id, {
      failed_login_attempts: 0,
    });
    // Use raw SQL to set locked_until to null
    await this.repository.query(
      'UPDATE accounts SET locked_until = NULL WHERE id = $1',
      [id],
    );
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await this.repository.update(id, { password_hash: passwordHash });
  }

  async setTemporaryPasswordFlag(
    id: number,
    isTemporary: boolean,
  ): Promise<void> {
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

  async findWithPagination(
    criteria: any,
  ): Promise<{ accounts: Account[]; total: number }> {
    // Debug: Log incoming criteria
    console.log(
      '🔍 PostgresAccountRepository - Incoming criteria:',
      JSON.stringify(criteria, null, 2),
    );
    console.log(
      '🔍 criteria.status:',
      criteria.status,
      'type:',
      typeof criteria.status,
    );

    // Use raw query to join with roles table
    const whereConditions: string[] = [];
    const whereParams: any[] = [];
    let paramIndex = 1;

    // Filter by status - check for truthy value and non-empty string
    if (
      criteria.status !== undefined &&
      criteria.status !== null &&
      criteria.status !== ''
    ) {
      whereConditions.push(`a.status = $${paramIndex}`);
      whereParams.push(criteria.status);
      console.log(
        '✅ Repository: Status filter added to WHERE:',
        `a.status = $${paramIndex}`,
        'value:',
        criteria.status,
      );
      paramIndex++;
    } else {
      console.log(
        '❌ Repository: Status filter NOT added. criteria.status:',
        criteria.status,
      );
    }

    // Filter by role (using role_code from roles table)
    if (
      criteria.role !== undefined &&
      criteria.role !== null &&
      criteria.role !== ''
    ) {
      whereConditions.push(`r.code = $${paramIndex}`);
      whereParams.push(criteria.role);
      paramIndex++;
    }

    // Filter by department_id - check for truthy value
    if (
      criteria.department_id !== undefined &&
      criteria.department_id !== null
    ) {
      whereConditions.push(`a.department_id = $${paramIndex}`);
      whereParams.push(criteria.department_id);
      paramIndex++;
    }

    // Search in email or full_name
    if (criteria.search && criteria.search.trim()) {
      const searchTerm = `%${criteria.search.trim()}%`;
      whereConditions.push(
        `(a.email ILIKE $${paramIndex} OR a.full_name ILIKE $${paramIndex + 1})`,
      );
      whereParams.push(searchTerm, searchTerm);
      paramIndex += 2;
    }

    // Validate and sanitize sortBy to prevent SQL injection
    const allowedSortFields = [
      'id',
      'email',
      'full_name',
      'status',
      'created_at',
      'updated_at',
      'last_login_at',
      'department_id',
    ];
    const sortBy = allowedSortFields.includes(criteria.sortBy)
      ? criteria.sortBy
      : 'created_at';
    const sortOrder = criteria.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const offset = criteria.offset || 0;
    const limit = criteria.limit || 10;

    // Build WHERE clause
    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    console.log('🔍 WHERE conditions:', whereConditions);
    console.log('🔍 WHERE clause:', whereClause);
    console.log('🔍 WHERE params:', whereParams);

    // Get total count - use separate params array
    const countQuery = `
      SELECT COUNT(*) as count
      FROM accounts a
      LEFT JOIN roles r ON r.id = a.role_id
      ${whereClause}
    `;
    console.log('🔍 Count Query:', countQuery);
    console.log('🔍 Count Query Params:', whereParams);

    const countResult: any = await this.repository.query(
      countQuery,
      whereParams,
    );
    const total = parseInt(countResult[0]?.count || '0', 10);
    console.log('🔍 Total count result:', total);

    // Get accounts with role_code - build params array with limit and offset
    const queryParams = [...whereParams];
    const limitParamIndex = paramIndex;
    const offsetParamIndex = paramIndex + 1;

    const query = `
      SELECT a.*, r.code as role_code
      FROM accounts a
      LEFT JOIN roles r ON r.id = a.role_id
      ${whereClause}
      ORDER BY a.${sortBy} ${sortOrder}
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;
    queryParams.push(limit, offset);

    console.log('🔍 Main Query:', query);
    console.log('🔍 Main Query Params:', queryParams);

    const results: any = await this.repository.query(query, queryParams);
    console.log('🔍 Query results count:', results.length);
    const accounts = results.map((entity: any) => {
      const account = AccountMapper.toDomain(entity);
      account.role = entity.role_code;
      return account;
    });

    return { accounts, total };
  }
}
