import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum DashboardPeriod {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM',
}

export class HRDashboardQueryDto {
  @ApiPropertyOptional({ enum: DashboardPeriod, default: DashboardPeriod.MONTH, description: 'Dashboard period' })
  @IsEnum(DashboardPeriod)
  @IsOptional()
  period?: DashboardPeriod = DashboardPeriod.MONTH;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)', example: '2025-01-01' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)', example: '2025-01-31' })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Department ID filter (only for Department Manager)' })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  department_id?: number;
}

export class KPICardDto {
  @ApiProperty({ description: 'KPI title' })
  title: string;

  @ApiProperty({ description: 'KPI value' })
  value: number;

  @ApiProperty({ description: 'Unit of measurement' })
  unit: string;

  @ApiProperty({ description: 'Icon identifier' })
  icon: string;

  @ApiProperty({ description: 'Trend percentage compared to previous period', nullable: true })
  trend?: number;

  @ApiProperty({ description: 'Trend direction (up/down/stable)', nullable: true })
  trend_direction?: 'up' | 'down' | 'stable';

  @ApiProperty({ description: 'Color theme (success/warning/danger/info)' })
  color: string;
}

export class StatusDistributionDto {
  @ApiProperty({ description: 'Status label' })
  status: string;

  @ApiProperty({ description: 'Count' })
  count: number;

  @ApiProperty({ description: 'Percentage' })
  percentage: number;

  @ApiProperty({ description: 'Color code for chart' })
  color: string;
}

export class LeaveTypeDistributionDto {
  @ApiProperty({ description: 'Leave type name' })
  leave_type: string;

  @ApiProperty({ description: 'Total days' })
  days: number;

  @ApiProperty({ description: 'Percentage' })
  percentage: number;

  @ApiProperty({ description: 'Color code for chart' })
  color: string;
}

export class WorkingHoursTrendDto {
  @ApiProperty({ description: 'Period label (week number, month, etc.)' })
  period_label: string;

  @ApiProperty({ description: 'Average working hours' })
  average_hours: number;

  @ApiProperty({ description: 'Total working hours' })
  total_hours: number;

  @ApiProperty({ description: 'Period start date' })
  start_date: string;

  @ApiProperty({ description: 'Period end date' })
  end_date: string;
}

export class DepartmentComparisonDto {
  @ApiProperty({ description: 'Department ID' })
  department_id: number;

  @ApiProperty({ description: 'Department name' })
  department_name: string;

  @ApiProperty({ description: 'Late count' })
  late_count: number;

  @ApiProperty({ description: 'Leave days' })
  leave_days: number;

  @ApiProperty({ description: 'Absent days' })
  absent_days: number;

  @ApiProperty({ description: 'Total employees in department' })
  total_employees: number;

  @ApiProperty({ description: 'Attendance rate percentage' })
  attendance_rate: number;
}

export class CalendarDayDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Day of week' })
  day_of_week: string;

  @ApiProperty({ description: 'Dominant status for the day' })
  status: 'ON_TIME' | 'LATE' | 'LEAVE' | 'ABSENT' | 'HOLIDAY' | 'WEEKEND';

  @ApiProperty({ description: 'Color code for heatmap' })
  color: string;

  @ApiProperty({ description: 'On-time percentage for employees' })
  on_time_rate: number;

  @ApiProperty({ description: 'Total employees scheduled' })
  total_scheduled: number;

  @ApiProperty({ description: 'Summary text for tooltip', nullable: true })
  summary?: string;
}

export class ResourceAllocationDto {
  @ApiProperty({ description: 'Department ID' })
  department_id: number;

  @ApiProperty({ description: 'Department name' })
  department_name: string;

  @ApiProperty({ description: 'Total employees' })
  total_employees: number;

  @ApiProperty({ description: 'Present employees' })
  present: number;

  @ApiProperty({ description: 'On leave' })
  on_leave: number;

  @ApiProperty({ description: 'Absent' })
  absent: number;

  @ApiProperty({ description: 'Availability percentage' })
  availability_rate: number;
}

export class DashboardChartsDto {
  @ApiProperty({ description: 'Status distribution pie chart', type: [StatusDistributionDto] })
  status_distribution: StatusDistributionDto[];

  @ApiProperty({ description: 'Leave type distribution pie chart', type: [LeaveTypeDistributionDto] })
  leave_distribution: LeaveTypeDistributionDto[];

  @ApiProperty({ description: 'Working hours trend line chart', type: [WorkingHoursTrendDto] })
  working_hours_trend: WorkingHoursTrendDto[];

  @ApiProperty({ description: 'Department comparison bar chart (HR only)', type: [DepartmentComparisonDto] })
  department_comparison: DepartmentComparisonDto[];
}

export class HRDashboardResponseDto {
  @ApiProperty({ description: 'Period information' })
  period: {
    type: DashboardPeriod;
    start_date: string;
    end_date: string;
    label: string;
  };

  @ApiProperty({ description: 'Top row KPI cards', type: [KPICardDto] })
  kpi_cards: KPICardDto[];

  @ApiProperty({ description: 'Charts data', type: DashboardChartsDto })
  charts: DashboardChartsDto;

  @ApiProperty({ description: 'Heatmap calendar data', type: [CalendarDayDto] })
  calendar_heatmap: CalendarDayDto[];

  @ApiProperty({ description: 'Resource allocation by department', type: [ResourceAllocationDto] })
  resource_allocation: ResourceAllocationDto[];
}
