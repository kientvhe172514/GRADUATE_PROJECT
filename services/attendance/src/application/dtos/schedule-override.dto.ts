import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsInt,
  ValidateIf,
  Matches,
} from 'class-validator';

export enum ScheduleOverrideType {
  SCHEDULE_CHANGE = 'SCHEDULE_CHANGE',
  OVERTIME = 'OVERTIME',
  ON_LEAVE = 'ON_LEAVE', // When employee has approved leave
}

export enum ScheduleOverrideStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * DTO for creating a schedule override
 * 
 * ⚠️ IMPORTANT: Choose ONE type and fill ONLY the required fields for that type!
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📋 TYPE 1: SCHEDULE_CHANGE (Thay đổi lịch làm việc tạm thời)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Required fields:
 * - type: "SCHEDULE_CHANGE"
 * - from_date: "2025-12-01"
 * - to_date: "2025-12-31" (optional, default = from_date)
 * - override_work_schedule_id: 5
 * - reason: "Chuyển sang ca tối tạm thời"
 * 
 * Example JSON:
 * {
 *   "type": "SCHEDULE_CHANGE",
 *   "from_date": "2025-12-01",
 *   "to_date": "2025-12-31",
 *   "override_work_schedule_id": 5,
 *   "reason": "Chuyển sang ca tối tạm thời do yêu cầu dự án"
 * }
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ⏰ TYPE 2: OVERTIME (Đăng ký làm thêm giờ)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Required fields:
 * - type: "OVERTIME"
 * - from_date: "2025-12-15"
 * - overtime_start_time: "18:00"
 * - overtime_end_time: "22:00"
 * - reason: "Làm thêm giờ dự án X"
 * 
 * Example JSON:
 * {
 *   "type": "OVERTIME",
 *   "from_date": "2025-12-15",
 *   "overtime_start_time": "18:00",
 *   "overtime_end_time": "22:00",
 *   "reason": "Làm thêm giờ để hoàn thành sprint"
 * }
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🏖️ TYPE 3: ON_LEAVE (Nghỉ phép - thường tự động tạo)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Required fields:
 * - type: "ON_LEAVE"
 * - from_date: "2025-12-20"
 * - to_date: "2025-12-22" (optional, default = from_date)
 * - leave_request_id: 123
 * - reason: "Annual leave"
 * 
 * NOTE: This type is usually auto-created by the system when leave is approved.
 * Manual creation via API is rarely needed.
 * 
 * Example JSON:
 * {
 *   "type": "ON_LEAVE",
 *   "from_date": "2025-12-20",
 *   "to_date": "2025-12-22",
 *   "leave_request_id": 123,
 *   "reason": "Annual leave - approved"
 * }
 */
export class AddScheduleOverrideDto {
  @ApiProperty({
    enum: ScheduleOverrideType,
    example: ScheduleOverrideType.SCHEDULE_CHANGE,
    description: `Type of override. Choose ONE:
    
• SCHEDULE_CHANGE: Change work schedule temporarily
• OVERTIME: Add overtime hours
• ON_LEAVE: Mark as on leave (usually auto-created)`,
  })
  @IsEnum(ScheduleOverrideType)
  type: ScheduleOverrideType;

  @ApiProperty({
    example: '2025-12-01',
    description: 'Start date of the override (YYYY-MM-DD)',
  })
  @IsDateString()
  from_date: string;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description:
      'End date for SCHEDULE_CHANGE (null for OVERTIME - single day only)',
  })
  @IsOptional()
  @IsDateString()
  @ValidateIf((o) => o.type === ScheduleOverrideType.SCHEDULE_CHANGE)
  to_date?: string;

  @ApiPropertyOptional({
    example: 5,
    description: '🔸 ONLY for SCHEDULE_CHANGE: The new work_schedule_id to use during this period',
  })
  @IsOptional()
  @IsInt()
  @ValidateIf((o) => o.type === ScheduleOverrideType.SCHEDULE_CHANGE)
  override_work_schedule_id?: number;

  @ApiPropertyOptional({
    example: '18:00',
    description: '🔸 ONLY for OVERTIME: Start time in HH:mm format (24-hour)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'overtime_start_time must be in HH:mm format',
  })
  @ValidateIf((o) => o.type === ScheduleOverrideType.OVERTIME)
  overtime_start_time?: string;

  @ApiPropertyOptional({
    example: '22:00',
    description: '🔸 ONLY for OVERTIME: End time in HH:mm format (24-hour)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'overtime_end_time must be in HH:mm format',
  })
  @ValidateIf((o) => o.type === ScheduleOverrideType.OVERTIME)
  overtime_end_time?: string;

  @ApiPropertyOptional({
    example: 123,
    description: '🔸 ONLY for ON_LEAVE: Leave request ID from leave management system',
  })
  @IsOptional()
  @IsInt()
  @ValidateIf((o) => o.type === ScheduleOverrideType.ON_LEAVE)
  leave_request_id?: number;

  @ApiProperty({
    example: 'Chuyển sang ca tối tạm thời',
    description: 'Reason for the override',
  })
  @IsString()
  reason: string;
}

/**
 * DTO for schedule override response
 */
export class ScheduleOverrideDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique ID of the override',
  })
  id: string;

  @ApiProperty({
    enum: ScheduleOverrideType,
    example: ScheduleOverrideType.OVERTIME,
  })
  type: ScheduleOverrideType;

  @ApiProperty({ example: '2025-12-15' })
  from_date: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  to_date?: string;

  @ApiPropertyOptional({ example: 5 })
  override_work_schedule_id?: number;

  @ApiPropertyOptional({ example: '18:00' })
  overtime_start_time?: string;

  @ApiPropertyOptional({ example: '22:00' })
  overtime_end_time?: string;

  @ApiProperty({ example: 'Làm thêm giờ dự án X' })
  reason: string;

  @ApiProperty({ example: 123 })
  created_by: number;

  @ApiProperty({ example: '2025-12-01T10:00:00Z' })
  created_at: string;

  @ApiProperty({
    enum: ScheduleOverrideStatus,
    example: ScheduleOverrideStatus.PENDING,
  })
  status: ScheduleOverrideStatus;

  @ApiProperty({ example: false })
  shift_created: boolean;

  @ApiPropertyOptional({ example: '2025-12-02T01:00:00Z' })
  processed_at?: string;

  @ApiPropertyOptional({ example: null })
  error_message?: string;
}

/**
 * DTO for querying schedule overrides
 */
export class QueryScheduleOverridesDto {
  @ApiPropertyOptional({
    enum: ScheduleOverrideType,
    description: 'Filter by override type',
  })
  @IsOptional()
  @IsEnum(ScheduleOverrideType)
  type?: ScheduleOverrideType;

  @ApiPropertyOptional({
    enum: ScheduleOverrideStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(ScheduleOverrideStatus)
  status?: ScheduleOverrideStatus;

  @ApiPropertyOptional({
    example: '2025-12-01',
    description: 'Filter overrides active on or after this date',
  })
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description: 'Filter overrides active on or before this date',
  })
  @IsOptional()
  @IsDateString()
  to_date?: string;
}
