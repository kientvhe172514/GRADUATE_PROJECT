import { Inject, Injectable, Logger } from '@nestjs/common';
import { ScheduledNotification, ScheduleType, ScheduledNotificationStatus } from '../../domain/entities/scheduled-notification.entity';
import {
  ScheduledNotificationRepositoryPort,
  SCHEDULED_NOTIFICATION_REPOSITORY,
} from '../ports/scheduled-notification.repository.port';
import { SendNotificationUseCase } from './send-notification.use-case';
import { Priority } from '../../domain/enums/priority.enum';
import { CronExpressionParser } from 'cron-parser';

@Injectable()
export class ProcessScheduledNotificationsUseCase {
  private readonly logger = new Logger(ProcessScheduledNotificationsUseCase.name);

  constructor(
    @Inject(SCHEDULED_NOTIFICATION_REPOSITORY)
    private readonly scheduledRepo: ScheduledNotificationRepositoryPort,
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  async execute(): Promise<number> {
    this.logger.log('Processing due scheduled notifications');

    const dueNotifications = await this.scheduledRepo.findDueNotifications();

    if (dueNotifications.length === 0) {
      this.logger.log('No due notifications to process');
      return 0;
    }

    this.logger.log(`Found ${dueNotifications.length} due notifications to process`);

    let processed = 0;

    for (const scheduled of dueNotifications) {
      try {
        await this.processNotification(scheduled);
        processed++;
      } catch (error) {
        this.logger.error(`Failed to process scheduled notification ${scheduled.id}:`, error);
      }
    }

    this.logger.log(`Processed ${processed} out of ${dueNotifications.length} scheduled notifications`);
    return processed;
  }

  private async processNotification(scheduled: ScheduledNotification): Promise<void> {
    this.logger.log(`Processing scheduled notification ${scheduled.id}`);

    // Send notification to recipients
    // For now, we'll send to individual recipients or handle other recipient types
    const recipientIds = scheduled.recipient_ids || [];

    for (const recipientId of recipientIds) {
      try {
        await this.sendNotificationUseCase.execute({
          recipientId,
          title: scheduled.title,
          message: scheduled.message,
          notificationType: scheduled.notification_type as any,
          channels: scheduled.channels as any,
          priority: Priority.MEDIUM,
        });
      } catch (error) {
        this.logger.error(`Failed to send notification to recipient ${recipientId}:`, error);
      }
    }

    // Update scheduled notification
    scheduled.last_run_at = new Date();

    // Calculate next run time for recurring notifications
    if (scheduled.schedule_type === ScheduleType.RECURRING && scheduled.cron_expression) {
      try {
        const interval = CronExpressionParser.parse(scheduled.cron_expression, {
          currentDate: new Date(),
          tz: scheduled.timezone,
        });
        scheduled.next_run_at = interval.next().toDate();
      } catch (error) {
        this.logger.error(`Failed to calculate next run time for scheduled notification ${scheduled.id}:`, error);
        scheduled.status = ScheduledNotificationStatus.CANCELLED;
      }
    } else if (scheduled.schedule_type === ScheduleType.ONCE) {
      // Mark as completed for one-time notifications
      scheduled.status = ScheduledNotificationStatus.COMPLETED;
    }

    await this.scheduledRepo.update(scheduled);
    this.logger.log(`Updated scheduled notification ${scheduled.id}, next run at ${scheduled.next_run_at}`);
  }
}
