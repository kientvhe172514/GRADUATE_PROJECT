import { Employee } from 'domain/entities/employee.entity';

export class EmployeeUpdatedEventDto {
  employee_id: number;
  account_id?: number;
  employee_code: string;
  full_name: string;
  email: string;
  department_id?: number;
  position_id?: number;
  hire_date: Date;
  status: string;
  updated_at: Date;

  constructor(employee: Employee) {
    this.employee_id = employee.id!;
    this.account_id = employee.account_id;
    this.employee_code = employee.employee_code;
    this.full_name = employee.full_name;
    this.email = employee.email;
    this.department_id = employee.department_id;
    this.position_id = employee.position_id;
    this.hire_date = employee.hire_date;
    this.status = employee.status;
    this.updated_at = employee.updated_at!;
  }
}
