import { Account } from '../../domain/entities/account.entity';

export class AccountUpdatedEventDto {
  account_id: number;
  email: string;
  role: string;
  status: string;
  employee_id?: number;
  employee_code?: string;
  full_name?: string;
  department_id?: number;
  department_name?: string;
  position_id?: number;
  position_name?: string;
  sync_version: number;
  updated_at: Date;

  constructor(account: Account) {
    this.account_id = account.id!;
    this.email = account.email;
    this.role = account.role;
    this.status = account.status;
    this.employee_id = account.employee_id;
    this.employee_code = account.employee_code;
    this.full_name = account.full_name;
    this.department_id = account.department_id;
    this.department_name = account.department_name;
    this.position_id = account.position_id;
    this.position_name = account.position_name;
    this.sync_version = account.sync_version;
    this.updated_at = account.updated_at!;
  }
}
