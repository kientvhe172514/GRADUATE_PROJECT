import { Notification } from '../../domain/entities/notification.entity';
import { NotificationType } from '../../domain/enums/notification-type.enum';

export interface NotificationRepositoryPort {
  create(notification: Notification): Promise<Notification>;
  findById(id: number): Promise<Notification | null>;
  findByRecipientId(
    recipientId: number,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
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
}
