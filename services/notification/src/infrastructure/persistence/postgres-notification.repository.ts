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
    options?: { limit?: number; offset?: number; unreadOnly?: boolean },
  ): Promise<Notification[]> {
    const query = this.repository
      .createQueryBuilder('notification')
      .where('notification.recipient_id = :recipientId', { recipientId })
      .orderBy('notification.created_at', 'DESC');

    if (options?.unreadOnly) {
      query.andWhere('notification.is_read = false');
    }

    if (options?.limit) {
      query.take(options.limit);
    }

    if (options?.offset) {
      query.skip(options.offset);
    }

    const schemas = await query.getMany();
    return schemas.map(NotificationMapper.toDomain);
  }

  async update(notification: Notification): Promise<Notification> {
    const schema = NotificationMapper.toPersistence(notification);
    const updated = await this.repository.save(schema);
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
}
