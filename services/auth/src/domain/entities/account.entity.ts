export class Account {
  id?: number;
  email: string;
  password_hash: string;
  account_type: string = 'EMPLOYEE';
  role: string = 'EMPLOYEE';
  employee_id?: number;
  employee_code?: string;
  full_name?: string;
  department_id?: number;
  department_name?: string;
  position_id?: number;
  position_name?: string;
  external_ids?: object;
  metadata?: object;
  data_synced_at?: Date;
  sync_version: number = 1;
  status: string = 'ACTIVE';
  failed_login_attempts: number = 0;
  locked_until?: Date;
  last_login_at?: Date;
  last_login_ip?: string;
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
}