import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsDateString,
  IsArray,
  ArrayNotEmpty,
  IsNotEmpty,
  IsDate,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ScheduleStatus, ScheduleType, WorkSchedule } from '../../domain/entities/work-schedule.entity';
import { EmployeeWorkSchedule } from '../../domain/entities/employee-work-schedule.entity';

// =======================================
//             INPUT DTOs
// =======================================

export class CreateWorkScheduleDto {
  @ApiProperty({ example: 'Standard Office Hours', description: 'Name of the work schedule' })
  @IsString()
  @IsNotEmpty()
  schedule_name: string;

  @ApiProperty({ enum: ScheduleType, example: ScheduleType.FIXED })
  @IsEnum(ScheduleType)
  schedule_type: ScheduleType;

  @ApiPropertyOptional({
    example: '1,2,3,4,5',
    description: 'Comma-separated working days (1=Mon, 7=Sun)',
  })
  @IsOptional()
  @IsString()
  work_days?: string;

  @ApiPropertyOptional({ example: '08:00:00', description: 'Start time in HH:mm:ss format' })
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiPropertyOptional({ example: '17:00:00', description: 'End time in HH:mm:ss format' })
  @IsOptional()
  @IsString()
  end_time?: string;

  @ApiPropertyOptional({ example: 60, default: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  break_duration_minutes?: number;

  @ApiPropertyOptional({ example: 15, default: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  late_tolerance_minutes?: number;

  @ApiPropertyOptional({ example: 15, default: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  early_leave_tolerance_minutes?: number;
}

export class UpdateWorkScheduleDto extends PartialType(CreateWorkScheduleDto) {
  @ApiPropertyOptional({ enum: ScheduleStatus, example: ScheduleStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;
}

export class ListWorkScheduleDto {
  @ApiPropertyOptional({ enum: ScheduleStatus, example: ScheduleStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @ApiPropertyOptional({ enum: ScheduleType, example: ScheduleType.FIXED })
  @IsOptional()
  @IsEnum(ScheduleType)
  schedule_type?: ScheduleType;

  @ApiPropertyOptional({ example: 10, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  limit = 20;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  offset = 0;
}

export class AssignWorkScheduleDto {
  @ApiProperty({ type: [Number], example: [101, 102], description: 'List of Employee IDs' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  employee_ids: number[];

  @ApiProperty({ example: '2024-01-01', description: 'Effective start date' })
  @IsDateString()
  effective_from: string;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'Optional effective end date' })
  @IsOptional()
  @IsDateString()
  effective_to?: string;
}

// =======================================
//            OUTPUT DTOs
// =======================================

export class WorkScheduleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  schedule_name: string;

  @ApiProperty({ enum: ScheduleType })
  schedule_type: ScheduleType;

  @ApiPropertyOptional()
  work_days?: string;

  @ApiPropertyOptional()
  start_time?: string;

  @ApiPropertyOptional()
  end_time?: string;

  @ApiProperty()
  break_duration_minutes: number;

  @ApiProperty()
  late_tolerance_minutes: number;

  @ApiProperty()
  early_leave_tolerance_minutes: number;

  @ApiProperty({ enum: ScheduleStatus })
  status: ScheduleStatus;

  constructor(entity: WorkSchedule) {
    const props = entity.toJSON();
    this.id = props.id;
    this.schedule_name = props.schedule_name;
    this.schedule_type = props.schedule_type;
    this.work_days = props.work_days;
    this.start_time = props.start_time;
    this.end_time = props.end_time;
    this.break_duration_minutes = props.break_duration_minutes ?? 60;
    this.late_tolerance_minutes = props.late_tolerance_minutes ?? 15;
    this.early_leave_tolerance_minutes = props.early_leave_tolerance_minutes ?? 15;
    this.status = props.status ?? ScheduleStatus.ACTIVE;
  }
}

export class EmployeeWorkScheduleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  employee_id: number;

  @ApiProperty()
  work_schedule_id: number;

  @ApiProperty()
  effective_from: Date;

  @ApiPropertyOptional()
  effective_to?: Date;

  constructor(entity: EmployeeWorkSchedule) {
    const props = entity.toJSON();
    this.id = props.id;
    this.employee_id = props.employee_id;
    this.work_schedule_id = props.work_schedule_id;
    this.effective_from = props.effective_from;
    this.effective_to = props.effective_to;
  }
}

