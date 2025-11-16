import { Inject, Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ScheduledNotification, ScheduleType } from '../../domain/entities/scheduled-notification.entity';
import {
  ScheduledNotificationRepositoryPort,
  SCHEDULED_NOTIFICATION_REPOSITORY,
} from '../ports/scheduled-notification.repository.port';
import { UpdateScheduledNotificationDto } from '../dtos/scheduled-notification.dto';
import { CronExpressionParser } from 'cron-parser';

@Injectable()
export class UpdateScheduledNotificationUseCase {
  private readonly logger = new Logger(UpdateScheduledNotificationUseCase.name);

  constructor(
    @Inject(SCHEDULED_NOTIFICATION_REPOSITORY)
    private readonly scheduledRepo: ScheduledNotificationRepositoryPort,
  ) {}

  async execute(
    id: number,
    dto: UpdateScheduledNotificationDto,
    userId: number,
  ): Promise<ScheduledNotification> {
    this.logger.log(`Updating scheduled notification ${id} by user ${userId}`);

    const existing = await this.scheduledRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Scheduled notification with ID ${id} not found`);
    }

    // Verify ownership
    if (existing.created_by !== userId) {
      throw new ForbiddenException('You can only update your own scheduled notifications');
    }

    // Update fields
    if (dto.title) existing.title = dto.title;
    if (dto.message) existing.message = dto.message;
    if (dto.channels) existing.channels = dto.channels as unknown as string[];
    if (dto.status) existing.status = dto.status;

    // Recalculate next_run_at if schedule changed
    if (dto.scheduled_at) {
      existing.scheduled_at = new Date(dto.scheduled_at);
      if (existing.schedule_type === ScheduleType.ONCE) {
        existing.next_run_at = new Date(dto.scheduled_at);
      }
    }

    if (dto.cron_expression) {
      existing.cron_expression = dto.cron_expression;
      if (existing.schedule_type === ScheduleType.RECURRING) {
        try {
          const interval = CronExpressionParser.parse(dto.cron_expression, {
            tz: existing.timezone,
          });
          existing.next_run_at = interval.next().toDate();
        } catch (error) {
          throw new Error(`Invalid cron expression: ${dto.cron_expression}`);
        }
      }
    }

    existing.updated_at = new Date();

    const updated = await this.scheduledRepo.update(existing);
    this.logger.log(`Updated scheduled notification ${id}`);

    return updated;
  }
}
