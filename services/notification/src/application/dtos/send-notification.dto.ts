import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, IsObject, IsArray, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { Priority } from '../../domain/enums/priority.enum';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';

export class SendNotificationDto {
  @ApiProperty({
    description: 'ID of the notification recipient',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  recipientId: number;

  @ApiProperty({
    description: 'Email address of the recipient',
    example: 'test@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @ApiProperty({
    description: 'Full name of the recipient',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiProperty({
    description: 'Title of the notification',
    example: 'Test Email Notification',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Message content of the notification',
    example: 'This is a test email notification message. Your account has been updated successfully.',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Type of the notification',
    enum: NotificationType,
    example: NotificationType.SYSTEM_ANNOUNCEMENT,
  })
  @IsNotEmpty()
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @ApiProperty({
    description: 'Priority level of the notification',
    enum: Priority,
    example: Priority.NORMAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({
    description: 'Delivery channels for the notification',
    enum: ChannelType,
    isArray: true,
    example: [ChannelType.EMAIL],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ChannelType, { each: true })
  channels?: ChannelType[];

  @ApiProperty({
    description: 'Type of related entity (e.g., user, leave_request, attendance)',
    example: 'user',
    required: false,
  })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @ApiProperty({
    description: 'ID of the related entity',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  relatedEntityId?: number;

  @ApiProperty({
    description: 'Additional data related to the notification',
    example: {
      leaveType: 'ANNUAL',
      startDate: '2025-11-01',
      endDate: '2025-11-05',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  relatedData?: Record<string, any>;

  @ApiProperty({
    description: 'Additional metadata for the notification',
    example: {
      source: 'manual_test',
      testMode: true,
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Expiration date and time for the notification',
    example: '2025-10-22T18:43:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;
}
