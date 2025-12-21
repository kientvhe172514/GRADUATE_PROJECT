import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationRepositoryPort } from '../../application/ports/notification.repository.port';
import { NotificationSchema } from './typeorm/schemas/notification.schema';
import { NotificationMapper } from './typeorm/mappers/notification.mapper';
import { NotificationType } from '../../domain/enums/notification-type.enum';

@Injectable()
export class PostgresNotificationRepository
  implements NotificationRepositoryPort
{
  constructor(
    @InjectRepository(NotificationSchema)
    private readonly repository: Repository<NotificationSchema>,
  ) {}

  async create(notification: Notification): Promise<Notification> {
    const schema = NotificationMapper.toPersistence(notification);
    const saved = await this.repository.save(schema);
    return NotificationMapper.toDomain(saved);
  }

  async findById(id: number): Promise<Notification | null> {
    const schema = await this.repository.findOne({ where: { id } });
    return schema ? NotificationMapper.toDomain(schema) : null;
  }

  async findByRecipientId(
    recipientId: number,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      channelFilter?: string;
    },
  ): Promise<Notification[]> {
    console.log('🔍 [REPO] findByRecipientId called with:', { recipientId, options });
    
    const query = this.repository
      .createQueryBuilder('notification')
      .where('notification.recipient_id = :recipientId', { recipientId })
      .orderBy('notification.created_at', 'DESC');

    if (options?.unreadOnly) {
      query.andWhere('notification.is_read = false');
    }

    // Filter by channel - check if notification's channels array contains the filter channel
    if (options?.channelFilter) {
      console.log('🔍 [REPO] Adding channelFilter:', options.channelFilter);
      query.andWhere(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(notification.channels) AS channel
          WHERE channel = :channelFilter
        )`,
        { channelFilter: options.channelFilter }
      );
    }

    if (options?.limit) {
      query.take(options.limit);
    }

    if (options?.offset) {
      query.skip(options.offset);
    }

    const sqlQuery = query.getSql();
    const params = query.getParameters();
    console.log('🔍 [REPO] Final SQL:', sqlQuery);
    console.log('🔍 [REPO] Parameters:', params);

    const schemas = await query.getMany();
    console.log('🔍 [REPO] Found schemas:', schemas.length);
    console.log('🔍 [REPO] First schema channels:', schemas[0]?.channels);
    
    return schemas.map(NotificationMapper.toDomain);
  }

  async update(notification: Notification): Promise<Notification> {
    if (!notification.id) {
      throw new Error('Cannot update notification without ID');
    }

    const schema = NotificationMapper.toPersistence(notification);
    
    // Use update() instead of save() to prevent creating duplicates
    await this.repository.update(notification.id, {
      is_read: schema.is_read,
      read_at: schema.read_at,
      email_sent: schema.email_sent,
      email_sent_at: schema.email_sent_at,
      push_sent: schema.push_sent,
      push_sent_at: schema.push_sent_at,
      sms_sent: schema.sms_sent,
      sms_sent_at: schema.sms_sent_at,
    });

    const updated = await this.repository.findOne({
      where: { id: notification.id },
    });
    
    if (!updated) {
      throw new Error(`Notification ${notification.id} not found after update`);
    }
    
    return NotificationMapper.toDomain(updated);
  }

  async markAsRead(notificationId: number): Promise<void> {
    await this.repository.update(notificationId, {
      is_read: true,
      read_at: new Date(),
    });
  }

  async markAllAsRead(recipientId: number): Promise<void> {
    await this.repository.update(
      { recipient_id: recipientId, is_read: false },
      { is_read: true, read_at: new Date() },
    );
  }

  async deleteExpired(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }

  async countUnread(recipientId: number): Promise<number> {
    return this.repository.count({
      where: {
        recipient_id: recipientId,
        is_read: false,
      },
    });
  }

  async countByType(
    recipientId: number,
    type: NotificationType,
  ): Promise<number> {
    return this.repository.count({
      where: {
        recipient_id: recipientId,
        notification_type: type,
      },
    });
  }

  async getStatistics(recipientId: number): Promise<{
    total: number;
    unread: number;
    read: number;
    byType: Array<{ type: NotificationType; total: number; unread: number }>;
  }> {
    // Get total counts
    const [total, unread] = await Promise.all([
      this.repository.count({ where: { recipient_id: recipientId } }),
      this.repository.count({ where: { recipient_id: recipientId, is_read: false } }),
    ]);

    // Get counts by type
    const byTypeResults = await this.repository
      .createQueryBuilder('notification')
      .select('notification.notification_type', 'type')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN notification.is_read = false THEN 1 ELSE 0 END)', 'unread')
      .where('notification.recipient_id = :recipientId', { recipientId })
      .groupBy('notification.notification_type')
      .getRawMany();

    const byType = byTypeResults.map((row) => ({
      type: row.type as NotificationType,
      total: parseInt(row.total, 10),
      unread: parseInt(row.unread, 10),
    }));

    return {
      total,
      unread,
      read: total - unread,
      byType,
    };
  }

  async getUnreadCountByType(
    recipientId: number,
  ): Promise<Array<{ type: NotificationType; count: number }>> {
    const results = await this.repository
      .createQueryBuilder('notification')
      .select('notification.notification_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('notification.recipient_id = :recipientId', { recipientId })
      .andWhere('notification.is_read = false')
      .groupBy('notification.notification_type')
      .getRawMany();

    return results.map((row) => ({
      type: row.type as NotificationType,
      count: parseInt(row.count, 10),
    }));
  }

  async deleteReadByRecipient(recipientId: number): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('recipient_id = :recipientId', { recipientId })
      .andWhere('is_read = true')
      .execute();

    return result.affected || 0;
  }

  async deleteOldNotifications(
    olderThanDays: number,
    onlyRead: boolean,
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const query = this.repository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate });

    if (onlyRead) {
      query.andWhere('is_read = true');
    }

    const result = await query.execute();
    return result.affected || 0;
  }
}
