import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Query parameters for calendar view - now shows work schedule assignments instead of shifts
 */
export class EmployeeShiftCalendarQueryDto {
  @ApiPropertyOptional({
    example: 10,
    description:
      'Filter by department ID. If not provided, returns all departments',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  department_id?: number;

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 2, 3],
    description:
      'Filter by specific employee IDs (can be 1 or more). If not provided, returns all employees in department/organization',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v: any) => parseInt(String(v), 10));
    }
    return [parseInt(String(value), 10)];
  })
  employee_ids?: number[];

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Search by employee name (partial match)',
  })
  @IsOptional()
  employee_name?: string;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of records per page (default: 20)',
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Offset for pagination (default: 0)',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  offset?: number;
}

/**
 * Work schedule assignment information
 */
export class WorkScheduleAssignmentDto {
  @ApiProperty({
    example: 1,
    description: 'Assignment ID',
  })
  assignment_id: number;

  @ApiProperty({
    example: 1,
    description: 'Work schedule ID',
  })
  work_schedule_id: number;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Effective from date',
  })
  effective_from: string;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description: 'Effective to date (null = indefinite)',
  })
  effective_to?: string;

  @ApiProperty({
    description: 'Work schedule details',
  })
  work_schedule: {
    id: number;
    schedule_name: string;
    schedule_type: string;
    start_time?: string;
    end_time?: string;
    break_duration_minutes: number;
    late_tolerance_minutes: number;
    early_leave_tolerance_minutes: number;
    status: string;
  };

  @ApiPropertyOptional({
    type: 'array',
    description: 'Schedule overrides (temporary schedule changes or overtime)',
  })
  schedule_overrides?: any[];
}

/**
 * Employee shift (actual shift created from work schedule)
 */
export class EmployeeShiftDto {
  @ApiProperty({
    example: 1,
    description: 'Shift ID',
  })
  shift_id: number;

  @ApiProperty({
    example: '2025-12-04',
    description: 'Shift date',
  })
  shift_date: string;

  @ApiProperty({
    example: '09:00',
    description: 'Shift start time',
  })
  start_time: string;

  @ApiProperty({
    example: '18:00',
    description: 'Shift end time',
  })
  end_time: string;

  @ApiPropertyOptional({
    example: 60,
    description: 'Break duration in minutes',
  })
  break_duration_minutes?: number;

  @ApiProperty({
    example: 'SCHEDULED',
    description: 'Shift status',
  })
  status: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Work schedule ID this shift was created from',
  })
  work_schedule_id?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this shift was created from an override',
  })
  is_override?: boolean;
}

/**
 * Employee information with their work schedule assignments and shifts
 */
export class EmployeeCalendarDto {
  @ApiProperty({
    example: 123,
    description: 'Employee ID',
  })
  employee_id: number;

  @ApiProperty({
    example: 'EMP001',
    description: 'Employee code',
  })
  employee_code: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of employee',
  })
  full_name: string;

  @ApiProperty({
    example: 'john.doe@company.com',
    description: 'Email of employee',
  })
  email: string;

  @ApiProperty({
    example: 'Engineering',
    description: 'Department name',
  })
  department_name: string;

  @ApiProperty({
    example: 10,
    description: 'Department ID',
  })
  department_id: number;

  @ApiProperty({
    type: [WorkScheduleAssignmentDto],
    description:
      'List of work schedule assignments for this employee (past and current)',
  })
  assignments: WorkScheduleAssignmentDto[];

  @ApiPropertyOptional({
    type: [EmployeeShiftDto],
    description:
      'List of actual shifts created for this employee (upcoming and recent)',
  })
  shifts?: EmployeeShiftDto[];
}

/**
 * Calendar view response - work schedule assignments
 */
export class EmployeeShiftCalendarResponseDto {
  @ApiProperty({
    type: [EmployeeCalendarDto],
    description: 'List of employees with their work schedule assignments',
  })
  data: EmployeeCalendarDto[];

  @ApiProperty({
    example: 100,
    description: 'Total number of employees matching the query',
  })
  total: number;
}
