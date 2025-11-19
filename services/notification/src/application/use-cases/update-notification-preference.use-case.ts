import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationPreference } from '../../domain/entities/notification-preference.entity';
import { NotificationPreferenceRepositoryPort } from '../ports/notification-preference.repository.port';
import { UpdateNotificationPreferenceDto } from '../dtos/update-notification-preference.dto';
import { NOTIFICATION_PREFERENCE_REPOSITORY } from './send-notification.use-case';

@Injectable()
export class UpdateNotificationPreferenceUseCase {
  private readonly logger = new Logger(UpdateNotificationPreferenceUseCase.name);

  constructor(
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferenceRepo: NotificationPreferenceRepositoryPort,
  ) {}

  async execute(dto: UpdateNotificationPreferenceDto): Promise<NotificationPreference> {
    if (!dto.employeeId) {
      throw new Error('Employee ID is required');
    }

    this.logger.log(
      `Updating notification preference for employee ${dto.employeeId}, type: ${dto.notificationType}`,
    );

    const existing = await this.preferenceRepo.findByEmployeeIdAndType(
      dto.employeeId,
      dto.notificationType,
    );

    if (existing) {
      // Update existing preference
      if (dto.emailEnabled !== undefined) existing.emailEnabled = dto.emailEnabled;
      if (dto.pushEnabled !== undefined) existing.pushEnabled = dto.pushEnabled;
      if (dto.smsEnabled !== undefined) existing.smsEnabled = dto.smsEnabled;
      if (dto.inAppEnabled !== undefined) existing.inAppEnabled = dto.inAppEnabled;
      if (dto.doNotDisturbStart !== undefined)
        existing.doNotDisturbStart = dto.doNotDisturbStart;
      if (dto.doNotDisturbEnd !== undefined)
        existing.doNotDisturbEnd = dto.doNotDisturbEnd;

      existing.updateTimestamp();
      return await this.preferenceRepo.update(existing);
    } else {
      // Create new preference
      const newPreference = new NotificationPreference({
        employeeId: dto.employeeId,
        notificationType: dto.notificationType,
        emailEnabled: dto.emailEnabled,
        pushEnabled: dto.pushEnabled,
        smsEnabled: dto.smsEnabled,
        inAppEnabled: dto.inAppEnabled,
        doNotDisturbStart: dto.doNotDisturbStart,
        doNotDisturbEnd: dto.doNotDisturbEnd,
      });

      return await this.preferenceRepo.create(newPreference);
    }
  }
}
