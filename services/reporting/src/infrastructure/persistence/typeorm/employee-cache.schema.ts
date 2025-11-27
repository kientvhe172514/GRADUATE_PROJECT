import { EntitySchema } from 'typeorm';

export interface EmployeeCacheEntity {
  employee_id: number;
  employee_code: string;
  full_name: string;
  email: string;
  department_id: number;
  department_name: string;
  position_name: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export const EmployeeCacheSchema = new EntitySchema<EmployeeCacheEntity>({
  name: 'EmployeeCache',
  tableName: 'employees_cache',
  columns: {
    employee_id: {
      type: 'int',
      primary: true,
      comment: 'ID from employee service',
    },
    employee_code: {
      type: 'varchar',
      length: 50,
      nullable: false,
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
    position_name: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    status: {
      type: 'varchar',
      length: 50,
      default: 'ACTIVE',
      comment: 'ACTIVE, INACTIVE, TERMINATED',
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
      name: 'idx_employee_cache_code',
      columns: ['employee_code'],
    },
    {
      name: 'idx_employee_cache_department',
      columns: ['department_id'],
    },
    {
      name: 'idx_employee_cache_status',
      columns: ['status'],
    },
    {
      name: 'idx_employee_cache_full_name',
      columns: ['full_name'],
    },
  ],
});
