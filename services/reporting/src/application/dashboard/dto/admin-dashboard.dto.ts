import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum AdminDashboardPeriod {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM',
}

export class AdminDashboardQueryDto {
  @ApiPropertyOptional({ enum: AdminDashboardPeriod, default: AdminDashboardPeriod.MONTH })
  @IsEnum(AdminDashboardPeriod)
  @IsOptional()
  period?: AdminDashboardPeriod = AdminDashboardPeriod.MONTH;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)', example: '2025-01-01' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)', example: '2025-01-31' })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}

export class AdminKPICardDto {
  @ApiProperty({ description: 'KPI title' })
  title: string;

  @ApiProperty({ description: 'KPI value' })
  value: number;

  @ApiProperty({ description: 'Unit of measurement' })
  unit: string;

  @ApiProperty({ description: 'Icon identifier' })
  icon: string;

  @ApiProperty({ description: 'Trend percentage', nullable: true })
  trend?: number;

  @ApiProperty({ description: 'Trend direction', nullable: true })
  trend_direction?: 'up' | 'down' | 'stable';

  @ApiProperty({ description: 'Color theme' })
  color: string;

  @ApiProperty({ description: 'Additional details', nullable: true })
  details?: string;
}

export class UserRoleDistributionDto {
  @ApiProperty({ description: 'Role name' })
  role: string;

  @ApiProperty({ description: 'User count' })
  count: number;

  @ApiProperty({ description: 'Percentage' })
  percentage: number;

  @ApiProperty({ description: 'Color code' })
  color: string;
}

export class DepartmentEmployeeCountDto {
  @ApiProperty({ description: 'Department ID' })
  department_id: number;

  @ApiProperty({ description: 'Department name' })
  department_name: string;

  @ApiProperty({ description: 'Employee count' })
  count: number;

  @ApiProperty({ description: 'Active employees' })
  active_count: number;

  @ApiProperty({ description: 'Inactive employees' })
  inactive_count: number;
}

export class LoginTrendDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Total logins' })
  login_count: number;

  @ApiProperty({ description: 'Unique users' })
  unique_users: number;

  @ApiProperty({ description: 'Failed login attempts' })
  failed_attempts: number;
}

export class DeviceStatusDto {
  @ApiProperty({ description: 'Device ID' })
  device_id: string;

  @ApiProperty({ description: 'Device name' })
  device_name: string;

  @ApiProperty({ description: 'Device type (Beacon, Camera, etc.)' })
  device_type: string;

  @ApiProperty({ description: 'Status (online/offline)' })
  status: 'online' | 'offline';

  @ApiProperty({ description: 'Location/Department' })
  location: string;

  @ApiProperty({ description: 'Last seen timestamp', nullable: true })
  last_seen?: string;

  @ApiProperty({ description: 'Battery level percentage', nullable: true })
  battery_level?: number;

  @ApiProperty({ description: 'Signal strength', nullable: true })
  signal_strength?: number;
}

export class SystemActivityDto {
  @ApiProperty({ description: 'Activity timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Activity type' })
  type: string;

  @ApiProperty({ description: 'Activity description' })
  description: string;

  @ApiProperty({ description: 'User ID who performed the action', nullable: true })
  user_id?: number;

  @ApiProperty({ description: 'User name', nullable: true })
  user_name?: string;

  @ApiProperty({ description: 'Severity (info/warning/error)' })
  severity: 'info' | 'warning' | 'error';
}

export class FaceIDRegistrationStatsDto {
  @ApiProperty({ description: 'Total employees' })
  total_employees: number;

  @ApiProperty({ description: 'Registered with FaceID' })
  registered: number;

  @ApiProperty({ description: 'Not registered' })
  not_registered: number;

  @ApiProperty({ description: 'Registration rate percentage' })
  registration_rate: number;

  @ApiProperty({ description: 'Pending verification' })
  pending_verification: number;
}

export class AuthenticationFailureStatsDto {
  @ApiProperty({ description: 'Total authentication attempts' })
  total_attempts: number;

  @ApiProperty({ description: 'Failed FaceID recognitions' })
  faceid_failures: number;

  @ApiProperty({ description: 'GPS mismatch failures' })
  gps_failures: number;

  @ApiProperty({ description: 'Other failures' })
  other_failures: number;

  @ApiProperty({ description: 'Failure rate percentage' })
  failure_rate: number;

  @ApiProperty({ description: 'Top failure reasons', type: [Object] })
  top_reasons: Array<{ reason: string; count: number }>;
}

export class AdminDashboardChartsDto {
  @ApiProperty({ description: 'User role distribution pie chart', type: [UserRoleDistributionDto] })
  role_distribution: UserRoleDistributionDto[];

  @ApiProperty({ description: 'Department employee count bar chart', type: [DepartmentEmployeeCountDto] })
  department_employee_count: DepartmentEmployeeCountDto[];

  @ApiProperty({ description: 'Login trend line chart', type: [LoginTrendDto] })
  login_trend: LoginTrendDto[];
}

export class AdminDashboardResponseDto {
  @ApiProperty({ description: 'Period information' })
  period: {
    type: AdminDashboardPeriod;
    start_date: string;
    end_date: string;
    label: string;
  };

  @ApiProperty({ description: 'Top row KPI cards', type: [AdminKPICardDto] })
  kpi_cards: AdminKPICardDto[];

  @ApiProperty({ description: 'Charts data', type: AdminDashboardChartsDto })
  charts: AdminDashboardChartsDto;

  @ApiProperty({ description: 'FaceID registration statistics' })
  faceid_stats: FaceIDRegistrationStatsDto;

  @ApiProperty({ description: 'Authentication failure statistics' })
  auth_failure_stats: AuthenticationFailureStatsDto;

  @ApiProperty({ description: 'Device status list', type: [DeviceStatusDto] })
  devices: DeviceStatusDto[];

  @ApiProperty({ description: 'Recent system activities', type: [SystemActivityDto] })
  system_activities: SystemActivityDto[];
}
