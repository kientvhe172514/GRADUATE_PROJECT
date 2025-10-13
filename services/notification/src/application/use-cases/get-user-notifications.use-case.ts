import { Inject, Injectable, Logger } from '@nestjs/common';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationRepositoryPort } from '../ports/notification.repository.port';
import { NOTIFICATION_REPOSITORY } from './send-notification.use-case';

export interface GetUserNotificationsResult {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

@Injectable()
export class GetUserNotificationsUseCase {
  private readonly logger = new Logger(GetUserNotificationsUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: NotificationRepositoryPort,
  ) {}

  async execute(
    userId: number,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    },
  ): Promise<GetUserNotificationsResult> {
    this.logger.log(`Getting notifications for user ${userId}`);

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const [notifications, unreadCount] = await Promise.all([
      this.notificationRepo.findByRecipientId(userId, {
        limit: limit + 1, // Fetch one extra to check if there are more
        offset,
        unreadOnly: options?.unreadOnly,
      }),
      this.notificationRepo.countUnread(userId),
    ]);

    const hasMore = notifications.length > limit;
    const resultNotifications = hasMore ? notifications.slice(0, limit) : notifications;

    return {
      notifications: resultNotifications,
      total: resultNotifications.length,
      unreadCount,
      hasMore,
    };
  }
}
