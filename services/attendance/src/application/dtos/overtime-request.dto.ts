import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OvertimeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class CreateOvertimeRequestDto {
  // shift_id removed - OT always creates a standalone shift after approval
  // No extend logic to keep OT tracking simple

  @ApiProperty({
    example: '2025-01-15',
    description: 'Overtime date (YYYY-MM-DD)',
  })
  @IsDateString()
  overtime_date: string;

  @ApiProperty({ example: '2025-01-15T18:00:00Z' })
  @IsDateString()
  start_time: string;

  @ApiProperty({ example: '2025-01-15T21:00:00Z' })
  @IsDateString()
  end_time: string;

  @ApiProperty({ example: 3.0, description: 'Estimated overtime hours' })
  // Accept numeric values (integers or decimals). class-validator's IsDecimal
  // expects strings; using IsNumber with Type(() => Number) allows JSON numbers.
  @Type(() => Number)
  @IsNotEmpty()
  @Min(0)
  // allow floating point numbers
  estimated_hours: number;

  @ApiProperty({ example: 'Urgent project deadline' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateOvertimeRequestDto {
  @ApiPropertyOptional({ example: '2025-01-15T18:30:00Z' })
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @ApiPropertyOptional({ example: '2025-01-15T21:30:00Z' })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiPropertyOptional({ example: 3.5 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  estimated_hours?: number;

  @ApiPropertyOptional({ example: 'Extended due to additional tasks' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RejectOvertimeDto {
  @ApiPropertyOptional({ example: 'Not aligned with policy' })
  @IsOptional()
  @IsString()
  rejection_reason?: string;
}

export class OvertimeQueryDto {
  @ApiPropertyOptional({ enum: OvertimeStatus })
  @IsOptional()
  @IsEnum(OvertimeStatus)
  status?: OvertimeStatus;

  @ApiPropertyOptional({ description: 'Department ID filter', example: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  department_id?: number;

  @ApiPropertyOptional({ example: 20, default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
