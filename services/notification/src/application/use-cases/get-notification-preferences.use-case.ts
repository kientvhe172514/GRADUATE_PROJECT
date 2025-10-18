import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationPreference } from '../../domain/entities/notification-preference.entity';
import { NotificationPreferenceRepositoryPort } from '../ports/notification-preference.repository.port';
import { NOTIFICATION_PREFERENCE_REPOSITORY } from './send-notification.use-case';

@Injectable()
export class GetNotificationPreferencesUseCase {
  private readonly logger = new Logger(GetNotificationPreferencesUseCase.name);

  constructor(
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferenceRepo: NotificationPreferenceRepositoryPort,
  ) {}

  async execute(employeeId: number): Promise<NotificationPreference[]> {
    this.logger.log(`Getting notification preferences for employee ${employeeId}`);
    return await this.preferenceRepo.findAllByEmployeeId(employeeId);
  }
}
