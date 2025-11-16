import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  ValidateIf,
  ArrayMinSize,
} from 'class-validator';
import {
  ScheduleType,
  RecipientType,
  ScheduledNotificationStatus,
} from '../../domain/entities/scheduled-notification.entity';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';

/**
 * DTO for creating a scheduled notification
 */
export class CreateScheduledNotificationDto {
  @ApiProperty({
    description: 'Type of schedule: ONCE for one-time execution, RECURRING for repeated execution',
    enum: ScheduleType,
    example: ScheduleType.ONCE,
  })
  @IsEnum(ScheduleType)
  @IsNotEmpty()
  schedule_type: ScheduleType;

  @ApiProperty({
    description: 'Type of recipient: INDIVIDUAL, DEPARTMENT, or ALL_EMPLOYEES',
    enum: RecipientType,
    example: RecipientType.INDIVIDUAL,
  })
  @IsEnum(RecipientType)
  @IsNotEmpty()
  recipient_type: RecipientType;

  @ApiPropertyOptional({
    description:
      'Array of recipient IDs (employee IDs or department IDs). Required for INDIVIDUAL and DEPARTMENT types',
    type: [Number],
    example: [101, 102, 103],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  @ValidateIf((o) => o.recipient_type !== RecipientType.ALL_EMPLOYEES)
  @IsOptional()
  recipient_ids?: number[];

  @ApiProperty({
    description: 'Notification title',
    example: 'System Maintenance Notice',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Notification message content',
    example: 'System maintenance is scheduled for tonight at 10 PM',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Type of notification',
    example: 'SYSTEM_ANNOUNCEMENT',
  })
  @IsString()
  @IsNotEmpty()
  notification_type: string;

  @ApiProperty({
    description: 'Delivery channels for the notification',
    type: [String],
    enum: ChannelType,
    example: [ChannelType.IN_APP, ChannelType.EMAIL],
  })
  @IsArray()
  @IsEnum(ChannelType, { each: true })
  @ArrayMinSize(1)
  channels: ChannelType[];

  @ApiPropertyOptional({
    description: 'Scheduled date-time for one-time execution (ISO 8601 format). Required when schedule_type is ONCE',
    example: '2024-12-31T22:00:00Z',
  })
  @IsDateString()
  @ValidateIf((o) => o.schedule_type === ScheduleType.ONCE)
  @IsOptional()
  scheduled_at?: string;

  @ApiPropertyOptional({
    description:
      'Cron expression for recurring execution (e.g., "0 9 * * 1-5" for weekdays at 9 AM). Required when schedule_type is RECURRING',
    example: '0 9 * * 1-5',
  })
  @IsString()
  @ValidateIf((o) => o.schedule_type === ScheduleType.RECURRING)
  @IsOptional()
  cron_expression?: string;

  @ApiPropertyOptional({
    description: 'Timezone for schedule execution (IANA timezone)',
    example: 'Asia/Ho_Chi_Minh',
    default: 'Asia/Ho_Chi_Minh',
  })
  @IsString()
  @IsOptional()
  timezone?: string;
}

/**
 * DTO for updating a scheduled notification
 */
export class UpdateScheduledNotificationDto {
  @ApiPropertyOptional({
    description: 'Notification title',
    example: 'Updated System Maintenance Notice',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Notification message content',
    example: 'System maintenance rescheduled to tomorrow at 10 PM',
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({
    description: 'Delivery channels for the notification',
    type: [String],
    enum: ChannelType,
    example: [ChannelType.IN_APP, ChannelType.EMAIL, ChannelType.PUSH],
  })
  @IsArray()
  @IsEnum(ChannelType, { each: true })
  @ArrayMinSize(1)
  @IsOptional()
  channels?: ChannelType[];

  @ApiPropertyOptional({
    description: 'Scheduled date-time for one-time execution (ISO 8601 format)',
    example: '2024-12-31T22:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  scheduled_at?: string;

  @ApiPropertyOptional({
    description: 'Cron expression for recurring execution',
    example: '0 10 * * 1-5',
  })
  @IsString()
  @IsOptional()
  cron_expression?: string;

  @ApiPropertyOptional({
    description: 'Status of the scheduled notification',
    enum: ScheduledNotificationStatus,
    example: ScheduledNotificationStatus.PAUSED,
  })
  @IsEnum(ScheduledNotificationStatus)
  @IsOptional()
  status?: ScheduledNotificationStatus;
}

/**
 * Response DTO for scheduled notification
 */
export class ScheduledNotificationResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: ScheduleType, example: ScheduleType.ONCE })
  schedule_type: ScheduleType;

  @ApiProperty({ enum: RecipientType, example: RecipientType.INDIVIDUAL })
  recipient_type: RecipientType;

  @ApiPropertyOptional({ type: [Number], example: [101, 102] })
  recipient_ids?: number[];

  @ApiProperty({ example: 'System Maintenance Notice' })
  title: string;

  @ApiProperty({ example: 'System maintenance is scheduled for tonight at 10 PM' })
  message: string;

  @ApiProperty({ example: 'SYSTEM_ANNOUNCEMENT' })
  notification_type: string;

  @ApiProperty({ type: [String], example: ['IN_APP', 'EMAIL'] })
  channels: string[];

  @ApiPropertyOptional({ example: '2024-12-31T22:00:00Z' })
  scheduled_at?: Date;

  @ApiPropertyOptional({ example: '0 9 * * 1-5' })
  cron_expression?: string;

  @ApiProperty({ example: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @ApiProperty({ enum: ScheduledNotificationStatus, example: ScheduledNotificationStatus.ACTIVE })
  status: ScheduledNotificationStatus;

  @ApiPropertyOptional({ example: '2024-01-15T09:00:00Z' })
  last_run_at?: Date;

  @ApiPropertyOptional({ example: '2024-01-16T09:00:00Z' })
  next_run_at?: Date;

  @ApiProperty({ example: 1 })
  created_by: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updated_at: Date;

  static fromEntity(entity: any): ScheduledNotificationResponseDto {
    const dto = new ScheduledNotificationResponseDto();
    Object.assign(dto, entity);
    return dto;
  }
}
