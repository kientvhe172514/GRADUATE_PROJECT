import { IsString, IsDateString, IsInt, IsBoolean, IsOptional, IsEnum, IsNumber, IsUrl, Min, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum LeaveRecordStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export class CreateLeaveRequestDto {
  // ❌ REMOVED: employee_id, employee_code, department_id
  // ✅ These will be extracted from JWT token (@CurrentUser)
  
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  leave_type_id: number;

  @ApiProperty({ example: '2025-01-20' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: '2025-01-22' })
  @IsDateString()
  end_date: string;

  @ApiProperty({ example: false, description: 'Is the start date a half day?' })
  @IsBoolean()
  is_half_day_start: boolean;

  @ApiProperty({ example: false, description: 'Is the end date a half day?' })
  @IsBoolean()
  is_half_day_end: boolean;

  @ApiProperty({ example: 'Family emergency' })
  @IsString()
  reason: string;

  @ApiProperty({ required: false, example: 'https://example.com/document.pdf' })
  @IsOptional()
  @IsUrl()
  supporting_document_url?: string;

  @ApiProperty({ required: false, description: 'Additional metadata as JSON' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateLeaveRecordDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_half_day_start?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_half_day_end?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  supporting_document_url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class ApproveLeaveDto {
  @ApiProperty({ example: 123, description: 'ID of approver' })
  @IsInt()
  @Min(1)
  approved_by: number;

  @ApiProperty({ required: false, description: 'Optional approval notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectLeaveDto {
  @ApiProperty({ example: 123, description: 'ID of rejector' })
  @IsInt()
  @Min(1)
  rejected_by: number;

  @ApiProperty({ example: 'Insufficient notice period' })
  @IsString()
  rejection_reason: string;
}

export class CancelLeaveDto {
  @ApiProperty({ example: 'Plans changed' })
  @IsString()
  cancellation_reason: string;

  @ApiProperty({ required: false, description: 'ID of user cancelling (if admin)' })
  @IsOptional()
  @IsInt()
  cancelled_by?: number;
}

export class LeaveRecordResponseDto {
  @ApiProperty()
  @Transform(({ value }) => Number(value))
  id: number;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  employee_id: number;

  @ApiProperty()
  employee_code: string;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  department_id: number;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  leave_type_id: number;

  @ApiProperty()
  start_date: Date;

  @ApiProperty()
  end_date: Date;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  total_calendar_days: number;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  total_working_days: number;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  total_leave_days: number;

  @ApiProperty()
  is_half_day_start: boolean;

  @ApiProperty()
  is_half_day_end: boolean;

  @ApiProperty()
  reason: string;

  @ApiProperty({ required: false })
  supporting_document_url?: string;

  @ApiProperty({ enum: LeaveRecordStatus })
  status: string;

  @ApiProperty()
  requested_at: Date;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  approval_level: number;

  @ApiProperty({ required: false })
  @Transform(({ value }) => value ? Number(value) : undefined)
  current_approver_id?: number;

  @ApiProperty({ required: false })
  @Transform(({ value }) => value ? Number(value) : undefined)
  approved_by?: number;

  @ApiProperty({ required: false })
  approved_at?: Date;

  @ApiProperty({ required: false })
  rejection_reason?: string;

  @ApiProperty({ required: false })
  cancelled_at?: Date;

  @ApiProperty({ required: false })
  cancellation_reason?: string;

  @ApiProperty({ required: false })
  metadata?: any;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class GetLeaveRecordsQueryDto {
  @ApiProperty({ required: false, description: 'Filter by employee ID' })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @IsInt()
  employee_id?: number;

  @ApiProperty({ enum: LeaveRecordStatus, required: false })
  @IsOptional()
  @IsEnum(LeaveRecordStatus)
  status?: LeaveRecordStatus;

  @ApiProperty({ required: false, description: 'Filter by leave type ID' })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @IsInt()
  leave_type_id?: number;

  @ApiProperty({ required: false, example: '2025-01-01', description: 'Start date range filter' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({ required: false, example: '2025-12-31', description: 'End date range filter' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({ required: false, description: 'Filter by department ID' })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @IsInt()
  department_id?: number;
}

export class LeaveRecordStatsDto {
  @ApiProperty()
  @Transform(({ value }) => Number(value))
  total_requests: number;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  pending_requests: number;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  approved_requests: number;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  rejected_requests: number;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  cancelled_requests: number;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  total_days_taken: number;
}

