import { Account } from '../entities/account.entity';
import { AccountType, AccountRole } from '../value-objects/account-type.vo';
import { AccountStatus } from '../value-objects/account-status.vo';

export interface CreateAccountProps {
  email: string;
  password_hash: string;
  employee_id?: number;
  employee_code?: string;
  full_name?: string;
  department_id?: number;
  department_name?: string;
  position_id?: number;
  position_name?: string;
  account_type?: AccountType;
  role?: AccountRole;
}

export class AccountFactory {
  static createEmployeeAccount(props: CreateAccountProps): Account {
    const account = new Account();
    account.email = props.email;
    account.password_hash = props.password_hash;
    account.employee_id = props.employee_id;
    account.employee_code = props.employee_code;
    account.full_name = props.full_name;
    account.department_id = props.department_id;
    account.department_name = props.department_name;
    account.position_id = props.position_id;
    account.position_name = props.position_name;
    account.account_type = props.account_type || AccountType.EMPLOYEE;
    account.role = props.role || AccountRole.EMPLOYEE;
    account.status = AccountStatus.ACTIVE;
    account.sync_version = 1;
    account.failed_login_attempts = 0;
    account.created_at = new Date();
    
    return account;
  }

  static createAdminAccount(props: CreateAccountProps): Account {
    const account = this.createEmployeeAccount(props);
    account.account_type = AccountType.ADMIN;
    account.role = AccountRole.ADMIN;
    
    return account;
  }

  static createManagerAccount(props: CreateAccountProps): Account {
    const account = this.createEmployeeAccount(props);
    account.account_type = AccountType.MANAGER;
    account.role = AccountRole.DEPARTMENT_MANAGER;
    
    return account;
  }

  static createHRManagerAccount(props: CreateAccountProps): Account {
    const account = this.createEmployeeAccount(props);
    account.account_type = AccountType.MANAGER;
    account.role = AccountRole.HR_MANAGER;
    
    return account;
  }
}