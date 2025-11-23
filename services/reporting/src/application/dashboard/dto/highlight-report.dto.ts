import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum HighlightPeriod {
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
}

export enum HighlightCategory {
  LATE = 'LATE',
  EARLY = 'EARLY',
  LEAVE = 'LEAVE',
  OVERTIME = 'OVERTIME',
  UNUSUAL_ABSENCE = 'UNUSUAL_ABSENCE',
}

export class HighlightReportQueryDto {
  @ApiPropertyOptional({ enum: HighlightPeriod, default: HighlightPeriod.MONTH, description: 'Report period' })
  @IsEnum(HighlightPeriod)
  @IsOptional()
  period?: HighlightPeriod = HighlightPeriod.MONTH;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD) for custom period', example: '2025-01-01' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD) for custom period', example: '2025-01-31' })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Department ID filter' })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  department_id?: number;
}

export class HighlightReportDetailQueryDto extends HighlightReportQueryDto {
  @ApiProperty({ enum: HighlightCategory, description: 'Category to view details' })
  @IsEnum(HighlightCategory)
  category: HighlightCategory;

  @ApiPropertyOptional({ description: 'Number of top employees to show', default: 5, minimum: 1 })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  top_n?: number = 5;
}

export class TopEmployeeDto {
  @ApiProperty({ description: 'Employee ID' })
  employee_id: number;

  @ApiProperty({ description: 'Employee code' })
  employee_code: string;

  @ApiProperty({ description: 'Full name' })
  full_name: string;

  @ApiProperty({ description: 'Department name', nullable: true })
  department_name?: string;

  @ApiProperty({ description: 'Position name', nullable: true })
  position_name?: string;

  @ApiProperty({ description: 'Avatar URL', nullable: true })
  avatar_url?: string;

  @ApiProperty({ description: 'Count value (late count, early count, leave days, OT hours, etc.)' })
  count: number;

  @ApiProperty({ description: 'Additional metric (e.g., total minutes late, total OT amount)', nullable: true })
  metric_value?: number;

  @ApiProperty({ description: 'Percentage or rate', nullable: true })
  rate?: number;
}

export class UnusualAbsenceEmployeeDto {
  @ApiProperty({ description: 'Employee ID' })
  employee_id: number;

  @ApiProperty({ description: 'Employee code' })
  employee_code: string;

  @ApiProperty({ description: 'Full name' })
  full_name: string;

  @ApiProperty({ description: 'Department name', nullable: true })
  department_name?: string;

  @ApiProperty({ description: 'Position name', nullable: true })
  position_name?: string;

  @ApiProperty({ description: 'Avatar URL', nullable: true })
  avatar_url?: string;

  @ApiProperty({ description: 'Number of unusual absences' })
  unusual_absence_count: number;

  @ApiProperty({ description: 'Total absent days without approved leave' })
  absent_days: number;

  @ApiProperty({ description: 'Attendance rate percentage' })
  attendance_rate: number;

  @ApiProperty({ description: 'Last absence date', nullable: true })
  last_absence_date?: string;

  @ApiProperty({ description: 'Consecutive absence days', nullable: true })
  consecutive_absence_days?: number;
}

export class HighlightKPIDto {
  @ApiProperty({ description: 'KPI card title' })
  title: string;

  @ApiProperty({ description: 'KPI card icon/emoji' })
  icon: string;

  @ApiProperty({ description: 'Primary value' })
  value: number;

  @ApiProperty({ description: 'Unit of measurement (times, hours, days, people)' })
  unit: string;

  @ApiProperty({ description: 'Top employee for this category', type: TopEmployeeDto, nullable: true })
  top_employee?: TopEmployeeDto;

  @ApiProperty({ description: 'Trend compared to previous period (%)', nullable: true })
  trend?: number;

  @ApiProperty({ description: 'Category identifier' })
  category: HighlightCategory;
}

export class HighlightReportResponseDto {
  @ApiProperty({ description: 'Period information' })
  period: {
    type: HighlightPeriod;
    start_date: string;
    end_date: string;
    label: string;
  };

  @ApiProperty({ description: 'Department filter info', nullable: true })
  department?: {
    department_id: number;
    department_name: string;
  };

  @ApiProperty({ description: 'Highlight KPI cards', type: [HighlightKPIDto] })
  kpi_cards: HighlightKPIDto[];

  @ApiProperty({ description: 'List of employees with unusual absences', type: [UnusualAbsenceEmployeeDto] })
  unusual_absences: UnusualAbsenceEmployeeDto[];

  @ApiProperty({ description: 'Overall statistics' })
  overall_stats: {
    total_employees: number;
    total_working_days: number;
    average_attendance_rate: number;
  };
}

export class HighlightDetailResponseDto {
  @ApiProperty({ description: 'Category' })
  category: HighlightCategory;

  @ApiProperty({ description: 'Period information' })
  period: {
    type: HighlightPeriod;
    start_date: string;
    end_date: string;
    label: string;
  };

  @ApiProperty({ description: 'Department filter info', nullable: true })
  department?: {
    department_id: number;
    department_name: string;
  };

  @ApiProperty({ description: 'Top employees for this category', type: [TopEmployeeDto] })
  top_employees: TopEmployeeDto[];

  @ApiProperty({ description: 'Summary statistics for this category' })
  summary: {
    total_count: number;
    average_per_employee: number;
    highest_value: number;
    lowest_value: number;
  };
}
