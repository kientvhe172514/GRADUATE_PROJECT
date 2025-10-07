export class AccountEntity {
    id?: number;
    email: string;
    password_hash: string;
    account_type: string;
    role: string;
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
    sync_version: number;
    status: string;
    failed_login_attempts: number;
    locked_until?: Date;
    last_login_at?: Date;
    last_login_ip?: string;
    created_at?: Date;
    updated_at?: Date;
    created_by?: number;
    updated_by?: number;
  }