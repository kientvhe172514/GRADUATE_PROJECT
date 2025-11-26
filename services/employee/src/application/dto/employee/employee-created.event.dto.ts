import { ApiProperty } from '@nestjs/swagger';
import { Employee } from 'domain/entities/employee.entity';

export class EmployeeCreatedEventDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  employee_code: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty({ description: 'Company email' })
  email: string;

  @ApiProperty({ description: 'Personal email for account credentials', required: false })
  personal_email?: string;

  @ApiProperty()
  hire_date: Date;

  @ApiProperty()
  suggested_role: string; // Role from position for RBAC assignment

  constructor(employee: Employee, suggestedRole: string = 'EMPLOYEE') {
    this.id = employee.id!;
    this.employee_code = employee.employee_code;
    this.full_name = employee.full_name;
    this.email = employee.email;
    this.personal_email = employee.personal_email; // Send personal email for account creation
    this.hire_date = employee.hire_date;
    this.suggested_role = suggestedRole;
  }
}