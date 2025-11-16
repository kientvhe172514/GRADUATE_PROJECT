import { ScheduledNotification, ScheduledNotificationStatus } from '../../domain/entities/scheduled-notification.entity';

export interface ScheduledNotificationRepositoryPort {
  /**
   * Create a new scheduled notification
   */
  create(scheduled: ScheduledNotification): Promise<ScheduledNotification>;

  /**
   * Find scheduled notification by ID
   */
  findById(id: number): Promise<ScheduledNotification | null>;

  /**
   * Find all due notifications that need to be processed
   */
  findDueNotifications(): Promise<ScheduledNotification[]>;

  /**
   * Find all scheduled notifications created by a user
   */
  findByCreator(
    creatorId: number,
    options?: {
      limit?: number;
      offset?: number;
      status?: ScheduledNotificationStatus;
    },
  ): Promise<ScheduledNotification[]>;

  /**
   * Find all active scheduled notifications
   */
  findActive(): Promise<ScheduledNotification[]>;

  /**
   * Update a scheduled notification
   */
  update(scheduled: ScheduledNotification): Promise<ScheduledNotification>;

  /**
   * Delete a scheduled notification
   */
  delete(id: number): Promise<void>;

  /**
   * Count scheduled notifications by creator
   */
  countByCreator(
    creatorId: number,
    status?: ScheduledNotificationStatus,
  ): Promise<number>;
}

export const SCHEDULED_NOTIFICATION_REPOSITORY = 'SCHEDULED_NOTIFICATION_REPOSITORY';
