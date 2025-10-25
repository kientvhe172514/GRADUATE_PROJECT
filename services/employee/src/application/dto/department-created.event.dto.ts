import { ApiProperty } from '@nestjs/swagger';
import { Department } from '../../domain/entities/department.entity';

export class DepartmentCreatedEventDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  department_code: string;

  @ApiProperty()
  department_name: string;

  @ApiProperty({ required: false })
  parent_department_id?: number;

  @ApiProperty({ required: false })
  manager_id?: number;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  created_at?: Date;

  constructor(department: Department) {
    this.id = department.id!;
    this.department_code = department.department_code;
    this.department_name = department.department_name;
    this.parent_department_id = department.parent_department_id;
    this.manager_id = department.manager_id;
    this.description = department.description;
    this.created_at = department.created_at;
  }
}
