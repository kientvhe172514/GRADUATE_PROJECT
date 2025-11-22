import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ScheduleType {
  FIXED = 'FIXED',
  FLEXIBLE = 'FLEXIBLE',
  SHIFT_BASED = 'SHIFT_BASED',
}

export enum ScheduleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class CreateWorkScheduleDto {
  @ApiProperty({ example: 'Standard Office Hours' })
  @IsString()
  schedule_name: string;

  @ApiProperty({ enum: ScheduleType, example: 'FIXED' })
  @IsEnum(ScheduleType)
  schedule_type: string;

  @ApiPropertyOptional({
    example: '1,2,3,4,5',
    description: 'Working days (1=Mon, 7=Sun)',
  })
  @IsOptional()
  @IsString()
  work_days?: string;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @IsString()
  end_time?: string;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  break_duration_minutes?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  late_tolerance_minutes?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  early_leave_tolerance_minutes?: number;

  @ApiPropertyOptional({ enum: ScheduleStatus, example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: string;
}

export class UpdateWorkScheduleDto {
  @ApiPropertyOptional({ example: 'Standard Office Hours' })
  @IsOptional()
  @IsString()
  schedule_name?: string;

  @ApiPropertyOptional({ enum: ScheduleType, example: 'FIXED' })
  @IsOptional()
  @IsEnum(ScheduleType)
  schedule_type?: string;

  @ApiPropertyOptional({ example: '1,2,3,4,5' })
  @IsOptional()
  @IsString()
  work_days?: string;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @IsString()
  end_time?: string;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  break_duration_minutes?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  late_tolerance_minutes?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  early_leave_tolerance_minutes?: number;

  @ApiPropertyOptional({ enum: ScheduleStatus, example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: string;
}

export class AssignWorkScheduleDto {
  @ApiProperty({ example: [101, 102, 103], description: 'Employee IDs' })
  @IsNumber({}, { each: true })
  employee_ids: number[];

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  effective_from: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  effective_to?: string;
}

export class WorkScheduleQueryDto {
  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'FIXED' })
  @IsOptional()
  @IsString()
  schedule_type?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
