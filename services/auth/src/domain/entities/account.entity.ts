import { AccountType, AccountRole } from '../value-objects/account-type.vo';
import { AccountStatus } from '../value-objects/account-status.vo';

export class Account {
  id?: number;
  email: string;
  password_hash: string;
  account_type: AccountType = AccountType.EMPLOYEE;
  role: AccountRole = AccountRole.EMPLOYEE;
  employee_id?: number;
  employee_code?: string;
  full_name?: string;
  department_id?: number;
  department_name?: string;
  position_id?: number;
  position_name?: string;
  
  // External IDs mapping
  external_ids?: Record<string, any>;
  metadata?: Record<string, any>;
  
  // Sync tracking
  data_synced_at?: Date;
  sync_version: number = 1;
  status: AccountStatus = AccountStatus.ACTIVE;
  failed_login_attempts: number = 0;
  locked_until?: Date;
  last_login_at?: Date;
  last_login_ip?: string;
  
  // Temporary password flag (for first-time login flow)
  is_temporary_password?: boolean;
  
  // Audit
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
}