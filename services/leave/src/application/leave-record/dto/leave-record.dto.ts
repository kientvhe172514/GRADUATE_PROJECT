import { IsString, IsDateString, IsInt, IsBoolean, IsOptional, IsEnum, IsNumber, IsUrl, Min, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum LeaveRecordStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export class CreateLeaveRequestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  employee_id: number;

  @ApiProperty({ example: 'EMP001' })
  @IsString()
  employee_code: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  department_id: number;

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
  id: number;

  @ApiProperty()
  employee_id: number;

  @ApiProperty()
  employee_code: string;

  @ApiProperty()
  department_id: number;

  @ApiProperty()
  leave_type_id: number;

  @ApiProperty()
  start_date: Date;

  @ApiProperty()
  end_date: Date;

  @ApiProperty()
  total_calendar_days: number;

  @ApiProperty()
  total_working_days: number;

  @ApiProperty()
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
  approval_level: number;

  @ApiProperty({ required: false })
  current_approver_id?: number;

  @ApiProperty({ required: false })
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
  @IsInt()
  employee_id?: number;

  @ApiProperty({ enum: LeaveRecordStatus, required: false })
  @IsOptional()
  @IsEnum(LeaveRecordStatus)
  status?: LeaveRecordStatus;

  @ApiProperty({ required: false, description: 'Filter by leave type ID' })
  @IsOptional()
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
  @IsInt()
  department_id?: number;
}

export class LeaveRecordStatsDto {
  @ApiProperty()
  total_requests: number;

  @ApiProperty()
  pending_requests: number;

  @ApiProperty()
  approved_requests: number;

  @ApiProperty()
  rejected_requests: number;

  @ApiProperty()
  cancelled_requests: number;

  @ApiProperty()
  total_days_taken: number;
}

