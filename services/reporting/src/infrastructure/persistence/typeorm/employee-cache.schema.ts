import { EntitySchema } from 'typeorm';

export interface EmployeeCacheEntity {
  id: number;
  employee_id: number;
  account_id: number;
  role_id: number;
  employee_code: string;
  full_name: string;
  email: string;
  department_id: number;
  department_name: string;
  position_id: number;
  position_name: string;
  join_date: Date;
  status: string;
  synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

export const EmployeeCacheSchema = new EntitySchema<EmployeeCacheEntity>({
  name: 'EmployeeCache',
  tableName: 'employees_cache',
  columns: {
    id: {
      type: 'bigint',
      primary: true,
      generated: true,
      comment: 'Auto-increment primary key for cache table',
    },
    employee_id: {
      type: 'bigint',
      nullable: false,
      unique: true,
      comment: 'References employees.id from employee_db',
    },
    account_id: {
      type: 'bigint',
      nullable: true,
      comment: 'References accounts.id from auth_db',
    },
    role_id: {
      type: 'int',
      nullable: true,
      comment: 'References roles.id from auth_db',
    },
    employee_code: {
      type: 'varchar',
      length: 50,
      nullable: false,
      unique: true,
    },
    full_name: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    email: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    department_id: {
      type: 'int',
      nullable: true,
    },
    department_name: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    position_id: {
      type: 'int',
      nullable: true,
    },
    position_name: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    join_date: {
      type: 'date',
      nullable: true,
      comment: 'Employee hire_date from employee service',
    },
    status: {
      type: 'varchar',
      length: 20,
      default: 'ACTIVE',
      comment: 'ACTIVE, INACTIVE, TERMINATED',
    },
    synced_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
      comment: 'Last sync timestamp from employee service',
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  indices: [
    {
      name: 'idx_employees_cache_employee_id',
      columns: ['employee_id'],
    },
    {
      name: 'idx_employees_cache_account_id',
      columns: ['account_id'],
    },
    {
      name: 'idx_employees_cache_role_id',
      columns: ['role_id'],
    },
    {
      name: 'idx_employees_cache_code',
      columns: ['employee_code'],
    },
    {
      name: 'idx_employees_cache_department_id',
      columns: ['department_id'],
    },
    {
      name: 'idx_employees_cache_position_id',
      columns: ['position_id'],
    },
    {
      name: 'idx_employees_cache_status',
      columns: ['status'],
    },
    {
      name: 'idx_employees_cache_full_name',
      columns: ['full_name'],
    },
  ],
});
