import { ApiProperty } from '@nestjs/swagger';
import { Employee } from 'domain/entities/employee.entity';

export class EmployeeDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  account_id?: number;

  @ApiProperty()
  employee_code: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  date_of_birth: Date;

  @ApiProperty()
  gender: string;

  @ApiProperty()
  national_id?: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone_number?: string;

  @ApiProperty()
  personal_email?: string;

  @ApiProperty()
  address?: object;

  @ApiProperty()
  department_id?: number;

  @ApiProperty()
  position_id?: number;

  @ApiProperty()
  manager_id?: number;

  @ApiProperty()
  hire_date: Date;

  @ApiProperty()
  employment_type: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  termination_date?: Date;

  @ApiProperty()
  termination_reason?: string;

  @ApiProperty()
  emergency_contact?: object;

  @ApiProperty()
  onboarding_status: string;

  @ApiProperty()
  onboarding_completed_at?: Date;

  @ApiProperty()
  profile_completion_percentage: number;

  @ApiProperty()
  external_refs?: object;

  @ApiProperty()
  created_at?: Date;

  @ApiProperty()
  updated_at?: Date;

  @ApiProperty()
  created_by?: number;

  @ApiProperty()
  updated_by?: number;

  constructor(employee: Employee) {
    this.id = employee.id!;
    this.account_id = employee.account_id;
    this.employee_code = employee.employee_code;
    this.first_name = employee.first_name;
    this.last_name = employee.last_name;
    this.full_name = employee.full_name;
    this.date_of_birth = employee.date_of_birth;
    this.gender = employee.gender;
    this.national_id = employee.national_id;
    this.email = employee.email;
    this.phone_number = employee.phone_number;
    this.personal_email = employee.personal_email;
    this.address = employee.address;
    this.department_id = employee.department_id;
    this.position_id = employee.position_id;
    this.manager_id = employee.manager_id;
    this.hire_date = employee.hire_date;
    this.employment_type = employee.employment_type;
    this.status = employee.status;
    this.termination_date = employee.termination_date;
    this.termination_reason = employee.termination_reason;
    this.emergency_contact = employee.emergency_contact;
    this.onboarding_status = employee.onboarding_status;
    this.onboarding_completed_at = employee.onboarding_completed_at;
    this.profile_completion_percentage = employee.profile_completion_percentage;
    this.external_refs = employee.external_refs;
    this.created_at = employee.created_at;
    this.updated_at = employee.updated_at;
    this.created_by = employee.created_by;
    this.updated_by = employee.updated_by;
  }
}