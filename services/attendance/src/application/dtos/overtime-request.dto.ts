import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
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
  @ApiPropertyOptional({
    example: 123,
    description: 'Related shift ID (optional)',
  })
  @IsOptional()
  @IsInt()
  shift_id?: number;

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
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Type(() => Number)
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
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Type(() => Number)
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
