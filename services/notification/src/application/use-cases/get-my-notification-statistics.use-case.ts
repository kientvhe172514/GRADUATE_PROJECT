import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from './send-notification.use-case';
import { NotificationRepositoryPort } from '../ports/notification.repository.port';
import { NotificationStatisticsResponseDto, NotificationByTypeDto, RecentNotificationDto } from '../dtos/notification-statistics.dto';

@Injectable()
export class GetMyNotificationStatisticsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepositoryPort,
  ) {}

  async execute(userId: number): Promise<NotificationStatisticsResponseDto> {
    // Get statistics from repository
    const stats = await this.notificationRepository.getStatistics(userId);

    // Calculate read rate
    const readRate = stats.total > 0 ? (stats.read / stats.total) * 100 : 0;

    // Get recent notifications
    const recentNotifications = await this.notificationRepository.findByRecipientId(userId, {
      limit: 10,
      offset: 0,
    });

    // Map by type
    const byType: NotificationByTypeDto[] = stats.byType.map((item) => ({
      notification_type: item.type,
      total: item.total,
      unread: item.unread,
    }));

    // Map recent notifications
    const recentMapped: RecentNotificationDto[] = recentNotifications.map((notif) => ({
      id: notif.id!,
      title: notif.title,
      notification_type: notif.notificationType,
      is_read: notif.isRead,
      created_at: notif.createdAt,
    }));

    // For now, we'll mock channel statistics since we don't have delivery log queries yet
    // TODO: Query from NotificationDeliveryLog table for accurate channel stats
    const byChannel = [
      { channel: 'PUSH' as any, sent: 0, delivered: 0, failed: 0 },
      { channel: 'EMAIL' as any, sent: 0, delivered: 0, failed: 0 },
      { channel: 'SMS' as any, sent: 0, delivered: 0, failed: 0 },
      { channel: 'IN_APP' as any, sent: stats.total, delivered: stats.total, failed: 0 },
    ];

    return {
      total_notifications: stats.total,
      unread_count: stats.unread,
      read_count: stats.read,
      read_rate: parseFloat(readRate.toFixed(2)),
      by_type: byType,
      by_channel: byChannel,
      recent_notifications: recentMapped,
    };
  }
}
