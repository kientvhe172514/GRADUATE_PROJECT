import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CheckStrategyDto {
  INTERVAL_BASED = 'INTERVAL_BASED',
  FIXED_COUNT = 'FIXED_COUNT',
  DURATION_BASED = 'DURATION_BASED',
  RANDOM = 'RANDOM',
}

export enum ShiftTypeDto {
  REGULAR = 'REGULAR',
  OVERTIME = 'OVERTIME',
  ALL = 'ALL',
}

export class CreateGpsCheckConfigDto {
  @ApiProperty({ example: 'Default Regular Shift' })
  @IsString()
  config_name: string;

  @ApiPropertyOptional({ example: 'Default configuration for regular shifts' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ShiftTypeDto, example: ShiftTypeDto.REGULAR })
  @IsEnum(ShiftTypeDto)
  shift_type: ShiftTypeDto;

  @ApiProperty({ enum: CheckStrategyDto, example: CheckStrategyDto.DURATION_BASED })
  @IsEnum(CheckStrategyDto)
  check_strategy: CheckStrategyDto;

  @ApiProperty({ example: 2.5, description: 'Check interval in hours' })
  @IsNumber()
  @Min(0.5)
  @Max(24)
  check_interval_hours: number;

  @ApiProperty({ example: 2, description: 'Minimum GPS checks per shift' })
  @IsNumber()
  @Min(0)
  @Max(50)
  min_checks_per_shift: number;

  @ApiProperty({ example: 12, description: 'Maximum GPS checks per shift' })
  @IsNumber()
  @Min(0)
  @Max(50)
  max_checks_per_shift: number;

  @ApiProperty({ example: true, description: 'Enable random timing offset' })
  @IsBoolean()
  enable_random_timing: boolean;

  @ApiProperty({ example: 15, description: 'Random offset in minutes' })
  @IsNumber()
  @Min(0)
  @Max(60)
  random_offset_minutes: number;

  @ApiProperty({ example: 4.0, description: 'Minimum shift duration to apply' })
  @IsNumber()
  @Min(0)
  @Max(24)
  min_shift_duration_hours: number;

  @ApiProperty({ example: 3, description: 'Default checks count' })
  @IsNumber()
  @Min(0)
  @Max(50)
  default_checks_count: number;

  @ApiPropertyOptional({ example: 100, description: 'Priority (higher = preferred)' })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class UpdateGpsCheckConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  config_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CheckStrategyDto })
  @IsOptional()
  @IsEnum(CheckStrategyDto)
  check_strategy?: CheckStrategyDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(24)
  check_interval_hours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  min_checks_per_shift?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  max_checks_per_shift?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enable_random_timing?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  random_offset_minutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  min_shift_duration_hours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  default_checks_count?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class GpsCheckConfigResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  config_name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ enum: ShiftTypeDto })
  shift_type: string;

  @ApiProperty({ enum: CheckStrategyDto })
  check_strategy: string;

  @ApiProperty()
  check_interval_hours: number;

  @ApiProperty()
  min_checks_per_shift: number;

  @ApiProperty()
  max_checks_per_shift: number;

  @ApiProperty()
  enable_random_timing: boolean;

  @ApiProperty()
  random_offset_minutes: number;

  @ApiProperty()
  min_shift_duration_hours: number;

  @ApiProperty()
  default_checks_count: number;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  is_default: boolean;

  @ApiProperty()
  priority: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({ required: false })
  created_by?: number;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ required: false })
  updated_by?: number;
}
