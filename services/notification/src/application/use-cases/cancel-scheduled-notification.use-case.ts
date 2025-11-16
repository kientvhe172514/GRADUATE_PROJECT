import { Inject, Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ScheduledNotificationStatus } from '../../domain/entities/scheduled-notification.entity';
import {
  ScheduledNotificationRepositoryPort,
  SCHEDULED_NOTIFICATION_REPOSITORY,
} from '../ports/scheduled-notification.repository.port';

@Injectable()
export class CancelScheduledNotificationUseCase {
  private readonly logger = new Logger(CancelScheduledNotificationUseCase.name);

  constructor(
    @Inject(SCHEDULED_NOTIFICATION_REPOSITORY)
    private readonly scheduledRepo: ScheduledNotificationRepositoryPort,
  ) {}

  async execute(id: number, userId: number): Promise<void> {
    this.logger.log(`Cancelling scheduled notification ${id} by user ${userId}`);

    const existing = await this.scheduledRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Scheduled notification with ID ${id} not found`);
    }

    // Verify ownership
    if (existing.created_by !== userId) {
      throw new ForbiddenException('You can only cancel your own scheduled notifications');
    }

    // Mark as cancelled
    existing.status = ScheduledNotificationStatus.CANCELLED;
    existing.updated_at = new Date();

    await this.scheduledRepo.update(existing);
    this.logger.log(`Cancelled scheduled notification ${id}`);
  }
}
