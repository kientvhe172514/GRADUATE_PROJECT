import { Notification } from '../../domain/entities/notification.entity';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';

export interface NotificationStatistics {
  total: number;
  unread: number;
  read: number;
  byType: Array<{ type: NotificationType; total: number; unread: number }>;
}

export interface NotificationRepositoryPort {
  create(notification: Notification): Promise<Notification>;
  findById(id: number): Promise<Notification | null>;
  findByRecipientId(
    recipientId: number,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      channelFilter?: ChannelType;
    },
  ): Promise<Notification[]>;
  update(notification: Notification): Promise<Notification>;
  markAsRead(notificationId: number): Promise<void>;
  markAllAsRead(recipientId: number): Promise<void>;
  deleteExpired(): Promise<number>;
  countUnread(recipientId: number): Promise<number>;
  countByType(
    recipientId: number,
    type: NotificationType,
  ): Promise<number>;
  getStatistics(recipientId: number): Promise<NotificationStatistics>;
  getUnreadCountByType(recipientId: number): Promise<Array<{ type: NotificationType; count: number }>>;
  deleteReadByRecipient(recipientId: number): Promise<number>;
  deleteOldNotifications(olderThanDays: number, onlyRead: boolean): Promise<number>;
}
