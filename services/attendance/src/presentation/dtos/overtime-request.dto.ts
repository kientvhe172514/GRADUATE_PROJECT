import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsDateString,
  IsString,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';

export enum OvertimeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class CreateOvertimeRequestDto {
  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  overtime_date: string;

  @ApiProperty({ example: '2024-01-15T18:00:00Z' })
  @IsDateString()
  start_time: string;

  @ApiProperty({ example: '2024-01-15T22:00:00Z' })
  @IsDateString()
  end_time: string;

  @ApiProperty({ example: 4.0 })
  @IsNumber()
  @Min(0)
  estimated_hours: number;

  @ApiProperty({ example: 'Urgent project deadline' })
  @IsString()
  reason: string;
}

export class UpdateOvertimeRequestDto {
  @ApiPropertyOptional({ example: '2024-01-15T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @ApiPropertyOptional({ example: '2024-01-15T22:00:00Z' })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiPropertyOptional({ example: 4.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimated_hours?: number;

  @ApiPropertyOptional({ example: 'Updated reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ApproveOvertimeDto {
  @ApiPropertyOptional({ example: 3.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actual_hours?: number;
}

export class RejectOvertimeDto {
  @ApiProperty({ example: 'Not enough justification' })
  @IsString()
  rejection_reason: string;
}

export class OvertimeQueryDto {
  @ApiPropertyOptional({ enum: OvertimeStatus, example: 'PENDING' })
  @IsOptional()
  @IsEnum(OvertimeStatus)
  status?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}
