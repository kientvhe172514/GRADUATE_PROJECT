import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignDepartmentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  department_id: number;
}
