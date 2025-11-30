import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ShiftStatus } from '../../domain/entities/employee-shift.entity';

/**
 * ✅ QUY TẮC: DTO Pattern
 * Purpose: Query params for My Attendance API
 * Business Rule:
 * - Filter by period (day, week, month, year)
 * - DAY: Only selected date
 * - WEEK: Monday of week → reference_date
 * - MONTH: 1st of month → reference_date
 * - YEAR: Jan 1 → reference_date
 * - Get ALL attendance (including weekends based on work schedule)
 * - Support pagination
 */

export enum AttendancePeriodFilter {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class GetMyAttendanceQueryDto {
  @ApiPropertyOptional({
    enum: AttendancePeriodFilter,
    example: AttendancePeriodFilter.MONTH,
    description:
      '🔄 DEPRECATED: Use start_date + end_date instead. Filter period: day, week, month, or year',
  })
  @IsOptional()
  @IsEnum(AttendancePeriodFilter)
  period?: AttendancePeriodFilter;

  @ApiPropertyOptional({
    example: '2025-11-05',
    description:
      '🔄 DEPRECATED: Use start_date + end_date instead. Reference date (YYYY-MM-DD). Used as end date for week/month/year filters. ' +
      'WEEK: Monday → reference_date | MONTH: 1st → reference_date | YEAR: Jan 1 → reference_date',
  })
  @IsOptional()
  @IsDateString()
  reference_date?: string;

  @ApiPropertyOptional({
    example: '2025-11-01',
    description:
      '✅ NEW: Start date (YYYY-MM-DD) for custom date range filter. If not provided, will use period + reference_date logic.',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    example: '2025-11-30',
    description:
      '✅ NEW: End date (YYYY-MM-DD) for custom date range filter. If not provided, will use period + reference_date logic.',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    enum: ShiftStatus,
    description: 'Filter by shift status',
  })
  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Page number (1-based)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    description: 'Items per page',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}

export class AttendanceSummaryDto {
  @ApiProperty({ example: 20, description: 'Total working days in period' })
  total_working_days: number;

  @ApiProperty({ example: 18, description: 'Days present' })
  days_present: number;

  @ApiProperty({ example: 2, description: 'Days absent' })
  days_absent: number;

  @ApiProperty({ example: 1, description: 'Days on leave' })
  days_on_leave: number;

  @ApiProperty({ example: 160.5, description: 'Total work hours' })
  total_work_hours: number;

  @ApiProperty({ example: 5.5, description: 'Total overtime hours' })
  total_overtime_hours: number;

  @ApiProperty({ example: 3, description: 'Times late' })
  times_late: number;

  @ApiProperty({ example: 45, description: 'Total late minutes' })
  total_late_minutes: number;

  @ApiProperty({ example: 1, description: 'Times early leave' })
  times_early_leave: number;

  @ApiProperty({ example: 15, description: 'Total early leave minutes' })
  total_early_leave_minutes: number;
}

export class MyAttendanceShiftDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: '2025-11-05' })
  shift_date: string;

  @ApiProperty({ example: 'Monday' })
  day_of_week: string;

  @ApiProperty({ example: '08:00:00' })
  scheduled_start_time: string;

  @ApiProperty({ example: '17:00:00' })
  scheduled_end_time: string;

  @ApiPropertyOptional({ example: '2025-11-05T08:05:00Z' })
  check_in_time?: string;

  @ApiPropertyOptional({ example: '2025-11-05T17:10:00Z' })
  check_out_time?: string;

  @ApiProperty({ example: 8.5 })
  work_hours: number;

  @ApiProperty({ example: 0.5 })
  overtime_hours: number;

  @ApiProperty({ example: 5, description: 'Late minutes' })
  late_minutes: number;

  @ApiProperty({ example: 0, description: 'Early leave minutes' })
  early_leave_minutes: number;

  @ApiProperty({ enum: ShiftStatus, example: ShiftStatus.COMPLETED })
  status: ShiftStatus;

  @ApiPropertyOptional({ example: 'Approved overtime' })
  notes?: string;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 3 })
  total_pages: number;

  @ApiProperty({ example: true })
  has_next: boolean;

  @ApiProperty({ example: false })
  has_prev: boolean;
}

export class GetMyAttendanceResponseDto {
  @ApiProperty({ type: AttendanceSummaryDto })
  summary: AttendanceSummaryDto;

  @ApiProperty({ type: [MyAttendanceShiftDto] })
  shifts: MyAttendanceShiftDto[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;

  @ApiProperty({
    example: '2025-11-01',
    description: 'Start date of filtered period',
  })
  period_start: string;

  @ApiProperty({
    example: '2025-11-30',
    description: 'End date of filtered period',
  })
  period_end: string;
}
