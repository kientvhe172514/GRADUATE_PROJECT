import { EntitySchema } from 'typeorm';
import { AccountEntity } from '../entities/account.entity';

export const AccountSchema = new EntitySchema<AccountEntity>({
  name: 'Account',
  tableName: 'accounts',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    email: { type: 'varchar', length: 255, unique: true },
    password_hash: { type: 'varchar', length: 255 },
    account_type: { type: 'varchar', length: 50, default: 'EMPLOYEE' },
    role_id: { type: 'int', nullable: false }, // Required: Foreign key to roles table
    role: { type: 'varchar', length: 50, nullable: true }, // Legacy field, populated from roles table join
    employee_id: { type: 'bigint', nullable: true },
    employee_code: { type: 'varchar', length: 50, nullable: true },
    full_name: { type: 'varchar', length: 255, nullable: true },
    department_id: { type: 'int', nullable: true },
    department_name: { type: 'varchar', length: 255, nullable: true },
    position_id: { type: 'int', nullable: true },
    position_name: { type: 'varchar', length: 255, nullable: true },
    external_ids: { type: 'jsonb', default: '{}' },
    metadata: { type: 'jsonb', default: '{}' },
    data_synced_at: { type: 'timestamp', nullable: true },
    sync_version: { type: 'int', default: 1 },
    status: { type: 'varchar', length: 20, default: 'ACTIVE' },
    failed_login_attempts: { type: 'int', default: 0 },
    locked_until: { type: 'timestamp', nullable: true },
    last_login_at: { type: 'timestamp', nullable: true },
    last_login_ip: { type: 'varchar', length: 45, nullable: true },
    is_temporary_password: { type: 'boolean', default: false },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
    created_by: { type: 'bigint', nullable: true },
    updated_by: { type: 'bigint', nullable: true },
  },
  relations: {
    // Note: TypeORM EntitySchema doesn't support foreign keys directly
    // Foreign key constraint should be added via migration
  },
  indices: [
    { name: 'idx_accounts_email', columns: ['email'] },
    { name: 'idx_accounts_role_id', columns: ['role_id'] },
    { name: 'idx_accounts_employee_id', columns: ['employee_id'] },
    { name: 'idx_accounts_status', columns: ['status'] },
  ],
});