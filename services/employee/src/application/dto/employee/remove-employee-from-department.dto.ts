import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveEmployeeFromDepartmentDto {
  @ApiProperty({ example: 1, required: false, description: 'ID of user performing the removal' })
  @IsOptional()
  removed_by?: number;

  @ApiProperty({ example: 'Employee transferred to another department', required: false, description: 'Reason for removal' })
  @IsOptional()
  @IsString()
  reason?: string;
}

