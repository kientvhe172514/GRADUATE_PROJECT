import { ApiProperty } from '@nestjs/swagger';
import { Employee } from 'domain/entities/employee.entity';

export class EmployeeCreatedEventDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  employee_code: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  hire_date: Date;

  constructor(employee: Employee) {
    this.id = employee.id!;
    this.employee_code = employee.employee_code;
    this.full_name = employee.full_name;
    this.email = employee.email;
    this.hire_date = employee.hire_date;
  }
}