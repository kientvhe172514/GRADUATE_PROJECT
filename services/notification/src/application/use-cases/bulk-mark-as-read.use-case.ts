import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from './send-notification.use-case';
import { NotificationRepositoryPort } from '../ports/notification.repository.port';
import { BulkMarkAsReadDto } from '../dtos/bulk-notification.dto';

@Injectable()
export class BulkMarkAsReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepositoryPort,
  ) {}

  async execute(dto: BulkMarkAsReadDto, userId: number): Promise<{ marked_count: number }> {
    // Verify that all notifications belong to the user
    let markedCount = 0;

    for (const notificationId of dto.notificationIds) {
      const notification = await this.notificationRepository.findById(notificationId);
      
      if (notification && notification.recipientId === userId && !notification.isRead) {
        await this.notificationRepository.markAsRead(notificationId);
        markedCount++;
      }
    }

    console.log(`✅ [Bulk Mark Read] Marked ${markedCount}/${dto.notificationIds.length} notifications as read for user ${userId}`);

    return { marked_count: markedCount };
  }
}
