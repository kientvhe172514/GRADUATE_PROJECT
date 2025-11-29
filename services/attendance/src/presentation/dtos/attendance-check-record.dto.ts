import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AttendanceCheckRecordQueryDto {
  @ApiPropertyOptional({ example: 123, description: 'Filter by employee ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  employee_id?: number;

  @ApiPropertyOptional({ example: 456, description: 'Filter by shift ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shift_id?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by validation status',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_valid?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by face verification status',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  face_verified?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by GPS validation status',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  gps_validated?: boolean;

  @ApiPropertyOptional({
    example: 'CHECK_IN',
    enum: ['CHECK_IN', 'CHECK_OUT'],
    description: 'Filter by check type',
  })
  @IsOptional()
  @IsString()
  check_type?: string;

  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Filter from date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiPropertyOptional({
    example: '2025-01-31',
    description: 'Filter to date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  to_date?: string;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;
}
