import { EntitySchema } from 'typeorm';
import { EmployeeEntity } from '../entities/employee.entity';

// Transformer to convert bigint to number
const bigintTransformer = {
  from: (value: string | number | null): number | null => {
    if (value === null || value === undefined) return null;
    return typeof value === 'string' ? parseInt(value, 10) : value;
  },
  to: (value: number | null): number | null => value,
};

export const EmployeeSchema = new EntitySchema<EmployeeEntity>({
  name: 'Employee',
  tableName: 'employees',
  columns: {
    id: { type: 'bigint', primary: true, generated: true, transformer: bigintTransformer },
    account_id: {
      type: 'bigint',
      unique: true,
      nullable: true,
      transformer: bigintTransformer,
    },
    employee_code: { type: 'varchar', length: 50, unique: true },
    first_name: { type: 'varchar', length: 100 },
    last_name: { type: 'varchar', length: 100 },
    full_name: { type: 'varchar', length: 255 },
    date_of_birth: { type: 'date' },
    gender: { type: 'varchar', length: 10 },
    national_id: { type: 'varchar', length: 50, nullable: true },
    email: { type: 'varchar', length: 255 },
    phone_number: { type: 'varchar', length: 20, nullable: true },
    personal_email: { type: 'varchar', length: 255, nullable: true },
    address: { type: 'jsonb', nullable: true },
    department_id: { type: 'int', nullable: true },
    position_id: { type: 'int', nullable: true },
    manager_id: { type: 'bigint', nullable: true, transformer: bigintTransformer },
    hire_date: { type: 'date' },
    employment_type: { type: 'varchar', length: 50 },
    status: { type: 'varchar', length: 20, default: 'ACTIVE' },
    termination_date: { type: 'date', nullable: true },
    termination_reason: { type: 'text', nullable: true },
    emergency_contact: { type: 'jsonb', nullable: true },
    onboarding_status: { type: 'varchar', length: 50, default: 'PENDING' },
    onboarding_completed_at: { type: 'timestamp', nullable: true },
    profile_completion_percentage: { type: 'int', default: 0 },
    external_refs: { type: 'jsonb', default: '{}' },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
    created_by: { type: 'bigint', nullable: true, transformer: bigintTransformer },
    updated_by: { type: 'bigint', nullable: true, transformer: bigintTransformer },
  },
  // Note: No TypeORM relation to avoid foreign key constraints
  // Department will be manually joined when needed
});
