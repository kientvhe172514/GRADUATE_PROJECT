import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from './send-notification.use-case';
import { NotificationRepositoryPort } from '../ports/notification.repository.port';
import { UnreadCountResponseDto, UnreadCountByTypeDto } from '../dtos/notification-statistics.dto';

@Injectable()
export class GetUnreadCountUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepositoryPort,
  ) {}

  async execute(userId: number): Promise<UnreadCountResponseDto> {
    // Get total unread count
    const unreadCount = await this.notificationRepository.countUnread(userId);

    // Get unread count by type
    const byTypeRaw = await this.notificationRepository.getUnreadCountByType(userId);

    // Map to DTO
    const byType: UnreadCountByTypeDto[] = byTypeRaw.map((item) => ({
      type: item.type,
      count: item.count,
    }));

    return {
      unread_count: unreadCount,
      by_type: byType,
    };
  }
}
