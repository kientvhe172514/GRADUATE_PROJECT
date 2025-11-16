import { ScheduledNotification } from '../../../../domain/entities/scheduled-notification.entity';
import { ScheduledNotificationSchema } from '../schemas/scheduled-notification.schema';

export class ScheduledNotificationMapper {
  static toDomain(schema: ScheduledNotificationSchema): ScheduledNotification {
    return new ScheduledNotification({
      id: schema.id,
      schedule_type: schema.schedule_type as any,
      recipient_type: schema.recipient_type as any,
      recipient_ids: schema.recipient_ids,
      title: schema.title,
      message: schema.message,
      notification_type: schema.notification_type,
      channels: schema.channels,
      scheduled_at: schema.scheduled_at,
      cron_expression: schema.cron_expression,
      timezone: schema.timezone,
      status: schema.status as any,
      last_run_at: schema.last_run_at,
      next_run_at: schema.next_run_at,
      created_by: schema.created_by,
      created_at: schema.created_at,
      updated_at: schema.updated_at,
    });
  }

  static toSchema(domain: ScheduledNotification): ScheduledNotificationSchema {
    const schema = new ScheduledNotificationSchema();
    if (domain.id) schema.id = domain.id;
    schema.schedule_type = domain.schedule_type;
    schema.recipient_type = domain.recipient_type;
    if (domain.recipient_ids) schema.recipient_ids = domain.recipient_ids;
    schema.title = domain.title;
    schema.message = domain.message;
    schema.notification_type = domain.notification_type;
    schema.channels = domain.channels;
    if (domain.scheduled_at) schema.scheduled_at = domain.scheduled_at;
    if (domain.cron_expression) schema.cron_expression = domain.cron_expression;
    schema.timezone = domain.timezone;
    schema.status = domain.status;
    if (domain.last_run_at) schema.last_run_at = domain.last_run_at;
    if (domain.next_run_at) schema.next_run_at = domain.next_run_at;
    schema.created_by = domain.created_by;
    if (domain.created_at) schema.created_at = domain.created_at;
    if (domain.updated_at) schema.updated_at = domain.updated_at;
    return schema;
  }
}
