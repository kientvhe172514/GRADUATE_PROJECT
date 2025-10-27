import { ApiProperty } from '@nestjs/swagger';
import { Department } from 'domain/entities/department.entity';

export class DepartmentDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  department_code: string;

  @ApiProperty()
  department_name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  parent_department_id?: number;

  @ApiProperty()
  level: number;

  @ApiProperty({ required: false })
  path?: string;

  @ApiProperty({ required: false })
  manager_id?: number;

  @ApiProperty({ required: false })
  office_address?: string;

  @ApiProperty({ required: false })
  office_latitude?: number;

  @ApiProperty({ required: false })
  office_longitude?: number;

  @ApiProperty()
  office_radius_meters: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  constructor(department: Department) {
    Object.assign(this, department);
  }
}