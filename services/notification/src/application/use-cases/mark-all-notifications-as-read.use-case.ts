import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationRepositoryPort } from '../ports/notification.repository.port';
import { EventPublisherPort } from '../ports/event-publisher.port';
import { NOTIFICATION_REPOSITORY, EVENT_PUBLISHER } from './send-notification.use-case';

@Injectable()
export class MarkAllNotificationsAsReadUseCase {
  private readonly logger = new Logger(MarkAllNotificationsAsReadUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: NotificationRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(userId: number): Promise<void> {
    this.logger.log(`Marking all notifications as read for user ${userId}`);

    await this.notificationRepo.markAllAsRead(userId);

    await this.eventPublisher.publish('notifications.all.read', {
      userId,
      timestamp: new Date(),
    });

    this.logger.log(`All notifications marked as read for user ${userId}`);
  }
}
