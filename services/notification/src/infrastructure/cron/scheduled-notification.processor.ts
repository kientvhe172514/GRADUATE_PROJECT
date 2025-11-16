import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProcessScheduledNotificationsUseCase } from '../../application/use-cases/process-scheduled-notifications.use-case';

@Injectable()
export class ScheduledNotificationProcessor {
  private readonly logger = new Logger(ScheduledNotificationProcessor.name);

  constructor(
    private readonly processScheduledNotificationsUseCase: ProcessScheduledNotificationsUseCase,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications() {
    this.logger.log('Running scheduled notification processor');

    try {
      const processed = await this.processScheduledNotificationsUseCase.execute();
      if (processed > 0) {
        this.logger.log(`Successfully processed ${processed} scheduled notifications`);
      }
    } catch (error) {
      this.logger.error('Error processing scheduled notifications:', error);
    }
  }
}
