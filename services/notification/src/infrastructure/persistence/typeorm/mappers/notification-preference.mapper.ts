import { NotificationPreference } from '../../../../domain/entities/notification-preference.entity';
import { NotificationPreferenceSchema } from '../schemas/notification-preference.schema';
import { NotificationType } from '../../../../domain/enums/notification-type.enum';

export class NotificationPreferenceMapper {
  static toDomain(schema: NotificationPreferenceSchema): NotificationPreference {
    return new NotificationPreference({
      id: schema.id,
      employeeId: Number(schema.employee_id),
      notificationType: schema.notification_type as NotificationType,
      emailEnabled: schema.email_enabled,
      pushEnabled: schema.push_enabled,
      smsEnabled: schema.sms_enabled,
      inAppEnabled: schema.in_app_enabled,
      doNotDisturbStart: schema.do_not_disturb_start ?? undefined,
      doNotDisturbEnd: schema.do_not_disturb_end ?? undefined,
      createdAt: schema.created_at,
      updatedAt: schema.updated_at,
    });
  }

  static toPersistence(
    preference: NotificationPreference,
  ): NotificationPreferenceSchema {
    const schema = new NotificationPreferenceSchema();
    if (preference.id) schema.id = preference.id;
    schema.employee_id = preference.employeeId;
    schema.notification_type = preference.notificationType;
    schema.email_enabled = preference.emailEnabled;
    schema.push_enabled = preference.pushEnabled;
    schema.sms_enabled = preference.smsEnabled;
    schema.in_app_enabled = preference.inAppEnabled;
    schema.do_not_disturb_start = preference.doNotDisturbStart ?? null;
    schema.do_not_disturb_end = preference.doNotDisturbEnd ?? null;
    schema.created_at = preference.createdAt;
    schema.updated_at = preference.updatedAt;
    return schema;
  }
}
