import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { NotificationRepositoryPort } from '../ports/notification.repository.port';
import { EventPublisherPort } from '../ports/event-publisher.port';
import { NOTIFICATION_REPOSITORY, EVENT_PUBLISHER } from './send-notification.use-case';
import { NotificationReadEvent } from '../../domain/events/notification-read.event';

@Injectable()
export class MarkNotificationAsReadUseCase {
  private readonly logger = new Logger(MarkNotificationAsReadUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: NotificationRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(notificationId: number, userId: number): Promise<void> {
    this.logger.log(`Marking notification ${notificationId} as read for user ${userId}`);

    const notification = await this.notificationRepo.findById(notificationId);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.recipientId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.isRead) {
      notification.markAsRead();
      await this.notificationRepo.update(notification);

      const event = new NotificationReadEvent(notificationId, userId);
      await this.eventPublisher.publish('notification.read', event);

      this.logger.log(`Notification ${notificationId} marked as read`);
    }
  }
}
