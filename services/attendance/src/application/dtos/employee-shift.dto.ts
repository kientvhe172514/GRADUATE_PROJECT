import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  EmployeeShift,
  EmployeeShiftProps,
  ShiftStatus,
  ShiftType,
} from '../../domain/entities/employee-shift.entity';

export class EmployeeShiftFilterDto {
  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  from_date: string;

  @ApiProperty({ example: '2025-01-31' })
  @IsDateString()
  to_date: string;

  @ApiPropertyOptional({ enum: ShiftStatus })
  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @ApiPropertyOptional({ example: 123 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  employee_id?: number;

  @ApiPropertyOptional({ example: 10, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit = 20;

  @ApiPropertyOptional({ example: 10, description: 'Filter by department ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  department_id?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset = 0;
}

export class EmployeeShiftDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  employee_id: number;

  @ApiProperty()
  employee_code: string;

  @ApiProperty()
  department_id: number;

  @ApiProperty()
  shift_date: Date;

  @ApiProperty()
  work_schedule_id: number;

  @ApiProperty()
  scheduled_start_time: string;

  @ApiProperty()
  scheduled_end_time: string;

  @ApiPropertyOptional()
  check_in_time?: Date;

  @ApiPropertyOptional()
  check_out_time?: Date;

  @ApiProperty()
  work_hours: number;

  @ApiProperty()
  overtime_hours: number;

  @ApiProperty()
  break_hours: number;

  @ApiProperty()
  late_minutes: number;

  @ApiProperty()
  early_leave_minutes: number;

  @ApiProperty({ enum: ShiftStatus })
  status: ShiftStatus;

  @ApiProperty({ enum: ShiftType, description: 'REGULAR or OVERTIME' })
  shift_type: ShiftType;

  @ApiPropertyOptional()
  notes?: string;

  constructor(entity: EmployeeShift) {
    const props: EmployeeShiftProps = entity.toJSON();
    this.id = props.id!;
    this.employee_id = props.employee_id;
    this.employee_code = props.employee_code;
    this.department_id = props.department_id;
    this.shift_date = props.shift_date;
    this.work_schedule_id = props.work_schedule_id;
    this.scheduled_start_time = props.scheduled_start_time;
    this.scheduled_end_time = props.scheduled_end_time;
    this.check_in_time = props.check_in_time;
    this.check_out_time = props.check_out_time;
    this.work_hours = props.work_hours ?? 0;
    this.overtime_hours = props.overtime_hours ?? 0;
    this.break_hours = props.break_hours ?? 0;
    this.late_minutes = props.late_minutes ?? 0;
    this.early_leave_minutes = props.early_leave_minutes ?? 0;
    this.status = props.status ?? ShiftStatus.SCHEDULED;
    this.shift_type = props.shift_type ?? ShiftType.REGULAR;
    this.notes = props.notes;
  }
}
