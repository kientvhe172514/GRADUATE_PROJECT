import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidatePositionDepartmentDto {
  @ApiProperty({ example: 1, description: 'Position ID to validate' })
  @IsNumber()
  position_id: number;

  @ApiProperty({ example: 1, description: 'Department ID to check against' })
  @IsNumber()
  department_id: number;
}

export class ValidatePositionDepartmentResponseDto {
  @ApiProperty({ description: 'Whether position belongs to department' })
  valid: boolean;

  @ApiProperty({ required: false, description: 'Error message if validation fails' })
  message?: string;

  @ApiProperty({ required: false, description: 'Position details' })
  position?: {
    id: number;
    position_code: string;
    position_name: string;
    department_id?: number;
  };

  @ApiProperty({ required: false, description: 'Department details' })
  department?: {
    id: number;
    department_code: string;
    department_name: string;
  };
}

