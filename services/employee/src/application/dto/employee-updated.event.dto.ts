import { ApiProperty } from '@nestjs/swagger';
import { Employee } from '../../domain/entities/employee.entity';

export class EmployeeUpdatedEventDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  employee_code: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  updated_fields: string[];

  @ApiProperty()
  updated_at: Date;

  constructor(employee: Employee, updatedFields: string[]) {
    this.id = employee.id!;
    this.employee_code = employee.employee_code;
    this.full_name = employee.full_name;
    this.email = employee.email;
    this.updated_fields = updatedFields;
    this.updated_at = employee.updated_at || new Date();
  }
}