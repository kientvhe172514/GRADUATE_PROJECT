import { EntitySchema } from 'typeorm';

export interface Contract {
  id: number;
  employee_id: number;
  contract_code: string;
  contract_type: 'PERMANENT' | 'FIXED_TERM' | 'PROBATION' | 'INTERN' | 'PART_TIME' | 'SEASONAL';
  start_date: Date;
  end_date: Date | null;
  
  // Compensation
  salary: number;
  currency: string;
  allowances: Record<string, any> | null;
  
  // Job details
  job_title: string;
  department_id: number | null;
  position_id: number | null;
  working_hours_per_week: number;
  
  // Status tracking
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'SUSPENDED';
  signed_at: Date | null;
  effective_date: Date;
  
  // Termination info
  termination_date: Date | null;
  termination_reason: string | null;
  notice_period_days: number | null;
  
  // Additional info
  probation_end_date: Date | null;
  benefits: Record<string, any> | null;
  notes: string | null;
  
  created_at: Date;
  updated_at: Date;
  created_by_user_id: number | null;
}

export const ContractSchema = new EntitySchema<Contract>({
  name: 'Contract',
  tableName: 'contracts',
  columns: {
    id: {
      type: 'bigint',
      primary: true,
      generated: 'increment',
    },
    employee_id: {
      type: 'bigint',
      comment: 'References employees.id',
    },
    contract_code: {
      type: 'varchar',
      length: 50,
      unique: true,
      comment: 'Mã hợp đồng duy nhất, VD: HD-2024-001',
    },
    contract_type: {
      type: 'varchar',
      length: 50,
      comment: 'PERMANENT, FIXED_TERM, PROBATION, INTERN, PART_TIME, SEASONAL',
    },
    start_date: {
      type: 'date',
      comment: 'Ngày bắt đầu hợp đồng',
    },
    end_date: {
      type: 'date',
      nullable: true,
      comment: 'Ngày kết thúc (null nếu PERMANENT)',
    },
    salary: {
      type: 'decimal',
      precision: 15,
      scale: 2,
      comment: 'Lương cơ bản',
    },
    currency: {
      type: 'varchar',
      length: 3,
      default: 'VND',
      comment: 'VND, USD, EUR',
    },
    allowances: {
      type: 'jsonb',
      nullable: true,
      comment: 'Phụ cấp: {transport: 500000, lunch: 1000000, phone: 300000}',
    },
    job_title: {
      type: 'varchar',
      length: 255,
      comment: 'Chức danh công việc trong hợp đồng',
    },
    department_id: {
      type: 'bigint',
      nullable: true,
      comment: 'References departments.id',
    },
    position_id: {
      type: 'bigint',
      nullable: true,
      comment: 'References positions.id',
    },
    working_hours_per_week: {
      type: 'decimal',
      precision: 5,
      scale: 2,
      default: 40.00,
      comment: 'Số giờ làm việc mỗi tuần (VN: 40-48h)',
    },
    status: {
      type: 'varchar',
      length: 50,
      default: 'DRAFT',
      comment: 'DRAFT, ACTIVE, EXPIRED, TERMINATED, SUSPENDED',
    },
    signed_at: {
      type: 'timestamp',
      nullable: true,
      comment: 'Thời điểm ký hợp đồng',
    },
    effective_date: {
      type: 'date',
      comment: 'Ngày có hiệu lực',
    },
    termination_date: {
      type: 'date',
      nullable: true,
      comment: 'Ngày chấm dứt hợp đồng',
    },
    termination_reason: {
      type: 'text',
      nullable: true,
      comment: 'Lý do chấm dứt',
    },
    notice_period_days: {
      type: 'int',
      nullable: true,
      comment: 'Thời gian báo trước khi chấm dứt (ngày)',
    },
    probation_end_date: {
      type: 'date',
      nullable: true,
      comment: 'Ngày kết thúc thử việc (nếu có)',
    },
    benefits: {
      type: 'jsonb',
      nullable: true,
      comment: 'Quyền lợi: {insurance: true, annual_leave: 12, sick_leave: 30}',
    },
    notes: {
      type: 'text',
      nullable: true,
      comment: 'Ghi chú thêm',
    },
    created_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    updated_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    created_by_user_id: {
      type: 'bigint',
      nullable: true,
      comment: 'User ID người tạo hợp đồng',
    },
  },
  indices: [
    {
      name: 'idx_contracts_employee_id',
      columns: ['employee_id'],
    },
    {
      name: 'idx_contracts_contract_code',
      columns: ['contract_code'],
      unique: true,
    },
    {
      name: 'idx_contracts_status',
      columns: ['status'],
    },
    {
      name: 'idx_contracts_contract_type',
      columns: ['contract_type'],
    },
    {
      name: 'idx_contracts_dates',
      columns: ['start_date', 'end_date'],
    },
    {
      name: 'idx_contracts_department_id',
      columns: ['department_id'],
    },
  ],
});
