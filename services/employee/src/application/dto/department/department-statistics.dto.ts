import { ApiProperty } from '@nestjs/swagger';

export class DepartmentStatisticsDto {
  @ApiProperty({ description: 'Department ID' })
  department_id: number;

  @ApiProperty({ description: 'Department code' })
  department_code: string;

  @ApiProperty({ description: 'Department name' })
  department_name: string;

  @ApiProperty({ description: 'Total number of employees in department' })
  total_employees: number;

  @ApiProperty({ description: 'Employees count by status' })
  employees_by_status: {
    ACTIVE: number;
    INACTIVE: number;
    TERMINATED: number;
  };

  @ApiProperty({ description: 'Employees count by position', type: 'array' })
  employees_by_position: {
    position_id: number;
    position_name: string;
    count: number;
  }[];

  @ApiProperty({ description: 'Number of sub-departments' })
  sub_departments_count: number;

  @ApiProperty({ required: false, description: 'Parent department ID' })
  parent_department_id?: number;

  @ApiProperty({ required: false, description: 'Parent department name' })
  parent_department_name?: string;
}

