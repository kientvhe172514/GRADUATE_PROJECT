import { ScheduledNotification } from '../../domain/entities/scheduled-notification.entity';

export interface ScheduledNotificationRepositoryPort {
  create(scheduled: ScheduledNotification): Promise<ScheduledNotification>;
  findById(id: number): Promise<ScheduledNotification | null>;
  findDueNotifications(): Promise<ScheduledNotification[]>;
  update(scheduled: ScheduledNotification): Promise<ScheduledNotification>;
  findByCreator(creatorId: number): Promise<ScheduledNotification[]>;
  findActive(): Promise<ScheduledNotification[]>;
}
