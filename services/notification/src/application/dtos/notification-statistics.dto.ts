import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';

export class NotificationByTypeDto {
  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.LEAVE_REQUEST_APPROVED,
  })
  notification_type: NotificationType;

  @ApiProperty({
    description: 'Total number of notifications of this type',
    example: 15,
  })
  total: number;

  @ApiProperty({
    description: 'Number of unread notifications of this type',
    example: 3,
  })
  unread: number;
}

export class NotificationByChannelDto {
  @ApiProperty({
    description: 'Delivery channel',
    enum: ChannelType,
    example: ChannelType.PUSH,
  })
  channel: ChannelType;

  @ApiProperty({
    description: 'Number of notifications sent via this channel',
    example: 45,
  })
  sent: number;

  @ApiProperty({
    description: 'Number of successfully delivered notifications',
    example: 42,
  })
  delivered: number;

  @ApiProperty({
    description: 'Number of failed delivery attempts',
    example: 3,
  })
  failed: number;
}

export class RecentNotificationDto {
  @ApiProperty({
    description: 'Notification ID',
    example: 123,
  })
  id: number;

  @ApiProperty({
    description: 'Notification title',
    example: 'Leave Request Approved',
  })
  title: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.LEAVE_REQUEST_APPROVED,
  })
  notification_type: NotificationType;

  @ApiProperty({
    description: 'Whether notification has been read',
    example: false,
  })
  is_read: boolean;

  @ApiProperty({
    description: 'Notification creation timestamp',
    example: '2024-11-16T09:30:00Z',
  })
  created_at: Date;
}

export class NotificationStatisticsResponseDto {
  @ApiProperty({
    description: 'Total number of notifications received',
    example: 150,
  })
  total_notifications: number;

  @ApiProperty({
    description: 'Total number of unread notifications',
    example: 12,
  })
  unread_count: number;

  @ApiProperty({
    description: 'Total number of read notifications',
    example: 138,
  })
  read_count: number;

  @ApiProperty({
    description: 'Percentage of read notifications',
    example: 92.0,
  })
  read_rate: number;

  @ApiProperty({
    description: 'Notifications grouped by type',
    type: [NotificationByTypeDto],
    example: [
      {
        notification_type: 'LEAVE_REQUEST_APPROVED',
        total: 15,
        unread: 3,
      },
      {
        notification_type: 'ATTENDANCE_REMINDER',
        total: 50,
        unread: 5,
      },
    ],
  })
  by_type: NotificationByTypeDto[];

  @ApiProperty({
    description: 'Notifications grouped by delivery channel',
    type: [NotificationByChannelDto],
    example: [
      {
        channel: 'PUSH',
        sent: 45,
        delivered: 42,
        failed: 3,
      },
      {
        channel: 'EMAIL',
        sent: 30,
        delivered: 29,
        failed: 1,
      },
    ],
  })
  by_channel: NotificationByChannelDto[];

  @ApiProperty({
    description: 'Recent 10 notifications',
    type: [RecentNotificationDto],
  })
  recent_notifications: RecentNotificationDto[];
}

export class UnreadCountByTypeDto {
  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.LEAVE_REQUEST_APPROVED,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Number of unread notifications of this type',
    example: 3,
  })
  count: number;
}

export class UnreadCountResponseDto {
  @ApiProperty({
    description: 'Total number of unread notifications',
    example: 12,
  })
  unread_count: number;

  @ApiProperty({
    description: 'Unread notifications grouped by type',
    type: [UnreadCountByTypeDto],
    example: [
      { type: 'LEAVE_REQUEST_APPROVED', count: 3 },
      { type: 'ATTENDANCE_REMINDER', count: 5 },
      { type: 'SYSTEM_ANNOUNCEMENT', count: 4 },
    ],
  })
  by_type: UnreadCountByTypeDto[];
}
