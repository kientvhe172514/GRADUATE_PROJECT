import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from './send-notification.use-case';
import { NotificationRepositoryPort } from '../ports/notification.repository.port';

@Injectable()
export class DeleteMyReadNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepositoryPort,
  ) {}

  async execute(userId: number): Promise<{ deleted_count: number }> {
    const deletedCount = await this.notificationRepository.deleteReadByRecipient(userId);

    console.log(`🗑️ [Delete Read] Deleted ${deletedCount} read notifications for user ${userId}`);

    return { deleted_count: deletedCount };
  }
}
