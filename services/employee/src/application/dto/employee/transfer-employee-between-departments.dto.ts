import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferEmployeeBetweenDepartmentsDto {
  @ApiProperty({ example: 1, description: 'Target department ID to transfer employee to' })
  @IsNumber()
  to_department_id: number;

  @ApiProperty({ example: 1, required: false, description: 'ID of user performing the transfer' })
  @IsOptional()
  @IsNumber()
  transferred_by?: number;

  @ApiProperty({ example: '2025-01-01', required: false, description: 'Effective date for the transfer' })
  @IsOptional()
  @IsDateString()
  effective_date?: string;
}

