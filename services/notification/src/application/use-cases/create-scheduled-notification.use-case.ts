import { Inject, Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ScheduledNotification, ScheduleType } from '../../domain/entities/scheduled-notification.entity';
import {
  ScheduledNotificationRepositoryPort,
  SCHEDULED_NOTIFICATION_REPOSITORY,
} from '../ports/scheduled-notification.repository.port';
import { CreateScheduledNotificationDto } from '../dtos/scheduled-notification.dto';
import { CronExpressionParser } from 'cron-parser';

@Injectable()
export class CreateScheduledNotificationUseCase {
  private readonly logger = new Logger(CreateScheduledNotificationUseCase.name);

  constructor(
    @Inject(SCHEDULED_NOTIFICATION_REPOSITORY)
    private readonly scheduledRepo: ScheduledNotificationRepositoryPort,
  ) {}

  async execute(dto: CreateScheduledNotificationDto, createdBy: number): Promise<ScheduledNotification> {
    this.logger.log(`Creating scheduled notification for creator ${createdBy}`);

    // Calculate next_run_at based on schedule type
    let nextRunAt: Date | undefined;

    if (dto.schedule_type === ScheduleType.ONCE) {
      nextRunAt = new Date(dto.scheduled_at!);
    } else if (dto.schedule_type === ScheduleType.RECURRING) {
      try {
        const interval = CronExpressionParser.parse(dto.cron_expression!, {
          tz: dto.timezone || 'Asia/Ho_Chi_Minh',
        });
        nextRunAt = interval.next().toDate();
      } catch (error) {
        throw new Error(`Invalid cron expression: ${dto.cron_expression}`);
      }
    }

    const scheduled = new ScheduledNotification({
      ...dto,
      channels: dto.channels as unknown as string[],
      scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : undefined,
      next_run_at: nextRunAt,
      created_by: createdBy,
    });

    const created = await this.scheduledRepo.create(scheduled);
    this.logger.log(`Created scheduled notification with ID ${created.id}, next run at ${nextRunAt}`);

    return created;
  }
}
