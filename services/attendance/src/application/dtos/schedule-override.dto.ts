import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsInt,
  ValidateIf,
  Matches,
} from 'class-validator';

export enum ScheduleOverrideType {
  SCHEDULE_CHANGE = 'SCHEDULE_CHANGE',
  OVERTIME = 'OVERTIME',
}

export enum ScheduleOverrideStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * DTO for creating a schedule override (schedule change or overtime)
 */
export class AddScheduleOverrideDto {
  @ApiProperty({
    enum: ScheduleOverrideType,
    example: ScheduleOverrideType.SCHEDULE_CHANGE,
    description: 'Type of override: SCHEDULE_CHANGE or OVERTIME',
  })
  @IsEnum(ScheduleOverrideType)
  type: ScheduleOverrideType;

  @ApiProperty({
    example: '2025-12-01',
    description: 'Start date of the override (YYYY-MM-DD)',
  })
  @IsDateString()
  from_date: string;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description:
      'End date for SCHEDULE_CHANGE (null for OVERTIME - single day only)',
  })
  @IsOptional()
  @IsDateString()
  @ValidateIf((o) => o.type === ScheduleOverrideType.SCHEDULE_CHANGE)
  to_date?: string;

  @ApiPropertyOptional({
    example: 5,
    description:
      'New work schedule ID for SCHEDULE_CHANGE (required if type is SCHEDULE_CHANGE)',
  })
  @IsOptional()
  @IsInt()
  @ValidateIf((o) => o.type === ScheduleOverrideType.SCHEDULE_CHANGE)
  override_work_schedule_id?: number;

  @ApiPropertyOptional({
    example: '18:00',
    description:
      'Overtime start time in HH:mm format (required if type is OVERTIME)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'overtime_start_time must be in HH:mm format',
  })
  @ValidateIf((o) => o.type === ScheduleOverrideType.OVERTIME)
  overtime_start_time?: string;

  @ApiPropertyOptional({
    example: '22:00',
    description:
      'Overtime end time in HH:mm format (required if type is OVERTIME)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'overtime_end_time must be in HH:mm format',
  })
  @ValidateIf((o) => o.type === ScheduleOverrideType.OVERTIME)
  overtime_end_time?: string;

  @ApiProperty({
    example: 'Chuyển sang ca tối tạm thời',
    description: 'Reason for the override',
  })
  @IsString()
  reason: string;
}

/**
 * DTO for schedule override response
 */
export class ScheduleOverrideDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique ID of the override',
  })
  id: string;

  @ApiProperty({
    enum: ScheduleOverrideType,
    example: ScheduleOverrideType.OVERTIME,
  })
  type: ScheduleOverrideType;

  @ApiProperty({ example: '2025-12-15' })
  from_date: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  to_date?: string;

  @ApiPropertyOptional({ example: 5 })
  override_work_schedule_id?: number;

  @ApiPropertyOptional({ example: '18:00' })
  overtime_start_time?: string;

  @ApiPropertyOptional({ example: '22:00' })
  overtime_end_time?: string;

  @ApiProperty({ example: 'Làm thêm giờ dự án X' })
  reason: string;

  @ApiProperty({ example: 123 })
  created_by: number;

  @ApiProperty({ example: '2025-12-01T10:00:00Z' })
  created_at: string;

  @ApiProperty({
    enum: ScheduleOverrideStatus,
    example: ScheduleOverrideStatus.PENDING,
  })
  status: ScheduleOverrideStatus;

  @ApiProperty({ example: false })
  shift_created: boolean;

  @ApiPropertyOptional({ example: '2025-12-02T01:00:00Z' })
  processed_at?: string;

  @ApiPropertyOptional({ example: null })
  error_message?: string;
}

/**
 * DTO for querying schedule overrides
 */
export class QueryScheduleOverridesDto {
  @ApiPropertyOptional({
    enum: ScheduleOverrideType,
    description: 'Filter by override type',
  })
  @IsOptional()
  @IsEnum(ScheduleOverrideType)
  type?: ScheduleOverrideType;

  @ApiPropertyOptional({
    enum: ScheduleOverrideStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(ScheduleOverrideStatus)
  status?: ScheduleOverrideStatus;

  @ApiPropertyOptional({
    example: '2025-12-01',
    description: 'Filter overrides active on or after this date',
  })
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description: 'Filter overrides active on or before this date',
  })
  @IsOptional()
  @IsDateString()
  to_date?: string;
}
