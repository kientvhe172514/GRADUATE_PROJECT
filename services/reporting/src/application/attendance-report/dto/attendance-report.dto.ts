import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReportPeriod {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM',
}

export class EmployeesAttendanceReportQueryDto {
  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)', example: '2025-01-01' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)', example: '2025-01-31' })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Department ID filter' })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  department_id?: number;

  @ApiPropertyOptional({ description: 'Employee search keyword (name, code)' })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}

export class EmployeeAttendanceSummaryDto {
  @ApiProperty({ description: 'Employee ID' })
  employee_id: number;

  @ApiProperty({ description: 'Employee code' })
  employee_code: string;

  @ApiProperty({ description: 'Full name' })
  full_name: string;

  @ApiProperty({ description: 'Department ID', nullable: true })
  department_id?: number;

  @ApiProperty({ description: 'Department name', nullable: true })
  department_name?: string;

  @ApiProperty({ description: 'Position name', nullable: true })
  position_name?: string;

  @ApiProperty({ description: 'Number of working days' })
  working_days: number;

  @ApiProperty({ description: 'Total working hours' })
  total_working_hours: number;

  @ApiProperty({ description: 'Total overtime hours' })
  total_overtime_hours: number;

  @ApiProperty({ description: 'Total late arrivals count' })
  total_late_count: number;

  @ApiProperty({ description: 'Total early leaves count' })
  total_early_leave_count: number;

  @ApiProperty({ description: 'Total leave days taken' })
  total_leave_days: number;

  @ApiProperty({ description: 'Total absent days (without approved leave)' })
  total_absent_days: number;

  @ApiProperty({ description: 'Manday calculation (working days equivalent)' })
  manday: number;

  @ApiProperty({ description: 'Attendance rate percentage' })
  attendance_rate: number;
}

export class EmployeesAttendanceReportResponseDto {
  @ApiProperty({ type: [EmployeeAttendanceSummaryDto] })
  data: EmployeeAttendanceSummaryDto[];

  @ApiProperty({ description: 'Total records' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  total_pages: number;

  @ApiProperty({ description: 'Report period' })
  period: string;

  @ApiProperty({ description: 'Start date' })
  start_date: string;

  @ApiProperty({ description: 'End date' })
  end_date: string;
}

export class EmployeeAttendanceReportQueryDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsInt()
  @Type(() => Number)
  employee_id: number;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)', example: '2025-01-01' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)', example: '2025-01-31' })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}

export class DailyAttendanceDetailDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Day of week' })
  day_of_week: string;

  @ApiProperty({ description: 'Shift name', nullable: true })
  shift_name?: string;

  @ApiProperty({ description: 'Scheduled start time', nullable: true })
  scheduled_start_time?: string;

  @ApiProperty({ description: 'Scheduled end time', nullable: true })
  scheduled_end_time?: string;

  @ApiProperty({ description: 'Actual check-in time', nullable: true })
  check_in_time?: string;

  @ApiProperty({ description: 'Check-in status', enum: ['ON_TIME', 'LATE', 'ABSENT', 'HOLIDAY', 'LEAVE'] })
  check_in_status: string;

  @ApiProperty({ description: 'Late minutes', nullable: true })
  late_minutes?: number;

  @ApiProperty({ description: 'Actual check-out time', nullable: true })
  check_out_time?: string;

  @ApiProperty({ description: 'Check-out status', enum: ['ON_TIME', 'EARLY', 'ABSENT', 'HOLIDAY', 'LEAVE'] })
  check_out_status: string;

  @ApiProperty({ description: 'Early leave minutes', nullable: true })
  early_leave_minutes?: number;

  @ApiProperty({ description: 'Total working hours' })
  working_hours: number;

  @ApiProperty({ description: 'Outside office time (minutes)', nullable: true })
  outside_office_time?: number;

  @ApiProperty({ description: 'Leave type', nullable: true })
  leave_type?: string;

  @ApiProperty({ description: 'Leave days', nullable: true })
  leave_days?: number;

  @ApiProperty({ description: 'Is holiday' })
  is_holiday: boolean;

  @ApiProperty({ description: 'Holiday name', nullable: true })
  holiday_name?: string;

  @ApiProperty({ description: 'Overtime hours', nullable: true })
  overtime_hours?: number;

  @ApiProperty({ description: 'Overtime approval status', nullable: true })
  overtime_status?: string;

  @ApiProperty({ description: 'Manday value for this day' })
  manday: number;

  @ApiProperty({ description: 'Remarks/Notes', nullable: true })
  remarks?: string;
}

export class EmployeeAttendanceReportResponseDto {
  @ApiProperty({ description: 'Employee information' })
  employee: {
    employee_id: number;
    employee_code: string;
    full_name: string;
    email: string;
    department_id?: number;
    department_name?: string;
    position_name?: string;
    join_date: string;
  };

  @ApiProperty({ description: 'Report period' })
  period: {
    type: string;
    start_date: string;
    end_date: string;
    total_days: number;
  };

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    total_working_days: number;
    total_working_hours: number;
    total_overtime_hours: number;
    total_late_count: number;
    total_early_leave_count: number;
    total_leave_days: number;
    total_absent_days: number;
    total_holidays: number;
    total_manday: number;
    attendance_rate: number;
  };

  @ApiProperty({ type: [DailyAttendanceDetailDto] })
  daily_records: DailyAttendanceDetailDto[];
}
