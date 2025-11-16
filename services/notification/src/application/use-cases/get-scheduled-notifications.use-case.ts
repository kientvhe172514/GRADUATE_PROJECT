import { Inject, Injectable, Logger } from '@nestjs/common';
import { ScheduledNotification } from '../../domain/entities/scheduled-notification.entity';
import {
  ScheduledNotificationRepositoryPort,
  SCHEDULED_NOTIFICATION_REPOSITORY,
} from '../ports/scheduled-notification.repository.port';

export interface GetScheduledNotificationsResult {
  notifications: ScheduledNotification[];
  total: number;
}

@Injectable()
export class GetScheduledNotificationsUseCase {
  private readonly logger = new Logger(GetScheduledNotificationsUseCase.name);

  constructor(
    @Inject(SCHEDULED_NOTIFICATION_REPOSITORY)
    private readonly scheduledRepo: ScheduledNotificationRepositoryPort,
  ) {}

  async execute(
    userId: number,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
    },
  ): Promise<GetScheduledNotificationsResult> {
    this.logger.log(`Getting scheduled notifications for user ${userId}`);

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const [notifications, total] = await Promise.all([
      this.scheduledRepo.findByCreator(userId, {
        limit,
        offset,
        status: options?.status as any,
      }),
      this.scheduledRepo.countByCreator(userId, options?.status as any),
    ]);

    return {
      notifications,
      total,
    };
  }
}
