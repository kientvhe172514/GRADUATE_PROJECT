import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ShiftStatus } from '../../domain/entities/employee-shift.entity';

/**
 * Query parameters for calendar view
 */
export class EmployeeShiftCalendarQueryDto {
  @ApiProperty({
    example: '2025-01-01',
    description: 'Start date of the calendar view (inclusive)',
  })
  @IsDateString()
  from_date: string;

  @ApiProperty({
    example: '2025-01-31',
    description: 'End date of the calendar view (inclusive)',
  })
  @IsDateString()
  to_date: string;

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
      'Filter by specific employee IDs. If not provided, returns all employees in department/organization',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  employee_ids?: number[];
}

/**
 * Shift information for a specific date in calendar view
 */
export class ShiftCalendarItemDto {
  @ApiProperty({
    example: 1,
    description: 'Employee shift record ID',
  })
  shift_id: number;

  @ApiProperty({
    example: '2025-01-15',
    description: 'Date of the shift',
  })
  shift_date: string;

  @ApiProperty({
    example: 'Morning Shift',
    description: 'Work schedule name (e.g., Morning Shift, Afternoon Shift)',
  })
  schedule_name: string;

  @ApiProperty({
    example: '08:00',
    description: 'Scheduled start time (HH:MM format)',
  })
  start_time: string;

  @ApiProperty({
    example: '17:00',
    description: 'Scheduled end time (HH:MM format)',
  })
  end_time: string;

  @ApiProperty({
    enum: ShiftStatus,
    example: ShiftStatus.COMPLETED,
    description: 'Shift status',
  })
  status: ShiftStatus;

  @ApiProperty({
    example: 'REGULAR',
    description: 'Shift type (REGULAR, OVERTIME)',
  })
  shift_type: string;

  @ApiPropertyOptional({
    example: '08:15',
    description: 'Actual check-in time (HH:MM format)',
  })
  check_in_time?: string;

  @ApiPropertyOptional({
    example: '17:30',
    description: 'Actual check-out time (HH:MM format)',
  })
  check_out_time?: string;

  @ApiProperty({
    example: 8.5,
    description: 'Total work hours',
  })
  work_hours: number;

  @ApiProperty({
    example: 1.5,
    description: 'Overtime hours',
  })
  overtime_hours: number;

  @ApiProperty({
    example: 15,
    description: 'Late arrival minutes',
  })
  late_minutes: number;

  @ApiProperty({
    example: 0,
    description: 'Early leave minutes',
  })
  early_leave_minutes: number;
}

/**
 * Employee information with their shifts in calendar view
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
    type: [ShiftCalendarItemDto],
    description: 'List of shifts for this employee within the date range',
  })
  shifts: ShiftCalendarItemDto[];
}

/**
 * Calendar view response
 */
export class EmployeeShiftCalendarResponseDto {
  @ApiProperty({
    example: '2025-01-01',
    description: 'Start date of the calendar period',
  })
  from_date: string;

  @ApiProperty({
    example: '2025-01-31',
    description: 'End date of the calendar period',
  })
  to_date: string;

  @ApiProperty({
    example: 5,
    description: 'Total number of employees in this calendar view',
  })
  total_employees: number;

  @ApiProperty({
    type: [EmployeeCalendarDto],
    description: 'List of employees with their shift schedules',
  })
  employees: EmployeeCalendarDto[];
}
