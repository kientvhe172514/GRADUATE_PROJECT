import { IsEnum, IsOptional, IsArray, IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { Priority } from '../../domain/enums/priority.enum';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';

export enum RecipientType {
  INDIVIDUAL = 'INDIVIDUAL',
  DEPARTMENT = 'DEPARTMENT',
  ALL_EMPLOYEES = 'ALL_EMPLOYEES',
  ROLE = 'ROLE',
}

export class SendBulkNotificationDto {
  @ApiProperty({
    description: 'Type of recipients',
    enum: RecipientType,
    example: RecipientType.DEPARTMENT,
  })
  @IsNotEmpty()
  @IsEnum(RecipientType)
  recipientType: RecipientType;

  @ApiProperty({
    description: 'Array of individual recipient IDs (required if recipientType = INDIVIDUAL)',
    type: [Number],
    example: [1, 2, 3, 4, 5],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  recipientIds?: number[];

  @ApiProperty({
    description: 'Array of department IDs (required if recipientType = DEPARTMENT)',
    type: [Number],
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  departmentIds?: number[];

  @ApiProperty({
    description: 'Array of role names (required if recipientType = ROLE)',
    type: [String],
    example: ['HR_MANAGER', 'DEPARTMENT_MANAGER'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.SYSTEM_ANNOUNCEMENT,
  })
  @IsNotEmpty()
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @ApiProperty({
    description: 'Priority level',
    enum: Priority,
    example: Priority.HIGH,
  })
  @IsNotEmpty()
  @IsEnum(Priority)
  priority: Priority;

  @ApiProperty({
    description: 'Notification title',
    example: 'Company Holiday Announcement',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Tomorrow is a company holiday. Enjoy your day off!',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Delivery channels',
    enum: ChannelType,
    isArray: true,
    example: [ChannelType.EMAIL, ChannelType.PUSH, ChannelType.IN_APP],
  })
  @IsNotEmpty()
  @IsArray()
  @IsEnum(ChannelType, { each: true })
  channels: ChannelType[];

  @ApiProperty({
    description: 'Additional metadata',
    example: { source: 'admin_panel', category: 'announcement' },
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class BulkMarkAsReadDto {
  @ApiProperty({
    description: 'Array of notification IDs to mark as read',
    type: [Number],
    example: [1, 2, 3, 4, 5],
  })
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  notificationIds: number[];
}

export class BulkNotificationResponseDto {
  @ApiProperty({
    description: 'Number of notifications sent successfully',
    example: 45,
  })
  sent_count: number;

  @ApiProperty({
    description: 'Number of recipients',
    example: 45,
  })
  recipient_count: number;

  @ApiProperty({
    description: 'List of recipient IDs who received the notification',
    type: [Number],
    example: [1, 2, 3, 4, 5],
  })
  recipient_ids: number[];
}
