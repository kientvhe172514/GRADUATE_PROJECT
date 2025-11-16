import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignEmployeeToPositionDto {
  @ApiProperty({ example: 1, description: 'Position ID to assign employee to' })
  @IsNumber()
  position_id: number;

  @ApiProperty({ example: 1, required: false, description: 'ID of user performing the assignment' })
  @IsOptional()
  @IsNumber()
  assigned_by?: number;
}

