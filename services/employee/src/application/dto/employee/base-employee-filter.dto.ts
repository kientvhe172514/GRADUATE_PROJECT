import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Base DTO for employee filtering
 * Consolidates common filters used across multiple employee endpoints
 */
export class BaseEmployeeFilterDto {
  @ApiProperty({
    required: false,
    type: String,
    description: 'Search in employee code, email, or full name (supports Vietnamese with diacritics)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Filter by department ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  department_id?: number;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Filter by position ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  position_id?: number;
}
