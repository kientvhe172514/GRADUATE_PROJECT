import { NotificationPreference } from '../../domain/entities/notification-preference.entity';
import { NotificationType } from '../../domain/enums/notification-type.enum';

export interface NotificationPreferenceRepositoryPort {
  findByEmployeeIdAndType(
    employeeId: number,
    type: NotificationType,
  ): Promise<NotificationPreference | null>;
  upsert(
    preference: NotificationPreference,
  ): Promise<NotificationPreference>;
  findAllByEmployeeId(
    employeeId: number,
  ): Promise<NotificationPreference[]>;
  create(
    preference: NotificationPreference,
  ): Promise<NotificationPreference>;
  update(
    preference: NotificationPreference,
  ): Promise<NotificationPreference>;
}
